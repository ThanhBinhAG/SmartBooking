/**
 * ============================================
 * ADMIN MANAGER — SmartBook 3D
 * ============================================
 */

const AdminApp = {
  currentRoomId: null,

  /* ---- SECTION SWITCH ---- */
  showSection(name, btn) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`section-${name}`).classList.remove('hidden');
    btn.classList.add('active');

    const loaders = {
      dashboard:  () => this.loadDashboard(),
      rooms:      () => this.loadRooms(),
      bookings:   () => this.loadBookings(),
      users:      () => this.loadUsers(),
      equipment:  () => this.loadEquipment(),
    };
    loaders[name]?.();
  },

  /* ---- DASHBOARD ---- */
  async loadDashboard() {
    try {
      const res = await API.adminGetStats();
      const d = res.data;
      document.getElementById('stats-grid').innerHTML = `
        <div class="stat-card">
          <div class="stat-card-icon">🏢</div>
          <div class="stat-card-value">${d.total_rooms}</div>
          <div class="stat-card-label">Phòng đang hoạt động</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">📅</div>
          <div class="stat-card-value">${d.active_bookings}</div>
          <div class="stat-card-label">Đặt phòng sắp tới</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-value">${d.total_users}</div>
          <div class="stat-card-label">Người dùng</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">💰</div>
          <div class="stat-card-value">${fmtPrice(d.monthly_revenue)}</div>
          <div class="stat-card-label">Doanh thu tháng này</div>
        </div>
      `;

      // Load upcoming bookings
      const bRes = await API.adminGetBookings({});
      const upcoming = bRes.data.slice(0, 8);
      document.getElementById('upcoming-bookings').innerHTML = upcoming.length
        ? `<table class="booking-table">
            <thead><tr>
              <th>Khách hàng</th><th>Phòng</th><th>Thời gian</th><th>Trạng thái</th>
            </tr></thead>
            <tbody>
              ${upcoming.map(b => `
                <tr>
                  <td><strong>${b.user_name}</strong><br><span style="color:var(--text-soft);font-size:0.8rem;">${b.user_phone || ''}</span></td>
                  <td>${b.room_name}</td>
                  <td style="font-size:0.82rem;">${fmtDT(b.start_time)}<br>→ ${fmtDT(b.end_time)}</td>
                  <td><span class="status-badge status-${b.status}">${statusLabel(b.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
        : `<div style="text-align:center;padding:30px;color:var(--text-soft)">📭 Không có đặt phòng sắp tới</div>`;
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  /* ---- ROOMS ---- */
  async loadRooms() {
    const container = document.getElementById('rooms-admin-list');
    try {
      const res = await API.adminGetRooms();
      if (!res.data.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-soft)">Chưa có phòng nào</div>';
        return;
      }
      container.innerHTML = res.data.map(room => `
        <div class="room-admin-card">
          ${room.primary_image_url
            ? `<img src="${room.primary_image_url}" alt="${room.name}" class="room-admin-thumb">`
            : `<div class="room-admin-thumb-placeholder">🏢</div>`}
          <div class="room-admin-info">
            <div class="room-admin-name">${room.name}</div>
            <div class="room-admin-meta">
              📍 ${room.location || 'Chưa có địa chỉ'} · 👥 ${room.capacity} người · Tầng ${room.floor || '?'}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
              <span style="font-size:0.82rem;color:var(--gold);font-weight:700;">💰 ${fmtPrice(room.price_per_hour)}/giờ</span>
              <span style="font-size:0.82rem;color:var(--text-soft);">🖼️ ${room.image_count} ảnh</span>
              <span style="font-size:0.82rem;color:var(--text-soft);">📅 ${room.active_bookings} đặt phòng đang có</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">
              ${(room.amenities || []).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
            </div>
            ${!room.is_available ? '<span style="color:#DC2626;font-size:0.8rem;font-weight:700;margin-top:6px;display:block;">⚠️ Đang ẩn</span>' : ''}
          </div>
          <div class="room-admin-actions">
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.openImageModal('${room.id}', '${room.name}')">
              🖼️ Quản lý ảnh
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.openRoomModal(${JSON.stringify(room).replace(/"/g, '&quot;')})">
              ✏️ Chỉnh sửa
            </button>
            <button class="btn btn-sm" style="color:#DC2626;background:var(--bg-section);border:1px solid #FCA5A5;"
                    onclick="AdminApp.toggleRoomAvailability('${room.id}', ${room.is_available})">
              ${room.is_available ? '🙈 Ẩn phòng' : '👁️ Hiện lại'}
            </button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:#DC2626;text-align:center;padding:40px;">❌ ${e.message}</div>`;
    }
  },

  /* ---- ROOM MODAL ---- */
  openRoomModal(room = null) {
    const isEdit = !!room;
    document.getElementById('room-modal-title').textContent = isEdit ? 'Chỉnh sửa phòng' : 'Thêm phòng mới';
    document.getElementById('edit-room-id').value = isEdit ? room.id : '';
    document.getElementById('room-name').value = isEdit ? room.name : '';
    document.getElementById('room-floor').value = isEdit ? (room.floor || '') : '';
    document.getElementById('room-capacity').value = isEdit ? room.capacity : '';
    document.getElementById('room-price').value = isEdit ? room.price_per_hour : '';
    document.getElementById('room-location').value = isEdit ? (room.location || '') : '';
    document.getElementById('room-description').value = isEdit ? (room.description || '') : '';
    document.getElementById('room-amenities').value = isEdit ? (room.amenities || []).join(', ') : '';
    document.getElementById('room-admin-note').value = isEdit ? (room.admin_note || '') : '';
    document.getElementById('room-modal-error').classList.add('hidden');
    document.getElementById('room-modal-backdrop').classList.add('open');
  },

  closeRoomModal() {
    document.getElementById('room-modal-backdrop').classList.remove('open');
  },

  async saveRoom() {
    const id = document.getElementById('edit-room-id').value;
    const errEl = document.getElementById('room-modal-error');
    errEl.classList.add('hidden');

    const payload = {
      name:          document.getElementById('room-name').value.trim(),
      floor:         parseInt(document.getElementById('room-floor').value) || null,
      capacity:      parseInt(document.getElementById('room-capacity').value),
      price_per_hour: parseFloat(document.getElementById('room-price').value),
      location:      document.getElementById('room-location').value.trim(),
      description:   document.getElementById('room-description').value.trim(),
      amenities:     document.getElementById('room-amenities').value
                       .split(',').map(s => s.trim()).filter(Boolean),
      admin_note:    document.getElementById('room-admin-note').value.trim()
    };

    if (!payload.name || !payload.capacity || !payload.price_per_hour) {
      errEl.textContent = 'Vui lòng điền tên phòng, sức chứa và giá';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      if (id) {
        await API.adminUpdateRoom(id, payload);
        showToast('success', 'Đã cập nhật', `Phòng "${payload.name}" đã được cập nhật`);
      } else {
        await API.adminCreateRoom(payload);
        showToast('success', 'Đã thêm phòng', `Phòng "${payload.name}" đã được tạo`);
      }
      this.closeRoomModal();
      this.loadRooms();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async toggleRoomAvailability(roomId, currentStatus) {
    const msg = currentStatus ? 'Ẩn phòng khỏi danh sách?' : 'Hiện lại phòng?';
    if (!confirm(msg)) return;
    try {
      await API.adminUpdateRoom(roomId, { is_available: !currentStatus });
      showToast('success', 'Đã cập nhật', '');
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  /* ---- IMAGE MODAL ---- */
  openImageModal(roomId, roomName) {
    this.currentRoomId = roomId;
    document.getElementById('image-modal-room-name').textContent = roomName;
    document.getElementById('image-modal-backdrop').classList.add('open');
    this.loadRoomImages(roomId);
  },

  async loadRoomImages(roomId) {
    const grid = document.getElementById('room-images-grid');
    grid.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft)">⏳ Đang tải...</div>';
    try {
      const res = await API.adminGetRoomImages(roomId);
      if (!res.data.length) {
        grid.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-soft)">📷 Chưa có ảnh nào. Hãy upload ảnh!</div>';
        return;
      }
      grid.innerHTML = res.data.map(img => `
        <div class="image-item ${img.is_primary ? 'is-primary' : ''}" id="img-${img.id}" draggable="true" data-id="${img.id}">
          <img src="${img.url}" alt="${img.alt_text || ''}">
          ${img.is_primary ? '<div class="primary-badge">⭐ Chính</div>' : ''}
          <div class="image-item-actions">
            <button class="image-action-btn star" onclick="AdminApp.setPrimary('${roomId}', '${img.id}')"
                    title="Đặt làm ảnh chính">⭐</button>
            <button class="image-action-btn up" onclick="AdminApp.moveImage('${img.id}', 'up')"
                    title="Di chuyển lên">⬆️</button>
            <button class="image-action-btn down" onclick="AdminApp.moveImage('${img.id}', 'down')"
                    title="Di chuyển xuống">⬇️</button>
            <button class="image-action-btn del" onclick="AdminApp.deleteImage('${img.id}', '${roomId}')"
                    title="Xóa ảnh">🗑️</button>
          </div>
        </div>
      `).join('');

      // Thêm event listeners cho drag & drop
      this.initDragAndDrop();
    } catch (e) {
      grid.innerHTML = `<div style="color:#DC2626;text-align:center;padding:20px;">❌ ${e.message}</div>`;
    }
  },

  initDragAndDrop() {
    const grid = document.getElementById('room-images-grid');
    const items = grid.querySelectorAll('.image-item');

    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.id);
        e.target.classList.add('dragging');
      });

      item.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== e.target) {
          const rect = e.target.getBoundingClientRect();
          const midpoint = rect.left + rect.width / 2;
          if (e.clientX < midpoint) {
            e.target.parentNode.insertBefore(dragging, e.target);
          } else {
            e.target.parentNode.insertBefore(dragging, e.target.nextSibling);
          }
        }
      });
    });

    grid.addEventListener('drop', (e) => {
      e.preventDefault();
      this.saveImageOrder();
    });
  },

  async saveImageOrder() {
    const items = document.querySelectorAll('#room-images-grid .image-item');
    const orderData = Array.from(items).map((item, index) => ({
      id: item.dataset.id,
      sort_order: index
    }));

    try {
      await API.adminReorderImages(this.currentRoomId, { order: orderData });
      showToast('success', 'Đã lưu thứ tự', '');
    } catch (e) {
      showToast('error', 'Lỗi lưu thứ tự', e.message);
    }
  },

  async moveImage(imageId, direction) {
    const item = document.getElementById(`img-${imageId}`);
    if (!item) return;

    const parent = item.parentNode;
    if (direction === 'up' && item.previousElementSibling) {
      parent.insertBefore(item, item.previousElementSibling);
    } else if (direction === 'down' && item.nextElementSibling) {
      parent.insertBefore(item, item.nextElementSibling.nextSibling);
    }

    this.saveImageOrder();
  },

  handleFileSelect(event) {
    const files = Array.from(event.target.files);
    this.uploadImages(files);
  },

  handleDrop(event) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    this.uploadImages(files);
  },

  async uploadImages(files) {
    if (!files.length || !this.currentRoomId) return;
    const progressEl = document.getElementById('upload-progress');
    const barEl = document.getElementById('upload-bar');
    const statusEl = document.getElementById('upload-status');
    progressEl.classList.remove('hidden');

    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      statusEl.textContent = `Đang upload ${files.length} ảnh...`;
      barEl.style.width = '30%';

      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/admin/rooms/${this.currentRoomId}/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      barEl.style.width = '100%';
      const data = await res.json();

      if (!data.success) throw new Error(data.message);
      showToast('success', 'Upload thành công', `${data.data.length} ảnh đã được thêm`);
      this.loadRoomImages(this.currentRoomId);
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Upload thất bại', e.message);
    } finally {
      setTimeout(() => {
        progressEl.classList.add('hidden');
        barEl.style.width = '0%';
      }, 1000);
      document.getElementById('file-input').value = '';
    }
  },

  async setPrimary(roomId, imageId) {
    try {
      await API.adminSetPrimaryImage(roomId, imageId);
      showToast('success', 'Đã đặt ảnh chính', '');
      this.loadRoomImages(roomId);
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  async deleteImage(imageId, roomId) {
    if (!confirm('Xóa ảnh này?')) return;
    try {
      await API.adminDeleteImage(imageId);
      document.getElementById(`img-${imageId}`)?.remove();
      showToast('success', 'Đã xóa ảnh', '');
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  /* ---- BOOKINGS ---- */
  async loadBookings() {
    const status = document.getElementById('booking-filter-status')?.value;
    const date   = document.getElementById('booking-filter-date')?.value;
    const container = document.getElementById('bookings-admin-list');
    try {
      const res = await API.adminGetBookings({ status, date });
      if (!res.data.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-soft)">Không có dữ liệu</div>';
        return;
      }
      container.innerHTML = `
        <div class="admin-card">
          <table class="booking-table">
            <thead><tr>
              <th>Khách hàng</th><th>Phòng</th><th>Thời gian</th>
              <th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th>
            </tr></thead>
            <tbody>
              ${res.data.map(b => `
                <tr>
                  <td>
                    <strong>${b.user_name}</strong><br>
                    <span style="font-size:0.78rem;color:var(--text-soft);">${b.user_email}</span><br>
                    <span style="font-size:0.78rem;color:var(--text-soft);">${b.user_phone || ''}</span>
                  </td>
                  <td>${b.room_name}</td>
                  <td style="font-size:0.82rem;white-space:nowrap;">
                    ${fmtDT(b.start_time)}<br>→ ${fmtDT(b.end_time)}
                  </td>
                  <td style="font-weight:700;color:var(--gold);">${fmtPrice(b.total_price)}</td>
                  <td><span class="status-badge status-${b.status}">${statusLabel(b.status)}</span></td>
                  <td>
                    <select onchange="AdminApp.changeBookingStatus('${b.id}', this.value)"
                            style="padding:5px 8px;border:1px solid var(--border);border-radius:6px;font-size:0.82rem;">
                      <option value="">-- Đổi --</option>
                      <option value="confirmed">✅ Xác nhận</option>
                      <option value="paid">💳 Đã thanh toán</option>
                      <option value="cancelled">❌ Hủy</option>
                      <option value="completed">🏁 Hoàn thành</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color:#DC2626;text-align:center;padding:40px;">❌ ${e.message}</div>`;
    }
  },

  async changeBookingStatus(bookingId, status) {
    if (!status) return;
    try {
      await API.adminUpdateBookingStatus(bookingId, status);
      showToast('success', 'Đã cập nhật', `Trạng thái → ${statusLabel(status)}`);
      this.loadBookings();
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  /* ---- USERS ---- */
  async loadUsers() {
    const container = document.getElementById('users-admin-list');
    try {
      const res = await API.adminGetUsers();
      container.innerHTML = `
        <div class="admin-card">
          <table class="booking-table">
            <thead><tr>
              <th>Họ tên</th><th>Email</th><th>SĐT</th>
              <th>Vai trò</th><th>Số đặt phòng</th><th>Ngày đăng ký</th>
            </tr></thead>
            <tbody>
              ${res.data.map(u => `
                <tr>
                  <td><strong>${u.full_name}</strong></td>
                  <td style="font-size:0.85rem;">${u.email}</td>
                  <td style="font-size:0.85rem;">${u.phone || '—'}</td>
                  <td>
                    <select class="form-input" style="width:120px;font-size:0.8rem;padding:4px 8px;"
                            onchange="AdminApp.updateUserRole('${u.id}', this.value)">
                      <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                      <option value="staff" ${u.role === 'staff' ? 'selected' : ''}>Staff</option>
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </td>
                  <td style="text-align:center;">${u.total_bookings}</td>
                  <td style="font-size:0.8rem;color:var(--text-soft);">${new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div style="color:#DC2626;text-align:center;padding:40px;">❌ ${e.message}</div>`;
    }
  },

  /* ---- EQUIPMENT ---- */
  async loadEquipment() {
    const container = document.getElementById('equipment-admin-list');
    try {
      const res = await API.getEquipment();
      if (!res.data.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-soft)">Chưa có thiết bị nào</div>';
        return;
      }
      container.innerHTML = res.data.map(e => `
        <div class="room-admin-card" style="grid-template-columns:80px 1fr auto;">
          <div class="room-admin-thumb-placeholder" style="width:80px;height:80px;">🛠️</div>
          <div class="room-admin-info">
            <div class="room-admin-name">${e.name}</div>
            <div class="room-admin-meta">${e.description || ''} · Tồn kho: ${e.total_stock} ${e.unit}</div>
            <div style="color:var(--gold);font-weight:700;font-size:0.88rem;">💰 ${fmtPrice(e.hourly_rate)}/giờ</div>
          </div>
          <div class="room-admin-actions">
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.openEquipmentModal(${JSON.stringify(e).replace(/"/g, '&quot;')})">
              ✏️ Sửa
            </button>
            <button class="btn btn-sm" style="color:#DC2626;background:var(--bg-section);border:1px solid #FCA5A5;"
                    onclick="AdminApp.toggleEquipmentAvailability('${e.id}', ${e.is_active})">
              ${e.is_active ? '🙈 Ẩn' : '👁️ Hiện'}
            </button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = `<div style="color:#DC2626;text-align:center;padding:40px;">❌ ${e.message}</div>`;
    }
  },

  openEquipmentModal(equipment = null) {
    const isEdit = !!equipment;
    document.getElementById('equipment-modal-title').textContent = isEdit ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới';
    document.getElementById('edit-equipment-id').value = isEdit ? equipment.id : '';
    document.getElementById('equipment-name').value = isEdit ? equipment.name : '';
    document.getElementById('equipment-unit').value = isEdit ? (equipment.unit || 'cái') : 'cái';
    document.getElementById('equipment-price').value = isEdit ? equipment.hourly_rate : '';
    document.getElementById('equipment-stock').value = isEdit ? equipment.total_stock : '';
    document.getElementById('equipment-description').value = isEdit ? (equipment.description || '') : '';
    document.getElementById('equipment-modal-error').classList.add('hidden');
    document.getElementById('equipment-modal-backdrop').classList.add('open');
  },

  closeEquipmentModal() {
    document.getElementById('equipment-modal-backdrop').classList.remove('open');
  },

  async saveEquipment() {
    const id = document.getElementById('edit-equipment-id').value;
    const errEl = document.getElementById('equipment-modal-error');
    errEl.classList.add('hidden');

    const payload = {
      name: document.getElementById('equipment-name').value.trim(),
      unit: document.getElementById('equipment-unit').value.trim(),
      hourly_rate: parseFloat(document.getElementById('equipment-price').value),
      total_stock: parseInt(document.getElementById('equipment-stock').value),
      description: document.getElementById('equipment-description').value.trim()
    };

    if (!payload.name || !payload.hourly_rate || !payload.total_stock) {
      errEl.textContent = 'Vui lòng điền tên, giá và tồn kho';
      errEl.classList.remove('hidden');
      return;
    }

    try {
      if (id) {
        await API.adminUpdateEquipment(id, payload);
        showToast('success', 'Đã cập nhật', `Thiết bị "${payload.name}" đã được cập nhật`);
      } else {
        await API.adminCreateEquipment(payload);
        showToast('success', 'Đã thêm thiết bị', `Thiết bị "${payload.name}" đã được tạo`);
      }
      this.closeEquipmentModal();
      this.loadEquipment();
    } catch (e) {
      errEl.textContent = e.message;
      errEl.classList.remove('hidden');
    }
  },

  async toggleEquipmentAvailability(equipmentId, currentStatus) {
    const msg = currentStatus ? 'Ẩn thiết bị?' : 'Hiện thiết bị?';
    if (!confirm(msg)) return;
    try {
      await API.adminUpdateEquipment(equipmentId, { is_active: !currentStatus });
      showToast('success', 'Đã cập nhật', '');
      this.loadEquipment();
    } catch (e) {
      showToast('error', 'Lỗi', e.message);
    }
  },

  /* ---- INIT ---- */
  async init() {
    try {
      // Fetch thông tin user mới nhất từ server để đảm bảo role chính xác
      const res = await API.getCurrentUser();
      const user = res.data.user;

      // Cập nhật localStorage với thông tin mới nhất
      localStorage.setItem('user', JSON.stringify(user));

      // Kiểm tra quyền admin
      if (!user.id || user.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      AuthManager.updateUI(user);
      this.loadDashboard();
    } catch (error) {
      console.error('Failed to get current user:', error);
      // Nếu không thể lấy thông tin user, redirect về trang chủ
      AuthManager.logout();
      window.location.href = '/';
    }
  },

  /* ---- USER ROLE MANAGEMENT ---- */
  async updateUserRole(userId, newRole) {
    try {
      await API.adminUpdateUserRole(userId, newRole);
      showToast('success', 'Đã cập nhật', 'Vai trò người dùng đã được thay đổi');
      // Reload danh sách users để cập nhật hiển thị
      this.loadUsers();
    } catch (error) {
      showToast('error', 'Lỗi', error.message);
      // Reset lại select về giá trị cũ nếu có lỗi
      this.loadUsers();
    }
  }
};

/* ---- HELPERS ---- */
function fmtPrice(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
}
function fmtDT(dt) {
  return new Date(dt).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
}
function statusLabel(s) {
  const m = { pending:'⏳ Chờ', confirmed:'✅ Xác nhận', paid:'💳 Thanh toán', cancelled:'❌ Hủy', completed:'🏁 Hoàn thành' };
  return m[s] || s;
}

document.addEventListener('DOMContentLoaded', () => AdminApp.init());