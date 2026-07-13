USE hospital_registration;

INSERT INTO users (phone, role, nickname, real_name, status)
VALUES ('13800138000', 'super_admin', '平台管理员', '超级管理员', 1),
       ('13800138001', 'merchant_admin', '协和管理员', '医院管理员', 1);

INSERT INTO hospitals (code, name, short_name, level, type, province, city, district, address, phone, description, created_by)
SELECT 'BJXH', '北京协和医院', '协和医院', '三级甲等', '综合医院', '北京市', '北京市', '东城区', '帅府园1号', '010-69156114', '综合性三级甲等医院', id
FROM users WHERE phone='13800138000';

INSERT INTO hospitals (code, name, short_name, level, type, province, city, district, address, phone, description, created_by)
SELECT 'BDBYY', '北京大学第一医院', '北大医院', '三级甲等', '综合医院', '北京市', '北京市', '西城区', '西什库大街8号', '010-83572211', '大型综合性医院', id
FROM users WHERE phone='13800138000';

INSERT INTO hospital_members (hospital_id, user_id, member_role)
SELECT h.id, u.id, 'admin' FROM hospitals h JOIN users u ON u.phone='13800138001' WHERE h.code='BJXH';

INSERT INTO departments (hospital_id, code, name, description, sort_order)
SELECT id, 'INTERNAL', '内科', '常见内科疾病诊疗', 10 FROM hospitals WHERE code='BJXH'
UNION ALL SELECT id, 'DERM', '皮肤科', '皮肤常见病及疑难病诊疗', 20 FROM hospitals WHERE code='BDBYY';

INSERT INTO doctors (hospital_id, department_id, name, title, specialty, description, registration_fee, sort_order)
SELECT h.id, d.id, '张建国', '主任医师', '高血压、冠心病及常见内科疾病', '从事内科临床工作三十余年。', 80.00, 10
FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJXH' AND d.code='INTERNAL'
UNION ALL
SELECT h.id, d.id, '涂平', '主任医师', '皮炎、湿疹、荨麻疹及疑难皮肤病', '长期从事皮肤病临床诊疗。', 60.00, 10
FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='DERM';

INSERT INTO doctor_schedules (hospital_id, department_id, doctor_id, schedule_date, period, start_time, end_time, total_slots, fee)
SELECT hospital_id, department_id, id, DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY), 'morning', '08:30:00', '11:30:00', 30, registration_fee
FROM doctors;

INSERT INTO accounts (hospital_id)
SELECT id FROM hospitals;
