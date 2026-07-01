CREATE DATABASE IF NOT EXISTS cardforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cardforge;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  api_token VARCHAR(128) NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  token VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(190) NOT NULL,
  preview LONGTEXT NULL,
  design_json LONGTEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NULL,
  title VARCHAR(190) NOT NULL,
  preview LONGTEXT NULL,
  whatsapp_text TEXT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'whatsapp',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL DEFAULT 5000,
  image_url TEXT NULL,
  front_image_url TEXT NULL,
  back_image_url TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS front_image_url TEXT NULL AFTER image_url;
ALTER TABLE products ADD COLUMN IF NOT EXISTS back_image_url TEXT NULL AFTER front_image_url;
UPDATE products SET front_image_url = image_url WHERE (front_image_url IS NULL OR front_image_url = '') AND image_url IS NOT NULL AND image_url <> '';

INSERT INTO products (id, title, description, price, image_url, sort_order, active) VALUES
  (1, 'Business Cards', 'Premium cards for companies and personal brands.', 5000, '', 1, 1),
  (2, 'Wedding Invitations', 'Elegant printed invitations for weddings and family events.', 5000, '', 2, 1),
  (3, 'VIP Cards', 'Luxury passes for clubs, events, launches, and private access.', 5000, '', 3, 1),
  (4, 'Gift & Loyalty Cards', 'Printed cards for shops, restaurants, gyms, and campaigns.', 5000, '', 4, 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  price = VALUES(price),
  sort_order = VALUES(sort_order),
  active = VALUES(active);

CREATE TABLE IF NOT EXISTS brilogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL DEFAULT 15000,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brilog_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brilog_id INT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brilog_id) REFERENCES brilogs(id) ON DELETE CASCADE
);

INSERT INTO brilogs (id, title, description, price, sort_order, active) VALUES
  (1, 'Personal 3D Brilog', 'A custom 3D collectible figure based on a real portrait, prepared with an NFC profile link.', 15000, 1, 1),
  (2, 'Couple Brilog Set', 'Two matching stylized 3D figures for gifts, weddings, anniversaries, and premium keepsakes.', 28000, 2, 1),
  (3, 'Brand Mascot Brilog', 'A small physical 3D mascot for creators, teams, shops, and personal brands.', 22000, 3, 1),
  (4, 'Contact Us for Custom Brilog', 'Send us your photo. We will create your personal 3D brilog concept and contact you with the next steps.', 15000, 4, 1)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  price = VALUES(price),
  sort_order = VALUES(sort_order),
  active = VALUES(active);

CREATE TABLE IF NOT EXISTS product_catalogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL UNIQUE,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  catalog_id INT NOT NULL,
  title VARCHAR(190) NOT NULL,
  description TEXT NOT NULL,
  price INT NOT NULL DEFAULT 5000,
  sort_order INT NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES product_catalogs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog_product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES catalog_products(id) ON DELETE CASCADE
);
