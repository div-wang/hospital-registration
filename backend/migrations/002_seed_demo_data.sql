USE hospital_registration;

INSERT INTO hospitals (code, name, short_name, level, type, province, city, district, address, phone, description)
VALUES
  ('BJXH', '北京协和医院', '协和医院', '三级甲等', '综合医院', '北京市', '北京市', '东城区', '帅府园1号', '010-69156114', '综合性三级甲等医院'),
  ('BDBYY', '北京大学第一医院', '北大医院', '三级甲等', '综合医院', '北京市', '北京市', '西城区', '西什库大街8号', '010-83572211', '大型综合性医院'),
  ('BJTR', '北京同仁医院', '同仁医院', '三级甲等', '综合医院', '北京市', '北京市', '东城区', '东交民巷1号', '010-58266699', '以眼科、耳鼻咽喉科为重点的综合医院');

INSERT INTO departments (hospital_id, code, name, description)
SELECT id, 'INTERNAL', '内科', '常见内科疾病诊疗' FROM hospitals WHERE code='BJXH'
UNION ALL SELECT id, 'DERM', '皮肤科', '皮肤常见病及疑难病诊疗' FROM hospitals WHERE code='BDBYY'
UNION ALL SELECT id, 'EYE', '眼科', '眼科疾病诊疗' FROM hospitals WHERE code='BJTR';

INSERT INTO doctors (hospital_id, department_id, name, title, specialty, introduction, registration_fee)
SELECT h.id, d.id, '张建国', '主任医师', '高血压、冠心病及常见内科疾病', '从事内科临床工作三十余年。', 80.00
FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJXH' AND d.code='INTERNAL'
UNION ALL
SELECT h.id, d.id, '涂平', '主任医师', '皮炎、湿疹、荨麻疹及疑难皮肤病', '长期从事皮肤病临床诊疗。', 60.00
FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BDBYY' AND d.code='DERM'
UNION ALL
SELECT h.id, d.id, '史季桐', '主任医师', '眼部肿瘤、眼底病诊断与治疗', '眼科临床经验丰富。', 100.00
FROM hospitals h JOIN departments d ON d.hospital_id=h.id WHERE h.code='BJTR' AND d.code='EYE';
