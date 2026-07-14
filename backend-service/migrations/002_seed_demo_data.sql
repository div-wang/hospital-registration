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

INSERT INTO hospitals (code,name,short_name,level,type,province,city,district,address,description,created_by) VALUES
('BJ301','中国人民解放军总医院','解放军总医院','三级甲等','综合医院','北京市','北京市','海淀区','复兴路28号','大型现代化综合医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJCH','北京朝阳医院','朝阳医院','三级甲等','综合医院','北京市','北京市','朝阳区','工人体育场南路8号','北京市属综合医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJSY','北京大学人民医院','北大人民医院','三级甲等','综合医院','北京市','北京市','西城区','西直门南大街11号','综合性三级甲等医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJTH','北京天坛医院','天坛医院','三级甲等','综合医院','北京市','北京市','丰台区','南四环西路119号','神经疾病诊疗特色医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJXW','北京宣武医院','宣武医院','三级甲等','综合医院','北京市','北京市','西城区','长椿街45号','神经医学与老年医学特色医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJER','北京儿童医院','儿童医院','三级甲等','专科医院','北京市','北京市','西城区','南礼士路56号','儿童医学专科医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJFC','北京妇产医院','妇产医院','三级甲等','专科医院','北京市','北京市','朝阳区','姚家园路251号','妇产与妇幼保健专科医院',(SELECT id FROM users WHERE phone='13800138000')),
('BJZL','北京大学肿瘤医院','北大肿瘤医院','三级甲等','专科医院','北京市','北京市','海淀区','阜成路52号','肿瘤诊疗专科医院',(SELECT id FROM users WHERE phone='13800138000')),
('SHRJ','上海交通大学医学院附属瑞金医院','瑞金医院','三级甲等','综合医院','上海市','上海市','黄浦区','瑞金二路197号','综合性教学医院',(SELECT id FROM users WHERE phone='13800138000')),
('SHHS','复旦大学附属华山医院','华山医院','三级甲等','综合医院','上海市','上海市','静安区','乌鲁木齐中路12号','综合性三级甲等医院',(SELECT id FROM users WHERE phone='13800138000')),
('SHZS','复旦大学附属中山医院','上海中山医院','三级甲等','综合医院','上海市','上海市','徐汇区','枫林路180号','综合性教学医院',(SELECT id FROM users WHERE phone='13800138000')),
('GZSYY','中山大学附属第一医院','中山一院','三级甲等','综合医院','广东省','广州市','越秀区','中山二路58号','综合性三级甲等医院',(SELECT id FROM users WHERE phone='13800138000')),
('GZNF','南方医科大学南方医院','南方医院','三级甲等','综合医院','广东省','广州市','白云区','广州大道北1838号','综合性教学医院',(SELECT id FROM users WHERE phone='13800138000')),
('SCWC','四川大学华西医院','华西医院','三级甲等','综合医院','四川省','成都市','武侯区','国学巷37号','大型综合性教学医院',(SELECT id FROM users WHERE phone='13800138000')),
('WHXH','华中科技大学同济医学院附属协和医院','武汉协和医院','三级甲等','综合医院','湖北省','武汉市','江汉区','解放大道1277号','综合性三级甲等医院',(SELECT id FROM users WHERE phone='13800138000')),
('CSXY','中南大学湘雅医院','湘雅医院','三级甲等','综合医院','湖南省','长沙市','开福区','湘雅路87号','综合性教学医院',(SELECT id FROM users WHERE phone='13800138000')),
('XJXJ','西京医院','西京医院','三级甲等','综合医院','陕西省','西安市','新城区','长乐西路127号','大型综合医院',(SELECT id FROM users WHERE phone='13800138000'))
ON DUPLICATE KEY UPDATE name=VALUES(name),level=VALUES(level),status=1;

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

