-- 连接时通过 MYSQL_DATABASE 选择数据库。
INSERT INTO users (phone, role, nickname, real_name, status) VALUES
('13800138000','super_admin','平台管理员','超级管理员',1),
('13800138001','merchant_admin','协和管理员','医院管理员',1),
('13800138002','merchant_admin','北大医院管理员','医院管理员',1),
('13800138003','user','患者用户','测试患者',1)
ON DUPLICATE KEY UPDATE status=VALUES(status),role=VALUES(role),nickname=VALUES(nickname);

INSERT INTO hospitals (code,name,short_name,level,type,province,city,district,address,phone,description,created_by)
SELECT 'BJXH','北京协和医院','协和医院','三级甲等','综合医院','北京市','北京市','东城区','帅府园1号','010-69156114','综合性三级甲等医院',id FROM users WHERE phone='13800138000'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;
INSERT INTO hospitals (code,name,short_name,level,type,province,city,district,address,phone,description,created_by)
SELECT 'BDBYY','北京大学第一医院','北大医院','三级甲等','综合医院','北京市','北京市','西城区','西什库大街8号','010-83572211','大型综合性医院',id FROM users WHERE phone='13800138000'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;
INSERT INTO hospitals (code,name,short_name,level,type,province,city,district,address,phone,description,created_by)
SELECT 'BJTR','北京同仁医院','同仁医院','三级甲等','综合医院','北京市','北京市','东城区','东交民巷1号','010-58269911','以眼科和耳鼻咽喉科为特色的综合医院',id FROM users WHERE phone='13800138000'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;

INSERT INTO hospital_members (hospital_id,user_id,member_role)
SELECT h.id,u.id,'admin' FROM hospitals h JOIN users u ON u.phone='13800138001' WHERE h.code='BJXH'
ON DUPLICATE KEY UPDATE status=1,member_role='admin';
INSERT INTO hospital_members (hospital_id,user_id,member_role)
SELECT h.id,u.id,'admin' FROM hospitals h JOIN users u ON u.phone='13800138002' WHERE h.code='BDBYY'
ON DUPLICATE KEY UPDATE status=1,member_role='admin';

INSERT INTO departments (hospital_id,code,name,description,sort_order)
SELECT id,'CARD','心血管内科','心血管疾病诊疗',10 FROM hospitals WHERE code='BJXH'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;
INSERT INTO departments (hospital_id,code,name,description,sort_order)
SELECT id,'DERM','皮肤科','皮肤常见病与疑难病诊疗',10 FROM hospitals WHERE code='BDBYY'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;
INSERT INTO departments (hospital_id,code,name,description,sort_order)
SELECT id,'PED','儿科','儿童常见病与生长发育诊疗',20 FROM hospitals WHERE code='BDBYY'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;
INSERT INTO departments (hospital_id,code,name,description,sort_order)
SELECT id,'EYE','眼科','眼底病、眼肿瘤与视光诊疗',10 FROM hospitals WHERE code='BJTR'
ON DUPLICATE KEY UPDATE name=VALUES(name),status=1;

INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'张明远','主任医师','高血压、冠心病、心律失常','从事心血管临床工作三十余年。',80,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJXH' AND d.code='CARD' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='张明远');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'涂平','主任医师','皮炎、湿疹、荨麻疹及疑难皮肤病','长期从事皮肤病临床诊疗。',60,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='DERM' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='涂平');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'林书雅','副主任医师','儿童发热、呼吸道感染与过敏性疾病','擅长儿童常见病规范诊疗。',50,20 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='PED' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='林书雅');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'史季桐','主任医师','眼部肿瘤、眼底病的诊断与治疗','长期从事眼科临床与影像诊断。',100,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJTR' AND d.code='EYE' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='史季桐');

INSERT INTO doctor_schedules (hospital_id,department_id,doctor_id,schedule_date,period,start_time,end_time,total_slots,fee)
SELECT hospital_id,department_id,id,DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY),'morning','08:30:00','11:30:00',30,registration_fee FROM doctors
ON DUPLICATE KEY UPDATE total_slots=VALUES(total_slots),fee=VALUES(fee),status=1;
INSERT INTO doctor_schedules (hospital_id,department_id,doctor_id,schedule_date,period,start_time,end_time,total_slots,fee)
SELECT hospital_id,department_id,id,DATE_ADD(CURRENT_DATE,INTERVAL 2 DAY),'afternoon','13:30:00','17:00:00',24,registration_fee FROM doctors
ON DUPLICATE KEY UPDATE total_slots=VALUES(total_slots),fee=VALUES(fee),status=1;

INSERT INTO accounts (hospital_id,balance,frozen_amount)
SELECT id,20000,0 FROM hospitals ON DUPLICATE KEY UPDATE status=1;
