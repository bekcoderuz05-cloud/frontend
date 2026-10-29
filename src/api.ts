export type User = {id:number; first_name:string; last_name:string; phone:string; username?:string; avatar_url?:string};
export type Session = {access_token:string;refresh_token:string;user:User};
let session:Session|null = (()=>{try{return JSON.parse(sessionStorage.getItem('voha.session')||'null')}catch{return null}})();
let refreshing:Promise<void>|null=null;
export function getSession(){return session}
export function saveSession(value:Session|null){session=value; if(value)sessionStorage.setItem('voha.session',JSON.stringify(value));else sessionStorage.removeItem('voha.session')}
export async function api<T=any>(path:string,method='GET',body?:unknown,token?:string,retry=true):Promise<T>{
 const bearer=token??session?.access_token;
 const response=await fetch('/api'+path,{method,headers:{...(body instanceof FormData?{}:{'Content-Type':'application/json'}),...(bearer?{Authorization:'Bearer '+bearer}:{})},body:body===undefined?undefined:body instanceof FormData?body:JSON.stringify(body),signal:AbortSignal.timeout(25000)});
 if(response.status===401&&session&&retry&&!token){
  if(!refreshing)refreshing=(async()=>{try{const data=await api<{access_token:string}>('/auth/refresh','POST',{refresh_token:session!.refresh_token},'',false);saveSession({...session!,access_token:data.access_token})}catch(error){saveSession(null);window.dispatchEvent(new Event('voha:logout'));throw error}finally{refreshing=null}})();
  await refreshing;return api(path,method,body,undefined,false);
 }
 const text=await response.text();let data:any;try{data=text?JSON.parse(text):null}catch{throw new Error('Server javobi noto‘g‘ri')}
 if(!response.ok)throw new Error(typeof data?.detail==='string'?data.detail:Array.isArray(data?.detail)?data.detail[0]?.msg:'So‘rov bajarilmadi ('+response.status+')');return data;
}
export function media(url?:string){if(!url)return undefined; if(url.startsWith('/'))return '/api'+url;try{const parsed=new URL(url);return ['https:','http:'].includes(parsed.protocol)?url:undefined}catch{return undefined}}
export const fullName=(u?:Partial<User>|null)=>[u?.first_name,u?.last_name].filter(Boolean).join(' ')||u?.phone||'Foydalanuvchi';

let telegramLoginRequest:Promise<Session>|null=null;
export function telegramLogin(initData:string):Promise<Session>{
 if(!initData)return Promise.reject(new Error('Telegram Mini App ichidan oching.'));
 if(!telegramLoginRequest)telegramLoginRequest=api<Session>('/auth/telegram','POST',{init_data:initData},'',false).then(value=>{if(!value.access_token||!value.refresh_token||!value.user?.id)throw new Error('Telegram sessiyasi serverdan olinmadi');saveSession(value);return value}).finally(()=>{telegramLoginRequest=null});
 return telegramLoginRequest;
}
export const displayPhone=(phone?:string)=>phone?.startsWith('tg:')?'Telegram akkaunti':phone||'';
