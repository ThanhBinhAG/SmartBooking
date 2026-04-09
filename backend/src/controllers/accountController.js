const bcrypt = require('bcryptjs');
const { query } = require('../utils/db');

// Cập nhật hồ sơ cá nhân
const updateProfile = async (req, res) => {
  const { full_name, phone, bio } = req.body;
  const user_id = req.user.id;

  if (!full_name?.trim()) {
    return res.status(400).json({ success: false, message: 'Họ và tên không được để trống' });
  }

  try {
    const result = await query(
      `UPDATE users
       SET full_name = $1, phone = $2, bio = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, full_name, email, phone, role`,
      [full_name.trim(), phone?.trim() || null, bio?.trim() || null, user_id]
    );

    res.json({ success: true, message: 'Cập nhật hồ sơ thành công', data: result.rows[0] });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  const user_id = req.user.id;

  if (!old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải ít nhất 8 ký tự' });
  }

  try {
    const userResult = await query('SELECT hashed_password FROM users WHERE id = $1', [user_id]);
    if (!userResult.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }

    const isValid = await bcrypt.compare(old_password, userResult.rows[0].hashed_password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET hashed_password = $1, updated_at = NOW() WHERE id = $2', [hashed, user_id]);

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// Lấy thông tin tài khoản
const getProfile = async (req, res) => {
  const user_id = req.user.id;
  try {
    const result = await query(
      'SELECT id, full_name, email, phone, role, bio, created_at FROM users WHERE id = $1',
      [user_id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

module.exports = { updateProfile, changePassword, getProfile };