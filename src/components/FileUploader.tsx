import { useRef, useState } from 'react'
import { revisarFoto } from '../lib/fotoDelDocumento'

interface FileUploaderProps {
  title: string
  hint?: string
  /** light-blue (soft) or white (default) surface */
  tone?: 'default' | 'soft'
  /** smaller padding + lighter divider, used on the admin screen */
  compact?: boolean
  accept?: string
  onFileSelected?: (file: File) => void
  /**
   * Un segundo botón que abre directo la cámara trasera del celular
   * (05/11/2026). Va aparte y no en el selector de siempre porque `capture`
   * en el mismo campo quita la galería en Android, y quien ya tiene la foto
   * tiene que poder elegirla.
   */
  conCamara?: boolean
  /** Lo que hay que decirle de la foto elegida (oscura, movida, repetida…). */
  aviso?: string | null
  /** Algo que está pasando con la foto, como «Leyendo el código…». */
  estado?: string | null
  /**
   * Mirar si la foto elegida se ve oscura o movida y decirlo (05/11/2026).
   * Para las fotos de un documento; no para un PDF.
   */
  revisar?: boolean
}

/**
 * Functional drag-and-drop / click file uploader that visually matches the
 * dashed "Haz clic o arrastra y suelta para subir" boxes in the designs.
 *
 * Se reinicia con una `key` nueva desde quien lo monta: así se borra la
 * foto que enseña cuando la elegida deja de valer (cambiar el tipo de
 * documento, por ejemplo).
 */
export default function FileUploader({
  title,
  hint = 'Haz clic o arrastra y suelta para subir',
  tone = 'soft',
  compact = false,
  accept = 'image/*',
  onFileSelected,
  conCamara = false,
  aviso = null,
  estado = null,
  revisar = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const camaraRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [avisoPropio, setAvisoPropio] = useState<string | null>(null)

  function handleFile(f: File | undefined) {
    if (!f) return
    setFile(f)
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
    onFileSelected?.(f)
    setAvisoPropio(null)
    if (revisar) {
      revisarFoto(f)
        .then((r) => setAvisoPropio(r.aviso))
        // Sin poder mirarla no se dice nada: el aviso es una ayuda, no un filtro.
        .catch(() => {})
    }
  }

  const surface = tone === 'soft' ? 'bg-surface-soft' : 'bg-white'

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-dashed px-6 text-center transition ${
          compact ? 'border py-7' : 'border-2 py-10'
        } ${surface} ${
          dragging ? 'border-brand bg-brand-50' : 'border-muted/40 hover:border-brand/60'
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt={file?.name}
            className="mb-3 max-h-40 w-auto rounded-lg object-contain"
          />
        ) : null}
        <span className={`font-bold text-ink ${compact ? 'text-sm' : 'text-base'}`}>{title}</span>
        <span className={`mt-1 text-ink/70 ${compact ? 'text-xs' : 'text-sm'}`}>
          {file ? file.name : hint}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </button>
      {conCamara ? (
        <>
          <button
            type="button"
            onClick={() => camaraRef.current?.click()}
            className="w-full rounded-xl border border-brand/40 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5"
          >
            📷 Tomar la foto con la cámara
          </button>
          <input
            ref={camaraRef}
            type="file"
            accept={accept}
            capture="environment"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </>
      ) : null}
      {estado ? <p className="text-sm text-ink/70">{estado}</p> : null}
      {aviso || avisoPropio ? (
        <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm leading-relaxed text-ink">
          {aviso ?? avisoPropio}
        </p>
      ) : null}
    </div>
  )
}
