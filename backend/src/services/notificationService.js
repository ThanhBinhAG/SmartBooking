const crypto = require('crypto');

/**
 * Gửi thông báo ZNS qua Zalo OA
 * Template ZNS cần tạo trên portal Zalo với các tham số:
 * {{room_name}}, {{start_time}}, {{end_time}}, {{total_price}}, {{booking_id}}
 */
const sendZaloNotification = async ({ phone, bookingData }) => {
  // Lấy access token từ Zalo
  const tokenRes = await fetch(
    `https://oauth.zaloapp.com/v4/oa/access_token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'secret_key': process.env.ZALO_APP_SECRET
      },
      body: new URLSearchParams({
        app_id:      process.env.ZALO_APP_ID,
        grant_type:  'authorization_code',
        // Đối với OA gửi ZNS không cần user code, dùng app access token
      })
    }
  );

  // Trong thực tế, dùng Zalo App Access Token (không cần user login)
  const appToken = await getZaloAppToken();
  if (!appToken) {
    console.warn('Không lấy được Zalo token — bỏ qua gửi thông báo');
    return;
  }

  const payload = {
    phone:       phone.replace(/[^0-9]/g, ''), // Chuẩn hóa số điện thoại
    template_id: process.env.ZALO_ZNS_TEMPLATE_ID,
    template_data: {
      room_name:   bookingData.room_name,
      start_time:  new Date(bookingData.start_time).toLocaleString('vi-VN'),
      end_time:    new Date(bookingData.end_time).toLocaleString('vi-VN'),
      total_price: new Intl.NumberFormat('vi-VN', { style:'currency', currency:'VND' })
                      .format(bookingData.total_price),
      booking_id:  bookingData.id.substring(0, 8).toUpperCase()
    },
    tracking_id: bookingData.id
  };

  try {
    const res = await fetch('https://business.openapi.zalo.me/message/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': appToken
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.error !== 0) {
      console.error('Zalo ZNS error:', data.message);
    } else {
      console.log('✅ Zalo ZNS gửi thành công:', data.data?.msg_id);
    }
  } catch (err) {
    console.error('Zalo notification failed:', err.message);
    // Không throw — thất bại gửi thông báo không làm hỏng booking
  }
};

// Lấy App Access Token từ Zalo (cache 1 tiếng)
let _tokenCache = null;
let _tokenExpiry = 0;

async function getZaloAppToken() {
  if (_tokenCache && Date.now() < _tokenExpiry) return _tokenCache;

  try {
    const res = await fetch(
      `https://oauth.zaloapp.com/v4/access_token?app_id=${process.env.ZALO_APP_ID}&` +
      `grant_type=client_credentials&` +
      `app_secret=${process.env.ZALO_APP_SECRET}`
    );
    const data = await res.json();
    if (data.access_token) {
      _tokenCache = data.access_token;
      _tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // Trừ 5 phút dự phòng
      return _tokenCache;
    }
  } catch (err) {
    console.error('Lỗi lấy Zalo token:', err.message);
  }
  return null;
}

module.exports = { sendZaloNotification };