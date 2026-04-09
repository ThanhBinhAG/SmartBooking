# Dùng Node.js 20 phiên bản Alpine (nhẹ, bảo mật hơn)
FROM node:20-alpine

# Thư mục làm việc trong container
WORKDIR /app

# Copy package files trước (tận dụng Docker cache)
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Port backend lắng nghe
EXPOSE 3000

# Lệnh mặc định (sẽ bị override bởi docker-compose)
CMD ["node", "server.js"]