'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
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
import { api, getWebSocketUrl, getAuthToken, type ChatGroup, type ChatMessage } from '@/lib/api'
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

const sprintArchSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%230f172a" rx="12"/><rect x="15" y="15" width="570" height="350" fill="%231e293b" rx="8" stroke="%23334155" stroke-width="2"/><text x="40" y="55" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold">CSC 401 %C2%B7 Sprint Architecture %26 Burndown</text><rect x="40" y="90" width="140" height="90" rx="8" fill="%230f172a" stroke="%2338bdf8" stroke-width="2"/><text x="55" y="130" fill="%23f8fafc" font-family="sans-serif" font-size="13" font-weight="bold">Product Backlog</text><text x="55" y="155" fill="%2394a3b8" font-family="sans-serif" font-size="11">24 User Stories</text><line x1="180" y1="135" x2="230" y2="135" stroke="%2338bdf8" stroke-width="2"/><rect x="230" y="90" width="140" height="90" rx="8" fill="%230f172a" stroke="%23818cf8" stroke-width="2"/><text x="245" y="130" fill="%23f8fafc" font-family="sans-serif" font-size="13" font-weight="bold">Sprint Backlog</text><text x="245" y="155" fill="%2394a3b8" font-family="sans-serif" font-size="11">Milestone 1 Tasks</text><line x1="370" y1="135" x2="420" y2="135" stroke="%23818cf8" stroke-width="2"/><rect x="420" y="90" width="140" height="90" rx="8" fill="%230f172a" stroke="%2334d399" stroke-width="2"/><text x="445" y="130" fill="%23f8fafc" font-family="sans-serif" font-size="13" font-weight="bold">Shipped</text><text x="445" y="155" fill="%2334d399" font-family="sans-serif" font-size="11">CI/CD Pass</text><path d="M 50 300 Q 180 230, 300 270 T 540 210" fill="none" stroke="%23f59e0b" stroke-width="3"/><text x="40" y="340" fill="%23fbbf24" font-family="sans-serif" font-size="12">%E2%98%85 Burndown trajectory approved by Dr. Okafor</text></svg>`

const aStarGraphSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380"><rect width="600" height="380" fill="%230f172a" rx="12"/><rect x="15" y="15" width="570" height="350" fill="%231e1b4b" rx="8" stroke="%234338ca" stroke-width="2"/><text x="40" y="55" fill="%23a5b4fc" font-family="sans-serif" font-size="16" font-weight="bold">CSC 403 %C2%B7 A* Search Graph (Slide 24)</text><circle cx="300" cy="110" r="26" fill="%234338ca" stroke="%23c7d2fe" stroke-width="2"/><text x="294" y="116" fill="%23fff" font-family="sans-serif" font-size="16" font-weight="bold">S</text><circle cx="180" cy="205" r="24" fill="%23312e81" stroke="%23818cf8" stroke-width="2"/><text x="174" y="211" fill="%23fff" font-family="sans-serif" font-size="15" font-weight="bold">A</text><circle cx="420" cy="205" r="24" fill="%23312e81" stroke="%23818cf8" stroke-width="2"/><text x="414" y="211" fill="%23fff" font-family="sans-serif" font-size="15" font-weight="bold">B</text><circle cx="300" cy="295" r="26" fill="%23065f46" stroke="%236ee7b7" stroke-width="2"/><text x="293" y="301" fill="%23fff" font-family="sans-serif" font-size="16" font-weight="bold">G</text><line x1="280" y1="125" x2="200" y2="185" stroke="%23818cf8" stroke-width="2"/><text x="215" y="150" fill="%23c7d2fe" font-family="sans-serif" font-size="11">c=3, h=5</text><line x1="320" y1="125" x2="400" y2="185" stroke="%23818cf8" stroke-width="2"/><text x="365" y="150" fill="%23c7d2fe" font-family="sans-serif" font-size="11">c=4, h=3</text><line x1="195" y1="225" x2="280" y2="280" stroke="%23818cf8" stroke-width="2"/><line x1="405" y1="225" x2="320" y2="280" stroke="%2334d399" stroke-width="3"/><text x="375" y="265" fill="%236ee7b7" font-family="sans-serif" font-size="12">Optimal f(n)=7</text><text x="40" y="345" fill="%2394a3b8" font-family="sans-serif" font-size="11">Formula: f(n) = g(n) + h(n) | Goal node G reached with minimum cost</text></svg>`

