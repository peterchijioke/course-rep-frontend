'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Hash,
  Image as ImageIcon,
  Info,
  Lock,
  Maximize2,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Pill } from '@/components/pill'
import { Skeleton } from '@/components/ui/skeleton'
import {
  api,
  getWebSocketUrl,
  getAuthToken,
  ensureAuthToken,
  type ChatGroup,
  type ChatMessage,
} from '@/lib/api'
import { getUserProfile } from '@/lib/user-profile'

interface MessageItem {
  id: string
  sender: string
  avatar: string
  role?: 'rep' | 'lecturer' | 'student' | 'you'
  text: string
  time: string
  isMine: boolean
  attachment?: {
    name: string
    url: string
    type: string
    isImage?: boolean
  }
}

interface GroupChannel {
  id: string
  name: string
  category: 'course' | 'department' | 'study_group'
  codeTag?: string
  memberCount: number
  description: string
  inviteCode?: string
  members: { name: string; role: string; avatar: string }[]
}

interface DirectContact {
  id: string
  name: string
  role: string
  department: string
  level: string
  online: boolean
  avatar: string
  lastMessage: string
  time: string
}

export function ChatView({ direct = false }: { direct?: boolean }) {
  // Live channels & contacts from database
  const [channels, setChannels] = useState<GroupChannel[]>([])
  const [contacts, setContacts] = useState<DirectContact[]>([])

  // Active selections
  const [activeGroupId, setActiveGroupId] = useState('')
  const [activeContactId, setActiveContactId] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Lightbox & image zoom state
  const [lightboxImage, setLightboxImage] = useState<{
    url: string
    name: string
    sender: string
    time: string
    caption?: string
  } | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Messages per conversation state - dynamic from database
  const [conversationMessages, setConversationMessages] = useState<Record<string, MessageItem[]>>({})

  // Composer state
  const [inputText, setInputText] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modals & Drawers
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinCodeModal, setShowJoinCodeModal] = useState(false)
  const [showNewDMModal, setShowNewDMModal] = useState(false)
  const [dmSearchQuery, setDmSearchQuery] = useState('')
  const [directRecipientInput, setDirectRecipientInput] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  // WebSocket State
  const wsRef = useRef<WebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    const local = typeof window !== 'undefined' ? getUserProfile() : null
    return { id: 0, name: local?.name || 'Student' }
  })

  const searchParams = useSearchParams()
  const paramContactId = searchParams?.get('contactId')
  const paramContactName = searchParams?.get('name')

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Handle marketplace seller redirection
  useEffect(() => {
    if (direct && paramContactId) {
      setActiveContactId(paramContactId)
      const decodedName = paramContactName ? decodeURIComponent(paramContactName) : 'Campus Seller'
      setContacts((prev) => {
        if (prev.some((c) => c.id === paramContactId)) return prev
        const sellerContact: DirectContact = {
          id: paramContactId,
          name: decodedName,
          role: 'Campus Seller',
          department: 'Student Marketplace',
          level: 'Active',
          online: true,
          avatar: decodedName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'CS',
          lastMessage: 'Marketplace listing inquiry',
          time: 'Just now',
        }
        return [sellerContact, ...prev]
      })

      // Check if there is an optimistic pending message from marketplace
      try {
        const pendingKey = `pending_market_inquiry_${paramContactId}`
        const pending = localStorage.getItem(pendingKey)
        if (pending) {
          const parsed: MessageItem = JSON.parse(pending)
          localStorage.removeItem(pendingKey)
          setConversationMessages((prev) => {
            const list = prev[paramContactId] || []
            if (list.some((m) => m.id === parsed.id)) return prev
            return { ...prev, [paramContactId]: [...list, parsed] }
          })
        }
      } catch (e) {
        console.warn('Pending message load error:', e)
      }
    }
  }, [direct, paramContactId, paramContactName])

  // Active object references
  const currentGroup = channels.find((g) => g.id === activeGroupId) || channels[0] || {
    id: 'grp-0',
    name: 'General Channel',
    category: 'course' as const,
    memberCount: 1,
    description: 'Welcome to student group channels',
    members: [],
  }
  const currentContact = contacts.find((c) => c.id === activeContactId) || contacts[0] || {
    id: 'dm-0',
    name: 'Classmate',
    role: 'Student',
    department: 'Computer Science',
    level: '400L',
    online: true,
    avatar: 'ST',
    lastMessage: '',
    time: '',
  }
  const currentKey = direct ? (activeContactId || currentContact.id) : (activeGroupId || currentGroup.id)
  const currentMessages = conversationMessages[currentKey] || []

  // Load current user, groups, and contacts from backend
  useEffect(() => {
    const initData = async () => {
      setLoadingList(true)
      // 1. Ensure valid JWT auth token
      const token = await ensureAuthToken()

      // 2. Load user profile
      try {
        const me = await api.auth.me()
        if (me) {
          setCurrentUser({ id: me.id, name: me.full_name })
        }
      } catch (e) {
        const local = getUserProfile()
        if (local) setCurrentUser({ id: 0, name: local.name })
      }

      // 3. Load groups from PostgreSQL database
      try {
        const liveGroups = await api.chat.getGroups()
        if (Array.isArray(liveGroups) && liveGroups.length > 0) {
          const mapped: GroupChannel[] = liveGroups.map((g) => ({
            id: `grp-${g.id}`,
            name: g.name,
            category: 'course',
            codeTag: `Channel #${g.id}`,
            memberCount: 1,
            description: g.description || 'Class discussion room',
            inviteCode: `CR-${g.id}`,
            members: [],
          }))
          setChannels(mapped)
          if (!activeGroupId && mapped[0]) {
            setActiveGroupId(mapped[0].id)
          }
        }
      } catch (err) {
        console.warn('Failed to load chat groups from API:', err)
      }

      // 4. Load real contacts from PostgreSQL database
      try {
        const liveContacts = await api.chat.getContacts()
        if (Array.isArray(liveContacts) && liveContacts.length > 0) {
          const mappedContacts: DirectContact[] = liveContacts.map((c) => ({
            id: `dm-${c.id}`,
            name: c.full_name,
            role: `${c.role}${c.academic_level ? ` · ${c.academic_level}` : ''}`,
            department: c.department || 'Computer Science',
            level: c.academic_level || '400L',
            online: true,
            avatar: c.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'ST',
            lastMessage: 'Tap to start direct conversation',
            time: 'Registered',
          }))
          setContacts(mappedContacts)
          if (!activeContactId && mappedContacts[0]) {
            setActiveContactId(mappedContacts[0].id)
          }
        } else {
          setContacts([])
        }
      } catch (err) {
        console.warn('Failed to load contacts from API:', err)
        setContacts([])
      } finally {
        setLoadingList(false)
      }

      // 5. Connect WebSocket with verified token
      if (token) {
        try {
          if (wsRef.current) {
            wsRef.current.close()
          }
          const url = getWebSocketUrl(token)
          const ws = new WebSocket(url)
          wsRef.current = ws

          ws.onopen = () => {
            setWsConnected(true)
            if (!direct && activeGroupId) {
              const gid = parseInt(activeGroupId.replace(/\D/g, '')) || 1
              ws.send(JSON.stringify({ type: 'join_group', group_id: gid }))
            }
          }

          ws.onclose = () => {
            setWsConnected(false)
          }

          ws.onerror = () => {
            setWsConnected(false)
          }

          ws.onmessage = (event) => {
            try {
              const res = JSON.parse(event.data)
              if (res.type === 'message' && res.data) {
                const m = res.data
                const isMine = m.sender_id === currentUser.id
                const incomingMsg: MessageItem = {
                  id: `msg-${m.id || Date.now()}`,
                  sender: isMine ? `${m.sender_name} (You)` : m.sender_name,
                  avatar: (m.sender_name || 'CL').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
                  role: isMine ? 'you' : 'student',
                  text: m.content,
                  time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isMine,
                  attachment: m.attachment_url
                    ? {
                        name: m.attachment_name || 'attachment',
                        url: m.attachment_url,
                        type: m.attachment_type || '',
                        isImage: m.attachment_type?.startsWith('image/'),
                      }
                    : undefined,
                }

                const targetKey = m.group_id
                  ? `grp-${m.group_id}`
                  : `dm-${m.recipient_id === currentUser.id ? m.sender_id : m.recipient_id}`

                setConversationMessages((prev) => ({
                  ...prev,
                  [targetKey]: [...(prev[targetKey] || []).filter((item) => item.id !== incomingMsg.id), incomingMsg],
                }))
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          console.warn('WebSocket init error:', e)
        }
      }
    }

    initData()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Fetch group messages when active group changes
  useEffect(() => {
    if (!direct && activeGroupId) {
      const gid = parseInt(activeGroupId.replace(/\D/g, ''))
      if (gid) {
        // Join WebSocket room
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'join_group', group_id: gid }))
        }

        // Fetch past messages from backend
        if (!conversationMessages[activeGroupId]) {
          setLoadingMessages(true)
        }
        api.chat.getGroupMessages(gid).then((msgs) => {
          if (Array.isArray(msgs)) {
            const mapped: MessageItem[] = msgs.map((m) => ({
              id: String(m.id),
              sender: m.sender_id === currentUser.id ? `${m.sender_name} (You)` : m.sender_name,
              avatar: (m.sender_name || 'CL').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
              role: m.sender_id === currentUser.id ? 'you' : 'student',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMine: m.sender_id === currentUser.id,
              attachment: m.attachment_url
                ? {
                    name: m.attachment_name || 'attachment',
                    url: m.attachment_url,
                    type: m.attachment_type || '',
                    isImage: m.attachment_type?.startsWith('image/'),
                  }
                : undefined,
            }))
            setConversationMessages((prev) => ({ ...prev, [activeGroupId]: mapped }))
          }
        }).catch((e) => console.warn('Could not load group messages:', e))
          .finally(() => setLoadingMessages(false))
      }
    }
  }, [activeGroupId, direct, currentUser.id])

  // Fetch direct messages when active contact changes
  useEffect(() => {
    if (direct && activeContactId) {
      const recipientId = parseInt(activeContactId.replace(/\D/g, ''))
      if (recipientId) {
        if (!conversationMessages[activeContactId]) {
          setLoadingMessages(true)
        }
        api.chat.getDirectMessages(recipientId).then((msgs) => {
          if (Array.isArray(msgs)) {
            const mapped: MessageItem[] = msgs.map((m) => ({
              id: String(m.id),
              sender: m.sender_id === currentUser.id ? `${m.sender_name} (You)` : m.sender_name,
              avatar: (m.sender_name || 'CL').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
              role: m.sender_id === currentUser.id ? 'you' : 'student',
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMine: m.sender_id === currentUser.id,
              attachment: m.attachment_url
                ? {
                    name: m.attachment_name || 'attachment',
                    url: m.attachment_url,
                    type: m.attachment_type || '',
                    isImage: m.attachment_type?.startsWith('image/'),
                  }
                : undefined,
            }))
            setConversationMessages((prev) => ({ ...prev, [activeContactId]: mapped }))
          }
        }).catch((e) => console.warn('Could not load direct messages:', e))
          .finally(() => setLoadingMessages(false))
      }
    }
  }, [activeContactId, direct, currentUser.id])

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight
    }
  }, [currentMessages, activeGroupId, activeContactId])

  // Escape key handler for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null)
        setIsZoomed(false)
      }
    }
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxImage])

  // Handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setAttachment(file)
    if (file) {
      const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)
      if (isImg) {
        setAttachmentPreviewUrl(URL.createObjectURL(file))
      } else {
        setAttachmentPreviewUrl(null)
      }
    } else {
      setAttachmentPreviewUrl(null)
    }
  }

  const handleClearAttachment = () => {
    setAttachment(null)
    setAttachmentPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Send message via WebSocket & API
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() && !attachment) return

    const isImg = attachment
      ? attachment.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment.name)
      : false

    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: `${currentUser.name} (You)`,
      avatar: currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase(),
      role: 'you',
      text: inputText.trim(),
      time: 'Just now',
      isMine: true,
      attachment: attachment
        ? {
            name: attachment.name,
            url: attachmentPreviewUrl || URL.createObjectURL(attachment),
            type: attachment.type || (isImg ? 'image/png' : 'application/octet-stream'),
            isImage: isImg,
          }
        : undefined,
    }

    setConversationMessages((prev) => ({
      ...prev,
      [currentKey]: [...(prev[currentKey] || []), newMsg],
    }))

    // Send through live WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (direct) {
        const recipientId = parseInt(activeContactId.replace(/\D/g, '')) || 2
        wsRef.current.send(
          JSON.stringify({
            type: 'direct_message',
            recipient_id: recipientId,
            content: inputText.trim(),
            attachment_name: attachment?.name || '',
            attachment_url: attachmentPreviewUrl || '',
            attachment_type: attachment?.type || '',
          })
        )
      } else {
        const groupId = parseInt(activeGroupId.replace(/\D/g, '')) || 1
        wsRef.current.send(
          JSON.stringify({
            type: 'group_message',
            group_id: groupId,
            content: inputText.trim(),
            attachment_name: attachment?.name || '',
            attachment_url: attachmentPreviewUrl || '',
            attachment_type: attachment?.type || '',
          })
        )
      }
    }

    // Persist via REST as backup
    if (direct) {
      const recipientId = parseInt(activeContactId.replace(/\D/g, '')) || 2
      api.chat.sendDirectMessage(recipientId, {
        content: inputText.trim(),
        attachment_name: attachment?.name || '',
        attachment_url: attachmentPreviewUrl || '',
        attachment_type: attachment?.type || '',
      }).catch((e) => console.warn('REST direct message error:', e))
    } else {
      const groupId = parseInt(activeGroupId.replace(/\D/g, '')) || 1
      api.chat.sendGroupMessage(groupId, {
        content: inputText.trim(),
        attachment_name: attachment?.name || '',
        attachment_url: attachmentPreviewUrl || '',
        attachment_type: attachment?.type || '',
      }).catch((e) => console.warn('REST group message error:', e))
    }

    setInputText('')
    setAttachment(null)
    setAttachmentPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Create Custom Group
  const handleCreateGroupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || '').trim()
    const desc = String(form.get('desc') || '').trim()
    if (!name) return

    const newCode = `CR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    try {
      const created = await api.chat.createGroup({ name, description: desc })
      const newGrp: GroupChannel = {
        id: `grp-${created.id}`,
        name: created.name,
        category: 'study_group',
        codeTag: 'Custom Study Cell',
        memberCount: 1,
        description: desc || 'Student collaborative workspace.',
        inviteCode: newCode,
        members: [
          { name: `${currentUser.name} (You)`, role: 'Creator / Admin', avatar: 'PE' },
        ],
      }
      setChannels((prev) => [...prev, newGrp])
      setActiveGroupId(newGrp.id)
      setShowCreateGroup(false)
      showToastMsg(`Created "${name}"! Classmates can join with code: ${newCode}`)
    } catch (err) {
      // Local fallback
      const newGrp: GroupChannel = {
        id: `grp-${Date.now()}`,
        name,
        category: 'study_group',
        codeTag: 'Custom Study Cell',
        memberCount: 1,
        description: desc || 'Student collaborative workspace.',
        inviteCode: newCode,
        members: [
          { name: `${currentUser.name} (You)`, role: 'Creator / Admin', avatar: 'PE' },
        ],
      }
      setChannels((prev) => [...prev, newGrp])
      setActiveGroupId(newGrp.id)
      setShowCreateGroup(false)
      showToastMsg(`Created "${name}"!`)
    }
  }

  // Join by 6-digit Code
  const handleJoinByCodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') || '').trim().toUpperCase()

    const target = channels.find((g) => g.inviteCode?.toUpperCase() === code)
    if (target) {
      setActiveGroupId(target.id)
      setShowJoinCodeModal(false)
      showToastMsg(`Joined ${target.name}!`)
    } else {
      showToastMsg(`Invalid group invite code: "${code}"`)
    }
  }

  // Start new Direct Message
  const handleStartDM = (contact: DirectContact) => {
    if (!contacts.some((c) => c.id === contact.id)) {
      setContacts((prev) => [contact, ...prev])
    }
    setActiveContactId(contact.id)
    setShowNewDMModal(false)
    showToastMsg(`Opened direct chat with ${contact.name}`)
  }

  return (
    <>
      <PageHeader
        title={direct ? 'Direct messages' : 'Student groups & channels'}
        subtitle={
          direct
            ? 'One-on-one private academic conversations with course reps, classmates, and study partners.'
            : 'Cohort communication: auto-enrolled course channels, department spaces, and study teams.'
        }
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            {!direct ? (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowJoinCodeModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Hash style={{ width: '14px' }} /> Join with code
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus /> Create study group
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                onClick={() => setShowNewDMModal(true)}
              >
                <Plus /> New direct message
              </button>
            )}
          </div>
        }
      />

      {/* Main Chat Layout Container */}
      <div className="chat-layout" style={{ position: 'relative' }}>        {/* Left Sidebar: Channels or Contacts */}
        <aside className="chat-list" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chat-list-header">
            <strong>{direct ? 'Conversations' : 'Channels & Groups'}</strong>
            <span>{loadingList ? <Skeleton style={{ width: '18px', height: '14px', borderRadius: '4px' }} /> : direct ? contacts.length : channels.length}</span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loadingList ? (
              <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 0' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <Skeleton style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Skeleton style={{ width: i % 2 === 0 ? '75%' : '60%', height: '14px', marginBottom: '6px' }} />
                      <Skeleton style={{ width: i % 2 === 0 ? '45%' : '60%', height: '11px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : !direct ? (
              <>
                {/* Section 1: Course Channels */}
                <div style={{ padding: '10px 16px 4px', fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Auto-Enrolled Course Rooms
                </div>
                {channels
                  .filter((g) => g.category === 'course' || g.category === 'department')
                  .map((grp) => (
                    <button
                      type="button"
                      key={grp.id}
                      className={`chat-contact ${activeGroupId === grp.id ? 'active' : ''}`}
                      onClick={() => setActiveGroupId(grp.id)}
                    >
                      <span className="avatar avatar-small" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                        <Hash style={{ width: '13px' }} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {grp.name}
                        </strong>
                        <small style={{ color: '#64748b' }}>
                          {grp.memberCount} classmates · {grp.codeTag}
                        </small>
                      </span>
                    </button>
                  ))}

                {/* Section 2: Custom Study Groups */}
                <div style={{ padding: '14px 16px 4px', fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Project & Study Cells
                </div>
                {channels
                  .filter((g) => g.category === 'study_group')
                  .map((grp) => (
                    <button
                      type="button"
                      key={grp.id}
                      className={`chat-contact ${activeGroupId === grp.id ? 'active' : ''}`}
                      onClick={() => setActiveGroupId(grp.id)}
                    >
                      <span className="avatar avatar-small" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <Users style={{ width: '13px' }} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {grp.name}
                        </strong>
                        <small style={{ color: '#059669' }}>
                          Code: {grp.inviteCode} · {grp.memberCount} members
                        </small>
                      </span>
                    </button>
                  ))}
              </>
            ) : (
              /* Direct Message Contacts List */
              contacts.map((contact) => (
                <button
                  type="button"
                  key={contact.id}
                  className={`chat-contact ${activeContactId === contact.id ? 'active' : ''}`}
                  onClick={() => setActiveContactId(contact.id)}
                >
                  <span className="avatar avatar-small" style={{ position: 'relative' }}>
                    {contact.avatar}
                    {contact.online && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#16a34a',
                          border: '1.5px solid #fff',
                        }}
                      />
                    )}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {contact.name}
                      </strong>
                      <span style={{ fontSize: '9px', color: '#94a3b8' }}>{contact.time}</span>
                    </div>
                    <small style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {contact.lastMessage}
                    </small>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Center: Chat Window */}
        <section className="chat-window" style={{ position: 'relative' }}>
          {/* Chat Window Header */}
          <div className="chat-window-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {loadingList ? (
                <>
                  <Skeleton style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
                  <div>
                    <Skeleton style={{ width: '130px', height: '15px', marginBottom: '5px' }} />
                    <Skeleton style={{ width: '90px', height: '11px' }} />
                  </div>
                </>
              ) : (
                <>
                  <span className="avatar">
                    {!direct ? (
                      currentGroup.category === 'course' ? <Hash style={{ width: '16px' }} /> : <Users style={{ width: '16px' }} />
                    ) : (
                      currentContact.avatar
                    )}
                  </span>
                  <div>
                    <strong>{!direct ? currentGroup.name : currentContact.name}</strong>
                    <small style={{ color: '#64748b' }}>
                      {!direct
                        ? `${currentGroup.memberCount} members enrolled · ${currentGroup.codeTag || 'Active Group'}`
                        : `${currentContact.role} · ${currentContact.online ? 'Active now' : 'Offline'}`}
                    </small>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: wsConnected ? '#10b981' : '#ef4444',
                  border: wsConnected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: wsConnected ? '#10b981' : '#ef4444',
                    boxShadow: wsConnected ? '0 0 6px #10b981' : 'none',
                  }}
                />
                {wsConnected ? 'WebSocket Live' : 'Connecting WS...'}
              </span>
              {!direct ? (
                <button
                  type="button"
                  className={`icon-btn ${showDrawer ? 'active' : ''}`}
                  onClick={() => setShowDrawer(!showDrawer)}
                  title="View group members and invite link"
                >
                  <Info />
                </button>
              ) : (
                <a
                  href={`tel:${currentContact.id === 'dm-1' ? '+2348031234567' : '+2348123456789'}`}
                  className="icon-btn"
                  title="Call contact"
                >
                  <Phone />
                </a>
              )}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div ref={messageListRef} className="message-list">
            {/* Introductory notice inside room */}
            <div className="chat-intro-notice">
              <strong>
                {!direct ? currentGroup.name : `Direct Conversation with ${currentContact.name}`}
              </strong>
              <span>
                {!direct
                  ? currentGroup.description
                  : 'Direct coordinated messaging for coursework and campus academic exchange.'}
              </span>
            </div>

            {loadingList || loadingMessages ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 10px' }}>
                {/* Incoming bubble skeleton */}
                <div style={{ display: 'flex', gap: '10px', maxWidth: '75%', alignItems: 'flex-start' }}>
                  <Skeleton style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ width: '90px', height: '12px', marginBottom: '6px' }} />
                    <Skeleton style={{ height: '48px', width: '220px', borderRadius: '12px' }} />
                  </div>
                </div>

                {/* Outgoing bubble skeleton */}
                <div style={{ display: 'flex', gap: '10px', maxWidth: '75%', marginLeft: 'auto', alignItems: 'flex-start', flexDirection: 'row-reverse' }}>
                  <Skeleton style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                  <div>
                    <Skeleton style={{ height: '38px', width: '180px', borderRadius: '12px' }} />
                  </div>
                </div>

                {/* Incoming bubble skeleton */}
                <div style={{ display: 'flex', gap: '10px', maxWidth: '75%', alignItems: 'flex-start' }}>
                  <Skeleton style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <Skeleton style={{ width: '70px', height: '12px', marginBottom: '6px' }} />
                    <Skeleton style={{ height: '62px', width: '260px', borderRadius: '12px' }} />
                  </div>
                </div>
              </div>
            ) : currentMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b', fontSize: '13px' }}>
                <MessageCircle style={{ width: '28px', height: '28px', margin: '0 auto 10px', opacity: 0.5, display: 'block' }} />
                <strong>No messages yet</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Send a message below to start the conversation!
                </p>
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div
                  className={`chat-message ${msg.isMine ? 'mine' : ''}`}
                  key={msg.id}
                >
                <span className="avatar avatar-tiny">
                  {msg.avatar}
                </span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                      {msg.sender}
                    </span>
                    {msg.role === 'rep' && (
                      <span className="course-pill urgent-pill" style={{ fontSize: '8px', padding: '1px 5px' }}>
                        Course Rep
                      </span>
                    )}
                  </div>

                  {/* WhatsApp-Style Image Attachment Card */}
                  {msg.attachment?.isImage && (
                    <div
                      className="whatsapp-image-bubble"
                      onClick={() => {
                        setIsZoomed(false)
                        setLightboxImage({
                          url: msg.attachment!.url,
                          name: msg.attachment!.name,
                          sender: msg.sender,
                          time: msg.time,
                          caption: msg.text || undefined,
                        })
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View full-size image: ${msg.attachment.name}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.attachment.url}
                        alt={msg.attachment.name}
                        className="whatsapp-image-thumbnail"
                      />
                      <div className="whatsapp-image-overlay-badge">
                        <Maximize2 style={{ width: 12, height: 12 }} />
                        <span>View</span>
                      </div>
                    </div>
                  )}

                  {msg.text && (
                    <p style={{ marginTop: msg.attachment?.isImage ? '6px' : '0' }}>{msg.text}</p>
                  )}

                  {/* Regular Document Attachment */}
                  {msg.attachment && !msg.attachment.isImage && (
                    <div className="sent-attachment" style={{ marginTop: '6px' }}>
                      <div className="sent-document" style={{ background: msg.isMine ? '#3730a3' : '#f1f5f9', color: msg.isMine ? '#fff' : '#0f172a' }}>
                        <FileText />
                        <span>{msg.attachment.name}</span>
                      </div>
                    </div>
                  )}

                  <small style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: msg.isMine ? 'flex-end' : 'flex-start' }}>
                    {msg.time}
                    {msg.isMine && <CheckCheck style={{ width: '12px', color: '#4338ca' }} />}
                  </small>
                </div>
              </div>
            ))
            )}
          </div>

          {/* Composer Footer */}
          <form className="chat-composer" onSubmit={handleSendMessage}>
            <input
              ref={fileInputRef}
              className="sr-only"
              type="file"
              accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label="Attach photo or document"
              title="Attach photo or study note"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip />
            </button>

            <div className="chat-input-wrap">
              {attachment && (
                attachmentPreviewUrl ? (
                  <div className="composer-image-preview-tray">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachmentPreviewUrl} alt="Upload preview" className="composer-thumb-img" />
                    <div className="composer-file-info">
                      <strong>{attachment.name}</strong>
                      <small>Photo · {(attachment.size / 1024).toFixed(0)} KB · Click send or add caption</small>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: '24px', height: '24px', marginLeft: 'auto', background: 'transparent' }}
                      onClick={handleClearAttachment}
                      title="Remove image"
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                ) : (
                  <span className="chat-attachment" title={attachment.name}>
                    <FileText /> {attachment.name}
                    <button
                      type="button"
                      onClick={handleClearAttachment}
                      title="Remove document"
                    >
                      <X />
                    </button>
                  </span>
                )
              )}
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  attachment
                    ? 'Add a caption...'
                    : direct
                    ? `Message ${currentContact.name}...`
                    : `Share with ${currentGroup.name}...`
                }
              />
            </div>

            <button className="primary-button" type="submit" aria-label="Send message">
              <Send />
            </button>
          </form>

          {/* Right-Side Member / Info Drawer for Groups */}
          {!direct && showDrawer && (
            <div className="chat-info-drawer">
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: '13px' }}>Channel Info</strong>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setShowDrawer(false)}
                >
                  <X />
                </button>
              </div>

              <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                    Group Purpose
                  </label>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                    {currentGroup.description}
                  </p>
                </div>

                {/* Invite Code Box */}
                {currentGroup.inviteCode && (
                  <div className="chat-invite-box">
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8', display: 'block' }}>
                      Invite Code & Share Link
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                      <strong style={{ fontSize: '14px', letterSpacing: '0.05em', color: '#4338ca' }}>
                        {currentGroup.inviteCode}
                      </strong>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => {
                          navigator.clipboard?.writeText(currentGroup.inviteCode || '')
                          showToastMsg(`Copied group invite code: ${currentGroup.inviteCode}`)
                        }}
                        style={{ fontSize: '10px', gap: '3px' }}
                      >
                        <Copy style={{ width: '12px' }} /> Copy
                      </button>
                    </div>
                  </div>
                )}

                {/* Member Roster */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>
                      Enrolled Members ({currentGroup.memberCount})
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentGroup.members.map((member) => (
                      <div
                        key={member.name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 0',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <span className="avatar avatar-tiny">
                          {member.avatar}
                        </span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '11px', color: '#0f172a' }}>
                            {member.name}
                          </strong>
                          <small style={{ color: '#64748b', fontSize: '9px' }}>{member.role}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ====================================================================
          MODAL 1: CREATE STUDY GROUP
          ==================================================================== */}
      {showCreateGroup && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowCreateGroup(false)}
        >
          <form className="event-dialog" onSubmit={handleCreateGroupSubmit} style={{ width: 'min(100%, 500px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Student Groups</p>
                <h2>Create a Study Group / Project Team</h2>
                <p>Start a collaborative room and invite classmates with a 6-digit code.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCreateGroup(false)}
              >
                <X />
              </button>
            </div>

            <label>
              Group Name
              <input name="name" required placeholder="e.g. CSC 401 Project Team Gamma" autoFocus />
            </label>

            <label>
              Description & Objectives
              <textarea
                name="desc"
                rows={3}
                placeholder="What is the group focused on? (e.g. Sprint meetings, past question revision)"
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
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Plus /> Create group & generate code
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: JOIN WITH 6-DIGIT CODE
          ==================================================================== */}
      {showJoinCodeModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowJoinCodeModal(false)}
        >
          <form className="event-dialog" onSubmit={handleJoinByCodeSubmit} style={{ width: 'min(100%, 420px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Group Invite</p>
                <h2>Join with Group Code</h2>
                <p>Enter the 6-digit PIN shared by your course rep or project team lead.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowJoinCodeModal(false)}
              >
                <X />
              </button>
            </div>

            <label>
              Enter Code
              <input
                name="code"
                required
                placeholder="e.g. CR-GRP4 or CSC401-MAIN"
                autoFocus
                style={{ textAlign: 'center', fontSize: '16px', letterSpacing: '0.1em', fontWeight: 800 }}
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowJoinCodeModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Hash /> Join group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: START NEW DIRECT MESSAGE
          ==================================================================== */}
      {showNewDMModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowNewDMModal(false)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 480px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Direct Message</p>
                <h2>Select Classmate or Course Rep</h2>
                <p>Choose an enrolled peer from your cohort to start a real-time chat.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowNewDMModal(false)}
              >
                <X />
              </button>
            </div>

            {/* Live Search Input */}
            <div style={{ position: 'relative', margin: '6px 0 12px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '10px', width: '15px', height: '15px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search registered peers by name or role..."
                value={dmSearchQuery}
                onChange={(e) => setDmSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'inherit',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {contacts.filter((c) =>
                dmSearchQuery.trim() === '' ||
                c.name.toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
                c.role.toLowerCase().includes(dmSearchQuery.toLowerCase())
              ).length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                  <UserPlus style={{ width: '28px', height: '28px', margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ margin: '0 0 6px', fontWeight: 600, color: 'var(--foreground)' }}>
                    {dmSearchQuery ? `No registered peers matching "${dmSearchQuery}"` : 'No registered peers yet'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px' }}>
                    Enter their registered email or student ID below to initiate a private direct message.
                  </p>
                </div>
              ) : (
                contacts
                  .filter((c) =>
                    dmSearchQuery.trim() === '' ||
                    c.name.toLowerCase().includes(dmSearchQuery.toLowerCase()) ||
                    c.role.toLowerCase().includes(dmSearchQuery.toLowerCase())
                  )
                  .map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => handleStartDM(c)}
                      className="dm-peer-card"
                    >
                      <span className="avatar avatar-small">{c.avatar}</span>
                      <div className="dm-peer-info">
                        <strong>{c.name}</strong>
                        <small>{c.role}</small>
                      </div>
                      <ChevronRight className="dm-peer-chevron" />
                    </button>
                  ))
              )}
            </div>

            {/* Direct Connect by ID or Email */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Or message by classmate email or ID:
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!directRecipientInput.trim()) return
                  const input = directRecipientInput.trim()
                  const idNum = parseInt(input.replace(/\D/g, '')) || Date.now()
                  const newContact: DirectContact = {
                    id: `dm-${idNum}`,
                    name: input.includes('@') ? input.split('@')[0] : `Peer #${input}`,
                    role: 'Student',
                    department: 'Computer Science',
                    level: '400L',
                    online: true,
                    avatar: input.slice(0, 2).toUpperCase(),
                    lastMessage: 'Direct conversation started',
                    time: 'Active now',
                  }
                  handleStartDM(newContact)
                  setDirectRecipientInput('')
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  placeholder="e.g. peer@university.edu or student ID"
                  value={directRecipientInput}
                  onChange={(e) => setDirectRecipientInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'inherit',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="primary-button"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Start Chat
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          WHATSAPP FULL-SCREEN IMAGE LIGHTBOX MODAL
          ==================================================================== */}
      {lightboxImage && (
        <div
          className="whatsapp-lightbox-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxImage(null)
              setIsZoomed(false)
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
        >
          {/* Header Bar */}
          <div className="whatsapp-lightbox-header">
            <div className="whatsapp-lightbox-sender">
              <span className="avatar avatar-small" style={{ background: '#4338ca', color: '#fff', fontWeight: 700 }}>
                {lightboxImage.sender.substring(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{lightboxImage.sender}</strong>
                <small>{lightboxImage.name} · {lightboxImage.time}</small>
              </div>
            </div>

            <div className="whatsapp-lightbox-actions">
              <button
                type="button"
                className="lightbox-btn"
                onClick={() => setIsZoomed((z) => !z)}
                title={isZoomed ? "Reset zoom (100%)" : "Zoom in"}
              >
                {isZoomed ? <ZoomOut style={{ width: 14, height: 14 }} /> : <ZoomIn style={{ width: 14, height: 14 }} />}
                <span>{isZoomed ? "100%" : "Zoom"}</span>
              </button>

              <a
                href={lightboxImage.url}
                download={lightboxImage.name}
                className="lightbox-btn"
                title="Save image to device"
                target="_blank"
                rel="noreferrer"
              >
                <Download style={{ width: 14, height: 14 }} />
                <span>Save</span>
              </a>

              <button
                type="button"
                className="lightbox-btn"
                onClick={() => {
                  setLightboxImage(null)
                  setIsZoomed(false)
                }}
                aria-label="Close image lightbox"
                title="Close (Esc)"
              >
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          </div>

          {/* Image Display Area */}
          <div
            className="whatsapp-lightbox-body"
            onClick={() => setIsZoomed((z) => !z)}
            title="Click to toggle zoom"
            style={{ cursor: isZoomed ? 'zoom-out' : 'zoom-in' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="whatsapp-lightbox-img"
              style={{
                transform: isZoomed ? 'scale(1.65)' : 'scale(1)',
                transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </div>

          {/* Optional Caption Footer */}
          {lightboxImage.caption && (
            <div className="whatsapp-lightbox-caption">
              <span>{lightboxImage.caption}</span>
            </div>
          )}
        </div>
      )}

      {/* Toast Notification */}
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
