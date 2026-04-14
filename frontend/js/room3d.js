// === THREE.JS 3D ROOM VIEWER ===

let scene, camera, renderer, roomMesh;
let isMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };
let cameraAngle = { theta: 0, phi: Math.PI / 4 };
const cameraRadius = 8;

// Khởi tạo Three.js scene
function initThreeJS() {
  const canvas = document.getElementById('room-3d-canvas');
  if (!canvas) return;

  // Scene — không gian chứa mọi thứ
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);
  scene.fog = new THREE.Fog(0x1a1a2e, 20, 40);

  // Camera — góc nhìn perspective như mắt người
  camera = new THREE.PerspectiveCamera(
    60,                                          // FOV
    canvas.clientWidth / canvas.clientHeight,    // Tỉ lệ khung hình
    0.1,                                         // Near clipping
    100                                          // Far clipping
  );
  camera.position.set(0, 3, cameraRadius);

  // Renderer — engine vẽ 3D lên canvas
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);

  // Ánh sáng
  setupLighting();

  // Xây dựng phòng họp
  buildRoom();

  // Xử lý chuột để xoay camera
  setupMouseControls(canvas);

  // Bắt đầu vòng lặp render
  animate();

  // Resize khi cửa sổ thay đổi kích thước
  window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
  // Ánh sáng nền — chiếu đều khắp nơi
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Đèn trần chính
  const mainLight = new THREE.SpotLight(0xfff5e4, 1.5);
  mainLight.position.set(0, 8, 0);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.angle = Math.PI / 4;
  mainLight.penumbra = 0.3;
  scene.add(mainLight);

  // Đèn phụ tạo chiều sâu
  const fillLight = new THREE.DirectionalLight(0x4a6fa5, 0.5);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
}

function buildRoom() {
  // FLOOR (Sàn nhà)
  const floorGeo = new THREE.PlaneGeometry(10, 10);
  const floorMat = new THREE.MeshLambertMaterial({
    color: 0xc8a882,
    // Trong dự án thật, dùng TextureLoader để load texture gỗ đẹp hơn
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // WALLS (Tường)
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });

  // Tường sau
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.1), wallMat);
  backWall.position.set(0, 2, -5);
  scene.add(backWall);

  // Tường trái
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 10), wallMat);
  leftWall.position.set(-5, 2, 0);
  scene.add(leftWall);

  // Tường phải
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4, 10), wallMat);
  rightWall.position.set(5, 2, 0);
  scene.add(rightWall);

  // CONFERENCE TABLE (Bàn họp)
  const tableMat = new THREE.MeshLambertMaterial({ color: 0x5c3d11 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 2), tableMat);
  table.position.set(0, 0.75, 0);
  table.castShadow = true;
  table.receiveShadow = true;
  scene.add(table);

  // Chân bàn
  const legMat = new THREE.MeshLambertMaterial({ color: 0x3d2b0a });
  const legPositions = [[-1.8, 0.35, -0.8], [1.8, 0.35, -0.8], [-1.8, 0.35, 0.8], [1.8, 0.35, 0.8]];
  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), legMat);
    leg.position.set(...pos);
    scene.add(leg);
  });

  // CHAIRS (Ghế ngồi)
  addChairs();

  // PROJECTOR SCREEN (Màn chiếu)
  const screenMat = new THREE.MeshLambertMaterial({ color: 0xecf0f1 });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 0.05), screenMat);
  screen.position.set(0, 2.5, -4.9);
  scene.add(screen);

  // Khung màn
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.1, 2.1, 0.04), frameMat);
  frame.position.set(0, 2.5, -4.95);
  scene.add(frame);
}

function addChairs() {
  const chairMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
  const chairPositions = [
    { x: -1.5, z: -1.2 }, { x: 0, z: -1.2 }, { x: 1.5, z: -1.2 },
    { x: -1.5, z: 1.2 }, { x: 0, z: 1.2 }, { x: 1.5, z: 1.2 },
  ];

  chairPositions.forEach(({ x, z }) => {
    // Mặt ghế
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), chairMat);
    seat.position.set(x, 0.5, z);
    seat.castShadow = true;
    scene.add(seat);

    // Lưng ghế
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.05), chairMat);
    back.position.set(x, 0.8, z + (z > 0 ? 0.22 : -0.22));
    scene.add(back);
  });
}

function setupMouseControls(canvas) {
  canvas.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    cameraAngle.theta -= deltaX * 0.01;
    cameraAngle.phi = Math.max(0.1, Math.min(Math.PI / 2, cameraAngle.phi - deltaY * 0.01));

    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mouseup', () => { isMouseDown = false; });
  canvas.addEventListener('mouseleave', () => { isMouseDown = false; });

  // Zoom bằng scroll wheel
  canvas.addEventListener('wheel', (e) => {
    const newRadius = Math.max(3, Math.min(15, cameraRadius + e.deltaY * 0.01));
    camera.position.setLength(newRadius);
  });
}

