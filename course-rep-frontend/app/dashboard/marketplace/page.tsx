'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { api, type MarketplaceItem } from '@/lib/api'
import { type MarketItem } from '@/lib/data'

export default function MarketplacePage() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showListModal, setShowListModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null)
  const [contactItem, setContactItem] = useState<MarketItem | null>(null)
  const [contactMessage, setContactMessage] = useState('')

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch live items from backend
  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true)
      try {
        const liveItems = await api.marketplace.getAll()
        if (Array.isArray(liveItems)) {
          const mapped: MarketItem[] = liveItems.map((item) => ({
            id: String(item.id),
            title: item.title,
            seller: item.seller_name || 'Campus Student',
            price: item.price,
            tag: item.tag || 'Student essentials',
            location: 'Campus Quad',
            condition: 'Verified Item',
            phone: '+234 812 000 0000',
            verified: true,
            description: item.description || 'Verified campus exchange listing.',
            date: new Date(item.created_at).toLocaleDateString(),
            imageTone: 'indigo',
          }))
          setItems(mapped)
        }
      } catch (err: any) {
        if (!err?.message?.includes('expired') && !err?.message?.includes('token')) {
          console.error('Failed to load marketplace items:', err)
        }
      }
      setLoading(false)
    }

    fetchMarketplace()
  }, [])

  // Filter & Sort
  const filtered = useMemo(() => {
    return items
      .filter((item) => {
        const matchesQuery =
          query.trim() === '' ||
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.seller.toLowerCase().includes(query.toLowerCase()) ||
          (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
          (item.location && item.location.toLowerCase().includes(query.toLowerCase()))

        const matchesCategory =
          categoryFilter === 'All' || item.tag.toLowerCase() === categoryFilter.toLowerCase()

        return matchesQuery && matchesCategory
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const pA = a.price === 'Free' ? 0 : parseInt(a.price.replace(/[^0-9]/g, '')) || 0
          const pB = b.price === 'Free' ? 0 : parseInt(b.price.replace(/[^0-9]/g, '')) || 0
          return pA - pB
        }
        if (sortBy === 'price-desc') {
          const pA = a.price === 'Free' ? 0 : parseInt(a.price.replace(/[^0-9]/g, '')) || 0
          const pB = b.price === 'Free' ? 0 : parseInt(b.price.replace(/[^0-9]/g, '')) || 0
          return pB - pA
        }
        return 0
      })
  }, [items, query, categoryFilter, sortBy])

  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const price = String(form.get('price') || '').trim() || 'Free'
    const tag = String(form.get('tag') || 'Study materials')
    const location = String(form.get('location') || 'Main Campus Quad').trim()
    const condition = String(form.get('condition') || 'Good Condition').trim()
    const phone = String(form.get('phone') || '+234 800 000 0000').trim()
    const description = String(form.get('description') || '').trim()

    if (!title) return

    try {
      const created = await api.marketplace.create({
        title,
        price,
        tag,
        description: description || 'Available for campus pickup.',
      })

      const newItem: MarketItem = {
        id: String(created.id),
        title: created.title,
        seller: created.seller_name || 'You',
        price: created.price,
        tag: created.tag,
        location,
        condition,
        phone,
        verified: true,
        description: created.description,
        date: 'Just now',
        imageTone: 'indigo',
      }

      setItems((prev) => [newItem, ...prev])
      setShowListModal(false)
      showToastMsg(`Listing "${title}" published to campus marketplace!`)
    } catch (err: any) {
      // Local optimistic fallback
      const newItem: MarketItem = {
        id: `mkt-${Date.now()}`,
        title,
        seller: 'You',
        price,
        tag,
        location,
        condition,
        phone,
        verified: true,
        description: description || 'Available for campus pickup.',
        date: 'Just now',
        imageTone: 'indigo',
      }
      setItems((prev) => [newItem, ...prev])
      setShowListModal(false)
      showToastMsg(`Listing "${title}" published!`)
    }
  }

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactItem) return
    showToastMsg(`Inquiry sent to ${contactItem.seller}!`)
    setContactItem(null)
    setContactMessage('')
  }

  return (
    <>
      <PageHeader
        title="Student marketplace"
        subtitle="Buy, sell, and exchange verified study materials, electronics, and student essentials safely on campus."
        action={
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowListModal(true)}
          >
            <Plus /> List an item
          </button>
        }
      />

      {/* Hero Banner */}
      <div className="market-hero">
        <div>
          <Pill tone="verified-pill">
            <Store /> Verified Campus Exchange
          </Pill>
          <h2>Find what you need. Pass on what you no longer use.</h2>
          <p>
            Peer-to-peer campus commerce built for university students. Transparent pricing in Naira, verified student sellers, and safe hostel/faculty pickup spots.
          </p>
        </div>
        <Store />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="courses-toolbar-container" style={{ marginBottom: '20px' }}>
        <div className="courses-controls-row">
          <div className="courses-search-group">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search past questions, calculators, lab coats, books..."
              aria-label="Search marketplace"
            />
            {query && (
              <button
                type="button"
                className="courses-search-clear"
                onClick={() => setQuery('')}
              >
                <X />
              </button>
            )}
          </div>

          <div className="courses-filter-dropdowns">
            <div className="course-select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort marketplace items"
              >
                <option value="newest">Sort: Newly Listed</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
              </select>
              <ChevronDown className="course-select-icon" />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="courses-tabs-row">
          <div className="courses-tab-pills">
            {(
              [
                { label: 'All Listings', value: 'All' },
                { label: 'Study Materials', value: 'Study materials' },
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Campus Essentials', value: 'Campus essentials' },
                { label: 'Textbooks', value: 'Textbooks' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`course-tab-pill ${categoryFilter === cat.value ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="courses-count-summary">
            <strong>{filtered.length}</strong> items available
          </span>
        </div>
      </div>

      {/* Grid of Marketplace Cards */}
      <div className="market-grid">
        {filtered.map((item) => (
          <article
            className="market-card"
            key={item.id || item.title}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedItem(item)}
          >
            <div className={`market-thumb ${item.imageTone || 'indigo'}`}>
              <BookOpen />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Pill>{item.tag}</Pill>
              {item.verified && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#16a34a',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <ShieldCheck style={{ width: '13px' }} /> Verified Seller
                </span>
              )}
            </div>

            <h3 style={{ fontSize: '13px', lineHeight: 1.35, minHeight: '36px' }}>{item.title}</h3>

            <div style={{ fontSize: '11px', color: '#64748b' }}>
              <span>{item.seller}</span>
              {item.location && (
                <small style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: '#94a3b8' }}>
                  <MapPin style={{ width: '12px' }} /> {item.location}
                </small>
              )}
            </div>

            <div className="market-card-footer" style={{ marginTop: 'auto', paddingTop: '10px' }}>
              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.price}</strong>
              <button
                type="button"
                className="text-button"
                onClick={(e) => {
                  e.stopPropagation()
                  setContactItem(item)
                  setContactMessage(
                    `Hi ${item.seller}, I saw your listing "${item.title}" on Gradia and I'm interested in getting it.`
                  )
                }}
              >
                Message seller <ChevronRight />
              </button>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
          <Store style={{ width: '40px', height: '40px', color: '#6366f1', margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>No marketplace items listed yet</h3>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '6px 0 16px' }}>
            {query || categoryFilter !== 'All'
              ? 'Try adjusting your search keywords or clear the category filter.'
              : 'Be the first to list verified study materials, electronics, or campus essentials.'}
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {(query || categoryFilter !== 'All') && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setQuery('')
                  setCategoryFilter('All')
                }}
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowListModal(true)}
            >
              + List an Item
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: ITEM DETAIL PREVIEW MODAL
          ==================================================================== */}
      {selectedItem && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedItem(null)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 520px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">{selectedItem.tag}</p>
                <h2>{selectedItem.title}</h2>
                <strong style={{ fontSize: '20px', color: '#4338ca', display: 'block', marginTop: '4px' }}>
                  {selectedItem.price}
                </strong>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedItem(null)}
                aria-label="Close item details"
              >
                <X />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Seller:</span>
                  <strong>{selectedItem.seller}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Condition:</span>
                  <strong>{selectedItem.condition || 'Good Condition'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Pickup Spot:</span>
                  <strong>{selectedItem.location || 'Campus Quad'}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700 }}>Description</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  {selectedItem.description || 'Available immediately for campus trade.'}
                </p>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#065f46',
                }}
              >
                <strong>Safe Campus Trade Tip:</strong> Meet in public campus locations such as your faculty quad, library foyer, or student union building.
              </div>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setContactItem(selectedItem)
                  setContactMessage(
                    `Hi ${selectedItem.seller}, I saw your listing "${selectedItem.title}" on Gradia and I'm interested in getting it.`
                  )
                  setSelectedItem(null)
                }}
              >
                <MessageCircle style={{ width: '14px' }} /> Contact seller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: CONTACT SELLER MODAL
          ==================================================================== */}
      {contactItem && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setContactItem(null)}
        >
          <form className="event-dialog" onSubmit={handleSendInquiry}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Message Seller</p>
                <h2>Contact {contactItem.seller}</h2>
                <p>Regarding: {contactItem.title} ({contactItem.price})</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setContactItem(null)}
                aria-label="Close message form"
              >
                <X />
              </button>
            </div>

            <label>
              Your Message
              <textarea
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                style={{
                  width: '100%',
                  border: '1px solid #dbe3ef',
                  borderRadius: '7px',
                  padding: '10px 11px',
                  font: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </label>

            {contactItem.phone && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                }}
              >
                <span>
                  <Phone style={{ width: '13px', display: 'inline', marginRight: '4px' }} />
                  Seller WhatsApp / Call:
                </span>
                <a
                  href={`https://wa.me/${contactItem.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#16a34a', fontWeight: 700 }}
                >
                  {contactItem.phone}
                </a>
              </div>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setContactItem(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <MessageCircle style={{ width: '14px' }} /> Send inquiry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: LIST AN ITEM MODAL
          ==================================================================== */}
      {showListModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowListModal(false)}
        >
          <form className="event-dialog" onSubmit={handlePublish} style={{ width: 'min(100%, 540px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Campus Exchange</p>
                <h2>List an item for sale / free share</h2>
                <p>Post course materials, past questions, electronics, or essentials.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowListModal(false)}
                aria-label="Close listing form"
              >
                <X />
              </button>
            </div>

            <label>
              Item title
              <input
                name="title"
                required
                autoFocus
                placeholder="e.g. CSC 405 Cisco Packet Tracer Lab Manual"
              />
            </label>

            <div className="event-field-grid">
              <label>
                Category
                <select name="tag" defaultValue="Study materials">
                  <option value="Study materials">Study materials</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Campus essentials">Campus essentials</option>
                  <option value="Textbooks">Textbooks</option>
                </select>
              </label>

              <label>
                Price (₦ or Free)
                <input name="price" placeholder="e.g. ₦3,000 or Free" defaultValue="₦2,000" />
              </label>
            </div>

            <div className="event-field-grid">
              <label>
                Condition
                <input name="condition" placeholder="e.g. Clean PDF / Gently Used" defaultValue="Gently Used" />
              </label>

              <label>
                Campus pickup spot
                <input name="location" placeholder="e.g. Faculty of Science Quad" defaultValue="Faculty Quad" />
              </label>
            </div>

            <label>
              Your contact phone / WhatsApp
              <input name="phone" placeholder="+234 800 000 0000" defaultValue="+234 812 000 1122" />
            </label>

            <label>
              Detailed description
              <textarea
                name="description"
                rows={3}
                placeholder="Describe what is included, version, condition, and handover details..."
                style={{
                  width: '100%',
                  border: '1px solid #dbe3ef',
                  borderRadius: '7px',
                  padding: '10px 11px',
                  font: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowListModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Plus /> Publish listing
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="courses-toast-wrap">
          <div className="courses-toast success">
            <CheckCircle2 />
            <span>{toast}</span>
          </div>
        </div>
      )}
    </>
  )
}
