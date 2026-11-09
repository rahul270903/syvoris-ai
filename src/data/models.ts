export type ActivityEntry = { id:string; action:string; actor:string; at:string; details?:string };
export type LineItem = { id:string; productId?:string; name:string; sku?:string; quantity:number; unitPrice:number; discount:number; taxRate:number; total:number };
export type CRMRecord = {
  id:string; ref:string; title:string; status:string; owner:string; date:string; amount:number;
  description:string; fields:Record<string,string>; links:Record<string,string[]>;
  history:ActivityEntry[]; lineItems?:LineItem[]; score?:number; probability?:number;
};
export type CRMData = Record<string,CRMRecord[]>;
export type DomainEvent = { id:string; type:string; recordRef:string; summary:string; at:string; actor:string; status:'Published'|'Queued'|'Failed' };
export type ToastMessage = { id:string; text:string; tone:'success'|'error'|'info' };
export const STORAGE_KEY='syvoris-ai:prototype:v1';
export const nowISO=()=>new Date().toISOString();
export const today=()=>new Date().toISOString().slice(0,10);
export const makeId=()=>`rec_${Math.random().toString(36).slice(2,8)}_${Date.now().toString(36)}`;
export const money=(value:number,currency='USD')=>new Intl.NumberFormat('en-US',{style:'currency',currency,maximumFractionDigits:0}).format(value||0);
export const shortDate=(value:string)=>value?new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric'}).format(new Date(`${value.slice(0,10)}T12:00:00`)):'—';
export const prefixFor:Record<string,string>={organizations:'ORG',contacts:'CON',leads:'LEAD',opportunities:'OPP',quotes:'QT',salesOrders:'SO',purchaseOrders:'PO',invoices:'INV',cases:'CASE',projects:'PRJ',tasks:'TSK',campaigns:'CMP',products:'SKU',services:'SVC',interactions:'ACT',agents:'AGT',decisions:'DEC',knowledge:'KB',documents:'DOC',segments:'SEG',vendors:'VEN',surveys:'SUR',milestones:'MS',resources:'RES',internalTickets:'IT',employees:'EMP',integrations:'INT',events:'EVT',audit:'AUD',imports:'IMP',priceBooks:'PB',sequences:'SEQ',playbooks:'PBK',roles:'ROLE',teams:'TEAM',slaPolicies:'SLA',settings:'CFG',workflows:'WF',appointments:'APT',webforms:'FORM',loyalty:'LOY',categories:'CAT',bundles:'BND',scenarios:'SCN',duplicates:'DUP',recycleBin:'DEL',leadSources:'SRC',users:'USR',taxes:'TAX',terms:'TRM',stockPolicies:'STK',trackers:'TRK',mailroom:'MLR',preferences:'PRF'};
export const makeActivity=(action:string,details?:string):ActivityEntry=>({id:makeId(),action,actor:'Demo User',at:nowISO(),details});
export const makeRecord=(entity:string,fields:Record<string,string>,options?:Partial<CRMRecord>):CRMRecord=>{
  const id=makeId(); const count=Number(localStorage.getItem(`syvoris-seq:${entity}`)||'0')+1; localStorage.setItem(`syvoris-seq:${entity}`,String(count));
  const prefix=prefixFor[entity]||'REC'; const name=fields.name||fields.account||fields.subject||fields.title||fields.company||entity;
  const amount=Number(fields.amount||fields.value||fields.budget||fields.creditLimit||0)||0;
  return {id,ref:`${prefix}-${String(new Date().getFullYear())}-${String(count).padStart(5,'0')}`,title:name,status:options?.status||'Draft',owner:fields.owner||'Demo User',date:fields.date||today(),amount,description:fields.description||fields.notes||fields.scope||`${name} record`,fields:{...fields},links:options?.links||{},history:[makeActivity('Record created')],...options};
};
