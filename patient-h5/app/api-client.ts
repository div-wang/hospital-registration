export type Hospital={id:number;name:string;shortName?:string;level:string;type?:string;city:string;district:string;address:string;logoUrl?:string};
export type Department={id:number;name:string;hospitalId:number;hospitalName:string};
export type Doctor={id:number;name:string;title:string;specialty:string;description?:string;avatarUrl?:string;registrationFee:number;hospitalId:number;hospitalName:string;departmentId:number;departmentName:string};
export type Schedule={id:number;scheduleDate:string;period:string;startTime:string;endTime:string;totalSlots:number;bookedSlots:number;availableSlots:number;fee:number;doctorId:number};
export type Person={id:number;name:string;phone:string;idCardMasked:string;relationship:string;isDefault:boolean};
export type Order={id:number;orderNo:string;personName:string;personPhone:string;hospitalName:string;departmentName:string;doctorName:string;doctorTitle:string;visitDate:string;period:string;visitNumber:number;amount:number;status:string;createdAt:string};
const base=process.env.NEXT_PUBLIC_API_BASE_URL??"http://localhost:4000/api/v1";
export const token={get:()=>typeof window==="undefined"?null:localStorage.getItem("patient_token"),set:(value:string)=>localStorage.setItem("patient_token",value),clear:()=>localStorage.removeItem("patient_token")};
async function request<T>(path:string,init:RequestInit={},auth=false):Promise<T>{const headers=new Headers(init.headers);headers.set("Content-Type","application/json");headers.set("platform","h5");const value=token.get();if(value)headers.set("Authorization",`Bearer ${value}`);if(auth&&!value)throw new Error("NEED_LOGIN");const response=await fetch(`${base}${path}`,{...init,headers});const body=response.status===204?null:await response.json();if(!response.ok)throw new Error(body?.error?.message??"请求失败");return body?.data??body;}
export const api={
 hospitals:(keyword="")=>request<Hospital[]>(`/hospitals?pageSize=50${keyword?`&keyword=${encodeURIComponent(keyword)}`:""}`),
 departments:(hospitalId?:number)=>request<Department[]>(`/departments?pageSize=100${hospitalId?`&hospitalId=${hospitalId}`:""}`),
 doctors:(params:{keyword?:string;departmentId?:number;hospitalId?:number}={})=>{const q=new URLSearchParams({pageSize:"100"});Object.entries(params).forEach(([k,v])=>v&&q.set(k,String(v)));return request<Doctor[]>(`/doctors?${q}`)},
 schedules:(doctorId:number)=>request<Schedule[]>(`/schedules?doctorId=${doctorId}&pageSize=50`),
 sendSms:(phone:string)=>request<{debugCode?:string}>("/auth/send-sms",{method:"POST",body:JSON.stringify({phone,scene:"login"})}),
 login:(phone:string,verificationCode:string)=>request<{accessToken:string;user:{userId:number;phone:string;role:string}}>("/auth/mobile-login",{method:"POST",body:JSON.stringify({phone,verificationCode})}),
 people:()=>request<Person[]>("/registration-people",{},true),
 addPerson:(data:{name:string;phone:string;idCard:string;relationship:string;isDefault:boolean})=>request<{id:number}>("/registration-people",{method:"POST",body:JSON.stringify(data)},true),
 orders:()=>request<Order[]>("/registrations?pageSize=50",{},true),
 register:(data:{registrationPersonId:number;hospitalId:number;departmentId:number;doctorId:number;scheduleId:number})=>request<{id:number;orderNo:string}>("/registrations",{method:"POST",body:JSON.stringify(data)},true),
};
