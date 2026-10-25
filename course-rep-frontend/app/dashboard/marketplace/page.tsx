'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { Skeleton } from '@/components/ui/skeleton'
import { api, type MarketplaceItem } from '@/lib/api'
import { type MarketItem, initialMarketItems } from '@/lib/data'

export default function MarketplacePage() {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [items, setItems] = useState<MarketItem[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & Drawers
  const [showListModal, setShowListModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null)
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const [contactItem, setContactItem] = useState<MarketItem | null>(null)
  const [contactMessage, setContactMessage] = useState('')

  // List Item Form State (Multi-Image + Quantity)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [listingQuantity, setListingQuantity] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Preset academic photo pairs for fast student testing
  const samplePhotoSets: Record<string, string[]> = {
    'Study materials': [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    ],
    Electronics: [
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?auto=format&fit=crop&w=800&q=80',
    ],
    'Campus essentials': [
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    ],
    Textbooks: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=800&q=80',
    ],
  }

  // Fetch live items from backend or fallback to initial market items
  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true)
      try {
        const liveItems = await api.marketplace.getAll()
        if (Array.isArray(liveItems) && liveItems.length > 0) {
          const mapped: MarketItem[] = liveItems.map((item, idx) => ({
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

  // Handle multi-image file selection
  const handleImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, String(event.target!.result)])
        }
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const loadSamplePhotos = (category: string) => {
    const photos = samplePhotoSets[category] || samplePhotoSets['Study materials']
    setUploadedImages(photos)
    showToastMsg(`Added ${photos.length} sample photos for ${category}`)
  }

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

    // Enforce at least 2 images
    if (uploadedImages.length < 2) {
      showToastMsg('Please add at least 2 photos (front and back/detail) before publishing.')
      return
    }

    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const price = String(form.get('price') || '').trim() || 'Free'
    const tag = String(form.get('tag') || 'Study materials')
    const location = String(form.get('location') || 'Main Campus Quad').trim()
    const condition = String(form.get('condition') || 'Good Condition').trim()
    const phone = String(form.get('phone') || '+234 800 000 0000').trim()
    const description = String(form.get('description') || '').trim()
    const quantity = parseInt(String(form.get('quantity') || '1'), 10) || 1

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
        quantity,
        images: uploadedImages,
      }

      setItems((prev) => [newItem, ...prev])
      setShowListModal(false)
      setUploadedImages([])
      setListingQuantity(1)
      showToastMsg(`Listing "${title}" with ${uploadedImages.length} photos published!`)
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
        quantity,
        images: uploadedImages,
      }
      setItems((prev) => [newItem, ...prev])
      setShowListModal(false)
      setUploadedImages([])
      setListingQuantity(1)
      showToastMsg(`Listing "${title}" with ${uploadedImages.length} photos published!`)
    }
  }

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactItem) return
    showToastMsg(`Inquiry sent to ${contactItem.seller}!`)
    setContactItem(null)
    setContactMessage('')
  }

  const openItemDetails = (item: MarketItem) => {
    setSelectedItem(item)
    setActivePhotoIndex(0)
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
            onClick={() => {
              setUploadedImages([])
              setListingQuantity(1)
              setShowListModal(true)
            }}
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
            Peer-to-peer campus commerce built for university students. Transparent pricing in Naira, verified student sellers, multi-photo listings, and safe campus pickup spots.
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
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
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

                  {/* Top Badges */}
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
                  <strong style={{ fontSize: '15px', color: '#0f172a' }}>{item.price}</strong>
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
              onClick={() => {
                setUploadedImages([])
                setListingQuantity(1)
                setShowListModal(true)
              }}
            >
              + List an Item
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          JUMIA-STYLE RIGHT-SIDE SHEET (DRAWER) FOR SINGLE ITEM VIEW
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

              {/* Jumia-Style Specifications Grid */}
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
              {selectedItem.phone && (
                <a
                  href={`https://wa.me/${selectedItem.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ${selectedItem.seller}, I saw your listing "${selectedItem.title}" on Gradia and would like to buy it.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="market-whatsapp-btn"
                >
                  <Phone style={{ width: 14, height: 14 }} />
                  WhatsApp / Call
                </a>
              )}
              <button
                type="button"
                className="primary-button"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setContactItem(selectedItem)
                  setContactMessage(
                    `Hi ${selectedItem.seller}, I saw your listing "${selectedItem.title}" on Gradia and I am interested in purchasing it.`
                  )
                  setSelectedItem(null)
                }}
              >
                <MessageCircle style={{ width: 14, height: 14 }} />
                Message Seller
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONTACT SELLER MODAL
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
                <p className="eyebrow">Direct Message</p>
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
          MODAL: LIST AN ITEM (MULTI-IMAGE AT LEAST 2 + QUANTITY)
          ==================================================================== */}
      {showListModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowListModal(false)}
        >
          <form className="event-dialog" onSubmit={handlePublish} style={{ width: 'min(100%, 560px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Campus Exchange</p>
                <h2>List an item to sell / share</h2>
                <p>Upload at least 2 photos and set quantity so buyers can verify details.</p>
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

            {/* Multi-Image Upload Area (At least 2 required) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>
                  Item Photos <span style={{ color: '#ef4444' }}>* (Minimum 2 photos required)</span>
                </span>
                {uploadedImages.length >= 2 ? (
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check style={{ width: 13, height: 13 }} /> {uploadedImages.length} photos ready
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#e11d48', fontWeight: 600 }}>
                    {uploadedImages.length}/2 photos added
                  </span>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageFiles}
              />

              <div
                className="image-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <UploadCloud style={{ width: 32, height: 32, color: '#6366f1' }} />
                <strong style={{ fontSize: '12px', color: 'var(--foreground)' }}>
                  Click to upload item photos (Front, Back, Details)
                </strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Supports PNG, JPG, WebP. You must add at least 2 photos.
                </span>
              </div>

              {/* Uploaded Preview Chips Grid */}
              {uploadedImages.length > 0 && (
                <div className="image-preview-grid">
                  {uploadedImages.map((src, idx) => (
                    <div className="image-preview-slot" key={idx}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Upload preview ${idx + 1}`} />
                      <button
                        type="button"
                        className="image-preview-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeUploadedImage(idx)
                        }}
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        <X style={{ width: 12, height: 12 }} />
                      </button>
                      <span className="image-preview-tag">
                        {idx === 0 ? 'Cover Photo' : `Angle ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Helper for quick sample photos */}
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Or load sample student item photos:</span>
                <button
                  type="button"
                  className="text-button"
                  style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 600 }}
                  onClick={() => loadSamplePhotos('Study materials')}
                >
                  Load 3 Sample Photos
                </button>
              </div>
            </div>

            <label style={{ marginTop: '14px' }}>
              Item title
              <input
                name="title"
                required
                placeholder="e.g. Casio fx-991EX ClassWiz Calculator / CSC Past Questions"
              />
            </label>

            {/* Price & Quantity Grid */}
            <div className="event-field-grid">
              <label>
                Price (₦ or Free)
                <input name="price" placeholder="e.g. ₦3,500 or Free" defaultValue="₦2,500" />
              </label>

              <label>
                Quantity Available
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="999"
                  value={listingQuantity}
                  onChange={(e) => setListingQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  required
                />
              </label>
            </div>

            <div className="event-field-grid">
              <label>
                Category
                <select
                  name="tag"
                  defaultValue="Study materials"
                  onChange={(e) => {
                    if (uploadedImages.length === 0) {
                      loadSamplePhotos(e.target.value)
                    }
                  }}
                >
                  <option value="Study materials">Study materials</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Campus essentials">Campus essentials</option>
                  <option value="Textbooks">Textbooks</option>
                </select>
              </label>

              <label>
                Condition
                <input name="condition" placeholder="e.g. Brand New / Gently Used" defaultValue="Gently Used" />
              </label>
            </div>

            <div className="event-field-grid">
              <label>
                Campus pickup spot
                <input name="location" placeholder="e.g. Faculty of Science Quad" defaultValue="Faculty Quad" />
              </label>

              <label>
                Your contact WhatsApp / Phone
                <input name="phone" placeholder="+234 800 000 0000" defaultValue="+234 812 000 1122" />
              </label>
            </div>

            <label>
              Detailed description
              <textarea
                name="description"
                rows={3}
                placeholder="Describe condition, edition, accessories included, and pickup instructions..."
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
              <button
                type="submit"
                className="primary-button"
                disabled={uploadedImages.length < 2}
                style={{ opacity: uploadedImages.length < 2 ? 0.6 : 1 }}
              >
                <Plus /> Publish listing ({uploadedImages.length}/2 photos)
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

