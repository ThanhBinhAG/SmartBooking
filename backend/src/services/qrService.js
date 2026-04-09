const QRCode = require('qrcode');

// Tạo QR Code dạng Data URL (base64 PNG)
const generateQR = async (data) => {
  try {
    const qrCodeUrl = await QRCode.toDataURL(
      typeof data === 'string' ? data : JSON.stringify(data),
      {
        errorCorrectionLevel: 'H', // Mức độ sửa lỗi cao nhất
        type: 'image/png',
        quality: 0.92,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#FFFFFF' },
        width: 300
      }
    );
    return qrCodeUrl; // Data URL: "data:image/png;base64,..."
  } catch (error) {
    console.error('QR generation error:', error);
    throw error;
  }
};

module.exports = { generateQR };