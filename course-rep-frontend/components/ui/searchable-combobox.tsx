'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

export interface SearchableComboboxProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  containerStyle?: React.CSSProperties
  badgeText?: string
  subtext?: string
}

export function SearchableCombobox({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Search or type...',
  required = false,
  containerStyle,
  badgeText = 'New',
  subtext,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const query = (value || '').trim().toLowerCase()
  const filtered = options.filter((item) => item.toLowerCase().includes(query))
  const exactExists = options.some((item) => item.toLowerCase() === query)
  const showCustomOption = query.length > 0 && !exactExists

  return (
    <div className="institution-combobox" ref={containerRef} style={containerStyle}>
      <label htmlFor={id} style={{ display: 'block', margin: '0 0 6px', fontWeight: 600 }}>
        {label}
        {subtext && (
          <span style={{ fontWeight: 400, fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
            {subtext}
          </span>
        )}
      </label>

      <div className="institution-input-box">
        <input
          id={id}
          type="text"
          required={required}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
        />

        <div className="institution-input-actions">
          {value && value.length > 0 && (
            <button
              type="button"
              className="institution-action-btn"
              onClick={() => {
                onChange('')
                setIsOpen(true)
              }}
              title="Clear input"
              aria-label="Clear input"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}

          <button
            type="button"
            className="institution-action-btn"
            onClick={() => setIsOpen((prev) => !prev)}
            title={`Toggle ${label} options`}
            aria-label={`Toggle ${label} options`}
          >
            <ChevronDown
              style={{
                width: 15,
                height: 15,
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.18s ease',
              }}
            />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="institution-dropdown">
          {filtered.map((item) => {
            const isSelected = item.toLowerCase() === query
            return (
              <button
                key={item}
                type="button"
                className={`institution-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(item)
                  setIsOpen(false)
                }}
              >
                <span className="check-indicator">{isSelected ? '✓' : ''}</span>
                <span className="option-label">{item}</span>
              </button>
            )
          })}

          {showCustomOption && (
            <button
              type="button"
              className="institution-option new-option"
              onClick={() => {
                setIsOpen(false)
              }}
            >
              <span className="check-indicator">+</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#c7d2fe', fontWeight: 600 }}>
                  Use &ldquo;{value.trim()}&rdquo;
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Custom {label.toLowerCase()} · Will be enlisted to your records on continue
                </div>
              </div>
              <span className="new-badge">{badgeText}</span>
            </button>
          )}

          {filtered.length === 0 && !showCustomOption && (
            <div className="institution-empty-notice">
              No matching options found. Type your custom {label.toLowerCase()} above to enlist it.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
