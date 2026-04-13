/**
 * ============================================
 * ADMIN AUTH MANAGER — SmartBook 3D
 * ============================================
 */

const AdminAuth = {

  /* ---- INIT ---- */
  init() {
    // Kiểm tra nếu đã đăng nhập admin
    if (this.isLoggedIn() && this.getUser()?.role === 'admin') {
      this.showAdminPanel();
    } else {
      this.showLoginForm();
    }
  },

  /* ---- LOGIN ---- */
  async login() {
    const email = document.getElementById('admin-login-email')?.value.trim();
    const password = document.getElementById('admin-login-password')?.value;
    const errEl = document.getElementById('admin-login-error');
    const btnEl = document.getElementById('admin-login-btn');

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
      if (res.data.user.role !== 'admin') {
        throw new Error('Bạn không có quyền truy cập trang quản trị');
      }
      this._saveSession(res.data.token, res.data.user);
      this.showAdminPanel();
      showToast('success', 'Đăng nhập thành công', `Chào mừng, ${res.data.user.full_name}!`);
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.classList.remove('hidden'); }
    } finally {
      btnEl?.classList.remove('loading');
      if (btnEl) btnEl.disabled = false;
    }
  },

  /* ---- LOGOUT ---- */
  logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_session_start');
    this.showLoginForm();
    showToast('info', 'Đã đăng xuất', 'Hẹn gặp lại!');
  },

  /* ---- SESSION ---- */
  _saveSession(token, user) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    localStorage.setItem('admin_session_start', Date.now().toString());
  },

  isLoggedIn() {
    const token = localStorage.getItem('admin_token');
    const sessionStart = localStorage.getItem('admin_session_start');
    if (!token || !sessionStart) return false;
    // Tự động đăng xuất sau 7 ngày
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(sessionStart) > sevenDays) {
      this.logout();
      return false;
    }
    return true;
  },

  getUser() {
    return JSON.parse(localStorage.getItem('admin_user') || 'null');
  },

  /* ---- UI ---- */
  showLoginForm() {
    document.getElementById('admin-login-section').classList.remove('hidden');
    document.getElementById('admin-layout').classList.add('hidden');
    document.getElementById('main-header').classList.add('hidden');
  },

  showAdminPanel() {
    document.getElementById('admin-login-section').classList.add('hidden');
    document.getElementById('admin-layout').classList.remove('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    // Cập nhật UI header
    this.updateHeaderUI();
    // Load dashboard
    AdminApp.showSection('dashboard');
  },

  updateHeaderUI() {
    const user = this.getUser();
    if (!user) return;

    const initial = (user.full_name || 'A')[0].toUpperCase();
    document.querySelectorAll('.avatar-circle').forEach(el => el.textContent = initial);
    document.querySelectorAll('#user-display-name').forEach(el => {
      el.textContent = user.full_name?.split(' ').slice(-1)[0] || 'Admin';
    });
  },

  /* ---- API ---- */
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

};