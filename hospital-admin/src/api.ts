const API_BASE_URL=import.meta.env.VITE_API_BASE_URL??"http://localhost:4000/api/v1";
type Options=RequestInit&{public?:boolean};
export async function request<T>(path:string,options:Options={}):Promise<T>{const token=localStorage.getItem("hospital_admin_token");const headers=new Headers(options.headers);headers.set("Content-Type","application/json");if(!options.public){headers.set("platform","h5");if(token)headers.set("Authorization",`Bearer ${token}`);}const response=await fetch(`${API_BASE_URL}${path}`,{...options,headers});const body=response.status===204?null:await response.json();if(!response.ok)throw new Error(body?.error?.message??"请求失败");return body?.data??body;}
export const api={
  sendSms:(phone:string)=>request("/auth/send-sms",{method:"POST",public:true,body:JSON.stringify({phone,scene:"login"})}),
  login:async(phone:string,verificationCode:string)=>{const data=await request<{accessToken:string}>("/auth/mobile-login",{method:"POST",public:true,body:JSON.stringify({phone,verificationCode})});localStorage.setItem("hospital_admin_token",data.accessToken);return data;},
  hospitals:(query="")=>request(`/hospitals${query}`), hospital:(id:number)=>request(`/hospitals/${id}`),
  departments:(hospitalId:number)=>request(`/departments?hospitalId=${hospitalId}`),
  doctors:(hospitalId:number)=>request(`/doctors?hospitalId=${hospitalId}`),
  schedules:(hospitalId:number)=>request(`/schedules?hospitalId=${hospitalId}`),
  account:(hospitalId:number)=>request(`/accounts/${hospitalId}`), flows:(hospitalId:number)=>request(`/accounts/${hospitalId}/flows`),
};