function resetCamera() {
  cameraAngle = { theta: 0, phi: Math.PI / 4 };
}

function animate() {
  requestAnimationFrame(animate);

  // Cập nhật vị trí camera theo góc nhìn
  camera.position.x = cameraRadius * Math.sin(cameraAngle.theta) * Math.sin(cameraAngle.phi);
  camera.position.y = cameraRadius * Math.cos(cameraAngle.phi);
  camera.position.z = cameraRadius * Math.cos(cameraAngle.theta) * Math.sin(cameraAngle.phi);
  camera.lookAt(0, 0.8, 0); // Nhìn vào bàn họp

  renderer.render(scene, camera);
}

function onWindowResize() {
  const canvas = document.getElementById('room-3d-canvas');
  if (!canvas || !camera || !renderer) return;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

// Tải thông tin phòng từ API
async function loadRoomDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');

  if (!roomId) {
    document.getElementById('room-info').innerHTML = '<p>Không tìm thấy ID phòng</p>';
    return;
  }

  try {
    const response = await API.getRoomById(roomId);
    const { room, booked_slots } = response.data;

    document.title = `${room.name} — SmartBook 3D`;

    // Lưu thông tin phòng cho booking
    window.currentRoom = room;
    window.bookedSlots = booked_slots;

    document.getElementById('room-info').innerHTML = `
      <h1>${room.name}</h1>
      <p class="location">📍 ${room.location}</p>
      <p class="description">${room.description}</p>
      <div class="stats">
        <div><strong>👥 Sức chứa:</strong> ${room.capacity} người</div>
        <div><strong>💰 Giá:</strong> ${formatPrice(room.price_per_hour)}/giờ</div>
        <div><strong>⭐ Đánh giá:</strong> ${room.avg_rating}/5</div>
      </div>
      <div class="booked-slots">
        <h3>📅 Lịch đã đặt (7 ngày tới)</h3>
        ${booked_slots.length === 0
          ? '<p>✅ Hiện tại chưa có lịch đặt!</p>'
          : booked_slots.map(slot =>
              `<div class="slot">
                ${formatDateTime(slot.start_time)} → ${formatDateTime(slot.end_time)}
              </div>`
            ).join('')
        }
      </div>
      <button class="btn btn-primary btn-large" onclick="showBookingPanel()">
        📅 Đặt Phòng Này
      </button>
    `;

    // Load gallery
    loadRoomGallery(roomId);

    // Hiển thị booking panel
    document.getElementById('booking-panel').style.display = 'block';

    // Setup booking với thông tin phòng
    BookingManager.init(room, booked_slots);

  } catch (error) {
    document.getElementById('room-info').innerHTML = `<p class="error">❌ ${error.message}</p>`;
  }
}

async function loadRoomGallery(roomId) {
  try {
    const res = await API.getRoomImages(roomId);
    const images = res.data;
    if (!images.length) return;

    const gallery = document.getElementById('room-gallery');
    gallery.innerHTML = `
      <h4 style="margin-bottom:10px;font-size:0.9rem;color:var(--text-soft);text-transform:uppercase;letter-spacing:0.5px;">
        📷 Hình ảnh thực tế (${images.length} ảnh)
      </h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${images.slice(0,4).map((img, i) => `
          <div style="aspect-ratio:4/3;overflow:hidden;border-radius:8px;cursor:pointer;"
               onclick="openLightbox(${i}, ${JSON.stringify(images.map(x => x.url)).replace(/"/g, '&quot;')})">
            <img src="${img.url}" alt="${img.alt_text || ''}"
                 style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s;"
                 onmouseover="this.style.transform='scale(1.05)'"
                 onmouseout="this.style.transform='scale(1)'">
          </div>
        `).join('')}
      </div>
      ${images.length > 4 ? `<div style="text-align:center;margin-top:8px;font-size:0.82rem;color:var(--text-soft);">
        +${images.length - 4} ảnh khác
      </div>` : ''}
    `;
  } catch (e) { /* không có ảnh thì bỏ qua */ }
}

function formatDateTime(dt) {
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function showBookingPanel() {
  const panel = document.getElementById('booking-panel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth' });
  }
  // Focus vào input thời gian bắt đầu
  const startInput = document.getElementById('booking-start');
  if (startInput) startInput.focus();
}

const isPreviewOnlyMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('preview') === 'plain' || urlParams.get('mode') === 'preview';
};

// Khởi chạy khi trang load
document.addEventListener('DOMContentLoaded', () => {
  if (!isPreviewOnlyMode()) {
    initThreeJS();
  } else {
    const viewerPanel = document.querySelector('.viewer-panel');
    if (viewerPanel) {
      viewerPanel.style.display = 'none';
    }

    const equipmentSection = document.getElementById('equipment-section');
    if (equipmentSection) {
      equipmentSection.style.display = 'none';
    }

    const equipmentCart = document.getElementById('equipment-cart');
    if (equipmentCart) {
      equipmentCart.style.display = 'none';
    }
  }
  loadRoomDetail();
});