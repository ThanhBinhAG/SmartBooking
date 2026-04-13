const { query } = require('../utils/db');

// Lấy tất cả phòng (kể cả chưa available) — dành cho admin
const getAllRoomsAdmin = async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*,
             (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_primary = TRUE LIMIT 1) AS primary_image_url,
             COUNT(DISTINCT ri.id) AS image_count,
             COUNT(DISTINCT b.id) FILTER (WHERE b.status NOT IN ('cancelled')) AS active_bookings
      FROM rooms r
      LEFT JOIN room_images ri ON ri.room_id = r.id
      LEFT JOIN bookings b ON b.room_id = r.id
        AND upper(b.time_range) > NOW()
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách phòng:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Thêm phòng mới
const createRoom = async (req, res) => {
  const {
    name, description, capacity, price_per_hour,
    location, floor, amenities, admin_note
  } = req.body;

  if (!name || !capacity || !price_per_hour) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
  }

  // Validation cho dữ liệu
  if (isNaN(capacity) || capacity <= 0) {
    return res.status(400).json({ success: false, message: 'Sức chứa phòng phải là số dương' });
  }

  if (isNaN(price_per_hour) || price_per_hour <= 0) {
    return res.status(400).json({ success: false, message: 'Giá phòng phải là số dương' });
  }

  try {
    const result = await query(
      `INSERT INTO rooms
         (name, description, capacity, price_per_hour, location, floor, amenities, admin_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       RETURNING *`,
      [
        name.trim(),
        description ? description.trim() : null,
        parseInt(capacity),
        parseFloat(price_per_hour),
        location ? location.trim() : null,
        floor ? parseInt(floor) : null,
        JSON.stringify(amenities || []),
        admin_note ? admin_note.trim() : null
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Thêm phòng thành công' });
  } catch (err) {
    console.error('❌ Lỗi tạo phòng:', err.message);
    console.error('Chi tiết:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Cập nhật thông tin phòng
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, capacity, price_per_hour,
    location, floor, amenities, is_available, admin_note
  } = req.body;

  try {
    const result = await query(
      `UPDATE rooms SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         capacity = COALESCE($3, capacity),
         price_per_hour = COALESCE($4, price_per_hour),
         location = COALESCE($5, location),
         floor = COALESCE($6, floor),
         amenities = COALESCE($7::jsonb, amenities),
         is_available = COALESCE($8, is_available),
         admin_note = COALESCE($9, admin_note)
       WHERE id = $10
       RETURNING *`,
      [
        name ? name.trim() : null,
        description ? description.trim() : null,
        capacity ? parseInt(capacity) : null,
        price_per_hour ? parseFloat(price_per_hour) : null,
        location ? location.trim() : null,
        floor ? parseInt(floor) : null,
        amenities ? JSON.stringify(amenities) : null,
        is_available,
        admin_note ? admin_note.trim() : null,
        id
      ]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });

    res.json({ success: true, data: result.rows[0], message: 'Cập nhật phòng thành công' });
  } catch (err) {
    console.error('❌ Lỗi cập nhật phòng:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Xóa phòng (soft delete — tắt is_available)
const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE rooms SET is_available = FALSE WHERE id = $1', [id]);
    res.json({ success: true, message: 'Đã ẩn phòng khỏi danh sách' });
  } catch (err) {
    console.error('❌ Lỗi xóa phòng:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Lấy tổng quan Dashboard Admin
const getDashboardStats = async (req, res) => {
  try {
    const [rooms, bookings, users, revenue] = await Promise.all([
      query('SELECT COUNT(*) FROM rooms WHERE is_available = TRUE'),
      query(`SELECT COUNT(*) FROM bookings
             WHERE status NOT IN ('cancelled')
             AND time_range && tstzrange(NOW(), NOW() + interval '7 days')`),
      query('SELECT COUNT(*) FROM users WHERE is_active = TRUE'),
      query(`SELECT COALESCE(SUM(total_price), 0) AS total
             FROM bookings
             WHERE status IN ('confirmed', 'paid', 'completed')
             AND lower(time_range) >= date_trunc('month', NOW())`)
    ]);

    res.json({
      success: true,
      data: {
        total_rooms:    parseInt(rooms.rows[0].count),
        active_bookings: parseInt(bookings.rows[0].count),
        total_users:    parseInt(users.rows[0].count),
        monthly_revenue: parseFloat(revenue.rows[0].total)
      }
    });
  } catch (err) {
    console.error('❌ Lỗi lấy thống kê dashboard:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Lấy tất cả bookings (admin xem toàn bộ)
const getAllBookings = async (req, res) => {
  const { status, date } = req.query;
  let sql = `
    SELECT b.*,
           r.name AS room_name,
           u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
           lower(b.time_range) AS start_time,
           upper(b.time_range) AS end_time
    FROM bookings b
    JOIN rooms r ON r.id = b.room_id
    JOIN users u ON u.id = b.user_id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (status) { sql += ` AND b.status = $${i++}`; params.push(status); }
  if (date) {
    sql += ` AND DATE(lower(b.time_range)) = $${i++}`;
    params.push(date);
  }
  sql += ' ORDER BY lower(b.time_range) DESC LIMIT 100';

  try {
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách bookings:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Admin cập nhật trạng thái booking
const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'paid', 'cancelled', 'completed'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
  }
  try {
    const result = await query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Không tìm thấy booking' });

    res.json({ success: true, message: `Đã cập nhật trạng thái thành "${status}"` });
  } catch (err) {
    console.error('❌ Lỗi cập nhật trạng thái booking:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Lấy danh sách tất cả users
const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, full_name, email, phone, role, is_active, created_at,
              (SELECT COUNT(*) FROM bookings WHERE user_id = users.id) AS total_bookings
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('❌ Lỗi lấy danh sách users:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Cập nhật role của user
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Validate role
  if (!['customer', 'admin', 'staff'].includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Role không hợp lệ. Chỉ chấp nhận: customer, admin, staff' 
    });
  }

  try {
    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    res.json({ 
      success: true, 
      data: result.rows[0], 
      message: 'Cập nhật role thành công' 
    });
  } catch (err) {
    console.error('❌ Lỗi cập nhật role user:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  getAllRoomsAdmin, createRoom, updateRoom, deleteRoom,
  getDashboardStats, getAllBookings, updateBookingStatus, getAllUsers, updateUserRole
};