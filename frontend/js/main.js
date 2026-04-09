// Khởi tạo trang
document.addEventListener('DOMContentLoaded', () => {
  // Set ngày tối thiểu là hôm nay
  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Load danh sách phòng
  loadRooms();
});

// Gọi checkAuthStatus sau khi tất cả scripts đã load
window.addEventListener('load', async () => {
  await checkAuthStatus();
});

async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (token && user) {
    try {
      // Fetch thông tin user mới nhất từ server để đảm bảo role chính xác
      const res = await API.getCurrentUser();
      const freshUser = res.data.user;

      // Cập nhật localStorage với thông tin mới nhất
      localStorage.setItem('user', JSON.stringify(freshUser));

      // Sử dụng AuthManager.updateUI để cập nhật đầy đủ UI bao gồm link admin
      AuthManager.updateUI(freshUser);
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Nếu không thể lấy thông tin user, logout
      AuthManager.logout();
    }
  } else {
    // Hiển thị UI cho guest
    AuthManager._showGuestUI();
  }
}

async function loadRooms(params = {}) {
  const grid = document.getElementById('rooms-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="loading">⏳ Đang tải...</div>';

  try {
    const response = await API.getRooms(params);
    const rooms = response.data;

    if (rooms.length === 0) {
      grid.innerHTML = '<p class="no-results">😔 Không tìm thấy phòng phù hợp</p>';
      return;
    }

    grid.innerHTML = rooms.map(room => `
      <div class="room-card">
        <div class="room-thumbnail">
          <img 
            src="${room.primary_image_url || '/assets/default-room.svg'}" 
            alt="${room.name}"
            onerror="this.src='/assets/default-room.svg'">
          <span class="room-capacity">👥 ${room.capacity} người</span>
        </div>
        <div class="room-info">
          <h3>${room.name}</h3>
          <p class="room-location">📍 ${room.location}</p>
          <p class="room-desc">${room.description || ''}</p>
          <div class="room-amenities">
            ${(room.amenities || []).map(a => `<span class="tag">${a}</span>`).join('')}
          </div>
          <div class="room-footer">
            <div class="room-price">
              <span class="price">${formatPrice(room.price_per_hour)}</span>/giờ
            </div>
            <div class="room-rating">
              ⭐ ${room.avg_rating || 0} (${room.review_count || 0} đánh giá)
            </div>
          </div>
          <div class="room-actions">
            <a href="/room-detail.html?id=${room.id}" class="btn btn-outline btn-sm">
              🔭 Xem chi tiết & đặt phòng
            </a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    grid.innerHTML = `<p class="error">❌ ${error.message}</p>`;
  }
}

async function searchRooms() {
  const date = document.getElementById('search-date').value;
  const start = document.getElementById('search-start').value;
  const end = document.getElementById('search-end').value;
  const capacity = document.getElementById('search-capacity').value;

  const params = {};
  if (date && start && end) {
    params.date = date;
    params.start_time = start;
    params.end_time = end;
  }
  if (capacity) params.capacity = capacity;

  await loadRooms(params);
}

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await API.login({ email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    closeModal('login-modal');
    checkAuthStatus();
    alert('✅ Đăng nhập thành công!');
  } catch (error) {
    alert('❌ ' + error.message);
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
}

function showLoginModal() {
  document.getElementById('login-modal').style.display = 'flex';
}

function showRegisterModal() {
  closeModal('login-modal');
  // Mở modal đăng ký...
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}