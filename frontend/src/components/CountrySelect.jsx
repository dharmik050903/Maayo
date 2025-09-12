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
            className="input pr-10 cursor-text"
            placeholder={placeholder}
            value={open ? query : (selected ? selected.name : '')}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            required={required}
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-coolgray" onClick={() => setOpen(o => !o)}>
            ▼
          </button>
        </div>
      </label>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E3E8EF] rounded-lg shadow-soft max-h-64 overflow-auto" ref={listRef} role="listbox">
          {items.length === 0 && (
            <div className="px-3 py-2 text-sm text-coolgray">No matches</div>
          )}
          {items.map((c, idx) => (
            <div
              key={c.code}
              data-idx={idx}
              className={`px-3 py-2 text-sm flex items-center justify-between cursor-pointer ${idx === highlighted ? 'bg-base' : ''}`}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => selectCountry(c)}
              role="option"
              aria-selected={value === c.name}
            >
              <span className="text-graphite">{c.name}</span>
              <span className="text-coolgray">{c.code}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


