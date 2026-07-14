export type Hospital={id:number;code:string;name:string;shortName?:string;level:string;type?:string;province:string;city:string;district:string;address:string;phone?:string;description?:string};
export type Department={id:number;code:string;name:string;description:string;hospitalId:number;hospitalName:string};
export type Doctor={id:number;name:string;title:string;specialty:string;description?:string;avatarUrl?:string;registrationFee:number;hospitalId:number;hospitalName:string;departmentId:number;departmentName:string};
export type Schedule={id:number;scheduleDate:string;period:string;startTime:string;endTime:string;totalSlots:number;bookedSlots:number;availableSlots:number;fee:number;doctorId:number;doctorName:string;hospitalId:number;hospitalName:string;departmentId:number;departmentName:string};
export type Person={id:number;name:string;phone:string;idCardMasked:string;relationship:string;isDefault:boolean};
export type Order={id:number;orderNo:string;personName:string;personPhone:string;hospitalName:string;departmentName:string;doctorName:string;doctorTitle:string;visitDate:string;period:string;visitNumber:number;amount:number;status:string;createdAt:string};
const base=import.meta.env.VITE_API_BASE_URL||"http://localhost:4000/api/v1";
export const session={get:()=>localStorage.getItem("patient_token"),set:(v:string)=>localStorage.setItem("patient_token",v),clear:()=>localStorage.removeItem("patient_token")};
async function request<T>(path:string,init:RequestInit={},auth=false):Promise<T>{const headers=new Headers(init.headers);headers.set("Content-Type","application/json");headers.set("platform","h5");const t=session.get();if(t)headers.set("Authorization",`Bearer ${t}`);if(auth&&!t)throw new Error("NEED_LOGIN");const r=await fetch(`${base}${path}`,{...init,headers});const body=r.status===204?null:await r.json();if(!r.ok)throw new Error(body?.error?.message??"请求失败");return body?.data??body}
const json=(method:string,data:unknown):RequestInit=>({method,body:JSON.stringify(data)});const query=(values:Record<string,string|number|undefined>)=>{const q=new URLSearchParams();Object.entries(values).forEach(([k,v])=>v!==undefined&&v!==""&&q.set(k,String(v)));return q.toString()};
export const api={
 hospitals:(p:{keyword?:string;province?:string;city?:string;district?:string;page?:number;pageSize?:number}|string={})=>{const params=typeof p==="string"?{keyword:p}:p;return request<Hospital[]>(`/hospitals?${query({pageSize:100,...params})}`)},
 hospital:(id:number)=>request<Hospital>(`/hospitals/${id}`),
 departments:(hospitalId?:number)=>request<Department[]>(`/departments?${query({pageSize:100,hospitalId})}`),department:(id:number)=>request<Department>(`/departments/${id}`),
 doctors:(p:{keyword?:string;hospitalId?:number;departmentId?:number;department?:string;province?:string;city?:string;page?:number;pageSize?:number}={})=>request<Doctor[]>(`/doctors?${query({pageSize:20,page:1,...p})}`),
 doctor:(id:number)=>request<Doctor>(`/doctors/${id}`),schedules:(doctorId:number)=>request<Schedule[]>(`/schedules?doctorId=${doctorId}&pageSize=50`),
 sendSms:(phone:string)=>request<{debugCode?:string}>("/auth/send-sms",json("POST",{phone,scene:"login"})),login:(phone:string,verificationCode:string)=>request<{accessToken:string;user:{phone:string}}>("/auth/mobile-login",json("POST",{phone,verificationCode})),
 people:()=>request<Person[]>("/registration-people",{},true),addPerson:(d:unknown)=>request<{id:number}>("/registration-people",json("POST",d),true),orders:()=>request<Order[]>("/registrations?pageSize=100",{},true),order:(id:number)=>request<Order>(`/registrations/${id}`,{},true),register:(d:unknown)=>request<{id:number;orderNo:string}>("/registrations",json("POST",d),true)
};
