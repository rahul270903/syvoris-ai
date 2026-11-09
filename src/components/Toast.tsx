import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { ToastMessage } from '../data/models';
export function Toast({items,onDismiss}:{items:ToastMessage[];onDismiss:(id:string)=>void}){return <div className="toast-stack">{items.map(t=><div className={`toast ${t.tone}`} key={t.id}>{t.tone==='success'?<CheckCircle2 size={17}/>:t.tone==='error'?<XCircle size={17}/>:<Info size={17}/>}<span>{t.text}</span><button onClick={()=>onDismiss(t.id)} aria-label="Dismiss"><X size={14}/></button></div>)}</div>}
