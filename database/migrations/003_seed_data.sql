-- Dữ liệu mẫu để test

-- Phòng họp
INSERT INTO rooms (name, description, capacity, price_per_hour, location, floor, model_3d_url, amenities) VALUES
('Phòng Sáng Tạo A', 'Phòng họp hiện đại với view thành phố, ánh sáng tự nhiên tuyệt vời', 8, 250000, 'Tầng 5, Tòa nhà The Sun', 5, '/assets/3d-models/room_a.glb', '["wifi", "projector", "whiteboard", "coffee"]'),
('Phòng Hội Đồng B', 'Phòng sang trọng dành cho các cuộc họp quan trọng và tiếp khách', 20, 500000, 'Tầng 8, Tòa nhà The Sun', 8, '/assets/3d-models/room_b.glb', '["wifi", "projector", "screen", "microphone", "coffee"]'),
('Phòng Mini C', 'Không gian nhỏ gọn, ấm cúng cho các buổi brainstorm 2-4 người', 4, 150000, 'Tầng 3, Tòa nhà The Sun', 3, '/assets/3d-models/room_c.glb', '["wifi", "whiteboard", "coffee"]');

-- Trang thiết bị
INSERT INTO equipment (name, description, hourly_rate, total_stock, unit) VALUES
('Máy chiếu 4K', 'Epson EB-2265U, độ sáng 5500 lm', 50000, 5, 'cái'),
('Micro không dây', 'Bộ 2 micro Shure BLX288/PG58', 30000, 8, 'bộ'),
('Màn hình LED 75"', 'Samsung QM75B, màu sắc sắc nét', 80000, 3, 'cái'),
('Bộ trà nước cao cấp', 'Trà, cà phê, bánh cho 10 người', 100000, 20, 'bộ'),
('Hỗ trợ kỹ thuật', 'Nhân viên IT hỗ trợ trực tiếp', 150000, 4, 'người');