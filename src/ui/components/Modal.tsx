import { useEffect, useRef, type ReactNode } from 'react'

/** Accessible modal: labelled dialog, Escape closes, focus moves in and back. */
export function Modal({ title, onClose, children, wide, z = 'z-50' }: { title: string; onClose?: () => void; children: ReactNode; wide?: boolean; z?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className={`fixed inset-0 ${z} flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm`} onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-xl border-2 border-gold/50 bg-night p-4 shadow-2xl outline-none sm:p-6 ${wide ? 'max-w-5xl' : 'max-w-lg'}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-gold text-shadow">{title}</h2>
          {onClose && (
            <button type="button" onClick={onClose} className="btn px-2 py-0.5 text-base" aria-label="Close">
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
