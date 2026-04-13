const { query } = require('../utils/db');

const getAllRooms = async (req, res) => {
  try {
    const { capacity, date, start_time, end_time } = req.query;

    let sql = `
      SELECT r.*,
             COALESCE(AVG(rv.rating), 0)::NUMERIC(3,1) AS avg_rating,
             COUNT(rv.id) AS review_count,
             (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_primary = TRUE LIMIT 1) AS primary_image_url
      FROM rooms r
      LEFT JOIN reviews rv ON rv.room_id = r.id
      WHERE r.is_available = TRUE
    `;
    const params = [];
    let paramCount = 1;

    if (capacity) {
      sql += ` AND r.capacity >= $${paramCount}`;
      params.push(parseInt(capacity));
      paramCount++;
    }

    if (date && start_time && end_time) {
      const timeRange = `[${date}T${start_time}+07, ${date}T${end_time}+07)`;
      sql += `
        AND r.id NOT IN (
          SELECT room_id FROM bookings
          WHERE time_range && $${paramCount}::tstzrange
          AND status NOT IN ('cancelled')
        )
      `;
      params.push(timeRange);
      paramCount++;
    }

    sql += ' GROUP BY r.id ORDER BY r.price_per_hour ASC';

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });

  } catch (error) {
    console.error("FULL ERROR:", JSON.stringify({msg: error.message, stack: error.stack, code: error.code}));
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách phòng", debug: error.message });
  }
};

const getRoomById = async (req, res) => {
  const { id } = req.params;
  try {
    const roomResult = await query(
      `SELECT r.*, COALESCE(AVG(rv.rating), 0)::NUMERIC(3,1) AS avg_rating,
              (SELECT url FROM room_images ri WHERE ri.room_id = r.id AND ri.is_primary = TRUE LIMIT 1) AS primary_image_url
       FROM rooms r
       LEFT JOIN reviews rv ON rv.room_id = r.id
       WHERE r.id = $1
       GROUP BY r.id`,
      [id]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy phòng' });
    }

    const imagesResult = await query(
      `SELECT id, url, alt_text, is_primary, sort_order
       FROM room_images WHERE room_id = $1
       ORDER BY is_primary DESC, sort_order ASC`,
      [id]
    );

    const bookingsResult = await query(
      `SELECT lower(time_range) AS start_time, upper(time_range) AS end_time
       FROM bookings
       WHERE room_id = $1
         AND status NOT IN ('cancelled')
         AND time_range && tstzrange(NOW(), NOW() + interval '7 days')
       ORDER BY lower(time_range)`,
      [id]
    );

    const reviewsResult = await query(
      `SELECT rv.*, u.full_name AS user_name
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.room_id = $1
       ORDER BY rv.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        room: roomResult.rows[0],
        images: imagesResult.rows,
        booked_slots: bookingsResult.rows,
        reviews: reviewsResult.rows
      }
    });

  } catch (error) {
    console.error('getRoomById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin phòng' });
  }
};

module.exports = { getAllRooms, getRoomById };
