const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/db');

// ===========================
// ĐĂNG KÝ TÀI KHOẢN
// ===========================
const register = async (req, res) => {
  const { full_name, email, phone, password, consent_given } = req.body;

  // Validate bắt buộc phải đồng ý điều khoản (Nghị định 13/2023)
  if (!consent_given) {
    return res.status(400).json({
      success: false,
      message: 'Bạn phải đồng ý với chính sách bảo vệ dữ liệu cá nhân để đăng ký'
    });
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email này đã được đăng ký'
      });
    }

    // Băm mật khẩu với bcrypt (saltRounds = 12)
    // Không bao giờ lưu mật khẩu dạng plain text!
    const hashed_password = await bcrypt.hash(password, 12);

    // Lưu user vào database
    const result = await query(
      `INSERT INTO users (full_name, email, phone, hashed_password, consent_given)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role`,
      [full_name, email, phone, hashed_password, consent_given]
    );

    const newUser = result.rows[0];

    // Tạo JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: { user: newUser, token }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống, vui lòng thử lại'
    });
  }
};

// ===========================
// ĐĂNG NHẬP
// ===========================
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm user theo email
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    const user = result.rows[0];

    // So sánh mật khẩu với hash đã lưu
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
  }
};

// ===========================
// LẤY THÔNG TIN USER HIỆN TẠI
// ===========================
const getCurrentUser = async (req, res) => {
  try {
    // Lấy thông tin user từ token (đã được decode trong middleware)
    const user = req.user;

    // Trả về thông tin user (không bao gồm password hash)
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
};

module.exports = { register, login, getCurrentUser };