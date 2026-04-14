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
    document.getElementById(`section-${name}`)?.classList.remove('hidden');

    const activeButton = btn || document.querySelector(`.admin-nav-item[data-section="${name}"]`);
    activeButton?.classList.add('active');

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

  roomDesigner: {
    currentRoomId: null,
    currentRoomName: 'Phòng mới',
    blocks: [],
    previewMode: 'desktop',
    dragIndex: null,
    history: [],
    future: []
  },

  openRoomModal(room = null) {
    return this.openRoomDesigner(room);
  },

  async openRoomDesigner(room = null) {
    const isEdit = !!room;
    this.roomDesigner.currentRoomId = isEdit ? room.id : null;
    this.roomDesigner.currentRoomName = isEdit ? room.name : 'Phòng mới';
    this.roomDesigner.blocks = isEdit ? this.buildBlocksFromRoom(room) : this.buildDefaultBlocks();
    this.resetHistory();
    document.getElementById('rooms-list-panel').classList.add('hidden');
    document.getElementById('room-builder-shell').classList.remove('hidden');
    this.renderRoomDesigner();
    if (isEdit) {
      await this.loadRoomGallery(room.id);
    }
  },

  closeRoomDesigner() {
    document.getElementById('room-builder-shell').classList.add('hidden');
    document.getElementById('rooms-list-panel').classList.remove('hidden');
  },

  resetHistory() {
    this.roomDesigner.history = [];
    this.roomDesigner.future = [];
  },

  pushHistory() {
    const snapshot = JSON.parse(JSON.stringify(this.roomDesigner.blocks));
    this.roomDesigner.history.push(snapshot);
    if (this.roomDesigner.history.length > 50) {
      this.roomDesigner.history.shift();
    }
    this.roomDesigner.future = [];
    this.updateHistoryButtons();
  },

  undo() {
    if (!this.roomDesigner.history.length) return;
    const current = JSON.parse(JSON.stringify(this.roomDesigner.blocks));
    this.roomDesigner.future.unshift(current);
    const previous = this.roomDesigner.history.pop();
    this.roomDesigner.blocks = previous;
    this.renderRoomDesigner();
    this.updateHistoryButtons();
  },

  redo() {
    if (!this.roomDesigner.future.length) return;
    const current = JSON.parse(JSON.stringify(this.roomDesigner.blocks));
    this.roomDesigner.history.push(current);
    const next = this.roomDesigner.future.shift();
    this.roomDesigner.blocks = next;
    this.renderRoomDesigner();
    this.updateHistoryButtons();
  },

  updateHistoryButtons() {
    const undoBtn = document.getElementById('room-undo-btn');
    const redoBtn = document.getElementById('room-redo-btn');
    if (undoBtn) undoBtn.disabled = this.roomDesigner.history.length === 0;
    if (redoBtn) redoBtn.disabled = this.roomDesigner.future.length === 0;
  },

  buildDefaultBlocks() {
    return [
      { type: 'hero', title: 'Tên phòng mới', caption: 'Một phòng họp ấn tượng dành cho sự kiện và cuộc họp chuyên nghiệp.', image_url: '' },
      { type: 'gallery', items: [{ url: '', caption: '' }, { url: '', caption: '' }] },
      { type: 'text', content: 'Viết mô tả chi tiết về phòng họp, không gian, ánh sáng, trang thiết bị và cảm giác khi sử dụng.' },
      { type: 'highlight', items: [
        { title: 'Ánh sáng tự nhiên', description: 'Cửa sổ lớn, không gian sáng và thoáng.' },
        { title: 'Máy chiếu 4K', description: 'Trải nghiệm trình chiếu rõ nét, âm thanh tốt.' },
      ] },
      { type: 'specs', capacity: '8', area: '30m²', location: 'Tầng 5, Tòa nhà The Sun', devices: 'Wi-Fi, Máy chiếu, Whiteboard', hourly_price: '250000', daily_price: '1800000' },
      { type: 'seo', slug: '', title: '', description: '' },
      { type: 'status', active: true, featured: false, available_time: '08:00 - 18:00' }
    ];
  },

  buildBlocksFromRoom(room) {
    return [
      { type: 'hero', title: room.name || 'Tên phòng', caption: room.description || 'Mô tả nổi bật về phòng họp.', image_url: room.primary_image_url || '' },
      { type: 'gallery', items: [{ url: '', caption: '' }], note: 'Kéo thả ảnh vào đây để upload và lưu vào cơ sở dữ liệu.' },
      { type: 'text', content: room.description || 'Mô tả chi tiết phòng họp cho khách hàng.' },
      { type: 'highlight', items: [
        { title: 'Sức chứa', description: `${room.capacity || '?'} người` },
        { title: 'Tiện nghi nổi bật', description: (room.amenities || []).slice(0, 3).join(', ') || 'Wifi, máy chiếu, snack' },
      ] },
      { type: 'specs', capacity: room.capacity || '', area: room.area || '', location: room.location || '', devices: (room.amenities || []).join(', '), hourly_price: room.price_per_hour || '', daily_price: room.price_per_day || '' },
      { type: 'seo', slug: room.slug || this.slugify(room.name || ''), title: room.meta_title || room.name || '', description: room.meta_description || '' },
      { type: 'status', active: room.is_available !== false, featured: room.is_featured || false, available_time: room.available_time || '08:00 - 18:00' }
    ];
  },

  async loadRoomGallery(roomId) {
    if (!roomId) return;
    try {
      const res = await API.adminGetRoomImages(roomId);
      const gallery = this.roomDesigner.blocks.find(block => block.type === 'gallery');
      if (!gallery) return;
      gallery.items = res.data.map(img => ({ id: img.id, url: img.url, caption: img.caption || '' }));
      this.renderRoomDesigner();
    } catch (e) {
      showToast('error', 'Lỗi tải gallery', e.message);
    }
  },

  allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
  },

  removeDropHover(event) {
    event.currentTarget.classList.remove('dragover');
  },

  handleGalleryUploadFiles(event) {
    const index = Number(event.target.dataset.blockIndex);
    const files = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
    this.uploadGalleryImages(index, files);
    event.target.value = '';
  },

  handleGalleryDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const index = Number(event.currentTarget.dataset.blockIndex);
    const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    this.uploadGalleryImages(index, files);
    event.currentTarget.classList.remove('dragover');
  },

  openGalleryUploadInput(index) {
    document.getElementById(`gallery-upload-input-${index}`)?.click();
  },

  async uploadGalleryImages(blockIndex, files) {
    if (!files.length) return;
    if (!this.roomDesigner.currentRoomId) {
      showToast('error', 'Lỗi', 'Lưu phòng trước khi upload ảnh.');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const token = localStorage.getItem('admin_token');
      const requestOptions = {
        method: 'POST',
        body: formData,
        headers: {}
      };
      if (token) requestOptions.headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(`/api/images/rooms/${this.roomDesigner.currentRoomId}`, requestOptions);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload ảnh thất bại');
      }
      showToast('success', 'Upload thành công', `${data.data.length || files.length} ảnh đã được thêm`);
      await this.loadRoomGallery(this.roomDesigner.currentRoomId);
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Upload thất bại', e.message);
    }
  },

  async deleteGalleryImage(blockIndex, itemIndex) {
    const block = this.roomDesigner.blocks[blockIndex];
    if (!block?.items || !block.items[itemIndex]) return;
    const item = block.items[itemIndex];
    if (item.id) {
      if (!confirm('Xóa ảnh này khỏi phòng?')) return;
      try {
        await API.adminDeleteImage(item.id);
        showToast('success', 'Đã xóa ảnh', 'Ảnh đã được xóa khỏi cơ sở dữ liệu.');
        await this.loadRoomGallery(this.roomDesigner.currentRoomId);
      } catch (e) {
        showToast('error', 'Lỗi xóa ảnh', e.message);
      }
    } else {
      block.items.splice(itemIndex, 1);
      this.renderRoomDesigner();
    }
  },

  slugify(value) {
    return value.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/\-+/g, '-');
  },

  renderRoomDesigner() {
    const list = document.getElementById('room-blocks-list');
    list.innerHTML = this.roomDesigner.blocks.map((block, index) => `
      <div class="block-card" draggable="true" data-index="${index}">
        <div class="block-card-header">
          <div class="block-card-title"><span class="block-drag-handle">☰</span>${this.getBlockLabel(block.type)}</div>
          <div class="block-card-actions">
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.duplicateBlock(${index})">Sao chép</button>
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.removeBlock(${index})">Xóa</button>
          </div>
        </div>
        <div class="block-card-body">${this.renderBlockEditor(block, index)}</div>
      </div>
    `).join('');
    this.initBlockDragAndDrop();
    this.renderPreview();
    this.updateHistoryButtons();
  },

  getBlockLabel(type) {
    switch (type) {
      case 'hero': return 'Hero Image';
      case 'gallery': return 'Gallery';
      case 'text': return 'Text';
      case 'highlight': return 'Điểm nổi bật';
      case 'specs': return 'Thông số kỹ thuật';
      case 'seo': return 'SEO & Meta';
      case 'status': return 'Status & Xuất bản';
      default: return 'Block';
    }
  },

  renderBlockEditor(block, index) {
    const id = `block-${index}`;
    const escape = (value) => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const input = (label, field, value, type = 'text', placeholder = '') => `
      <div class="form-group">
        <label>${label}</label>
        <input class="form-input" type="${type}" value="${escape(value)}" placeholder="${escape(placeholder)}" onchange="AdminApp.updateBlockField(${index}, '${field}', this.value)" />
      </div>
    `;

    switch (block.type) {
      case 'hero':
        return `
          ${input('Tiêu đề', 'title', block.title, 'text', 'Tên phòng ví dụ')}
          ${input('Caption', 'caption', block.caption, 'text', 'Mô tả ngắn')}
          ${input('Ảnh hero URL', 'image_url', block.image_url, 'text', 'https://...')}
          <small>Hình ảnh hero sẽ xuất hiện ngay ở đầu trang.</small>
        `;
      case 'gallery':
        return `
          <div class="gallery-preview-grid">
            ${block.items.map((item, itemIndex) => `
              <div class="gallery-preview-item">
                <img src="${escape(item.url || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80')}" alt="${escape(item.caption)}" />
                <div class="gallery-preview-caption">${escape(item.caption || 'Ảnh phòng')}</div>
                ${item.id ? `<button class="btn btn-sm" style="position:absolute;top:8px;right:8px;background:rgba(220,38,38,0.9);color:white;border:none;border-radius:999px;width:28px;height:28px;" onclick="AdminApp.deleteGalleryImage(${index}, ${itemIndex})">✕</button>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="gallery-upload-zone" data-block-index="${index}"
               ondragover="AdminApp.allowDrop(event)"
               ondragleave="AdminApp.removeDropHover(event)"
               ondrop="AdminApp.handleGalleryDrop(event)">
            <strong>Kéo thả ảnh vào đây</strong>
            <small>Hoặc nhấn để chọn ảnh và upload lên server</small>
          </div>
          <input type="file" id="gallery-upload-input-${index}" data-block-index="${index}" multiple accept="image/*" onchange="AdminApp.handleGalleryUploadFiles(event)" hidden />
          <button class="btn btn-secondary btn-sm" onclick="AdminApp.openGalleryUploadInput(${index})">Chọn ảnh từ máy</button>
          <small>Ảnh sẽ được lưu vào cơ sở dữ liệu và hiển thị ở gallery.</small>
        `;
      case 'text':
        return `
          <div class="form-group">
            <label>Nội dung</label>
            <textarea onchange="AdminApp.updateBlockField(${index}, 'content', this.value)">${escape(block.content)}</textarea>
          </div>
          <small>Hỗ trợ nội dung dài để kể câu chuyện phòng họp.</small>
        `;
      case 'highlight':
        return `
          ${block.items.map((item, itemIndex) => `
            <div class="form-group">
              <label>Điểm ${itemIndex + 1}</label>
              <input class="form-input" type="text" value="${escape(item.title)}" placeholder="Tiêu đề điểm nổi bật" onchange="AdminApp.updateHighlightItem(${index}, ${itemIndex}, 'title', this.value)" />
              <input class="form-input" type="text" value="${escape(item.description)}" placeholder="Mô tả ngắn" onchange="AdminApp.updateHighlightItem(${index}, ${itemIndex}, 'description', this.value)" />
            </div>
          `).join('')}
          <button class="btn btn-secondary btn-sm" onclick="AdminApp.addHighlightItem(${index})">+ Thêm điểm nổi bật</button>
        `;
      case 'specs':
        return `
          ${input('Sức chứa', 'capacity', block.capacity, 'text', '8 người')}
          ${input('Diện tích', 'area', block.area, 'text', '30m²')}
          ${input('Vị trí', 'location', block.location, 'text', 'Tầng 5, Tòa nhà The Sun')}
          ${input('Thiết bị', 'devices', block.devices, 'text', 'Wifi, Máy chiếu, Whiteboard')}
          ${input('Giá/giờ', 'hourly_price', block.hourly_price, 'text', '250000')}
          ${input('Giá/ngày', 'daily_price', block.daily_price, 'text', '1800000')}
        `;
      case 'seo':
        return `
          ${input('Slug', 'slug', block.slug, 'text', 'phong-hop-sang-tao')}
          ${input('Meta title', 'title', block.title, 'text', 'Tiêu đề SEO')}
          <div class="form-group">
            <label>Meta description</label>
            <textarea onchange="AdminApp.updateBlockField(${index}, 'description', this.value)">${escape(block.description)}</textarea>
          </div>
        `;
      case 'status':
        return `
          <div class="form-group">
            <label><input type="checkbox" ${block.active ? 'checked' : ''} onchange="AdminApp.updateBlockField(${index}, 'active', this.checked)" /> Hoạt động</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" ${block.featured ? 'checked' : ''} onchange="AdminApp.updateBlockField(${index}, 'featured', this.checked)" /> Featured</label>
          </div>
          ${input('Available time', 'available_time', block.available_time, 'text', '08:00 - 18:00')}
          <small>Trạng thái và khung giờ hiển thị phòng.</small>
        `;
      default:
        return '<div>Block chưa hỗ trợ.</div>';
    }
  },

  updateBlockField(index, field, value) {
    if (!this.roomDesigner.blocks[index]) return;
    this.pushHistory();
    this.roomDesigner.blocks[index][field] = value;
    this.renderPreview();
  },

  updateGalleryItem(blockIndex, itemIndex, field, value) {
    const block = this.roomDesigner.blocks[blockIndex];
    if (!block?.items) return;
    this.pushHistory();
    block.items[itemIndex][field] = value;
    this.renderPreview();
  },

  addGalleryImage(blockIndex) {
    const block = this.roomDesigner.blocks[blockIndex];
    if (!block?.items) return;
    this.pushHistory();
    block.items.push({ url: '', caption: '' });
    this.renderRoomDesigner();
  },

  updateHighlightItem(blockIndex, itemIndex, field, value) {
    const block = this.roomDesigner.blocks[blockIndex];
    if (!block?.items) return;
    this.pushHistory();
    block.items[itemIndex][field] = value;
    this.renderPreview();
  },

  addHighlightItem(blockIndex) {
    const block = this.roomDesigner.blocks[blockIndex];
    if (!block?.items) return;
    block.items.push({ title: '', description: '' });
    this.renderRoomDesigner();
  },

  addBlock(type) {
    this.pushHistory();
    const template = this.createBlockTemplate(type);
    this.roomDesigner.blocks.push(template);
    this.renderRoomDesigner();
  },

  addSelectedBlock() {
    const selector = document.getElementById('block-type-selector');
    if (!selector) return;
    this.addBlock(selector.value);
  },

  createBlockTemplate(type) {
    switch (type) {
      case 'hero': return { type: 'hero', title: 'Tiêu đề mới', caption: 'Thêm caption ấn tượng...', image_url: '' };
      case 'gallery': return { type: 'gallery', items: [{ url: '', caption: '' }] };
      case 'text': return { type: 'text', content: 'Viết nội dung giới thiệu phong phú.' };
      case 'highlight': return { type: 'highlight', items: [{ title: 'Điểm nổi bật', description: 'Mô tả ngắn.' }] };
      case 'specs': return { type: 'specs', capacity: '', area: '', location: '', devices: '', hourly_price: '', daily_price: '' };
      case 'seo': return { type: 'seo', slug: '', title: '', description: '' };
      case 'status': return { type: 'status', active: true, featured: false, available_time: '08:00 - 18:00' };
      default: return { type: 'text', content: 'Nội dung...' };
    }
  },

  removeBlock(index) {
    this.pushHistory();
    this.roomDesigner.blocks.splice(index, 1);
    this.renderRoomDesigner();
  },

  duplicateBlock(index) {
    const block = this.roomDesigner.blocks[index];
    if (!block) return;
    this.pushHistory();
    const clone = JSON.parse(JSON.stringify(block));
    this.roomDesigner.blocks.splice(index + 1, 0, clone);
    this.renderRoomDesigner();
  },

  moveBlock(fromIndex, toIndex) {
    this.pushHistory();
    const blocks = this.roomDesigner.blocks;
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    this.renderRoomDesigner();
  },

  initBlockDragAndDrop() {
    const cards = document.querySelectorAll('#room-blocks-list .block-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.roomDesigner.dragIndex = Number(card.dataset.index);
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        this.roomDesigner.dragIndex = null;
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = Number(card.dataset.index);
        if (this.roomDesigner.dragIndex !== null && targetIndex !== this.roomDesigner.dragIndex) {
          this.moveBlock(this.roomDesigner.dragIndex, targetIndex);
        }
      });
    });
  },

  renderPreview() {
    const preview = document.getElementById('room-preview-frame');
    preview.classList.toggle('mobile-preview', this.roomDesigner.previewMode === 'mobile');
    preview.innerHTML = this.roomDesigner.blocks.map(block => this.renderPreviewBlock(block)).join('');
  },

  renderPreviewBlock(block) {
    const sanitize = (value) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const text = (value) => sanitize(value).replace(/\n/g, '<br/>');

    switch (block.type) {
      case 'hero':
        return `
          <section class="preview-section preview-hero" style="background-image:url('${sanitize(block.image_url) || 'https://images.unsplash.com/photo-1503424886304-8a4d8a83e81c?auto=format&fit=crop&w=1200&q=80'}')">
            <div class="preview-hero-content">
              <h1 class="preview-hero-title">${sanitize(block.title) || 'Tên phòng'}</h1>
              <p class="preview-hero-caption">${sanitize(block.caption) || 'Mô tả ngắn hấp dẫn.'}</p>
            </div>
          </section>
        `;
      case 'gallery':
        return `
          <section class="preview-section">
            <h3>Ảnh phòng</h3>
            <div class="preview-gallery">
              ${block.items.map(item => `<img src="${sanitize(item.url) || 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80'}" alt="${sanitize(item.caption)}" />`).join('')}
            </div>
          </section>
        `;
      case 'text':
        return `
          <section class="preview-section preview-text">
            <div>${text(block.content)}</div>
          </section>
        `;
      case 'highlight':
        return `
          <section class="preview-section">
            <h3>Điểm nổi bật</h3>
            <div class="preview-card-grid">
              ${block.items.map(item => `
                <div class="preview-card">
                  <h4>${sanitize(item.title)}</h4>
                  <p>${sanitize(item.description)}</p>
                </div>
              `).join('')}
            </div>
          </section>
        `;
      case 'specs':
        return `
          <section class="preview-section">
            <h3>Thông số kỹ thuật</h3>
            <div class="preview-specs">
              <div class="preview-specs-item"><strong>Sức chứa</strong>${sanitize(block.capacity)}</div>
              <div class="preview-specs-item"><strong>Diện tích</strong>${sanitize(block.area)}</div>
              <div class="preview-specs-item"><strong>Vị trí</strong>${sanitize(block.location)}</div>
              <div class="preview-specs-item"><strong>Thiết bị</strong>${sanitize(block.devices)}</div>
              <div class="preview-specs-item"><strong>Giá/giờ</strong>${sanitize(block.hourly_price)} VND</div>
              <div class="preview-specs-item"><strong>Giá/ngày</strong>${sanitize(block.daily_price)} VND</div>
            </div>
          </section>
        `;
      case 'seo':
        return `
          <section class="preview-section preview-card">
            <h4>SEO & Meta</h4>
            <p><strong>Slug</strong>: ${sanitize(block.slug) || 'phong-hop'}</p>
            <p><strong>Meta title</strong>: ${sanitize(block.title)}</p>
            <p>${sanitize(block.description)}</p>
          </section>
        `;
      case 'status':
        return `
          <section class="preview-section preview-card">
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
              <span style="background:${block.active ? '#DCFCE7' : '#FEE2E2'};color:${block.active ? '#166534' : '#991B1B'};padding:8px 12px;border-radius:999px;font-weight:700;">${block.active ? 'Đang hoạt động' : 'Tạm ẩn'}</span>
              ${block.featured ? '<span style="background:#FDE68A;color:#92400E;padding:8px 12px;border-radius:999px;font-weight:700;">Featured</span>' : ''}
            </div>
            <p style="margin-top:12px;font-size:0.95rem;color:var(--text-mid);">Thời gian hoạt động: ${sanitize(block.available_time)}</p>
          </section>
        `;
      default:
        return '';
    }
  },

  setPreviewMode(mode, button) {
    this.roomDesigner.previewMode = mode;
    document.querySelectorAll('.preview-mode-btn').forEach(el => el.classList.remove('active'));
    if (button) button.classList.add('active');
    this.renderPreview();
  },

  previewFullPage() {
    if (!this.roomDesigner.currentRoomId) {
      showToast('error', 'Lỗi', 'Hãy lưu phòng trước khi mở chế độ xem trang đầy đủ.');
      return;
    }
    window.open(`/room-detail.html?id=${encodeURIComponent(this.roomDesigner.currentRoomId)}&preview=plain`, '_blank');
  },

  async saveRoomDesigner() {
    const hero = this.roomDesigner.blocks.find(b => b.type === 'hero');
    const specs = this.roomDesigner.blocks.find(b => b.type === 'specs');
    const status = this.roomDesigner.blocks.find(b => b.type === 'status');
    const text = this.roomDesigner.blocks.find(b => b.type === 'text');

    const capacity = specs?.capacity ? parseInt(specs.capacity, 10) : null;
    const pricePerHour = specs?.hourly_price ? parseFloat(specs.hourly_price) : null;

    const payload = {
      name: hero?.title?.trim() || this.roomDesigner.currentRoomName,
      capacity,
      price_per_hour: pricePerHour,
      location: specs?.location || null,
      floor: specs?.floor ? parseInt(specs.floor, 10) : null,
      description: text?.content || hero?.caption || '',
      amenities: specs?.devices ? specs.devices.split(',').map(s => s.trim()).filter(Boolean) : [],
      is_available: status?.active ?? true,
      admin_note: status?.note || null
    };

    if (!payload.name || !capacity || !pricePerHour) {
      showToast('error', 'Lỗi', 'Vui lòng điền tên phòng, sức chứa và giá/giờ.');
      return;
    }

    try {
      if (this.roomDesigner.currentRoomId) {
        await API.adminUpdateRoom(this.roomDesigner.currentRoomId, payload);
        showToast('success', 'Đã cập nhật', `Phòng "${payload.name}" đã được lưu`);
      } else {
        const res = await API.adminCreateRoom(payload);
        if (res?.data?.id) {
          this.roomDesigner.currentRoomId = res.data.id;
        }
        showToast('success', 'Đã tạo', `Phòng "${payload.name}" đã được tạo`);
      }
      this.loadRooms();
    } catch (e) {
      showToast('error', 'Lỗi lưu', e.message);
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
      const res = await fetch(`/api/images/rooms/${this.currentRoomId}`, {
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
