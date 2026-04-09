/**
 * ============================================
 * AUTH MANAGER — SmartBook 3D v2.0
 * Quản lý: Login, Register, Session, UI
 * ============================================
 */
const AuthManager = {

  /* ---- MODAL CONTROL ---- */
  openModal(tab = 'login') {
    document.getElementById('auth-modal-backdrop').classList.add('open');
    this.switchTab(tab);
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    document.getElementById('auth-modal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
  },

  closeOnBackdrop(e) {
    if (e.target === document.getElementById('auth-modal-backdrop')) {
      this.closeModal();
    }
  },

  switchTab(tab) {
    const loginForm  = document.getElementById('form-login');
    const regForm    = document.getElementById('form-register');
    const tabLogin   = document.getElementById('tab-login');
    const tabReg     = document.getElementById('tab-register');

    if (!loginForm || !regForm) return;

    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
      tabLogin?.classList.add('active');
      tabReg?.classList.remove('active');
    } else {
      loginForm.classList.add('hidden');
      regForm.classList.remove('hidden');
      tabLogin?.classList.remove('active');
      tabReg?.classList.add('active');
    }
  },

  toggleDropdown() {
    document.getElementById('user-dropdown-menu')?.classList.toggle('open');
  },

  /* ---- GIÚP NẠP API (tự động nếu chưa load) ---- */
  async _ensureApiLoaded() {
    if (typeof API !== 'undefined') return;

    const existingScript = document.querySelector('script[src="/js/api.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = '/js/api.js';
      script.async = false;
      document.body.appendChild(script);
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => reject(new Error('Không tải được api.js'));
      });
    } else if (!window.API) {
      await new Promise((resolve, reject) => {
        if (existingScript.hasAttribute('data-loaded')) return resolve();
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Không tải được api.js')));
      });
    }

    if (typeof API === 'undefined') {
      throw new Error('API không khởi tạo được');
    }
  },

  /* ---- ĐĂNG NHẬP ---- */
  async login() {
    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const errEl    = document.getElementById('login-error');
    const btnEl    = document.getElementById('btn-login');

    if (errEl) errEl.classList.add('hidden');
    if (!email || !password) {
      if (errEl) { errEl.textContent = 'Vui lòng nhập email và mật khẩu'; errEl.classList.remove('hidden'); }
      return;
    }

    try {
      await this._ensureApiLoaded();
    } catch (err) {
      if (errEl) { errEl.textContent = 'Lỗi hệ thống: API chưa được nạp'; errEl.classList.remove('hidden'); }
      return;
    }

    btnEl?.classList.add('loading');
    btnEl && (btnEl.disabled = true);

    try {
      const res = await API.login({ email, password });
      this._saveSession(res.data.token, res.data.user);
      this.closeModal();
      this.updateUI(res.data.user);
      showToast('success', 'Đăng nhập thành công', `Chào mừng trở lại, ${res.data.user.full_name}! 👋`);
    } catch(err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
      btnEl?.classList.remove('loading');
      if (btnEl) btnEl.disabled = false;
    }
  },

  /* ---- ĐĂNG KÝ ---- */
  async register() {
    const name     = document.getElementById('reg-name')?.value.trim();
    const phone    = document.getElementById('reg-phone')?.value.trim();
    const email    = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const consent  = document.getElementById('reg-consent')?.checked;
    const errEl    = document.getElementById('reg-error');
    const btnEl    = document.getElementById('btn-register');

    if (errEl) errEl.classList.add('hidden');

    // Validate
    if (!name || !email || !password) {
      if (errEl) { errEl.textContent = 'Vui lòng điền đủ thông tin bắt buộc'; errEl.classList.remove('hidden'); }
      return;
    }
    if (password.length < 8) {
      if (errEl) { errEl.textContent = 'Mật khẩu phải có ít nhất 8 ký tự'; errEl.classList.remove('hidden'); }
      return;
    }
    if (!consent) {
      if (errEl) { errEl.textContent = 'Bạn phải đồng ý với điều khoản dịch vụ để tiếp tục'; errEl.classList.remove('hidden'); }
      return;
    }

    if (typeof API === 'undefined') {
      if (errEl) {
        errEl.textContent = 'Lỗi hệ thống: API chưa được nạp';
        errEl.classList.remove('hidden');
      }
      return;
    }

    try {
      await this._ensureApiLoaded();
    } catch (err) {
      if (errEl) { errEl.textContent = 'Lỗi hệ thống: API chưa được nạp'; errEl.classList.remove('hidden'); }
      return;
    }

    btnEl?.classList.add('loading');
    if (btnEl) btnEl.disabled = true;

    try {
      const res = await API.register({ full_name: name, email, phone, password, consent_given: true });
      this._saveSession(res.data.token, res.data.user);
      this.closeModal();
      this.updateUI(res.data.user);
      showToast('success', 'Đăng ký thành công! 🎉', `Chào mừng bạn đến với SmartBook 3D, ${name}!`);
    } catch(err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
      btnEl?.classList.remove('loading');
      if (btnEl) btnEl.disabled = false;
    }
  },

  /* ---- ĐĂNG XUẤT ---- */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._showGuestUI();
    showToast('info', 'Đã đăng xuất', 'Hẹn gặp lại bạn!');
    if (window.location.pathname !== '/') {
      setTimeout(() => window.location.href = '/', 1200);
    }
  },

  /* ---- SESSION ---- */
  _saveSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    // Lưu timestamp phiên làm việc
    localStorage.setItem('session_start', Date.now().toString());
  },

  isLoggedIn() {
    const token = localStorage.getItem('token');
    const sessionStart = localStorage.getItem('session_start');
    if (!token || !sessionStart) return false;
    // Tự động đăng xuất sau 7 ngày không hoạt động
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(sessionStart) > sevenDays) {
      this.logout();
      return false;
    }
    return true;
  },

  getUser() {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },

  /* ---- UI UPDATE ---- */
  updateUI(user) {
    if (!user) { this._showGuestUI(); return; }

    const initial = (user.full_name || 'U')[0].toUpperCase();

    // Cập nhật tất cả avatar circles
    document.querySelectorAll('.avatar-circle').forEach(el => el.textContent = initial);
    document.querySelectorAll('#user-avatar-initial').forEach(el => el.textContent = initial);
    document.querySelectorAll('#user-display-name').forEach(el => {
      el.textContent = user.full_name?.split(' ').slice(-1)[0] || 'Bạn';
    });

    // Ẩn guest, hiện user
    document.querySelectorAll('#auth-guest').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('#auth-user').forEach(el => el.classList.remove('hidden'));

    // Hiện link Admin nếu là admin
    if (user.role === 'admin') {
      document.querySelectorAll('.admin-only-link').forEach(el => el.classList.remove('hidden'));
    } else {
      document.querySelectorAll('.admin-only-link').forEach(el => el.classList.add('hidden'));
    }
  },

  _showGuestUI() {
    document.querySelectorAll('#auth-guest').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('#auth-user').forEach(el => el.classList.add('hidden'));
  },

  /* ---- PASSWORD TOGGLE ---- */
  togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁';
    }
  },

  /* ---- PASSWORD STRENGTH ---- */
  checkPasswordStrength(password, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!password) { el.innerHTML = ''; return; }

    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { label: 'Rất yếu', color: '#DC2626' },
      { label: 'Yếu',     color: '#F97316' },
      { label: 'Trung bình', color: '#EAB308' },
      { label: 'Khá mạnh',  color: '#22C55E' },
      { label: 'Mạnh',      color: '#16A34A' },
    ];

    const level = levels[Math.min(score, 4)];
    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; font-size:0.78rem;">
        <div style="flex:1; height:4px; background:var(--border); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${(score/5)*100}%; background:${level.color}; border-radius:4px; transition:width 0.3s;"></div>
        </div>
        <span style="color:${level.color}; font-weight:600; white-space:nowrap;">${level.label}</span>
      </div>
    `;
  },

  /* ---- INIT ---- */
  init() {
    // Khởi tạo khi load trang
    if (this.isLoggedIn()) {
      this.updateUI(this.getUser());
    } else {
      this._showGuestUI();
    }

    // Đóng dropdown khi click ngoài
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('user-dropdown-menu');
      const btn = document.getElementById('user-btn');
      if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Đóng modal bằng ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });

    // Kiểm tra password strength khi nhập
    const regPwInput = document.getElementById('reg-password');
    if (regPwInput) {
      regPwInput.addEventListener('input', () => {
        this.checkPasswordStrength(regPwInput.value, 'password-strength');
      });
    }

    // Intercept đặt phòng nếu chưa đăng nhập
    document.querySelectorAll('a[href*="booking"]').forEach(a => {
      a.addEventListener('click', (e) => {
        if (!this.isLoggedIn()) {
          e.preventDefault();
          this.openModal('login');
          showToast('info', 'Cần đăng nhập', 'Đăng nhập để đặt phòng nhé!');
        }
      });
    });
  }
};