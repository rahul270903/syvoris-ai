import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedData } from '../data/seed';
import { STORAGE_KEY, makeActivity, makeId, prefixFor, type CRMData, type CRMRecord, type DomainEvent } from '../data/models';

type Store = {
  data:CRMData; events:DomainEvent[];
  records:(entity:string)=>CRMRecord[];
  create:(entity:string,fields:Record<string,string>,options?:Partial<CRMRecord>)=>CRMRecord;
  update:(entity:string,id:string,patch:Partial<CRMRecord>,action?:string)=>CRMRecord|undefined;
  remove:(entity:string,id:string)=>void;
  addEvent:(type:string,record:CRMRecord|{ref:string},summary:string,status?:DomainEvent['status'])=>void;
  findByRef:(ref:string)=>{entity:string;record:CRMRecord}|undefined;
  addAudit:(name:string,actor?:string,details?:string)=>void;
  reset:()=>void;
};
const StoreContext=createContext<Store|null>(null);
const seededEvents:DomainEvent[]=(seedData.events||[]).map(record=>({id:record.id,type:record.title,recordRef:record.fields.entityRef||record.ref,summary:record.description,at:record.fields.at||record.date,actor:record.owner,status:record.fields.delivery==='Failed'?'Failed':'Published'}));
const load=():{data:CRMData;events:DomainEvent[]}=>{
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const parsed=JSON.parse(raw);return {data:parsed.data||seedData,events:parsed.events||seededEvents};}}catch{/* fallback to the clean demo baseline */}
  return {data:seedData,events:seededEvents};
};
export function CRMProvider({children}:{children:ReactNode}){
  const initial=useMemo(load,[]);const [data,setData]=useState<CRMData>(initial.data);const [events,setEvents]=useState<DomainEvent[]>(initial.events);
  useEffect(()=>{localStorage.setItem(STORAGE_KEY,JSON.stringify({data,events}));},[data,events]);
  const records=(entity:string)=>data[entity]||[];
  const addEvent=(type:string,record:CRMRecord|{ref:string},summary:string,status:DomainEvent['status']='Published')=>{
    const event:DomainEvent={id:makeId(),type,recordRef:record.ref,summary,at:new Date().toISOString(),actor:'Demo User',status};
    setEvents(old=>[event,...old].slice(0,500));
  };
  const addAudit=(name:string,actor='Demo User',details='')=>{
    const id=makeId();const audit:CRMRecord={id,ref:`${prefixFor.audit}-${Date.now().toString().slice(-6)}`,title:name,status:'Recorded',owner:actor,date:new Date().toISOString().slice(0,10),amount:0,description:details||name,fields:{name,actor,details,timestamp:new Date().toISOString()},links:{},history:[makeActivity('Audit record generated',details)]};
    setData(old=>({...old,audit:[audit,...(old.audit||[])]}));
  };
  const create=(entity:string,fields:Record<string,string>,options:Partial<CRMRecord>={})=>{
    const sequenceKey=`syvoris-seq:${entity}`;const count=Math.max((data[entity]||[]).length,Number(localStorage.getItem(sequenceKey)||'0'))+1;localStorage.setItem(sequenceKey,String(count));const prefix=prefixFor[entity]||'REC';const name=fields.name||fields.account||fields.subject||fields.title||entity;
    const id=makeId();const record:CRMRecord={id,ref:`${prefix}-${new Date().getFullYear()}-${String(count).padStart(5,'0')}`,title:name,status:options.status||'Draft',owner:fields.owner||'Demo User',date:fields.date||new Date().toISOString().slice(0,10),amount:Number(fields.amount||fields.value||fields.budget||0)||0,description:fields.description||fields.notes||fields.scope||`${name} record`,fields:{...fields},links:options.links||{},history:[makeActivity('Record created')],...options};
    setData(old=>({...old,[entity]:[record,...(old[entity]||[])]}));addEvent(`${entity}.created`,record,`${record.ref} created`);addAudit(`${entity} created`,record.owner,record.ref);return record;
  };
  const update=(entity:string,id:string,patch:Partial<CRMRecord>,action='Record updated')=>{
    const current=(data[entity]||[]).find(x=>x.id===id);if(!current)return undefined;
    const updated:CRMRecord={...current,...patch,fields:patch.fields?{...current.fields,...patch.fields}:current.fields,links:patch.links?{...current.links,...patch.links}:current.links,history:[...current.history,makeActivity(action,patch.description)]};
    setData(old=>({...old,[entity]:(old[entity]||[]).map(x=>x.id===id?updated:x)}));addEvent(`${entity}.updated`,updated,action);addAudit(action,'Demo User',updated.ref);return updated;
  };
  const remove=(entity:string,id:string)=>{const record=(data[entity]||[]).find(x=>x.id===id);if(!record)return;setData(old=>({...old,[entity]:(old[entity]||[]).filter(x=>x.id!==id),recycleBin:[{...record,status:'Deleted',history:[...record.history,makeActivity('Moved to recycle bin')]},...(old.recycleBin||[])]}));addAudit(`${entity} moved to recycle bin`,'Demo User',record.ref);};
  const findByRef=(ref:string)=>{for(const [entity,items] of Object.entries(data)){const record=items.find(x=>x.ref===ref||x.id===ref);if(record)return {entity,record};}return undefined;};
  const reset=()=>{setData(seedData);setEvents([]);localStorage.removeItem(STORAGE_KEY);};
  const value:Store={data,events,records,create,update,remove,addEvent,findByRef,addAudit,reset};
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useCRM(){const ctx=useContext(StoreContext);if(!ctx)throw new Error('useCRM must be used inside CRMProvider');return ctx;}
