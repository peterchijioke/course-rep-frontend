'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Layers,
  LogIn,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  X,
} from 'lucide-react'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'
import { Pill } from '@/components/pill'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type MarketplaceItem } from '@/lib/api'
import { type MarketItem, initialMarketItems } from '@/lib/data'
import { checkIsAuthenticated } from '@/lib/auth'
import { getUserProfile } from '@/lib/user-profile'

export default function PublicMarketplacePage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string } | null>(null)

  // Drawer & Contact Modal State
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [contactItem, setContactItem] = useState<MarketItem | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Load auth state & current user
  useEffect(() => {
    const authed = checkIsAuthenticated()
    setIsAuthenticated(authed)

    if (authed) {
      api.auth.me().then((me) => {
        if (me) {
          setCurrentUser({ id: me.id, name: me.full_name })
        }
      }).catch(() => {
        const local = getUserProfile()
        if (local) setCurrentUser({ id: 0, name: local.name })
      })
    }
  }, [])

  // Fetch live items from database or fallback to initialMarketItems
  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true)
      try {
        const liveItems = await api.marketplace.getAll()
        if (Array.isArray(liveItems) && liveItems.length > 0) {
          const mapped: MarketItem[] = liveItems.map((item, idx) => ({
            id: String(item.id),
            seller_id: item.seller_id,
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
            quantity: 1,
            images: initialMarketItems[idx % initialMarketItems.length]?.images || [
              'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
              'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
            ],
          }))
          setItems(mapped)
        } else {
          setItems(initialMarketItems)
        }
      } catch (err: any) {
        setItems(initialMarketItems)
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

  // Check if active item is owned by logged in user
  const isOwner = Boolean(
    selectedItem &&
    currentUser &&
    (
      (selectedItem.seller_id && currentUser.id && selectedItem.seller_id === currentUser.id) ||
      (selectedItem.seller && currentUser.name && selectedItem.seller.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
      selectedItem.seller.trim().toLowerCase() === 'you'
    )
  )

  const openItemDetails = (item: MarketItem) => {
    setSelectedItem(item)
    setActivePhotoIndex(0)
  }

  // Handle buyer sending message -> routes to Direct Messages
  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactItem) return

    if (!isAuthenticated) {
      router.push(`/login?redirect=/marketplace`)
      return
    }

    const sellerId = contactItem.seller_id || 1
    const contactKey = `dm-${sellerId}`
    const text = contactMessage.trim()
    if (!text) return

    try {
      await api.chat.sendDirectMessage(sellerId, { content: text })
    } catch (err) {
      console.warn('Direct message API note:', err)
    }

    const optimisticMsg = {
      id: `msg-${Date.now()}`,
      sender: `${currentUser?.name || 'You'} (You)`,
      avatar: (currentUser?.name || 'ME').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
      role: 'you' as const,
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    }
    try {
      localStorage.setItem(`pending_market_inquiry_${contactKey}`, JSON.stringify(optimisticMsg))
    } catch (e) {
      console.warn('Could not store pending inquiry:', e)
    }

    showToastMsg(`Inquiry sent to ${contactItem.seller}! Redirecting to conversation...`)
    const sellerName = contactItem.seller
    setContactItem(null)
    setContactMessage('')

    router.push(`/dashboard/messages?contactId=${contactKey}&name=${encodeURIComponent(sellerName)}`)
  }

  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingHeader />

      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Public Marketplace Hero */}
        <div className="market-hero" style={{ marginBottom: '28px', padding: '32px 36px' }}>
          <div>
            <Pill tone="verified-pill">
              <Store style={{ width: 14, height: 14 }} /> Public Student Marketplace
            </Pill>
            <h1 style={{ fontSize: '28px', letterSpacing: '-0.03em', margin: '14px 0 10px', color: 'var(--foreground)' }}>
              Campus Exchange for University Students
            </h1>
            <p style={{ maxWidth: '640px', fontSize: '14px', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
              Browse verified course past questions, scientific calculators, lab coats, textbooks, and essentials listed by students. Connect directly to chat with the seller and arrange safe campus pickup.
            </p>
          </div>
          {isAuthenticated ? (
            <Link
              href="/dashboard/marketplace"
              className="primary-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', whiteSpace: 'nowrap' }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              List an item to sell
            </Link>
          ) : (
            <Link
              href="/login?redirect=/marketplace"
              className="primary-button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', whiteSpace: 'nowrap' }}
            >
              <LogIn style={{ width: 15, height: 15 }} />
              Log in to start selling
            </Link>
          )}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="courses-toolbar-container" style={{ marginBottom: '24px' }}>
          <div className="courses-controls-row">
            <div className="courses-search-group">
              <Search />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search past questions, calculators, lab coats, textbooks..."
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

          {/* Category Tabs */}
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

        {/* Public Marketplace Items Grid */}
        <div className="market-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <article className="market-card" key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <Skeleton style={{ height: '156px', width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <Skeleton style={{ width: '80px', height: '18px', borderRadius: '12px' }} />
                  <Skeleton style={{ width: '70px', height: '14px' }} />
                </div>
                <Skeleton style={{ width: '85%', height: '16px', marginBottom: '6px' }} />
                <Skeleton style={{ width: '60%', height: '14px', marginBottom: '14px' }} />
                <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton style={{ width: '60px', height: '20px' }} />
                  <Skeleton style={{ width: '70px', height: '16px' }} />
                </div>
              </article>
            ))
          ) : (
            filtered.map((item) => {
              const hasImages = item.images && item.images.length > 0
              const coverImage = hasImages ? item.images![0] : null
              const qty = item.quantity ?? 1

              return (
                <article
                  className="market-card"
                  key={item.id || item.title}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openItemDetails(item)}
                >
                  {/* Thumbnail Image with Multi-Photo Chip & Stock Badge */}
                  <div className="market-thumb-img-wrap">
                    {coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImage}
                        alt={item.title}
                        className="market-thumb-img"
                      />
                    ) : (
                      <div className={`market-thumb ${item.imageTone || 'indigo'}`} style={{ height: '100%', marginBottom: 0 }}>
                        <BookOpen />
                      </div>
                    )}

                    {/* Stock status badge */}
                    <div className="market-badge-stack">
                      <span className={`market-stock-chip ${qty <= 1 ? 'low' : ''}`}>
                        {qty <= 1 ? 'Only 1 left' : `${qty} in stock`}
                      </span>
                    </div>

                    {/* Multi-Photo Count Badge */}
                    {item.images && item.images.length > 1 && (
                      <span className="market-photo-count-chip">
                        <Camera style={{ width: 11, height: 11 }} />
                        {item.images.length} photos
                      </span>
                    )}
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

                  <h3 style={{ fontSize: '13px', lineHeight: 1.35, minHeight: '36px', marginTop: '8px' }}>
                    {item.title}
                  </h3>

                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <span>{item.seller}</span>
                    {item.location && (
                      <small style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: '#94a3b8' }}>
                        <MapPin style={{ width: '12px' }} /> {item.location}
                      </small>
                    )}
                  </div>

                  <div className="market-card-footer" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                    <strong style={{ fontSize: '15px', color: 'var(--foreground)' }}>{item.price}</strong>
                    <button
                      type="button"
                      className="text-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openItemDetails(item)
                      }}
                    >
                      View details <ChevronRight />
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
            <Store style={{ width: '40px', height: '40px', color: '#6366f1', margin: '0 auto 12px', opacity: 0.8 }} />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--foreground)' }}>No marketplace items found</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '6px 0 16px' }}>
              {query || categoryFilter !== 'All'
                ? 'Try adjusting your search keywords or clear the category filter.'
                : 'Check back soon for new student listings and campus essentials.'}
            </p>
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
          </div>
        )}

        {/* ====================================================================
            JUMIA-STYLE RIGHT-SIDE SHEET DRAWER (PUBLIC)
            ==================================================================== */}
        {selectedItem && (
          <div
            className="market-sheet-backdrop"
            role="presentation"
            onClick={(e) => e.target === e.currentTarget && setSelectedItem(null)}
          >
            <aside
              className="market-sheet-drawer"
              aria-label={`Product details: ${selectedItem.title}`}
            >
              {/* Sheet Sticky Header */}
              <div className="market-sheet-header">
                <div className="market-sheet-header-left">
                  <Pill>{selectedItem.tag}</Pill>
                  {isOwner && (
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#4f46e5',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                      }}
                    >
                      Your Listing
                    </span>
                  )}
                  <span className="market-sheet-header-title">Item Details</span>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setSelectedItem(null)}
                  aria-label="Close product sheet"
                >
                  <X />
                </button>
              </div>

              {/* Sheet Scrollable Body */}
              <div className="market-sheet-scroll-body">
                {/* Jumia-Style Media Gallery */}
                {selectedItem.images && selectedItem.images.length > 0 ? (
                  <div className="jumia-gallery-box">
                    {/* Main Large Image View */}
                    <div className="jumia-main-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.images[activePhotoIndex] || selectedItem.images[0]}
                        alt={`${selectedItem.title} - view ${activePhotoIndex + 1}`}
                      />
                      <div className="jumia-photo-index-pill">
                        {activePhotoIndex + 1} / {selectedItem.images.length}
                      </div>
                    </div>

                    {/* Thumbnail "Over-Chips" Strip (Jumia-style Switcher) */}
                    <div className="jumia-chips-strip">
                      {selectedItem.images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`jumia-thumb-chip ${idx === activePhotoIndex ? 'active' : ''}`}
                          onClick={() => setActivePhotoIndex(idx)}
                          aria-label={`Switch to photo ${idx + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                          {idx === 0 && <span className="jumia-chip-cover-label">Cover</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={`market-thumb ${selectedItem.imageTone || 'indigo'}`} style={{ height: '220px', borderRadius: '12px' }}>
                    <BookOpen style={{ width: 48, height: 48 }} />
                  </div>
                )}

                {/* Price & Quantity Stock Row */}
                <div className="jumia-price-row">
                  <div className="jumia-price-tag">{selectedItem.price}</div>
                  <span className={`market-stock-chip ${(selectedItem.quantity ?? 1) <= 1 ? 'low' : ''}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                    {(selectedItem.quantity ?? 1) > 1
                      ? `✓ In Stock: ${selectedItem.quantity} units available`
                      : '⚡ Only 1 item left in stock'}
                  </span>
                </div>

                {/* Title & Pickup Location */}
                <div>
                  <h2 style={{ fontSize: '17px', lineHeight: 1.35, margin: '0 0 8px', color: 'var(--foreground)' }}>
                    {selectedItem.title}
                  </h2>
                  {selectedItem.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748b' }}>
                      <MapPin style={{ width: 14, height: 14, color: '#6366f1' }} />
                      <span>Campus Pickup: <strong>{selectedItem.location}</strong></span>
                    </div>
                  )}
                </div>

                {/* Product Specifications Grid */}
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                    Product Specifications
                  </h4>
                  <div className="jumia-spec-grid">
                    <div className="jumia-spec-item">
                      <span className="jumia-spec-label">Category</span>
                      <span className="jumia-spec-value">{selectedItem.tag}</span>
                    </div>
                    <div className="jumia-spec-item">
                      <span className="jumia-spec-label">Condition</span>
                      <span className="jumia-spec-value">{selectedItem.condition || 'Verified Condition'}</span>
                    </div>
                    <div className="jumia-spec-item">
                      <span className="jumia-spec-label">Quantity Available</span>
                      <span className="jumia-spec-value">{selectedItem.quantity ?? 1} unit(s)</span>
                    </div>
                    <div className="jumia-spec-item">
                      <span className="jumia-spec-label">Listed Date</span>
                      <span className="jumia-spec-value">{selectedItem.date || 'Recently'}</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>
                    Description
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--foreground)', background: 'var(--card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {selectedItem.description || 'Verified campus exchange listing ready for pickup.'}
                  </p>
                </div>

                {/* Seller Trust Profile Card */}
                <div className="jumia-seller-card">
                  <div className="jumia-seller-avatar">
                    {selectedItem.seller.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>{selectedItem.seller}</strong>
                      {selectedItem.verified && (
                        <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 700 }}>
                          <ShieldCheck style={{ width: 12, height: 12 }} /> Verified
                        </span>
                      )}
                    </div>
                    <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                      Active University Student Seller · Quick Response
                    </small>
                  </div>
                </div>

                {/* Campus Safety Notice */}
                <div className="jumia-safe-notice">
                  <ShieldCheck style={{ width: 18, height: 18, flexShrink: 0, marginTop: '2px', color: '#059669' }} />
                  <div>
                    <strong>Gradia Campus Trade Safety:</strong> Meet in well-lit, public campus locations (Faculty Quad, ICT Centre, University Library). Inspect the item thoroughly before concluding payment.
                  </div>
                </div>
              </div>

              {/* Sticky Sheet Footer Actions */}
              <div className="market-sheet-footer">
                {isOwner ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>This is your listing</span>
                    <Link
                      href="/dashboard/marketplace"
                      className="primary-button"
                      style={{ padding: '9px 16px', fontSize: '12px' }}
                    >
                      Manage in Dashboard <ExternalLink style={{ width: 13, height: 13 }} />
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                    onClick={() => {
                      setContactItem(selectedItem)
                      setContactMessage(
                        `Hi ${selectedItem.seller}, I saw your listing "${selectedItem.title}" (${selectedItem.price}) on Gradia and I am interested in purchasing it.`
                      )
                      setSelectedItem(null)
                    }}
                  >
                    <MessageCircle style={{ width: 15, height: 15 }} />
                    Chat with Owner
                  </button>
                ) : (
                  <Link
                    href={`/login?redirect=/marketplace`}
                    className="primary-button"
                    style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
                  >
                    <LogIn style={{ width: 15, height: 15 }} />
                    Log in to Chat with Owner
                  </Link>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* ====================================================================
            CONTACT / INQUIRY DIALOG (CHATTING WITH OWNER)
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
                  <h2>Chat with {contactItem.seller}</h2>
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
                  placeholder="Ask about item condition, availability, or pickup location..."
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

              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  color: '#64748b',
                  lineHeight: 1.5,
                }}
              >
                Sending this message will start a direct conversation with <strong>{contactItem.seller}</strong> in your Gradia Direct Messages.
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setContactItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <MessageCircle style={{ width: '14px' }} /> Start Chat
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
      </main>

      <SiteFooter />
    </div>
  )
}
