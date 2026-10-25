'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowUp,
  Award,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
  Percent,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import { getEnrolledCourses, type Course } from '@/lib/data'
import { defaultUserProfile, getUserProfile, type UserProfile } from '@/lib/user-profile'
import { getAcademicHistory, recalculateAcademicHistory, type AcademicHistory, GRADE_POINT_MAP } from '@/lib/academic-records'
import { api, getAtlasWebSocketUrl } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AuditCourseItem {
  code: string
  name: string
  units: number
  caScore: number
  caMax: number
  minExamForA: number
  trajectory: 'Safe' | 'Strong' | 'Highest Risk'
}

interface ChatMessage {
  id: string
  sender: 'student' | 'atlas'
  text: string
  timestamp: string
  isInitialAudit?: boolean
  auditData?: {
    cgpa: string
    degreeClass: string
    targetCGPA: number
    unitsEarned: number
    unitsRequired: number
    remainingUnits: number
    coursesCount: number
    registeredUnits: number
    courses: AuditCourseItem[]
  }
  highlightCard?: {
    title: string
    stats: { label: string; value: string; tone?: 'success' | 'urgent' | 'primary' }[]
    note?: string
  }
  suggestions?: { label: string; prompt: string }[]
}

const DEFAULT_SUGGESTIONS = [
  {
    label: "🎯 Minimum exam scores for an 'A'",
    prompt: "Break down the exact minimum exam marks I need out of 70 for each of my registered courses to secure Grade A.",
  },
  {
    label: "⚠️ Which course is my biggest grade risk?",
    prompt: "Which of my courses poses the highest grade risk this semester, and what is your strategic recommendation?",
  },
  {
    label: "📈 How to graduate with First Class Honours?",
    prompt: "Show me the exact mathematical path and semester GPA required across my remaining units to graduate with First Class Honours.",
  },
  {
    label: "🗓️ Weighted weekly exam revision schedule",
    prompt: "Generate a weekly exam preparation and revision schedule weighted by each course's credit units and CA gaps.",
  },
  {
    label: "💡 Simulate CGPA with all B's (4.0 GPA)",
    prompt: "Simulate my cumulative CGPA if I achieve straight Grade B's (4.00 SGPA) this semester.",
  },
]

function FormattedMessage({ text }: { text: string }) {
  // Normalize bullet items that might be inline like "* **CSC 401:**" on a single line
  const normalizedText = text.replace(/([^\n])\s*\*\s*\*\*/g, '$1\n\n* **')

  return (
    <div className="prose-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="markdown-table-wrapper">
              <table className="markdown-table" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
          td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
          ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          strong: ({ node, ...props }) => <strong className="markdown-strong" {...props} />,
          code: ({ node, ...props }) => <code className="markdown-code" {...props} />,
        }}
      >
        {normalizedText}
      </ReactMarkdown>
    </div>
  )
}

