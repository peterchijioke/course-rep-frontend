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
import { getAcademicHistory, type AcademicHistory, GRADE_POINT_MAP } from '@/lib/academic-records'

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

export default function ProfessorAtlasPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile)
  const [history, setHistory] = useState<AcademicHistory>(() => getAcademicHistory())
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>(() => getEnrolledCourses())
  const [question, setQuestion] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Voice Transcriber & Audio Output States
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [voiceAutoSpeak, setVoiceAutoSpeak] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

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

  // Listen to profile, records, and courses updates across tabs
  useEffect(() => {
    setProfile(getUserProfile())
    setHistory(getAcademicHistory())
    setEnrolledCourses(getEnrolledCourses())

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

  // Active semester & course performance audit data
  const auditComputation = useMemo(() => {
    const currentCGPA = history.overallCGPA.toFixed(2)
    const degreeClass = history.degreeClass.title
    const targetCGPA = profile.targetCGPA || history.targetCGPA || 4.52
    const unitsEarned = history.totalUnitsEarned
    const unitsRequired = history.totalUnitsRequired
    const remainingUnits = Math.max(0, unitsRequired - unitsEarned)
    const activeSem = history.semesters.find((s) => s.status === 'in_progress') || history.semesters[history.semesters.length - 1]

    const coursesData: AuditCourseItem[] = enrolledCourses.map((c) => {
      const match = activeSem?.courses.find((sc) => sc.code.toUpperCase() === c.code.toUpperCase())
      const score = match?.score ?? 75
      const caScore = Math.min(30, Math.round(score * 0.35))
      const caMax = 30
      const minExamForA = Math.max(0, 70 - caScore)
      const trajectory: 'Safe' | 'Strong' | 'Highest Risk' =
        minExamForA >= 48 ? 'Highest Risk' : minExamForA <= 44 ? 'Safe' : 'Strong'

      return {
        code: c.code,
        name: c.name,
        units: c.units || 3,
        caScore,
        caMax,
        minExamForA,
        trajectory,
      }
    })

    const registeredUnits = enrolledCourses.reduce((sum, c) => sum + (c.units || 3), 0)

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
  }, [history, enrolledCourses, profile])

  // Build the initial streamlined analysis message
  const createInitialAuditMessage = (): ChatMessage => {
    const firstName = profile.name.split(' ')[0] || 'Student'
    const { currentCGPA, degreeClass, targetCGPA, unitsEarned, unitsRequired, remainingUnits, registeredUnits, courses } = auditComputation

    return {
      id: 'atlas-initial-audit',
      sender: 'atlas',
      timestamp: 'Initial Analysis',
      isInitialAudit: true,
      text: `Hello ${firstName}. I have synthesized your academic trajectory directly from your enrolled courses in My Courses and your official records in Academic Records. Here is your streamlined executive academic intelligence audit:`,
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

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Reset conversation to initial streamlined audit
  const handleResetChat = () => {
    setMessages([createInitialAuditMessage()])
    setQuestion('')
  }

  // Intelligent Contextual Responses Engine
  const generateAtlasResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase()
    const { currentCGPA, unitsEarned, unitsRequired, remainingUnits, registeredUnits, courses } = auditComputation
    const highestRisk = courses.find((c) => c.trajectory === 'Highest Risk') || courses[0]

    if (q.includes('exam score') || q.includes('need for an a') || q.includes('minimum exam') || q.includes('get an a')) {
      return {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `Under the NUC 30:70 grading system, achieving an 'A' requires a cumulative score of 70% or higher. Based on your continuous assessment marks, here are the exact minimum scores out of 70 required in your semester examinations:`,
        timestamp: 'Just now',
        highlightCard: {
          title: 'Minimum Exam Scores for Grade "A" (70+ Total)',
          stats: courses.map((c) => ({
            label: `${c.code} (${c.caScore}/30 CA)`,
            value: `Need ${c.minExamForA} / 70`,
            tone: c.minExamForA >= 48 ? 'urgent' : c.minExamForA <= 44 ? 'success' : 'primary',
          })),
          note: highestRisk ? `Priority Focus: ${highestRisk.code} demands your highest exam performance (${highestRisk.minExamForA}/70).` : undefined,
        },
        suggestions: [
          { label: "⚠️ Analyze my biggest grade risk", prompt: "Which of my courses poses the highest grade risk this semester, and what is your strategic recommendation?" },
          { label: "📈 How to reach First Class?", prompt: "Show me the exact mathematical path and semester GPA required across my remaining units to graduate with First Class Honours." },
          { label: "🗓️ Weighted revision schedule", prompt: "Generate a weekly exam preparation and revision schedule weighted by each course's credit units and CA gaps." },
        ],
      }
    }

    if (q.includes('risk') || q.includes('weak') || q.includes('bottleneck') || q.includes('prioritize') || q.includes('focus')) {
      const riskCourse = highestRisk || { code: 'CSC 405', name: 'Computer Networks', units: 3, caScore: 22, minExamForA: 48 }

      return {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `Based on your course weights and CA scores, **${riskCourse.code} (${riskCourse.name})** represents your primary academic bottleneck this semester. You hold ${riskCourse.caScore}/30 in CA, which means you need at least ${riskCourse.minExamForA}/70 in the examination to protect your Grade 'A'.`,
        timestamp: 'Just now',
        highlightCard: {
          title: `Action Plan for ${riskCourse.code} (${riskCourse.units} Units)`,
          stats: [
            { label: 'Current CA', value: `${riskCourse.caScore} / 30`, tone: 'urgent' },
            { label: 'Exam Target', value: `${riskCourse.minExamForA} / 70 for 'A'`, tone: 'primary' },
            { label: 'Exam Safe Pass', value: `23 / 70 for 'C'`, tone: 'success' },
            { label: 'Credit Multiplier', value: `${riskCourse.units} Units (${riskCourse.units * 5} QP at 'A')` },
          ],
          note: `Dedicate at least 35% of your weekly study hours to ${riskCourse.code} past exam papers and subnetting/lab questions.`,
        },
        suggestions: [
          { label: "🗓️ Generate revision plan", prompt: "Generate a weekly exam preparation and revision schedule weighted by each course's credit units and CA gaps." },
          { label: "💡 What if I get a 'B' in this course?", prompt: "Simulate my cumulative CGPA if I achieve straight Grade B's (4.00 SGPA) this semester." },
          { label: "🎯 View exam targets for all courses", prompt: "Break down the exact minimum exam marks I need out of 70 for each of my registered courses to secure Grade A." },
        ],
      }
    }

    if (q.includes('first class') || q.includes('cgpa') || q.includes('honours') || q.includes('graduate')) {
      const currentPts = history.overallPoints
      const projectedPoints4As = currentPts + registeredUnits * 5
      const projectedCGPA4As = (projectedPoints4As / (unitsEarned + registeredUnits)).toFixed(2)

      return {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `Your current CGPA is **${currentCGPA} / 5.00** across ${unitsEarned} credit units. The NUC First Class cutoff is **4.50**. Here is your exact mathematical roadmap:`,
        timestamp: 'Just now',
        highlightCard: {
          title: 'First Class Honours Mathematical Roadmap',
          stats: [
            { label: 'Current CGPA', value: `${currentCGPA} (2:1)`, tone: 'primary' },
            { label: 'Projected SGPA (Straight As)', value: '5.00 SGPA (60 QP)', tone: 'success' },
            { label: 'CGPA after this semester', value: `${projectedCGPA4As} / 5.00`, tone: 'success' },
            { label: 'Remaining Credits', value: `${remainingUnits} Units to graduation` },
          ],
          note: `If you secure straight 'A's in your current ${registeredUnits} registered units, your CGPA jumps to ${projectedCGPA4As}. A repeat performance in second semester will graduate you with First Class Honours!`,
        },
        suggestions: [
          { label: "🎯 Show minimum exam marks for all courses", prompt: "Break down the exact minimum exam marks I need out of 70 for each of my registered courses to secure Grade A." },
          { label: "💡 What if I achieve straight B's?", prompt: "Simulate my cumulative CGPA if I achieve straight Grade B's (4.00 SGPA) this semester." },
          { label: "⚠️ Identify my highest risk course", prompt: "Which of my courses poses the highest grade risk this semester, and what is your strategic recommendation?" },
        ],
      }
    }

    if (q.includes('schedule') || q.includes('plan') || q.includes('revision') || q.includes('study')) {
      return {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `Here is an optimized weekly study and revision timetable weighted by your registered course credit units and continuous assessment risk:`,
        timestamp: 'Just now',
        highlightCard: {
          title: 'Credit-Weighted Weekly Study Allocation',
          stats: courses.map((c) => ({
            label: `${c.code} (${c.units} Units)`,
            value: c.trajectory === 'Highest Risk' ? '6.5 hrs/week (Priority)' : '4.5 hrs/week',
            tone: c.trajectory === 'Highest Risk' ? 'urgent' : 'primary',
          })),
          note: 'Allocates maximum cognitive energy to high-risk courses during peak morning study blocks.',
        },
        suggestions: [
          { label: "🎯 Check exam targets for 'A'", prompt: "Break down the exact minimum exam marks I need out of 70 for each of my registered courses to secure Grade A." },
          { label: "📈 How to reach First Class?", prompt: "Show me the exact mathematical path and semester GPA required across my remaining units to graduate with First Class Honours." },
        ],
      }
    }

    if (q.includes('b') || q.includes('simulate') || q.includes('worst') || q.includes('scenario')) {
      const currentPts = history.overallPoints
      const projectedPointsBs = currentPts + registeredUnits * 4
      const projectedCGPABs = (projectedPointsBs / (unitsEarned + registeredUnits)).toFixed(2)

      return {
        id: `atlas-${Date.now()}`,
        sender: 'atlas',
        text: `If you achieve straight Grade 'B's (4.00 Grade Points per unit) across all your current ${registeredUnits} registered units, your Semester GPA will be **4.00**. Here is how your cumulative standing responds:`,
        timestamp: 'Just now',
        highlightCard: {
          title: 'Simulation: Straight Grade B Scenario (4.00 SGPA)',
          stats: [
            { label: 'Current CGPA', value: `${currentCGPA} / 5.00` },
            { label: 'Semester SGPA', value: '4.00 (48 QP)' },
            { label: 'Projected CGPA', value: `${projectedCGPABs} / 5.00`, tone: 'primary' },
            { label: 'Degree Classification', value: 'Second Class Upper (2:1)', tone: 'success' },
          ],
          note: `You remain solidly in Second Class Upper division (${projectedCGPABs}). To aim for First Class Honours (4.50+), at least 2 courses must be elevated to Grade 'A'.`,
        },
        suggestions: [
          { label: "🎯 Minimum exam scores for 'A'", prompt: "Break down the exact minimum exam marks I need out of 70 for each of my registered courses to secure Grade A." },
          { label: "📈 How to reach First Class?", prompt: "Show me the exact mathematical path and semester GPA required across my remaining units to graduate with First Class Honours." },
        ],
      }
    }

    // Default intelligent response utilizing user's exact record
    return {
      id: `atlas-${Date.now()}`,
      sender: 'atlas',
      text: `Based on your ${profile.department} records: you have **${registeredUnits} credit units** registered this semester and a current cumulative CGPA of **${currentCGPA} / 5.00**. You have completed ${unitsEarned} of ${unitsRequired} required units. Your strategic objective is maintaining exam scores above 45/70 across all courses to protect your degree standing.`,
      timestamp: 'Just now',
      suggestions: DEFAULT_SUGGESTIONS.slice(0, 3),
    }
  }

  // Handle user submitting message
  const handleSendMessage = (textToSend?: string) => {
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

    setTimeout(() => {
      const response = generateAtlasResponse(trimmed)
      setMessages((prev) => [...prev, response])
      setIsTyping(false)

      if (voiceAutoSpeak) {
        speakText(response.text, response.id)
      }
    }, 550)
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

                  <p style={{ lineHeight: 1.55 }}>{msg.text}</p>

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
                    Prof. Zikora is recalculating academic records and grade matrices...
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
