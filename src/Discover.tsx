import {useEffect,useRef,useState} from 'react';
import {Search,MapPin,Store,GraduationCap,RefreshCw,ShoppingBag} from 'lucide-react';
import {api,media} from './api';
import {tg} from './telegram';
type Product={id:number;name:string;price:string;unit:string;image_url?:string;image_urls?:string[];is_active?:boolean};
type Market={id:number;name:string;image_url?:string;address?:string;products_count?:number;products?:Product[]};
export default function Discover({onMarket,onEducation}:{onMarket:(market:Market)=>void;onEducation:()=>void}){
 const [markets,setMarkets]=useState<Market[]>([]),[details,setDetails]=useState<Market[]>([]),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[productError,setProductError]=useState(''),[locating,setLocating]=useState(false),[locationLabel,setLocationLabel]=useState('Joylashuv aniqlanmadi');
 const generation=useRef(0),coordinates=useRef<{latitude:number;longitude:number}|null>(null);
 async function load(){
  const request=++generation.current;setLoading(true);setError('');setProductError('');
  try{
   const pos=coordinates.current;const nearby=await api<Market[]>('/markets/nearby?limit=20'+(pos?`&latitude=${pos.latitude}&longitude=${pos.longitude}`:''));
   if(request!==generation.current)return;setMarkets(nearby);setDetails([]);
   const results=await Promise.allSettled(nearby.map(m=>api<Market>('/markets/'+m.id)));
   if(request!==generation.current)return;
   setDetails(results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]));
   if(results.some(r=>r.status==='rejected'))setProductError('Ayrim do‘konlarning mahsulotlari yuklanmadi.');
  }catch(e){if(request===generation.current)setError((e as Error).message)}finally{if(request===generation.current)setLoading(false)}
 }
 useEffect(()=>{load();return()=>{generation.current++}},[]);
 function applyLocation(pos:{latitude:number;longitude:number}|null){setLocating(false);if(!pos){setLocationLabel('Joylashuv aniqlanmadi');return}coordinates.current=pos;setLocationLabel(`${pos.latitude.toFixed(3)}°, ${pos.longitude.toFixed(3)}°`);load()}
 function locate(){
  if(locating)return;setLocating(true);
  const manager=tg?.LocationManager;
  if(manager&&tg?.isVersionAtLeast?.('8.0')){manager.init(()=>{manager.getLocation((pos:any)=>applyLocation(pos))});return}
  if(!navigator.geolocation){applyLocation(null);return}
  navigator.geolocation.getCurrentPosition(p=>applyLocation(p.coords),()=>applyLocation(null),{timeout:12000,maximumAge:60000});
 }
 const needle=query.trim().toLocaleLowerCase();
 const stores=markets.filter(m=>!needle||(m.name+' '+(m.address||'')).toLocaleLowerCase().includes(needle));
 const products=details.flatMap(m=>(m.products||[]).filter(p=>p.is_active!==false).map(p=>({product:p,market:m}))).filter(({product,market})=>!needle||(product.name+' '+market.name).toLocaleLowerCase().includes(needle));
 async function openMarket(m:Market){const cached=details.find(d=>d.id===m.id);if(cached){onMarket(cached);return}try{onMarket(await api('/markets/'+m.id))}catch(e){setError((e as Error).message)}}
 return <div className="discover-page">
  <div className="discover-heading"><h1>VohaOne</h1><button className="discover-location" onClick={locate} disabled={locating} aria-label="Joylashuvni aniqlash"><MapPin size={19} fill="currentColor"/><span>{locating?'Joylashuv aniqlanmoqda…':locationLabel}</span></button></div>
  <label className="discover-search"><Search size={23}/><input aria-label="Mahsulot yoki xizmat qidiring" placeholder="Mahsulot yoki xizmat qidiring" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Qidiruvni tozalash" onClick={()=>setQuery('')}>×</button>}</label>
  <div className="discover-services"><button onClick={()=>document.getElementById('nearby-stores')?.scrollIntoView({behavior:'smooth'})}><span className="coming-soon">Coming soon</span><span className="discover-service-icon"><Store size={25}/></span><strong>Market</strong></button><button onClick={onEducation}><span className="discover-service-icon education"><GraduationCap size={27} fill="currentColor"/></span><strong>Ta’lim</strong></button></div>
  <section className="nearby-stores" id="nearby-stores"><h2>Sizga yaqin do'konlar</h2>
   {loading&&!markets.length?<p className="discover-status" role="status">Do‘konlar yuklanmoqda…</p>:null}
   {error?<div className="discover-status" role="alert"><p>{error}</p><button className="text-button" onClick={load}><RefreshCw size={15}/> Qayta urinish</button></div>:null}
   {!loading&&!error&&!stores.length?<p className="discover-status">{query?'Do‘kon topilmadi.':'Hozircha do‘konlar topilmadi.'}</p>:null}
   <div className="discover-stores">{stores.map(m=><button key={m.id} className="discover-store" onClick={()=>openMarket(m)}><span className="discover-store-image">{media(m.image_url)?<img src={media(m.image_url)} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>:null}<Store size={34}/></span><span>{m.name}</span></button>)}</div>
  </section>
  {productError&&<div className="discover-status" role="alert">{productError}<button className="text-button" onClick={load}>Qayta urinish</button></div>}
  <div className="discover-products" aria-label="Mahsulotlar">{products.map(({product:p,market:m})=><button className="discover-product" key={`${m.id}-${p.id}`} onClick={()=>onMarket(m)} aria-label={`${p.name}, ${m.name}`}><span className="discover-product-image">{media(p.image_urls?.[0]||p.image_url)?<img src={media(p.image_urls?.[0]||p.image_url)} alt={p.name} loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:null}<ShoppingBag size={48}/></span><strong>{Number(p.price).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g,' ')} so'm</strong><span className="discover-product-name">{p.name}</span><small>1 {p.unit}</small></button>)}</div>
  {loading&&markets.length>0&&<p className="discover-status" role="status">Mahsulotlar yuklanmoqda…</p>}
  {!loading&&!error&&!productError&&!products.length&&<p className="discover-status">{query?'Qidiruv bo‘yicha mahsulot topilmadi.':'Do‘konlarda hozircha mahsulot yo‘q.'}</p>}
 </div>
}
