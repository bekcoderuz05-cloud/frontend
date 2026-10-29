import {useRef,useState} from 'react';
import {Check,CheckCheck,LoaderCircle} from 'lucide-react';
import {api} from './api';
export type MarketOrder={id:number;status:string;payment_method:string;total_amount:string;customer?:{first_name?:string;last_name?:string;phone?:string};items:{id:number;product_name:string;quantity:number}[]};
export function orderPrice(value:string){const integer=String(value).split('.')[0].replace(/\D/g,'')||'0';return integer.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+' so‘m'}
export default function OrderCard({order,mine,createdAt,read,onUpdate}:{order:MarketOrder;mine:boolean;createdAt:string;read?:boolean;onUpdate:(order:MarketOrder)=>void}){
 const [loading,setLoading]=useState(false),[error,setError]=useState('');const pending=useRef(false);
 async function update(status:'confirmed'|'cancelled'){
  if(pending.current)return;pending.current=true;setLoading(true);setError('');
  try{onUpdate(await api<MarketOrder>('/markets/me/orders/'+order.id,'PATCH',{status}))}catch(e){setError(e instanceof Error?e.message:'Buyurtma holati yangilanmadi')}finally{pending.current=false;setLoading(false)}
 }
 const title=order.status==='confirmed'?'Buyurtma tasdiqlandi':order.status==='cancelled'?'Buyurtma bekor qilindi':'Yangi buyurtma';
 const customer=order.customer;const name=[customer?.first_name,customer?.last_name].filter(Boolean).join(' ').trim()||(!customer?.phone?.startsWith('tg:')&&customer?.phone)||'Mijoz';
 return <article aria-label={'Buyurtma №'+order.id} className={'order-card '+(mine?'mine ':'')+order.status} aria-busy={loading}>
  <h3>🛒 {title}</h3><hr/>
  <div className="order-lines">{order.items.map((item,index)=><div className="order-line" key={item.id??index}><span aria-hidden="true">📦</span><span>{item.quantity} x {item.product_name}</span></div>)}
  <div className="order-line"><span aria-hidden="true">💳</span><span>To‘lov turi: {order.payment_method==='debt'?'Qarzga':'Naqd'}</span></div>
  <div className="order-line"><span aria-hidden="true">💰</span><span>Umumiy narx: {orderPrice(order.total_amount)}</span></div>
  <div className="order-line"><span aria-hidden="true">👤</span><span>{name}</span></div></div>
  {!mine&&order.status==='pending'&&<div className="order-actions"><button className="order-cancel" disabled={loading} onClick={()=>void update('cancelled')}>Bekor qilish</button><button className="order-confirm" disabled={loading} onClick={()=>void update('confirmed')}>{loading?<LoaderCircle size={18} className="spin" aria-label="Yangilanmoqda"/>:'Tasdiqlash'}</button></div>}
  {error&&<p className="order-error" role="alert">{error}</p>}
  <div className="order-time">{createdAt&&<time dateTime={createdAt}>{new Date(createdAt).toLocaleTimeString('uz',{hour:'2-digit',minute:'2-digit'})}</time>}{mine&&(read?<CheckCheck size={15}/>:<Check size={15}/>)}</div>
 </article>
}
