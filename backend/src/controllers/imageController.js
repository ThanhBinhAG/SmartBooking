const { query } = require('../utils/db');
const path = require('path');
const fs = require('fs');

const getRoomImages = async (req, res) => {
  const { roomId } = req.params;
  try {
    const result = await query(
      `SELECT id, url, alt_text, is_primary, sort_order
       FROM room_images WHERE room_id = $1
       ORDER BY is_primary DESC, sort_order ASC`,
      [roomId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getRoomImages error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy ảnh phòng' });
  }
};

const uploadRoomImages = async (req, res) => {
  const { roomId } = req.params;
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có file ảnh' });
    }
    const inserted = [];
    const uploaderId = req.user?.id || null;
    for (const file of req.files) {
      const filePath = `uploads/rooms/${roomId}/${file.filename}`;
      const insertResult = await query(
        `INSERT INTO room_images (room_id, file_path, url, alt_text, is_primary, sort_order, uploaded_by)
         VALUES ($1, $2, '', $3, FALSE,
           (SELECT COALESCE(MAX(sort_order),0)+1 FROM room_images WHERE room_id = $1),
           $4)
         RETURNING id`,
        [roomId, filePath, file.originalname, uploaderId]
      );
      const imageId = insertResult.rows[0].id;
      const imageUrl = `/api/images/${imageId}`;
      const finalResult = await query(
        `UPDATE room_images SET url = $1 WHERE id = $2 RETURNING id, url, alt_text, is_primary, sort_order`,
        [imageUrl, imageId]
      );
      inserted.push(finalResult.rows[0]);
    }
    res.status(201).json({ success: true, data: inserted });
  } catch (error) {
    console.error('uploadRoomImages error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi upload ảnh' });
  }
};

const setPrimaryImage = async (req, res) => {
  const { roomId, imageId } = req.params;
  try {
    await query(`UPDATE room_images SET is_primary = FALSE WHERE room_id = $1`, [roomId]);
    await query(`UPDATE room_images SET is_primary = TRUE WHERE id = $1 AND room_id = $2`, [imageId, roomId]);
    res.json({ success: true, message: 'Đã đặt ảnh chính' });
  } catch (error) {
    console.error('setPrimaryImage error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const reorderImages = async (req, res) => {
  const { roomId } = req.params;
  const { order } = req.body; // [{ id, sort_order }]
  try {
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'order phải là mảng' });
    }
    for (const item of order) {
      await query(
        `UPDATE room_images SET sort_order = $1 WHERE id = $2 AND room_id = $3`,
        [item.sort_order, item.id, roomId]
      );
    }
    res.json({ success: true, message: 'Đã cập nhật thứ tự ảnh' });
  } catch (error) {
    console.error('reorderImages error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const deleteRoomImage = async (req, res) => {
  const { imageId } = req.params;
  try {
    const r = await query(`SELECT file_path FROM room_images WHERE id = $1`, [imageId]);
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
    }
    const imageFilePath = r.rows[0].file_path;
    const filePath = path.join(__dirname, '../../', imageFilePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await query(`DELETE FROM room_images WHERE id = $1`, [imageId]);
    res.json({ success: true, message: 'Đã xóa ảnh' });
  } catch (error) {
    console.error('deleteRoomImage error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const serveImage = async (req, res) => {
  const { imageId } = req.params;
  try {
    const result = await query(
      `SELECT file_path FROM room_images WHERE id = $1`,
      [imageId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy ảnh' });
    }
    const filePath = path.join(__dirname, '../../', result.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).json({ success: false, message: 'Ảnh không tồn tại' });
  } catch (error) {
    console.error('serveImage error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh' });
  }
};

module.exports = { getRoomImages, uploadRoomImages, setPrimaryImage, reorderImages, deleteRoomImage, serveImage };
