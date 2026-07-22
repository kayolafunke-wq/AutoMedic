import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Reusable pagination bar.
 *
 * Props:
 *  page        — current page (1-indexed)
 *  totalPages  — total number of pages
 *  total       — total item count (for label)
 *  pageSize    — items per page (for label)
 *  onPage      — (pageNumber) => void
 *  label       — optional noun e.g. "record" (defaults to "item")
 */
export default function Pagination({ page, totalPages, total, pageSize, onPage, label = 'item' }) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  // Build page number array with ellipsis
  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 px-1 gap-3">
      {/* Label */}
      <p className="text-xs text-gray-400 order-2 sm:order-1 text-center sm:text-left">
        Showing{' '}
        <strong className="text-gray-600">{from}–{to}</strong>{' '}
        of <strong className="text-gray-600">{total}</strong>{' '}
        {label}{total !== 1 ? 's' : ''}
      </p>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1 order-1 sm:order-2">
        {/* Prev */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers - show fewer on mobile */}
        {pages.filter((p, i, arr) => {
          // On mobile, show only current page and adjacent pages
          if (typeof window !== 'undefined' && window.innerWidth < 640) {
            return p === '...' || p === 1 || p === totalPages || Math.abs(p - page) <= 1
          }
          return true
        }).map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
            : <button key={p} onClick={() => onPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border
                  ${page === p
                    ? 'bg-[#B8860B] border-[#B8860B] text-white shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
                {p}
              </button>
        )}

        {/* Next */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
