CREATE DATABASE IF NOT EXISTS hospital_registration
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE hospital_registration;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  mobile VARCHAR(20) NOT NULL,
  nickname VARCHAR(64) NULL,
  avatar_url VARCHAR(512) NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1 active, 0 disabled',
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_mobile (mobile),
  KEY idx_users_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE user_third_party_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(32) NOT NULL COMMENT 'wechat, qwen, alipay, etc.',
  provider_user_id VARCHAR(191) NOT NULL,
  union_id VARCHAR(191) NULL,
  profile_json JSON NULL,
  bound_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_third_party_identity (provider, provider_user_id),
  UNIQUE KEY uk_user_provider (user_id, provider),
  CONSTRAINT fk_third_party_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE registration_people (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  id_card_ciphertext VARBINARY(512) NOT NULL,
  id_card_hash CHAR(64) NOT NULL,
  id_card_last4 CHAR(4) NOT NULL,
  relationship VARCHAR(24) NOT NULL DEFAULT 'other',
  is_default TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_user_id_card (user_id, id_card_hash),
  KEY idx_registration_people_user_created (user_id, created_at),
  CONSTRAINT fk_registration_people_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE hospitals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(128) NOT NULL,
  short_name VARCHAR(64) NULL,
  level VARCHAR(20) NOT NULL COMMENT '三级甲等, 三级乙等, 二级甲等, etc.',
  type VARCHAR(32) NULL COMMENT '综合医院, 专科医院, 中医医院',
  province VARCHAR(32) NOT NULL,
  city VARCHAR(32) NOT NULL,
  district VARCHAR(32) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NULL,
  description TEXT NULL,
  latitude DECIMAL(10, 7) NULL,
  longitude DECIMAL(10, 7) NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_hospitals_code (code),
  KEY idx_hospitals_region_level (province, city, district, level),
  KEY idx_hospitals_name (name)
) ENGINE=InnoDB;

CREATE TABLE departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(64) NOT NULL,
  description TEXT NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_department_code (hospital_id, code),
  KEY idx_departments_hospital_name (hospital_id, name),
  CONSTRAINT fk_departments_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE doctors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  hospital_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  title VARCHAR(32) NOT NULL COMMENT '主任医师, 副主任医师, 主治医师, 医师',
  specialty TEXT NULL,
  introduction TEXT NULL,
  avatar_url VARCHAR(512) NULL,
  registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status TINYINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_doctors_hospital_department (hospital_id, department_id),
  KEY idx_doctors_name_title (name, title),
  CONSTRAINT fk_doctors_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_doctors_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE registration_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(40) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  registration_person_id BIGINT UNSIGNED NOT NULL,
  hospital_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  doctor_id BIGINT UNSIGNED NOT NULL,
  person_name VARCHAR(64) NOT NULL,
  person_mobile VARCHAR(20) NOT NULL,
  person_id_card_ciphertext VARBINARY(512) NOT NULL,
  hospital_name VARCHAR(128) NOT NULL,
  department_name VARCHAR(64) NOT NULL,
  doctor_name VARCHAR(64) NOT NULL,
  doctor_title VARCHAR(32) NOT NULL,
  visit_date DATE NULL,
  time_period VARCHAR(32) NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'pending_payment',
  cancel_reason VARCHAR(255) NULL,
  paid_at DATETIME(3) NULL,
  cancelled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_registration_orders_no (order_no),
  KEY idx_registration_orders_user_created (user_id, created_at),
  KEY idx_registration_orders_doctor_visit (doctor_id, visit_date, time_period),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_person FOREIGN KEY (registration_person_id) REFERENCES registration_people(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_no VARCHAR(40) NOT NULL,
  order_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  channel VARCHAR(32) NOT NULL COMMENT 'wechat, alipay, qwen, etc.',
  third_party_trade_no VARCHAR(128) NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  paid_at DATETIME(3) NULL,
  callback_payload JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_payments_no (payment_no),
  UNIQUE KEY uk_payments_trade_no (channel, third_party_trade_no),
  KEY idx_payments_order (order_id),
  KEY idx_payments_user_created (user_id, created_at),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES registration_orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
