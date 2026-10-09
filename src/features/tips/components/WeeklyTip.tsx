import { Lightbulb } from 'lucide-react'
import { useWeeklyTip } from '../hooks/use-tips'

export function WeeklyTip(){const{data,isLoading,error}=useWeeklyTip();if(isLoading)return <div className="weekly-tip"><Lightbulb size={17}/><span>今週のチップスを読み込んでいます…</span></div>;if(error||!data)return null;return <aside className="weekly-tip"><Lightbulb size={18}/><div><strong>今週のMEOチップス</strong><span>{data.title}</span><p>{data.body}</p></div></aside>}