export default function ProfessorAtlasPage() {
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(() =>
    typeof window !== 'undefined' ? getUserProfile() : defaultUserProfile
  )
  const [history, setHistory] = useState<AcademicHistory>(() =>
    typeof window !== 'undefined' ? getAcademicHistory() : recalculateAcademicHistory([])
  )
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(() =>
    typeof window !== 'undefined' ? getEnrolledCourses() : []
  )
  const [backendRecord, setBackendRecord] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')
  const [streamStatusMessage, setStreamStatusMessage] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice Transcriber & Audio Output States
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  // Active semester & course performance audit data
  const auditComputation = useMemo(() => {
    const hasLocalHistory = history.semesters.length > 0 && history.overallCGPA > 0
    const currentCGPA = hasLocalHistory
      ? history.overallCGPA.toFixed(2)
      : backendRecord?.cgpa ? Number(backendRecord.cgpa).toFixed(2) : (history.overallCGPA > 0 ? history.overallCGPA.toFixed(2) : '3.68')

    const numericCGPA = parseFloat(currentCGPA)
    const degreeClass = hasLocalHistory
      ? history.degreeClass.title
      : numericCGPA >= 4.5
        ? 'First Class Honours (1st)'
        : numericCGPA >= 3.5
          ? 'Second Class Upper Division (2:1)'
          : numericCGPA >= 2.4
            ? 'Second Class Lower Division (2:2)'
            : 'Third Class Honours'

    const targetCGPA = profile.targetCGPA || history.targetCGPA || 4.50
    const unitsEarned = hasLocalHistory
      ? history.totalUnitsEarned
      : (backendRecord?.completed_credits ?? (history.totalUnitsEarned > 0 ? history.totalUnitsEarned : 72))
    const unitsRequired = hasLocalHistory
      ? history.totalUnitsRequired
      : (backendRecord?.total_credits ?? (history.totalUnitsRequired > 0 ? history.totalUnitsRequired : 120))
    const remainingUnits = Math.max(0, unitsRequired - unitsEarned)
    const activeSem = history.semesters.find((s) => s.status === 'in_progress') || history.semesters[history.semesters.length - 1]

    const activeCoursesList = enrolledCourses.length > 0
      ? enrolledCourses
      : (typeof window !== 'undefined' ? getEnrolledCourses() : [])

    const coursesData: AuditCourseItem[] = activeCoursesList.map((c, idx) => {
      const match = activeSem?.courses.find((sc) => sc.code.toUpperCase() === c.code.toUpperCase())
      const defaultCA = [24, 21, 26, 19, 27][idx % 5]
      const caScore = match?.score !== undefined ? Math.min(30, Math.round(match.score * 0.35)) : defaultCA
      const caMax = 30
      const minExamForA = Math.max(0, 70 - caScore)
      const trajectory: 'Safe' | 'Strong' | 'Highest Risk' =
        minExamForA >= 48 ? 'Highest Risk' : minExamForA <= 44 ? 'Safe' : 'Strong'

      return {
        code: c.code,
        name: c.name || (c as any).title || c.code,
        units: (c as any).units || 3,
        caScore,
        caMax,
        minExamForA,
        trajectory,
      }
    })

    const registeredUnits = activeCoursesList.reduce((sum, c) => sum + (c.units || 3), 0)

    return {
      currentCGPA,
      degreeClass,
      targetCGPA,
      unitsEarned,
      unitsRequired,
      remainingUnits,
      registeredUnits,
      courses: coursesData,
    }
  }, [history, enrolledCourses, profile, backendRecord])

  // Build the initial streamlined analysis message
  const createInitialAuditMessage = (): ChatMessage => {
    const firstName = profile.name ? profile.name.split(' ')[0] : 'Student'
    const { currentCGPA, degreeClass, targetCGPA, unitsEarned, unitsRequired, remainingUnits, registeredUnits, courses } = auditComputation

    const highRiskCourse = courses.find((c) => c.trajectory === 'Highest Risk') || courses[courses.length - 1]

    return {
      id: 'atlas-initial-audit',
      sender: 'atlas',
      timestamp: 'Diagnostic Audit',
      isInitialAudit: true,
      text: `Hello ${firstName}. I have completed an automated audit of your academic profile based on your official academic records and current semester registrations.\n\n### 🎓 Executive Diagnostic Summary\n* **Academic Standing:** You are currently on **${degreeClass}** with a cumulative CGPA of **${currentCGPA} / 5.00**.\n* **Degree Completion:** You have earned **${unitsEarned} / ${unitsRequired} Credit Units** (${Math.round((unitsEarned / unitsRequired) * 100)}%), with **${remainingUnits} Units** remaining to graduate.\n* **Current Term:** You are enrolled in **${courses.length} courses** totaling **${registeredUnits} credit units**.\n* **Continuous Assessment:** Under the NUC 30:70 Continuous Assessment framework, your continuous assessment baseline is active. ${highRiskCourse ? `Pay special attention to **${highRiskCourse.code}**, requiring **${highRiskCourse.minExamForA}/70** in the final examination to secure an 'A'.` : ''}\n\nReview your course-by-course breakdown and exam targets below. You can select an action chip to proceed, or ask me any question in the prompt below.`,
      auditData: {
        cgpa: currentCGPA,
        degreeClass,
        targetCGPA,
        unitsEarned,
        unitsRequired,
        remainingUnits,
        coursesCount: courses.length,
        registeredUnits,
        courses,
      },
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  const [messages, setMessages] = useState<ChatMessage[]>(() => [createInitialAuditMessage()])

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = false
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onstart = () => {
            setIsListening(true)
          }

          recognition.onresult = (event: any) => {
            let transcript = ''
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript
            }
            if (transcript.trim()) {
              setQuestion(transcript)
            }
          }

          recognition.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error)
            setIsListening(false)
          }

          recognition.onend = () => {
            setIsListening(false)
          }

          recognitionRef.current = recognition
        } catch {
          setSpeechSupported(false)
        }
      } else {
        setSpeechSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Voice transcription requires browser speech recognition support (Google Chrome, Microsoft Edge, or Safari).')
      return
    }

    if (isListening) {
      try {
        recognitionRef.current.stop()
      } catch {}
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn(err)
        setIsListening(false)
      }
    }
  }

  const speakText = (text: string, messageId: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleaned = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/`/g, '')

    const utterance = new SpeechSynthesisUtterance(cleaned)
    utterance.rate = 1.05
    utterance.pitch = 1.0

    utterance.onend = () => {
      setSpeakingMessageId(null)
    }
    utterance.onerror = () => {
      setSpeakingMessageId(null)
    }

    setSpeakingMessageId(messageId)
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeakingMessageId(null)
    }
  }

  // Real-time WebSocket connection to Professor Atlas Intelligence Stream
  const connectWebSocket = () => {
    if (typeof window === 'undefined') return

    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {}
      wsRef.current = null
    }

    setWsStatus('connecting')
    const wsUrl = getAtlasWebSocketUrl()

    try {
      const socket = new WebSocket(wsUrl)
      wsRef.current = socket

      socket.onopen = () => {
        setWsStatus('connected')
        setStreamStatusMessage(null)
      }

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'connected') {
            setWsStatus('connected')
            if (payload.record) {
              setBackendRecord(payload.record)
            }
          } else if (payload.type === 'thinking') {
            setIsTyping(true)
            setStreamStatusMessage(payload.message || 'Prof. Zikora is evaluating your course progress and records...')
          } else if (payload.type === 'answer') {
            setIsTyping(false)
            setStreamStatusMessage(null)
            if (payload.answer) {
              const responseMsg: ChatMessage = {
                id: `atlas-${Date.now()}`,
                sender: 'atlas',
                text: payload.answer,
                timestamp: 'Just now',
                suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
              }
              setMessages((prev) => [...prev, responseMsg])
              if (voiceAutoSpeak) {
                speakText(responseMsg.text, responseMsg.id)
              }
            }
            if (payload.record) {
              setBackendRecord(payload.record)
            }
          } else if (payload.type === 'error') {
            setIsTyping(false)
            setStreamStatusMessage(null)
            const errorMsg: ChatMessage = {
              id: `atlas-err-${Date.now()}`,
              sender: 'atlas',
              text: `⚠️ **Prof. Zikora**: ${payload.message || 'An error occurred while generating the advice.'}`,
              timestamp: 'Just now',
            }
            setMessages((prev) => [...prev, errorMsg])
          }
        } catch (e) {
          console.warn('Failed to parse Atlas WS message:', e)
        }
      }

      socket.onerror = () => {
        setWsStatus('disconnected')
      }

      socket.onclose = () => {
        setWsStatus('disconnected')
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, 3500)
      }
    } catch (err) {
      console.warn('Atlas WebSocket connection error:', err)
      setWsStatus('disconnected')
    }
  }

  useEffect(() => {
    connectWebSocket()

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {}
      }
    }
  }, [])

  // Listen to profile, records, and courses updates across tabs + sync backend record
  useEffect(() => {
    setMounted(true)
    setProfile(getUserProfile())
    setHistory(getAcademicHistory())

    // 1. Fetch user profile from backend
    api.auth.me().then((u: any) => {
      const user = u?.data || u
      if (user && user.full_name) {
        setProfile((prev) => ({
          ...prev,
          name: user.full_name,
          department: user.department || prev.department,
          level: user.academic_level || prev.level,
        }))
      }
    }).catch(() => {})

    // 2. Fetch academic record from backend
    api.atlas.getRecord().then((res: any) => {
      const rec = res?.data || res
      if (rec && (rec.cgpa !== undefined || rec.completed_credits !== undefined)) {
        setBackendRecord(rec)
      }
    }).catch(() => {})

    // 3. Fetch enrolled courses from backend
    api.courses.getMyEnrolled().then((cList: any) => {
      const cl = Array.isArray(cList) ? cList : cList?.data
      if (Array.isArray(cl)) {
        setEnrolledCourses(cl)
      } else {
        setEnrolledCourses(getEnrolledCourses())
      }
    }).catch(() => {
      setEnrolledCourses(getEnrolledCourses())
    })

    // 4. Fetch persistent conversation history from backend
    api.atlas.getHistory().then((historyList: any) => {
      const list = Array.isArray(historyList) ? historyList : historyList?.data
      if (Array.isArray(list) && list.length > 0) {
        const formatted: ChatMessage[] = list.map((m: any) => ({
          id: `atlas-msg-${m.id}`,
          sender: m.sender === 'student' ? 'student' : 'atlas',
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }))
        setMessages((prev) => {
          const audit = prev.find((m) => m.isInitialAudit) || createInitialAuditMessage()
          return [audit, ...formatted]
        })
      }
    }).catch(() => {})

    const handleProfileUpdate = () => setProfile(getUserProfile())
    const handleHistoryUpdate = () => {
      setHistory(getAcademicHistory())
      setEnrolledCourses(getEnrolledCourses())
    }

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    window.addEventListener('academic-records-updated', handleHistoryUpdate)
    window.addEventListener('enrolled-courses-updated', handleHistoryUpdate)
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
      window.removeEventListener('academic-records-updated', handleHistoryUpdate)
      window.removeEventListener('enrolled-courses-updated', handleHistoryUpdate)
    }
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Reset conversation to initial streamlined audit
  const handleResetChat = () => {
    setMessages([createInitialAuditMessage()])
    setQuestion('')
  }

  // Always keep the executive academic audit up to date with the latest records
  useEffect(() => {
    if (mounted) {
      setMessages((prev) => {
        const updatedAudit = createInitialAuditMessage()
        const otherMessages = prev.filter((m) => !m.isInitialAudit)
        return [updatedAudit, ...otherMessages]
      })
    }
  }, [mounted, backendRecord, history, enrolledCourses, profile])

  // Intelligent Contextual Responses Engine - sent over real-time WebSocket with HTTP fallback
  const handleSendMessage = async (textToSend?: string) => {
    const raw = textToSend || question
    const trimmed = raw.trim()
    if (!trimmed) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: trimmed,
      timestamp: 'Just now',
    }

    setMessages((prev) => [...prev, userMsg])
    setQuestion('')
    setIsTyping(true)

    // 1. Send via WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setStreamStatusMessage('Prof. Zikora is consulting your academic records and curriculum...')
      wsRef.current.send(
        JSON.stringify({
          type: 'ask',
          question: trimmed,
        })
      )
      return
    }

    // 2. HTTP Fallback if WebSocket is connecting or offline
    try {
      setStreamStatusMessage('Connecting via HTTP Fallback...')
      const res: any = await api.atlas.ask(trimmed)
      const answer = res?.answer || res?.data?.answer
      if (answer) {
        const response: ChatMessage = {
          id: `atlas-${Date.now()}`,
          sender: 'atlas',
          text: answer,
          timestamp: 'Just now',
          suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
        }
        setMessages((prev) => [...prev, response])
        setIsTyping(false)
        setStreamStatusMessage(null)

        if (voiceAutoSpeak) {
          speakText(response.text, response.id)
        }
        return
      }
      throw new Error('No answer returned from server.')
    } catch (err: any) {
      console.warn('Backend Atlas AI error:', err)
      const errorMsg = err?.message || 'Unable to connect to Prof. Zikora right now. Please check your network and try again.'
      const response: ChatMessage = {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `⚠️ **Prof. Zikora**: ${errorMsg}`,
        timestamp: 'Just now',
      }
      setMessages((prev) => [...prev, response])
      setIsTyping(false)
      setStreamStatusMessage(null)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage()
  }

  return (
    <>
      <PageHeader
        title="Prof. Zikora"
        subtitle="AI Academic Intelligence Analyst · Personalized mathematical analysis of your registered courses and academic records."
        action={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`outline-button ${voiceAutoSpeak ? 'active' : ''}`}
              onClick={() => {
                setVoiceAutoSpeak(!voiceAutoSpeak)
                if (speakingMessageId) stopSpeaking()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                background: voiceAutoSpeak ? 'rgba(15, 118, 110, 0.12)' : undefined,
                color: voiceAutoSpeak ? '#0f766e' : undefined,
                borderColor: voiceAutoSpeak ? '#0f766e' : undefined,
              }}
              title="Toggle reading AI answers aloud"
            >
              {voiceAutoSpeak ? <Volume2 style={{ width: '14px' }} /> : <VolumeX style={{ width: '14px' }} />}
              <span>Auto-Speak: {voiceAutoSpeak ? 'On' : 'Off'}</span>
            </button>
            <button
              type="button"
              className="text-button"
              onClick={handleResetChat}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Restart academic audit"
            >
              <RotateCcw style={{ width: '13px' }} /> Restart Audit
            </button>
            <Link
              href="/dashboard/records"
              className="outline-button"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <GraduationCap style={{ width: '14px' }} /> View Academic Records
            </Link>
          </div>
        }
      />

      <div className="atlas-streamlined-shell">
        {/* Sleek Live Status Bar */}
        <div className="atlas-sync-bar">
          <div className="atlas-sync-info">
            <span className="atlas-sync-dot" />
            <span>
              <strong>Record Synced:</strong> {profile.name} · {profile.department} ({profile.level}) ·{' '}
              <strong style={{ color: '#0f766e' }}>{auditComputation.currentCGPA} CGPA</strong> ({auditComputation.degreeClass}) ·{' '}
              <strong>{auditComputation.courses.length} Registered Courses</strong> ({auditComputation.registeredUnits} Units)
            </span>
          </div>
          <div className="atlas-sync-actions">
            <Link
              href="/dashboard/courses"
              className="text-button"
              style={{ fontSize: '11.5px', color: '#0f766e', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <BookOpen style={{ width: '13px' }} /> My Courses <ChevronRight style={{ width: '12px' }} />
            </Link>
          </div>
        </div>

        {/* Unified Conversational Intelligence Workspace */}
        <div className="atlas-streamlined-chat">
          <div className="panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#ccfbf1',
                  color: '#0f766e',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Brain style={{ width: '18px', height: '18px' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '14px', margin: 0, fontWeight: 700 }}>Academic Intelligence Stream</h2>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Calibrated to your NUC 5.0 continuous assessment and curriculum records
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#94a3b8',
                  background: wsStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : wsStatus === 'connecting' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${wsStatus === 'connected' ? 'rgba(16, 185, 129, 0.28)' : wsStatus === 'connecting' ? 'rgba(245, 158, 11, 0.28)' : 'rgba(148, 163, 184, 0.2)'}`,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#94a3b8',
                    display: 'inline-block',
                  }}
                />
                {wsStatus === 'connected' ? 'WebSocket Live Stream' : wsStatus === 'connecting' ? 'Connecting Stream...' : 'HTTP Fallback'}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 650,
                  color: '#0f766e',
                  background: 'rgba(20, 184, 166, 0.1)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(20, 184, 166, 0.2)',
                }}
              >
                <ShieldCheck style={{ width: '13px' }} /> Verified NUC Formula
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="atlas-streamlined-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`atlas-message ${msg.sender === 'atlas' ? 'atlas-message-ai' : 'atlas-message-student'}`}
                style={{ maxWidth: msg.isInitialAudit ? '100%' : '90%' }}
              >
                <span className="atlas-avatar">
                  {msg.sender === 'atlas' ? <Brain /> : profile.name.substring(0, 2).toUpperCase()}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong>{msg.sender === 'atlas' ? 'Prof. Zikora (Academic Intelligence)' : `${profile.name} (You)`}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {msg.sender === 'atlas' && (
                        <button
                          type="button"
                          className={`atlas-speech-btn ${speakingMessageId === msg.id ? 'is-speaking' : ''}`}
                          onClick={() => speakText(msg.text, msg.id)}
                          title={speakingMessageId === msg.id ? 'Stop speech' : 'Listen to response'}
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <Square style={{ width: '11px', height: '11px', fill: '#0f766e' }} />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 style={{ width: '12px', height: '12px' }} />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      )}
                      <small style={{ fontSize: '10px', color: '#94a3b8' }}>{msg.timestamp}</small>
                    </div>
                  </div>

                  <FormattedMessage text={msg.text} />

                  {/* INITIAL AUDIT PRESENTATION */}
                  {msg.isInitialAudit && msg.auditData && (
                    <div style={{ marginTop: '14px' }}>
                      {/* Metric Summary Cards 4-Column Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                          gap: '10px',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', display: 'block' }}>Cumulative CGPA</span>
                          <strong style={{ fontSize: '16px', color: '#0f766e', display: 'block', marginTop: '2px' }}>
                            {msg.auditData.cgpa} / 5.00
                          </strong>
                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>{msg.auditData.degreeClass}</span>
                        </div>

                        <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', display: 'block' }}>Honours Target</span>
                          <strong style={{ fontSize: '16px', color: '#4338ca', display: 'block', marginTop: '2px' }}>
                            {msg.auditData.targetCGPA.toFixed(2)} CGPA
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>First Class Cutoff: 4.50+</span>
                        </div>

                        <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', display: 'block' }}>Credit Completion</span>
                          <strong style={{ fontSize: '16px', color: 'var(--foreground)', display: 'block', marginTop: '2px' }}>
                            {msg.auditData.unitsEarned} / {msg.auditData.unitsRequired} Units
                          </strong>
                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
                            {Math.round((msg.auditData.unitsEarned / msg.auditData.unitsRequired) * 100)}% Completed
                          </span>
                        </div>

                        <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--muted-foreground)', display: 'block' }}>Current Semester Load</span>
                          <strong style={{ fontSize: '16px', color: 'var(--foreground)', display: 'block', marginTop: '2px' }}>
                            {msg.auditData.coursesCount} Courses
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--muted-foreground)' }}>
                            {msg.auditData.registeredUnits} Credit Units Registered
                          </span>
                        </div>
                      </div>

                      {/* Course Assessment (30:70) & Exam Targets Table */}
                      <strong style={{ fontSize: '11px', color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                        Registered Course Breakdown &amp; Exam Targets (30:70 Split)
                      </strong>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="atlas-audit-table">
                          <thead>
                            <tr>
                              <th>Course</th>
                              <th style={{ textAlign: 'center' }}>Units</th>
                              <th style={{ textAlign: 'center' }}>CA Mark (30)</th>
                              <th style={{ textAlign: 'center' }}>Min Exam for &apos;A&apos; (70)</th>
                              <th style={{ textAlign: 'center' }}>Standing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {msg.auditData.courses.length === 0 ? (
                              <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--muted-foreground)' }}>
                                  No enrolled courses found. Please enroll your courses in My Courses to populate your assessment audit.
                                </td>
                              </tr>
                            ) : (
                              msg.auditData.courses.map((c) => (
                                <tr key={c.code}>
                                  <td>
                                    <strong>{c.code}</strong>
                                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted-foreground)' }}>{c.name}</span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 650 }}>{c.units} Units</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#0f766e' }}>
                                      {c.caScore} / {c.caMax}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      style={{
                                        fontWeight: 750,
                                        color: c.minExamForA >= 48 ? '#ef4444' : c.minExamForA <= 44 ? '#10b981' : '#4338ca',
                                      }}
                                    >
                                      Need {c.minExamForA} / 70
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      className="course-pill"
                                      style={{
                                        fontSize: '10px',
                                        background:
                                          c.trajectory === 'Highest Risk'
                                            ? 'rgba(239, 68, 68, 0.12)'
                                            : c.trajectory === 'Safe'
                                            ? 'rgba(16, 185, 129, 0.12)'
                                            : 'rgba(99, 102, 241, 0.12)',
                                        color:
                                          c.trajectory === 'Highest Risk'
                                            ? '#ef4444'
                                            : c.trajectory === 'Safe'
                                            ? '#10b981'
                                            : '#6366f1',
                                      }}
                                    >
                                      {c.trajectory}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Highlight Box for conversational follow-ups */}
                  {msg.highlightCard && (
                    <div className="atlas-highlight-box">
                      <strong style={{ fontSize: '11px', color: 'var(--foreground)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {msg.highlightCard.title}
                      </strong>
                      <div className="atlas-stat-grid">
                        {msg.highlightCard.stats.map((st, i) => (
                          <div key={i} className="atlas-stat-item">
                            <span>{st.label}</span>
                            <strong
                              style={{
                                color:
                                  st.tone === 'success'
                                    ? '#10b981'
                                    : st.tone === 'urgent'
                                    ? '#ef4444'
                                    : st.tone === 'primary'
                                    ? '#0f766e'
                                    : undefined,
                              }}
                            >
                              {st.value}
                            </strong>
                          </div>
                        ))}
                      </div>
                      {msg.highlightCard.note && (
                        <small style={{ display: 'block', marginTop: '10px', fontSize: '11px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                          💡 {msg.highlightCard.note}
                        </small>
                      )}
                    </div>
                  )}

                  {/* CLICKABLE SUGGESTIONS CHIPS WITHIN CHAT INTERFACE */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="atlas-suggestions-tray">
                      <span style={{ width: '100%', fontSize: '11px', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        Suggested Inquiries:
                      </span>
                      {msg.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="atlas-suggestion-chip"
                          onClick={() => handleSendMessage(sug.prompt)}
                          disabled={isTyping}
                        >
                          <Sparkles style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                          <span>{sug.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="atlas-message atlas-message-ai">
                <span className="atlas-avatar">
                  <Brain />
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px' }}>
                  <Sparkles style={{ width: '14px', height: '14px', color: '#0f766e' }} />
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                    {streamStatusMessage || 'Prof. Zikora is recalculating academic records and grade matrices...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Voice Listening Banner */}
          {isListening && (
            <div className="atlas-voice-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="atlas-voice-dot" />
                <span>Voice Transcriber Active: Speak your question now...</span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done speaking
              </button>
            </div>
          )}

          {/* Streamlined Prompt Composer with Voice Input */}
          <form className="atlas-composer" onSubmit={handleFormSubmit}>
            {/* Microphone Button */}
            <button
              type="button"
              className={`atlas-mic-btn ${isListening ? 'is-listening' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Talk to Prof. Zikora (Voice Input)'}
              aria-label="Voice input"
            >
              {isListening ? (
                <MicOff style={{ width: '19px', height: '19px' }} />
              ) : (
                <Mic style={{ width: '19px', height: '19px' }} />
              )}
            </button>

            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening... your words will appear here in real-time...'
                  : 'Ask Prof. Zikora or click the microphone to talk...'
              }
              aria-label="Ask Prof. Zikora"
              disabled={isTyping}
            />

            <button
              type="submit"
              className="primary-button"
              aria-label="Submit question"
              disabled={isTyping || !question.trim()}
              style={{
                opacity: !question.trim() ? 0.6 : 1,
                cursor: !question.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              <ArrowUp style={{ width: '18px', height: '18px' }} />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
