import { SearchX } from 'lucide-react';
export function EmptyState({title='No records found',description='Try adjusting your search or create a new record.'}:{title?:string;description?:string}){return <div className="empty-state"><span><SearchX size={22}/></span><strong>{title}</strong><p>{description}</p></div>}
