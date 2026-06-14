'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { UploadCloud, X, Loader2 } from 'lucide-react'

type SingleProps = {
  multiple?: false
  value: string | null
  onChange: (value: string | null) => void
  label?: string
}
type MultiProps = {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
  label?: string
}
type Props = SingleProps | MultiProps

const ACCEPT = 'image/jpeg,image/png,image/webp'

export function ImageUpload(props: Props) {
  const { multiple, label } = props
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const items: string[] = multiple ? props.value : props.value ? [props.value] : []

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return
    setBusy(true)
    try {
      const form = new FormData()
      for (const f of list) form.append('file', f)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error || 'Upload failed')

      const paths: string[] = json.data.paths
      if (multiple) {
        ;(props as MultiProps).onChange([...(props as MultiProps).value, ...paths])
      } else {
        ;(props as SingleProps).onChange(paths[0] ?? null)
      }
      toast.success(`Uploaded ${paths.length} image${paths.length > 1 ? 's' : ''}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function removeAt(idx: number) {
    if (multiple) {
      const next = [...(props as MultiProps).value]
      next.splice(idx, 1)
      ;(props as MultiProps).onChange(next)
    } else {
      ;(props as SingleProps).onChange(null)
    }
  }

  return (
    <div>
      {label && (
        <span className="mb-1.5 block font-mono text-xs uppercase tracking-wide text-deep">
          {label}
        </span>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          uploadFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging ? 'border-leaf bg-sage/40' : 'border-border bg-card hover:border-leaf/60'
        }`}
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-leaf" />
        ) : (
          <UploadCloud className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-deep">Click to upload</span> or drag and drop
        </p>
        <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          JPG, PNG, WEBP · max 5MB{multiple ? ' · multiple allowed' : ''}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {items.map((src, i) => (
            <div key={src + i} className="group relative size-24 overflow-hidden rounded-xl border border-border bg-sage/40">
              <Image src={src} alt="" fill sizes="96px" className="object-contain p-1.5" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeAt(i)
                }}
                aria-label="Remove image"
                className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-deep/80 text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
