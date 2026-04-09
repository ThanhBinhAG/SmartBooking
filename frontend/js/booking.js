/**
 * ============================================
 * BOOKING MANAGER — Equipment Cart + Confirm
 * ============================================
 */
const BookingManager = {
  room: null,
  bookedSlots: [],
  cart: {},           // { equipment_id: { item, quantity } }
  roomPricePerHour: 0,
  hours: 0,

  /* ---- Khởi tạo với thông tin phòng ---- */
  init(room, bookedSlots) {
    this.room = room;
    this.bookedSlots = bookedSlots || [];
    this.roomPricePerHour = room.price_per_hour;
    this.cart = {};
    this.hours = 0;

    // Load equipment
    this.loadEquipment();

    // Setup time inputs
    this.setupTimeInputs();

    // Initial price calculation
    this.recalcTotal();
  },

  /* ---- Setup time inputs với validation ---- */
  setupTimeInputs() {
    const startInput = document.getElementById('booking-start');
    const endInput = document.getElementById('booking-end');

    if (!startInput || !endInput) return;

    // Set min datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getMinutes() % 15); // Round to nearest 15 min
    const minDatetime = now.toISOString().slice(0, 16);
    startInput.min = minDatetime;
    endInput.min = minDatetime;

    // Default start time: next hour
    const defaultStart = new Date(now.getTime() + 60 * 60 * 1000);
    defaultStart.setMinutes(0);
    startInput.value = defaultStart.toISOString().slice(0, 16);

    // Default end time: 2 hours later
    const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);
    endInput.value = defaultEnd.toISOString().slice(0, 16);

    // Update hours when times change
    const updateHours = () => {
      const startDT = startInput.value;
      const endDT = endInput.value;
      if (startDT && endDT) {
        this.updateHours(startDT, endDT);
      }
    };

    startInput.addEventListener('change', updateHours);
    endInput.addEventListener('change', updateHours);

    // Initial calculation
    this.updateHours(startInput.value, endInput.value);
  },

  /* ---- Load danh sách thiết bị ---- */
  async loadEquipment() {
    try {
      const res = await API.getEquipment();
      const container = document.getElementById('equipment-list');

      container.innerHTML = res.data.map(eq => `
        <div class="equipment-item">
          <div class="equipment-info">
            <div class="equipment-name">${eq.name}</div>
            <div class="equipment-details">
              ${eq.description || 'Không có mô tả'} • Tồn kho: ${eq.total_stock} ${eq.unit}
            </div>
            <div class="equipment-price">${fmtPrice(eq.hourly_rate)}/giờ</div>
          </div>
          <div class="equipment-controls">
            <button onclick="BookingManager.updateCart('${eq.id}', -1, ${JSON.stringify(eq).replace(/"/g,'&quot;')})">−</button>
            <span class="equipment-quantity" id="eq-qty-${eq.id}">0</span>
            <button onclick="BookingManager.updateCart('${eq.id}', 1, ${JSON.stringify(eq).replace(/"/g,'&quot;')}">＋</button>
          </div>
        </div>
      `).join('');
    } catch (e) {
      document.getElementById('equipment-list').innerHTML =
        '<p style="color:var(--text-soft);font-size:0.85rem;">Không tải được thiết bị</p>';
    }
  },

  /* ---- Cập nhật giỏ ---- */
  updateCart(eqId, delta, item) {
    if (!this.cart[eqId]) this.cart[eqId] = { item, quantity: 0 };

    const newQty = Math.max(0, Math.min(this.cart[eqId].quantity + delta, item.total_stock));
    this.cart[eqId].quantity = newQty;

    // Cập nhật số hiển thị
    const qtyEl = document.getElementById(`eq-qty-${eqId}`);
    if (qtyEl) qtyEl.textContent = newQty;

    this.renderCart();
    this.recalcTotal();
  },

  /* ---- Render giỏ thiết bị ---- */
  renderCart() {
    const cartItems = Object.values(this.cart).filter(c => c.quantity > 0);
    const cartEl = document.getElementById('equipment-cart');
    const itemsEl = document.getElementById('cart-items');

    if (!cartItems.length) {
      cartEl.classList.add('hidden');
      return;
    }
    cartEl.classList.remove('hidden');
    itemsEl.innerHTML = cartItems.map(({ item, quantity }) => `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:6px 0;font-size:0.85rem;">
        <span>${item.name} × ${quantity} ${item.unit}</span>
        <span style="font-weight:600;">${fmtPrice(item.hourly_rate * quantity * this.hours)}</span>
      </div>
    `).join('');

    const subtotal = cartItems.reduce((sum, { item, quantity }) =>
      sum + item.hourly_rate * quantity * this.hours, 0);
    document.getElementById('equipment-subtotal').textContent = fmtPrice(subtotal);
  },

  /* ---- Tính lại tổng tiền ---- */
  recalcTotal() {
    const roomPrice = this.roomPricePerHour * this.hours;
    const eqPrice = Object.values(this.cart)
      .filter(c => c.quantity > 0)
      .reduce((sum, { item, quantity }) => sum + item.hourly_rate * quantity * this.hours, 0);

    document.getElementById('room-price-display').textContent = fmtPrice(roomPrice);
    document.getElementById('equipment-price-display').textContent = fmtPrice(eqPrice);
    document.getElementById('total-price-display').textContent = fmtPrice(roomPrice + eqPrice);
  },

  /* ---- Cập nhật giờ khi người dùng thay đổi thời gian ---- */
  updateHours(startDT, endDT) {
    this.hours = Math.max(0, (new Date(endDT) - new Date(startDT)) / 3600000);
    this.renderCart();
    this.recalcTotal();
  },

  /* ---- Xác nhận đặt phòng ---- */
  async confirm() {
    const roomId = this.room?.id || new URLSearchParams(window.location.search).get('room_id');
    const startDT = document.getElementById('booking-start')?.value;
    const endDT = document.getElementById('booking-end')?.value;
    const notes = document.getElementById('booking-notes')?.value;

    if (!roomId || !startDT || !endDT) {
      showToast('error', 'Thiếu thông tin', 'Vui lòng chọn đầy đủ thời gian');
      return;
    }
    if (!AuthManager.isLoggedIn()) {
      AuthManager.openModal('login');
      return;
    }

    const equipmentItems = Object.entries(this.cart)
      .filter(([, c]) => c.quantity > 0)
      .map(([id, c]) => ({ equipment_id: id, quantity: c.quantity }));

    const btn = document.querySelector('[onclick="BookingManager.confirm()"]');
    btn?.classList.add('loading');

    try {
      const res = await API.createBooking({
        room_id: roomId,
        start_datetime: startDT,
        end_datetime: endDT,
        equipment_items: equipmentItems,
        notes
      });

      showToast('success', 'Đặt phòng thành công! 🎉',
                'Thông báo xác nhận sẽ được gửi về Zalo của bạn');

      // Redirect về trang xác nhận sau 1.5s
      setTimeout(() => {
        window.location.href = `/booking-confirm.html?id=${res.data.booking.id}`;
      }, 1500);
    } catch (e) {
      showToast('error', 'Lỗi đặt phòng', e.message);
    } finally {
      btn?.classList.remove('loading');
    }
  }
};

function fmtPrice(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0);
}

document.addEventListener('DOMContentLoaded', () => {
  BookingManager.loadEquipment();
});