export function ChatView({ direct = false }: { direct?: boolean }) {
  // Pre-configured channels matching university courses
  const [channels, setChannels] = useState<GroupChannel[]>([
    {
      id: 'grp-1',
      name: 'CSC 401 · Software Engineering Class',
      category: 'course',
      codeTag: 'Auto-enrolled via CSC 401',
      memberCount: 148,
      description: 'Official class channel for Software Engineering. Lecture updates, sprint project coordination, and slide distributions.',
      inviteCode: 'CSC401-MAIN',
      members: [
        { name: 'Daniel Chukwu', role: 'Course Representative', avatar: 'DC' },
        { name: 'Dr. Adaeze Okafor', role: 'Senior Lecturer', avatar: 'AO' },
        { name: 'Peter Chijioke (You)', role: 'Student · 400L', avatar: 'PE' },
        { name: 'Amaka Nwosu', role: 'Student · 400L', avatar: 'AN' },
        { name: 'David Obi', role: 'Student · 400L', avatar: 'DO' },
      ],
    },
    {
      id: 'grp-2',
      name: 'CSC 403 · Artificial Intelligence Class',
      category: 'course',
      codeTag: 'Auto-enrolled via CSC 403',
      memberCount: 148,
      description: 'Heuristic search assignments, Jupyter notebook discussions, and AI past question review.',
      inviteCode: 'CSC403-CLASS',
      members: [
        { name: 'Daniel Chukwu', role: 'Course Representative', avatar: 'DC' },
        { name: 'Prof. Kingsley Bassey', role: 'Professor', avatar: 'KB' },
        { name: 'Peter Chijioke (You)', role: 'Student · 400L', avatar: 'PE' },
        { name: 'Mariam Yusuf', role: 'Student · 400L', avatar: 'MY' },
      ],
    },
    {
      id: 'grp-3',
      name: '400 Level Computer Science (General)',
      category: 'department',
      codeTag: 'Department Cohort',
      memberCount: 162,
      description: 'General departmental notices, faculty events, clearance deadlines, and general student union directives.',
      inviteCode: 'CS400-ALL',
      members: [
        { name: 'Daniel Chukwu', role: 'Department Rep', avatar: 'DC' },
        { name: 'HOD Office / Staff', role: 'Faculty Admin', avatar: 'HO' },
        { name: 'Peter Chijioke (You)', role: 'Student · 400L', avatar: 'PE' },
      ],
    },
    {
      id: 'grp-4',
      name: 'Group 4 Sprint Project Team',
      category: 'study_group',
      codeTag: 'Project Cell · 6 Members',
      memberCount: 6,
      description: 'Team space for CSC 401 sprint backlog milestone 1 and GitHub repository work.',
      inviteCode: 'CR-GRP4',
      members: [
        { name: 'Peter Chijioke (You)', role: 'Team Lead', avatar: 'PE' },
        { name: 'Amaka Nwosu', role: 'Backend Dev', avatar: 'AN' },
        { name: 'David Obi', role: 'Frontend Dev', avatar: 'DO' },
        { name: 'Chinonso Eze', role: 'QA Tester', avatar: 'CE' },
      ],
    },
  ])

  // Direct message contacts
  const [contacts, setContacts] = useState<DirectContact[]>([
    {
      id: 'dm-1',
      name: 'Daniel Chukwu',
      role: 'Course Representative (CSC 400L)',
      department: 'Computer Science',
      level: '400L',
      online: true,
      avatar: 'DC',
      lastMessage: 'Sure Peter, I will announce the venue change before 10 AM.',
      time: '12m ago',
    },
    {
      id: 'dm-2',
      name: 'Amaka Nwosu',
      role: 'Study Partner · 400L',
      department: 'Computer Science',
      level: '400L',
      online: true,
      avatar: 'AN',
      lastMessage: 'Have you checked the search algorithms slide 24?',
      time: '2h ago',
    },
    {
      id: 'dm-3',
      name: 'Mariam Yusuf',
      role: 'Classmate · 400L',
      department: 'Computer Science',
      level: '400L',
      online: false,
      avatar: 'MY',
      lastMessage: 'Thanks for sharing the past questions PDF!',
      time: 'Yesterday',
    },
    {
      id: 'dm-4',
      name: 'David Obi',
      role: 'Marketplace Seller',
      department: 'Computer Science',
      level: '400L',
      online: true,
      avatar: 'DO',
      lastMessage: 'Yes, the scientific calculator is still available at Hall 3.',
      time: '2d ago',
    },
  ])

  // Active selections
  const [activeGroupId, setActiveGroupId] = useState('grp-1')
  const [activeContactId, setActiveContactId] = useState('dm-1')

  // Lightbox & image zoom state
  const [lightboxImage, setLightboxImage] = useState<{
    url: string
    name: string
    sender: string
    time: string
    caption?: string
  } | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  // Messages per conversation state
  const [conversationMessages, setConversationMessages] = useState<Record<string, MessageItem[]>>({
    'grp-1': [
      {
        id: 'm-1',
        sender: 'Daniel Chukwu',
        avatar: 'DC',
        role: 'rep',
        text: 'Good morning everyone! Quick reminder: Dr. Okafor moved today\'s CSC 401 lecture from ICT Centre to Lecture Hall B.',
        time: '9:30 AM',
        isMine: false,
      },
      {
        id: 'm-2',
        sender: 'Amaka Nwosu',
        avatar: 'AN',
        role: 'student',
        text: 'Thanks Daniel. Is the sprint backlog submission still due on Friday?',
        time: '9:38 AM',
        isMine: false,
      },
      {
        id: 'm-3',
        sender: 'Daniel Chukwu',
        avatar: 'DC',
        role: 'rep',
        text: 'Yes, Friday 11:59 PM on the department portal. Group leaders should upload their GitHub link.',
        time: '9:40 AM',
        isMine: false,
      },
      {
        id: 'm-4',
        sender: 'Peter Chijioke (You)',
        avatar: 'PE',
        role: 'you',
        text: 'Got it, Group 4 has already finalized our sprint burn-down PDF.',
        time: '9:45 AM',
        isMine: true,
      },
      {
        id: 'm-5',
        sender: 'Daniel Chukwu',
        avatar: 'DC',
        role: 'rep',
        text: 'Here is the sprint architecture diagram shared on the board today for everyone\'s reference.',
        time: '9:52 AM',
        isMine: false,
        attachment: {
          name: 'CSC401_Sprint_Architecture.png',
          url: sprintArchSvg,
          type: 'image/png',
          isImage: true,
        },
      },
    ],
    'grp-4': [
      {
        id: 'm-20',
        sender: 'Peter Chijioke (You)',
        avatar: 'PE',
        role: 'you',
        text: 'Hey team, let\'s sync on our sprint backlog milestone 1 before tomorrow.',
        time: 'Yesterday',
        isMine: true,
      },
      {
        id: 'm-21',
        sender: 'Amaka Nwosu',
        avatar: 'AN',
        role: 'student',
        text: 'I pushed the user authentication API endpoints to our GitHub repo.',
        time: 'Yesterday',
        isMine: false,
      },
    ],
    'dm-1': [
      {
        id: 'dm-m-1',
        sender: 'Peter Chijioke (You)',
        avatar: 'PE',
        role: 'you',
        text: 'Hello Daniel, please will the lecturer take attendance in Lecture Hall B today?',
        time: '10:05 AM',
        isMine: true,
      },
      {
        id: 'dm-m-2',
        sender: 'Daniel Chukwu',
        avatar: 'DC',
        role: 'rep',
        text: 'Yes Peter, she mentioned passing around the 400L attendance sheet around 11:00 AM.',
        time: '10:08 AM',
        isMine: false,
      },
    ],
    'dm-2': [
      {
        id: 'dm-m-3',
        sender: 'Amaka Nwosu',
        avatar: 'AN',
        role: 'student',
        text: 'Hi Peter, have you looked at the A* heuristic search question in the past questions?',
        time: '8:15 AM',
        isMine: false,
      },
      {
        id: 'dm-m-4',
        sender: 'Amaka Nwosu',
        avatar: 'AN',
        role: 'student',
        text: 'Check this graph traversal diagram from slide 24. Shows why path through B is optimal.',
        time: '8:20 AM',
        isMine: false,
        attachment: {
          name: 'A_Star_Graph_Slide24.png',
          url: aStarGraphSvg,
          type: 'image/png',
          isImage: true,
        },
      },
    ],
  })

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
  const [toast, setToast] = useState<string | null>(null)

  // WebSocket State
  const wsRef = useRef<WebSocket | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [currentUser, setCurrentUser] = useState({ id: 7, name: 'Peter Chijioke' })

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Active object references
  const currentGroup = channels.find((g) => g.id === activeGroupId) || channels[0]
  const currentContact = contacts.find((c) => c.id === activeContactId) || contacts[0]
  const currentKey = direct ? activeContactId : activeGroupId
  const currentMessages = conversationMessages[currentKey] || []

  // Load current user & groups from backend
  useEffect(() => {
    const initData = async () => {
      try {
        const me = await api.auth.me()
        if (me) {
          setCurrentUser({ id: me.id, name: me.full_name })
        }
      } catch (e) {
        const local = getUserProfile()
        if (local) setCurrentUser({ id: 7, name: local.name })
      }

      try {
        const liveGroups = await api.chat.getGroups()
        if (Array.isArray(liveGroups) && liveGroups.length > 0) {
          const mapped: GroupChannel[] = liveGroups.map((g) => ({
            id: `grp-${g.id}`,
            name: g.name,
            category: 'course',
            codeTag: 'Active Group Room',
            memberCount: 24,
            description: g.description || 'Class discussion room',
            inviteCode: `CR-${g.id}`,
            members: [
              { name: 'Daniel Chukwu', role: 'Course Representative', avatar: 'DC' },
              { name: 'Peter Chijioke (You)', role: 'Student', avatar: 'PE' },
            ],
          }))
          setChannels((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const newChannels = mapped.filter((m) => !existingIds.has(m.id))
            return [...prev, ...newChannels]
          })
        }
      } catch (err) {
        console.warn('Failed to load chat groups from API:', err)
      }
    }

    initData()
  }, [])

  // Setup WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null
    try {
      const url = getWebSocketUrl()
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        if (!direct && activeGroupId) {
          const gid = parseInt(activeGroupId.replace(/\D/g, '')) || 1
          ws?.send(JSON.stringify({ type: 'join_group', group_id: gid }))
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
              time: 'Just now',
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
          // ignore non-json messages
        }
      }
    } catch (e) {
      console.warn('WebSocket init exception:', e)
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [currentUser.id])

  // Join group channel room when group changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !direct && activeGroupId) {
      const gid = parseInt(activeGroupId.replace(/\D/g, '')) || 1
      wsRef.current.send(JSON.stringify({ type: 'join_group', group_id: gid }))
    }
  }, [activeGroupId, direct, wsConnected])

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
      <div className="chat-layout" style={{ position: 'relative' }}>
        {/* Left Sidebar: Channels or Contacts */}
        <aside className="chat-list" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chat-list-header">
            <strong>{direct ? 'Conversations' : 'Channels & Groups'}</strong>
            <span>{direct ? contacts.length : channels.length}</span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!direct ? (
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
                  ? `${currentGroup.description}`
                  : 'End-to-end coordinated student messaging for coursework and campus academic exchange.'}
              </span>
            </div>

            {currentMessages.map((msg) => (
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
            ))}
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
          <div className="event-dialog" style={{ width: 'min(100%, 460px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Direct Message</p>
                <h2>Select Classmate or Course Rep</h2>
                <p>Choose an enrolled peer from your 400L Computer Science cohort.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowNewDMModal(false)}
              >
                <X />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {[
                {
                  id: 'dm-1',
                  name: 'Daniel Chukwu',
                  role: 'Course Representative · 400L',
                  department: 'Computer Science',
                  level: '400L',
                  online: true,
                  avatar: 'DC',
                  lastMessage: 'Tap to chat with Class Rep',
                  time: 'Active',
                },
                {
                  id: 'dm-2',
                  name: 'Amaka Nwosu',
                  role: 'Student · 400L',
                  department: 'Computer Science',
                  level: '400L',
                  online: true,
                  avatar: 'AN',
                  lastMessage: 'Tap to chat with Amaka',
                  time: 'Active',
                },
                {
                  id: 'dm-3',
                  name: 'Mariam Yusuf',
                  role: 'Student · 400L',
                  department: 'Computer Science',
                  level: '400L',
                  online: false,
                  avatar: 'MY',
                  lastMessage: 'Tap to chat with Mariam',
                  time: 'Offline',
                },
                {
                  id: 'dm-4',
                  name: 'David Obi',
                  role: 'Marketplace Seller & Classmate',
                  department: 'Computer Science',
                  level: '400L',
                  online: true,
                  avatar: 'DO',
                  lastMessage: 'Tap to chat with David',
                  time: 'Active',
                },
                {
                  id: 'dm-5',
                  name: 'Chinonso Eze',
                  role: 'Student · 400L',
                  department: 'Computer Science',
                  level: '400L',
                  online: true,
                  avatar: 'CE',
                  lastMessage: 'Start new message',
                  time: 'Active',
                },
              ].map((c) => (
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
              ))}
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
