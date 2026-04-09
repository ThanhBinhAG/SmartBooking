// Địa chỉ API backend
const API_BASE = '/api';

// Helper function để gọi API
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  // Nếu server trả về JSON thì parse JSON, nếu không thì lấy text
  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (err) {
      data = { success: false, message: 'Phản hồi từ server không hợp lệ (JSON không thể parse)' };
    }
  } else {
    const text = await response.text();
    data = {
      success: false,
      message: text || response.statusText || 'Lỗi kết nối server'
    };
  }

  if (!response.ok) {
    throw new Error(data.message || 'Lỗi kết nối server');
  }

  return data;
};

// API functions
const API = {
  // Auth
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  getCurrentUser: () => apiCall('/auth/user'),

  // Rooms
  getRooms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/rooms${query ? '?' + query : ''}`);
  },

  getRoomById: (id) => apiCall(`/rooms/${id}`),

  // Bookings
  createBooking: (bookingData) => apiCall('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData)
  }),

  getMyBookings: () => apiCall('/bookings/my'),

  getBookingById: (id) => apiCall(`/bookings/${id}`),

  cancelBooking: (id) => apiCall(`/bookings/${id}/cancel`, { method: 'PATCH' }),

  // ==================== ACCOUNT ====================
  // Account
  getProfile: () => apiCall('/account/profile'),

  updateProfile: (data) => apiCall('/account/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  changePassword: (data) => apiCall('/account/change-password', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // ==================== ADMIN APIs ====================
  // Admin APIs
  adminGetStats: () => apiCall('/admin/stats'),

  adminGetRooms: () => apiCall('/admin/rooms'),

  adminCreateRoom: (data) => apiCall('/admin/rooms', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  adminUpdateRoom: (id, data) => apiCall(`/admin/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  adminDeleteRoom: (id) => apiCall(`/admin/rooms/${id}`, { method: 'DELETE' }),

  adminGetRoomImages: (roomId) => apiCall(`/admin/rooms/${roomId}/images`),

  adminReorderImages: (roomId, orderData) => apiCall(`/admin/rooms/${roomId}/images/reorder`, {
    method: 'PATCH',
    body: JSON.stringify(orderData)
  }),

  adminSetPrimaryImage: (roomId, imgId) => apiCall(`/admin/rooms/${roomId}/images/${imgId}/set-primary`, {
    method: 'PATCH'
  }),

  adminDeleteImage: (imgId) => apiCall(`/admin/images/${imgId}`, { method: 'DELETE' }),

  adminGetBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/admin/bookings${query ? '?' + query : ''}`);
  },

  adminUpdateBookingStatus: (id, status) => apiCall(`/admin/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  adminGetUsers: () => apiCall('/admin/users'),
  adminUpdateUserRole: (userId, role) => apiCall(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role })
  }),

  // Equipment (có thể là API chung, không nhất thiết chỉ admin)
  getEquipment: () => apiCall('/equipment'),

  // Admin Equipment APIs
  adminCreateEquipment: (data) => apiCall('/admin/equipment', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  adminUpdateEquipment: (id, data) => apiCall(`/admin/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  adminDeleteEquipment: (id) => apiCall(`/admin/equipment/${id}`, { method: 'DELETE' }),
  
};

// Nếu đang dùng <script src="/js/api.js"></script> thông thường (không viết module),
// API sẽ được gán global biến để các file khác có thể sử dụng.
window.API = API;