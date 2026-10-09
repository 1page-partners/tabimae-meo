import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export function Dialog(props:ComponentPropsWithoutRef<typeof DialogPrimitive.Root>){return <DialogPrimitive.Root {...props}/>}
export function DialogTrigger(props:ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>){return <DialogPrimitive.Trigger {...props}/>}
export function DialogClose(props:ComponentPropsWithoutRef<typeof DialogPrimitive.Close>){return <DialogPrimitive.Close {...props}/>}

export function DialogContent({children,...props}:ComponentPropsWithoutRef<typeof DialogPrimitive.Content>&{children:ReactNode}){return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay"/><DialogPrimitive.Content className="dialog-content" {...props}>{children}<DialogPrimitive.Close className="dialog-close" aria-label="閉じる"><X size={17}/></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>}
export function DialogHeader({children}:{children:ReactNode}){return <div className="dialog-header">{children}</div>}
export function DialogTitle(props:ComponentPropsWithoutRef<typeof DialogPrimitive.Title>){return <DialogPrimitive.Title className="dialog-title" {...props}/>}
export function DialogDescription(props:ComponentPropsWithoutRef<typeof DialogPrimitive.Description>){return <DialogPrimitive.Description className="dialog-description" {...props}/>}
export function DialogFooter({children}:{children:ReactNode}){return <div className="dialog-footer">{children}</div>}
