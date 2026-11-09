import type { ReactNode } from 'react';
export function SectionHeading({eyebrow,title,subtitle,action}:{eyebrow?:string;title:string;subtitle?:string;action?:ReactNode}){return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{action&&<div className="section-actions">{action}</div>}</div>}
