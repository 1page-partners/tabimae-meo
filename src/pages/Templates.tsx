import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { type ReplyTemplate, useTemplateMutations, useTemplates } from '../features/templates/use-templates'

const styleLabels={formal:'丁寧',warm:'温かみ',concise:'簡潔'} as const
export default function Templates(){
  const{data:items=[],isLoading,error}=useTemplates(),mutations=useTemplateMutations()
  const[open,setOpen]=useState(false),[editingId,setEditingId]=useState<string|null>(null),[title,setTitle]=useState(''),[body,setBody]=useState(''),[style,setStyle]=useState<ReplyTemplate['style']>('formal'),[copiedId,setCopiedId]=useState<string|null>(null)
  const busy=mutations.create.isPending||mutations.update.isPending||mutations.remove.isPending
  const reset=()=>{setOpen(false);setEditingId(null);setTitle('');setBody('');setStyle('formal')}
  const edit=(item:ReplyTemplate)=>{setEditingId(item.id);setTitle(item.title);setBody(item.content);setStyle(item.style);setOpen(true)}
  const save=async()=>{if(!title.trim()||!body.trim())return;const values={title:title.trim(),content:body.trim(),style};if(editingId)await mutations.update.mutateAsync({id:editingId,...values});else await mutations.create.mutateAsync(values);reset()}
  const copy=async(item:ReplyTemplate)=>{await navigator.clipboard.writeText(item.content);setCopiedId(item.id);mutations.recordUse.mutate({id:item.id,useCount:item.use_count})}
  const remove=(item:ReplyTemplate)=>{if(window.confirm(`テンプレート「${item.title}」を削除しますか？`))mutations.remove.mutate(item.id)}
  const mutationError=mutations.create.error||mutations.update.error||mutations.recordUse.error||mutations.remove.error
  return <section className="page-stack"><header className="section-heading"><div><h1>返信テンプレート</h1><p>よく使う返信文を保存し、口コミ対応をスムーズにします。</p></div><button className="primary-button" onClick={()=>{if(open)reset();else setOpen(true)}}><Plus size={16}/>{open?'閉じる':'新しいテンプレート'}</button></header>
    {error&&<p className="data-error">テンプレートを取得できませんでした。</p>}
    {open&&<div className="editor-card"><h2>{editingId?'テンプレートを編集':'新しいテンプレート'}</h2><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="テンプレート名"/><select value={style} onChange={e=>setStyle(e.target.value as typeof style)}><option value="formal">丁寧</option><option value="warm">温かみ</option><option value="concise">簡潔</option></select><textarea rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="返信文"/>{mutationError&&<p className="data-error">{mutationError.message}</p>}<button disabled={busy||!title.trim()||!body.trim()} className="primary-button" onClick={()=>void save()}>{busy?'保存中…':'保存する'}</button></div>}
    <div className="template-grid">{isLoading?<p>読み込み中…</p>:items.map(item=><article key={item.id}><header><div><h2>{item.title}</h2><span className="pill">{styleLabels[item.style]}</span></div><div><button aria-label={`${item.title}を編集`} disabled={busy} onClick={()=>edit(item)}><Pencil size={16}/></button><button aria-label={`${item.title}を削除`} disabled={busy} onClick={()=>remove(item)}><Trash2 size={16}/></button></div></header><p>{item.content}</p><footer><small>これまで {item.use_count}回使用</small><button disabled={mutations.recordUse.isPending} onClick={()=>void copy(item)}><Copy size={14}/>{copiedId===item.id?'コピーしました':'コピー'}</button></footer></article>)}{!isLoading&&!items.length&&<div className="empty-card"><h2>テンプレートはまだありません</h2><p>よく使う返信を登録してください。</p></div>}</div>
  </section>
}