CREATE TEMPORARY TABLE seed_department_templates (
  code VARCHAR(50) PRIMARY KEY, name VARCHAR(64), description VARCHAR(255), sort_order INT
);
INSERT INTO seed_department_templates VALUES
('INTERNAL','内科','常见内科疾病及慢性病诊疗',10),('SURGERY','外科','普通外科疾病与手术诊疗',20),
('PEDIATRICS','儿科','儿童常见病与生长发育诊疗',30),('OBGYN','妇产科','妇科、产科及孕产保健',40),
('DERMATOLOGY','皮肤科','皮肤常见病及疑难病诊疗',50),('ENT','耳鼻喉科','耳鼻咽喉常见病诊疗',60),
('OPHTHALMOLOGY','眼科','眼病与视光诊疗',70),('STOMATOLOGY','口腔科','口腔疾病与牙科诊疗',80),
('ORTHOPEDICS','骨科','骨与关节疾病诊疗',90),('TCM','中医科','中医辨证与调理诊疗',100),
('NEUROLOGY','神经内科','脑血管及神经系统疾病诊疗',110),('CARDIOLOGY','心血管内科','心脏与血管疾病诊疗',120);
INSERT INTO departments (hospital_id,code,name,description,sort_order)
SELECT h.id,t.code,t.name,t.description,t.sort_order FROM hospitals h CROSS JOIN seed_department_templates t WHERE 1=1
ON DUPLICATE KEY UPDATE name=VALUES(name),description=VALUES(description),status=1;

INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'张明远','主任医师','高血压、冠心病、心律失常','从事心血管临床工作三十余年。',80,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJXH' AND d.code='CARD' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='张明远');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'涂平','主任医师','皮炎、湿疹、荨麻疹及疑难皮肤病','长期从事皮肤病临床诊疗。',60,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='DERM' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='涂平');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'林书雅','副主任医师','儿童发热、呼吸道感染与过敏性疾病','擅长儿童常见病规范诊疗。',50,20 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='PED' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='林书雅');
INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,'史季桐','主任医师','眼部肿瘤、眼底病的诊断与治疗','长期从事眼科临床与影像诊断。',100,10 FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJTR' AND d.code='EYE' AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.hospital_id=h.id AND x.name='史季桐');

INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,CONCAT(LEFT(h.short_name,2),d.name,'医师'),
       CASE d.sort_order % 3 WHEN 0 THEN '主任医师' WHEN 1 THEN '副主任医师' ELSE '主治医师' END,
       CONCAT('擅长',d.name,'常见病、多发病及疑难疾病诊疗'),CONCAT('长期从事',d.name,'临床诊疗工作。'),
       30 + (d.sort_order % 8) * 10,10
FROM hospitals h JOIN departments d ON d.hospital_id=h.id
WHERE NOT EXISTS (SELECT 1 FROM doctors x WHERE x.department_id=d.id);

INSERT INTO doctors (hospital_id,department_id,name,title,specialty,description,registration_fee,sort_order)
SELECT h.id,d.id,CONCAT(LEFT(h.short_name,2),d.name,'专家'),'副主任医师',
       CONCAT('擅长',d.name,'专科诊疗与健康管理'),CONCAT('具有丰富的',d.name,'临床经验。'),60,20
FROM hospitals h JOIN departments d ON d.hospital_id=h.id
WHERE d.sort_order IN (10,20,30,40)
  AND NOT EXISTS (SELECT 1 FROM doctors x WHERE x.department_id=d.id AND x.sort_order=20);

INSERT INTO doctor_schedules (hospital_id,department_id,doctor_id,schedule_date,period,start_time,end_time,total_slots,fee)
SELECT hospital_id,department_id,id,DATE_ADD(CURRENT_DATE,INTERVAL 1 DAY),'morning','08:30:00','11:30:00',30,registration_fee FROM doctors
ON DUPLICATE KEY UPDATE total_slots=VALUES(total_slots),fee=VALUES(fee),status=1;
INSERT INTO doctor_schedules (hospital_id,department_id,doctor_id,schedule_date,period,start_time,end_time,total_slots,fee)
SELECT hospital_id,department_id,id,DATE_ADD(CURRENT_DATE,INTERVAL 2 DAY),'afternoon','13:30:00','17:00:00',24,registration_fee FROM doctors
ON DUPLICATE KEY UPDATE total_slots=VALUES(total_slots),fee=VALUES(fee),status=1;

INSERT INTO accounts (hospital_id,balance,frozen_amount)
SELECT id,20000,0 FROM hospitals ON DUPLICATE KEY UPDATE status=1;
