-- 为演示医生生成自然、稳定且可重复执行的中文姓名，并分配本地虚构头像。
UPDATE doctors
SET name = CONCAT(
  ELT(MOD(id - 1, 30) + 1,
    '陈','李','王','张','刘','赵','周','吴','徐','孙','胡','朱','高','林','何',
    '郭','马','罗','梁','宋','郑','谢','韩','唐','冯','于','董','萧','程','曹'),
  ELT(MOD(FLOOR((id - 1) / 30) * 7 + MOD(id - 1, 30) * 11, 30) + 1,
    '嘉宁','文博','思远','雅琳','俊杰','雨桐','明轩','静怡','承泽','若涵',
    '浩然','欣妍','景行','婉清','启航','舒雅','致远','清妍','睿哲','安然',
    '泽宇','书瑶','弘毅','知夏','彦博','语彤','修远','芷晴','绍谦','映雪')
),
avatar_url = CONCAT('/avatars/doctor-', MOD(id - 1, 9) + 1, '.png'),
description = CASE
  WHEN description IS NULL OR description = '' OR description LIKE '长期从事%临床诊疗工作。' OR description LIKE '具有丰富的%临床经验。'
  THEN CONCAT('长期从事', (SELECT name FROM departments WHERE departments.id = doctors.department_id), '临床诊疗与教学工作，重视规范化诊治和患者沟通。')
  ELSE description
END
WHERE status = 1;
