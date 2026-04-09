const { query, pool } = require('../utils/db');
const qrService = require('../services/qrService');
const crypto = require('crypto');

const createBooking = async (req, res) => {
  const { room_id, start_datetime, end_datetime, equipment_items = [], notes } = req.body;
  const user_id = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Kiểm tra phòng tồn tại và khả dụng
    const roomResult = await client.query(
      `SELECT price_per_hour 
       FROM rooms 
       WHERE id = $1 AND is_available = TRUE`,
      [room_id]
    );

    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Phòng không tồn tại hoặc không khả dụng' 
      });
    }

    const pricePerHour = parseFloat(roomResult.rows[0].price_per_hour);
    const startTime = new Date(start_datetime);
    const endTime = new Date(end_datetime);

    // Tính số giờ (làm tròn 2 chữ số thập phân)
    const hours = parseFloat(((endTime - startTime) / (1000 * 60 * 60)).toFixed(2));
    let totalPrice = pricePerHour * hours;

    // Tính tiền thiết bị (nếu có)
    if (equipment_items.length > 0) {
      for (const item of equipment_items) {
        const eqResult = await client.query(
          `SELECT hourly_rate 
           FROM equipment 
           WHERE id = $1 AND is_active = TRUE`,
          [item.equipment_id]
        );

        if (eqResult.rows.length > 0) {
          const eqRate = parseFloat(eqResult.rows[0].hourly_rate);
          totalPrice += eqRate * hours * (item.quantity || 1);
        }
      }
    }

    // Tạo booking
    const timeRange = `[${start_datetime}, ${end_datetime})`;

    const bookingResult = await client.query(
      `INSERT INTO bookings 
         (user_id, room_id, time_range, total_price, notes, status)
       VALUES ($1, $2, $3::tstzrange, $4, $5, 'pending')
       RETURNING *`,
      [user_id, room_id, timeRange, totalPrice, notes || null]
    );

    const booking = bookingResult.rows[0];

    // Thêm chi tiết thiết bị (nếu có)
    if (equipment_items.length > 0) {
      for (const item of equipment_items) {
        await client.query(
          `INSERT INTO booking_details (booking_id, equipment_id, quantity)
           VALUES ($1, $2, $3)`,
          [booking.id, item.equipment_id, item.quantity || 1]
        );
      }
    }

    // Tạo QR code
    const qrData = JSON.stringify({
      booking_id: booking.id,
      hash: crypto
        .createHmac('sha256', process.env.JWT_SECRET)
        .update(String(booking.id))
        .digest('hex')
        .substring(0, 16)
    });

    const qrCodeUrl = await qrService.generateQR(qrData);

    // Cập nhật qr_code_data vào booking
    await client.query(
      `UPDATE bookings 
       SET qr_code_data = $1 
       WHERE id = $2`,
      [qrData, booking.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Đặt phòng thành công! Vui lòng thanh toán để xác nhận.',
      data: {
        booking: { 
          ...booking, 
          qr_code_url: qrCodeUrl 
        },
        total_price: totalPrice
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');

    // Xử lý lỗi trùng lịch (nếu bạn có constraint no_booking_overlap)
    if (error.constraint === 'no_booking_overlap' || error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Phòng này đã được đặt vào khung giờ bạn chọn. Vui lòng chọn thời gian khác.'
      });
    }

    console.error('createBooking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi hệ thống khi đặt phòng' 
    });
  } finally {
    client.release();
  }
};

// ==================== Các hàm còn lại (cũng đã sửa nhỏ cho nhất quán) ====================

const getMyBookings = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await query(
      `SELECT b.*, r.name AS room_name, r.location AS room_location,
              lower(b.time_range) AS start_time, upper(b.time_range) AS end_time
       FROM bookings b 
       JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = $1 
       ORDER BY lower(b.time_range) DESC`,
      [user_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const getBookingById = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await query(
      `SELECT b.*, r.name AS room_name, r.location AS room_location,
              lower(b.time_range) AS start_time, upper(b.time_range) AS end_time
       FROM bookings b 
       JOIN rooms r ON r.id = b.room_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn đặt phòng' 
      });
    }

    const booking = result.rows[0];

    const equipmentRes = await query(
      `SELECT bd.equipment_id, e.name AS equipment_name, e.unit, bd.quantity
       FROM booking_details bd 
       JOIN equipment e ON e.id = bd.equipment_id
       WHERE bd.booking_id = $1`,
      [id]
    );

    booking.equipment_items = equipmentRes.rows;

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const result = await query(
      `UPDATE bookings 
       SET status = 'cancelled'
       WHERE id = $1 
         AND user_id = $2 
         AND status IN ('pending', 'confirmed') 
       RETURNING id`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy đơn đặt phòng hoặc không thể hủy' 
      });
    }

    res.json({ success: true, message: 'Hủy đặt phòng thành công' });
  } catch (error) {
    console.error('cancelBooking error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking };