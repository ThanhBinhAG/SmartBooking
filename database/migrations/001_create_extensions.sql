-- Bật các extension cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- Sinh UUID tự động
CREATE EXTENSION IF NOT EXISTS btree_gist;    -- Cho phép dùng GiST index với EXCLUSION