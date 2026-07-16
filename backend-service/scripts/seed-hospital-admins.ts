import"dotenv/config";
import type{ResultSetHeader,RowDataPacket}from"mysql2";
import{pool}from"../src/db/pool.js";
import{hashPassword}from"../src/lib/password.js";

const defaultPassword=process.env.HOSPITAL_ADMIN_INITIAL_PASSWORD||"Hospital@2026";
const[hospitals]=await pool.query<RowDataPacket[]>("SELECT id,code,name FROM hospitals WHERE status=1 ORDER BY id");
for(const hospital of hospitals){
  const phone=`166${String(hospital.id).padStart(8,"0")}`;
  const{salt,hash}=await hashPassword(defaultPassword);
  const[result]=await pool.execute<ResultSetHeader>(`INSERT INTO users(phone,role,nickname,real_name,password_hash,password_salt,status)
    VALUES(?,'merchant_admin',?,? ,?,?,1)
    ON DUPLICATE KEY UPDATE role='merchant_admin',nickname=VALUES(nickname),real_name=VALUES(real_name),password_hash=VALUES(password_hash),password_salt=VALUES(password_salt),status=1`,
    [phone,`${hospital.name}管理员`,"医院管理员",hash,salt]);
  let userId=result.insertId;
  if(!userId){const[users]=await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE phone=?",[phone]);if(!users[0])throw new Error(`管理员账号创建失败: ${phone}`);userId=users[0].id}
  await pool.execute(`INSERT INTO hospital_members(hospital_id,user_id,member_role,status) VALUES(?,?,'admin',1)
    ON DUPLICATE KEY UPDATE member_role='admin',status=1`,[hospital.id,userId]);
  console.log(`${hospital.name}\t${phone}`);
}
await pool.end();
console.log(`已创建 ${hospitals.length} 个医院管理员，初始密码：${defaultPassword}`);
