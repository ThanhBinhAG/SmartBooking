const { query } = require('../utils/db');

// Lấy danh sách tất cả thiết bị
const getAllEquipment = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM equipment WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('getAllEquipment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách thiết bị' });
  }
};

// Lấy thiết bị theo ID
const getEquipmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM equipment WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// Thêm thiết bị mới
const createEquipment = async (req, res) => {
  const { name, description, hourly_rate, total_stock, unit } = req.body;

  if (!name || !hourly_rate || !total_stock) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
  }

  try {
    const result = await query(
      `INSERT INTO equipment (name, description, hourly_rate, total_stock, unit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description ? description.trim() : null, hourly_rate, total_stock, unit || 'cái']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm thiết bị thành công' });
  } catch (err) {
    console.error('createEquipment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// Cập nhật thiết bị
const updateEquipment = async (req, res) => {
  const { id } = req.params;
  const { name, description, hourly_rate, total_stock, unit, is_active } = req.body;

  try {
    const result = await query(
      `UPDATE equipment SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         hourly_rate = COALESCE($3, hourly_rate),
         total_stock = COALESCE($4, total_stock),
         unit = COALESCE($5, unit),
         is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [name ? name.trim() : null, description ? description.trim() : null,
       hourly_rate, total_stock, unit, is_active, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
    }

    res.json({ success: true, data: result.rows[0], message: 'Cập nhật thiết bị thành công' });
  } catch (err) {
    console.error('updateEquipment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// Xóa thiết bị (soft delete)
const deleteEquipment = async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE equipment SET is_active = FALSE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Đã ẩn thiết bị' });
  } catch (err) {
    console.error('deleteEquipment error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

module.exports = {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment
};