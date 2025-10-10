import { useEffect, useMemo, useRef, useState } from 'react'

export default function CountrySelect({ countries, value, onChange, placeholder = 'Select a country...', required = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(c => c.name.toLowerCase().includes(q))
  }, [countries, query])

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!open) return
    setHighlighted(0)
  }, [open, query])

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-idx='${highlighted}']`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  function selectCountry(country) {
    onChange && onChange(country.name)
    setQuery('')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const country = items[highlighted]
      if (country) selectCountry(country)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const selected = value && countries.find(c => c.name === value)

  return (
    <div ref={containerRef} className="relative">
      <label className="block space-y-1.5">
        <span className="text-sm text-graphite">
          Country {required && <span className="text-red-500">*</span>}
        </span>
        <div className="relative">
          <input
            type="text"
            className="w-full px-4 py-3 text-base border border-gray-200 bg-white text-graphite placeholder-gray-400 focus:border-violet focus:ring-2 focus:ring-violet/20 hover:border-gray-300 transition-all duration-300 focus:outline-none rounded-xl pr-10 cursor-text min-h-[44px] sm:min-h-auto"
            placeholder={placeholder}
            value={open ? query : (selected ? selected.name : '')}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            required={required}
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200" onClick={() => setOpen(o => !o)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </label>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-auto" ref={listRef} role="listbox">
          {items.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
          )}
          {items.map((c, idx) => (
            <div
              key={c.code}
              data-idx={idx}
              className={`px-4 py-4 sm:py-3 text-sm flex items-center justify-between cursor-pointer transition-colors duration-200 min-h-[44px] sm:min-h-auto ${idx === highlighted ? 'bg-violet/10 text-violet' : 'hover:bg-gray-50'}`}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectCountry(c)}
              role="option"
              aria-selected={value === c.name}
            >
              <span className="text-graphite font-medium">{c.name}</span>
              <span className="text-gray-500 text-xs">{c.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


