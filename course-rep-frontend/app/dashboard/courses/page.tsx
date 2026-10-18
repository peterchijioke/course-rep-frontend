'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  Grid,
  Layers,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Plus,
  Printer,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { Pill } from '@/components/pill'
import {
  courses as initialCourses,
  availableCatalogCourses,
  getEnrolledCourses,
  saveEnrolledCourses,
  getAcademicLevels,
  saveAcademicLevels,
  getAcademicSemesters,
  saveAcademicSemesters,
  DEFAULT_ACADEMIC_LEVELS,
  DEFAULT_ACADEMIC_SEMESTERS,
  type Course,
  type CourseMaterial,
  type CourseAssessment,
  type CourseModule,
  type CourseAnnouncement,
  type StudyGroup,
} from '@/lib/data'
import { getUserProfile, defaultUserProfile, type UserProfile } from '@/lib/user-profile'
import { api } from '@/lib/api'

interface Toast {
  id: string
  message: string
  type: 'success' | 'info'
}

export default function CoursesPage() {
  const [mounted, setMounted] = useState(false)
  const [courseList, setCourseList] = useState<Course[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile)
  const [levels, setLevels] = useState<string[]>(DEFAULT_ACADEMIC_LEVELS)
  const [semesters, setSemesters] = useState<string[]>(DEFAULT_ACADEMIC_SEMESTERS)
  const [selectedLevel, setSelectedLevel] = useState<string>('400 Level')
  const [selectedSemester, setSelectedSemester] = useState<string>('First Semester')

  // Multi-Stage Hierarchy Navigation: 'levels' | 'semesters' | 'courses'
  const [currentStep, setCurrentStep] = useState<'levels' | 'semesters' | 'courses'>('courses')

  // Modals for Adding Level and Adding Semester
  const [showAddLevelModal, setShowAddLevelModal] = useState(false)
  const [newLevelInput, setNewLevelInput] = useState('')
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false)
  const [newSemesterInput, setNewSemesterInput] = useState('')

  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [activeTab, setActiveTab] = useState<'All' | 'Core' | 'Elective'>('All')
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'units' | 'progress' | 'next'>('code')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [repMode, setRepMode] = useState(false)

  const [enrollNotice, setEnrollNotice] = useState(false)

  // Active student current session helpers
  const activeLevel = userProfile.level || '400 Level'
  const activeSemesterName = 'First Semester'
  const coursesInActiveCurrentSemester = useMemo(
    () =>
      courseList.filter(
        (c) => (c.level || '400 Level') === activeLevel && (c.semester || 'First Semester') === activeSemesterName
      ),
    [courseList, activeLevel]
  )
  const activeCurrentSemesterUnits = useMemo(
    () => coursesInActiveCurrentSemester.reduce((acc, c) => acc + (c.units || 3), 0),
    [coursesInActiveCurrentSemester]
  )

  const [backendCatalog, setBackendCatalog] = useState<any[]>([])

  // Sync courses with localStorage / other tabs & check query params
  useEffect(() => {
    setMounted(true)
    setCourseList(getEnrolledCourses())
    const p = getUserProfile()
    setUserProfile(p)
    if (p.level) setSelectedLevel(p.level)
    setLevels(getAcademicLevels())
    setSemesters(getAcademicSemesters())

    const handleCoursesUpdate = () => {
      const enrolled = getEnrolledCourses()
      setCourseList(enrolled)
      if (enrolled.length > 0) {
        setSelectedLevel((cur) => {
          const hasInCurrent = enrolled.some((c) => (c.level || '400 Level') === cur)
          return hasInCurrent ? cur : (enrolled[0].level || '400 Level')
        })
      }
    }
    const handleLevelsUpdate = () => setLevels(getAcademicLevels())
    const handleSemestersUpdate = () => setSemesters(getAcademicSemesters())
    const handleProfileUpdate = () => {
      const p = getUserProfile()
      setUserProfile(p)
      if (p.level) setSelectedLevel(p.level)
    }

    // 1. Fetch live catalog courses from backend database
    api.courses.getAll().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.data
      if (Array.isArray(list) && list.length > 0) {
        setBackendCatalog(list)
      }
    }).catch(() => {})

    // 2. Fetch live enrolled courses from backend database
    api.courses.getMyEnrolled().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.data
      if (Array.isArray(list) && list.length > 0) {
        setCourseList(list)
        saveEnrolledCourses(list)
        setSelectedLevel((cur) => {
          const hasInCurrent = list.some((c: any) => (c.level || '400 Level') === cur)
          return hasInCurrent ? cur : (list[0].level || '400 Level')
        })
      }
    }).catch(() => {})

    window.addEventListener('enrolled-courses-updated', handleCoursesUpdate)
    window.addEventListener('academic-levels-updated', handleLevelsUpdate)
    window.addEventListener('academic-semesters-updated', handleSemestersUpdate)
    window.addEventListener('user-profile-updated', handleProfileUpdate)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'levels' || params.get('step') === 'levels') {
        setCurrentStep('levels')
      } else if (params.get('view') === 'semesters' || params.get('step') === 'semesters') {
        setCurrentStep('semesters')
      } else if (params.get('view') === 'courses' || params.get('step') === 'courses') {
        setCurrentStep('courses')
      }

      if (
        params.get('notice') === 'enroll-first' ||
        params.get('prompt') === 'enroll-first' ||
        params.get('openEnroll') === 'true'
      ) {
        setShowJoinModal(true)
        setEnrollNotice(true)
        setCurrentStep('courses')
      }
    }

    return () => {
      window.removeEventListener('enrolled-courses-updated', handleCoursesUpdate)
      window.removeEventListener('academic-levels-updated', handleLevelsUpdate)
      window.removeEventListener('academic-semesters-updated', handleSemestersUpdate)
      window.removeEventListener('user-profile-updated', handleProfileUpdate)
    }
  }, [])

  // Modals & Drawers
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [hubTab, setHubTab] = useState<'overview' | 'materials' | 'assessments' | 'announcements' | 'groups'>('overview')
  const [materialFilter, setMaterialFilter] = useState<string>('all')

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinTab, setJoinTab] = useState<'catalog' | 'custom'>('catalog')
  const [showRegSlip, setShowRegSlip] = useState(false)
  const [courseToDrop, setCourseToDrop] = useState<Course | null>(null)

  // Rep modals
  const [rescheduleCourse, setRescheduleCourse] = useState<Course | null>(null)
  const [broadcastCourse, setBroadcastCourse] = useState<Course | null>(null)

  // Creation dialogs inside Hub
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([])

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }

  // Hierarchy course filtering
  const coursesInSelectedLevel = useMemo(() => {
    return courseList.filter((c) => (c.level || '400 Level') === selectedLevel)
  }, [courseList, selectedLevel])

  const coursesInSelectedSemester = useMemo(() => {
    if (selectedSemester === 'All Semesters') {
      return coursesInSelectedLevel
    }
    return coursesInSelectedLevel.filter((c) => (c.semester || 'First Semester') === selectedSemester)
  }, [coursesInSelectedLevel, selectedSemester])

  // Active metrics for the currently selected semester
  const semesterUnits = useMemo(
    () => coursesInSelectedSemester.reduce((acc, curr) => acc + (curr.units || 3), 0),
    [coursesInSelectedSemester]
  )
  const semesterAvgProgress = useMemo(
    () =>
      coursesInSelectedSemester.length
        ? Math.round(coursesInSelectedSemester.reduce((acc, curr) => acc + (curr.progress || 0), 0) / coursesInSelectedSemester.length)
        : 0,
    [coursesInSelectedSemester]
  )
  const semesterAvgAttendance = useMemo(
    () =>
      coursesInSelectedSemester.length
        ? Math.round(coursesInSelectedSemester.reduce((acc, curr) => acc + (curr.attendance || 90), 0) / coursesInSelectedSemester.length)
        : 0,
    [coursesInSelectedSemester]
  )

  // Overall student metrics
  const totalUnits = useMemo(
    () => courseList.reduce((acc, curr) => acc + (curr.units || 3), 0),
    [courseList]
  )
  const avgProgress = useMemo(
    () =>
      courseList.length
        ? Math.round(courseList.reduce((acc, curr) => acc + (curr.progress || 0), 0) / courseList.length)
        : 0,
    [courseList]
  )
  const avgAttendance = useMemo(
    () =>
      courseList.length
        ? Math.round(courseList.reduce((acc, curr) => acc + (curr.attendance || 90), 0) / courseList.length)
        : 0,
    [courseList]
  )

  // Departments list for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>()
    courseList.forEach((c) => {
      if (c.department) set.add(c.department)
    })
    return ['All', ...Array.from(set)]
  }, [courseList])

  // Filtered & Sorted Courses in active Level & Semester
  const filteredCourses = useMemo(() => {
    return coursesInSelectedSemester
      .filter((c) => {
        const matchesQuery =
          query.trim() === '' ||
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.lecturer?.name && c.lecturer.name.toLowerCase().includes(query.toLowerCase())) ||
          (c.schedule?.venue && c.schedule.venue.toLowerCase().includes(query.toLowerCase())) ||
          (c.description && c.description.toLowerCase().includes(query.toLowerCase()))

        const matchesDept = departmentFilter === 'All' || c.department === departmentFilter

        let matchesTab = true
        if (activeTab === 'Core') matchesTab = c.category === 'Core'
        else if (activeTab === 'Elective') matchesTab = c.category === 'Elective'

        return matchesQuery && matchesDept && matchesTab
      })
      .sort((a, b) => {
        if (sortBy === 'code') return a.code.localeCompare(b.code)
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'units') return (b.units || 0) - (a.units || 0)
        if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0)
        if (sortBy === 'next') return a.next.localeCompare(b.next)
        return 0
      })
  }, [coursesInSelectedSemester, query, departmentFilter, activeTab, sortBy])

  // Actions: Level & Semester creation
  const handleCreateLevel = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newLevelInput.trim()
    if (!trimmed) return
    if (levels.includes(trimmed)) {
      triggerToast(`Level "${trimmed}" already exists`, 'info')
      setSelectedLevel(trimmed)
      setCurrentStep('semesters')
      setShowAddLevelModal(false)
      setNewLevelInput('')
      return
    }
    const updated = [...levels, trimmed]
    saveAcademicLevels(updated)
    setLevels(updated)
    setSelectedLevel(trimmed)
    setCurrentStep('semesters')
    setShowAddLevelModal(false)
    setNewLevelInput('')
    triggerToast(`Academic Level "${trimmed}" created!`, 'success')
  }

  const handleCreateSemester = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSemesterInput.trim()
    if (!trimmed) return
    if (semesters.includes(trimmed)) {
      triggerToast(`Semester "${trimmed}" already exists`, 'info')
      setSelectedSemester(trimmed)
      setCurrentStep('courses')
      setShowAddSemesterModal(false)
      setNewSemesterInput('')
      return
    }
    const updated = [...semesters, trimmed]
    saveAcademicSemesters(updated)
    setSemesters(updated)
    setSelectedSemester(trimmed)
    setCurrentStep('courses')
    setShowAddSemesterModal(false)
    setNewSemesterInput('')
    triggerToast(`Semester "${trimmed}" added!`, 'success')
  }

  // Course Actions
  const handleJoinCatalogCourse = (catalogItem: any) => {
    if (courseList.some((c) => c.code === catalogItem.code)) {
      triggerToast(`You are already enrolled in ${catalogItem.code}`, 'info')
      return
    }
    if (catalogItem.code) {
      api.courses.join(catalogItem.code).catch((err) => console.warn('Backend enroll error:', err))
    }
    const enrolledItem: Course = {
      ...catalogItem,
      level: selectedLevel,
      semester: selectedSemester === 'All Semesters' ? (catalogItem.semester || 'First Semester') : (selectedSemester as any),
    }
    const updated = [...courseList, enrolledItem]
    setCourseList(updated)
    saveEnrolledCourses(updated)
    setCurrentStep('courses')
    triggerToast(`Enrolled in ${catalogItem.code} for ${selectedLevel} (${enrolledItem.semester})!`, 'success')
  }

  const handleCustomJoin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') || '').trim().toUpperCase()
    const name = String(form.get('name') || '').trim()
    const units = Number(form.get('units') || 3)
    const category = (form.get('category') || 'Core') as 'Core' | 'Elective'
    const department = String(form.get('department') || 'Computer Science').trim()
    const formLevel = String(form.get('level') || selectedLevel).trim()
    const formSemester = String(
      form.get('semester') || (selectedSemester === 'All Semesters' ? 'First Semester' : selectedSemester)
    ).trim() as 'First Semester' | 'Second Semester'
    const lecturerName = String(form.get('lecturer') || 'Faculty Staff').trim()
    const venue = String(form.get('venue') || 'Lecture Hall A').trim()
    const day = String(form.get('day') || 'Mondays').trim()
    const time = String(form.get('time') || '10:00 AM – 12:00 PM').trim()

    if (!code || !name) return

    if (courseList.some((c) => c.code === code)) {
      triggerToast(`Course with code ${code} is already registered`, 'info')
      return
    }

    const newCourse: Course = {
      code,
      name,
      color: ['indigo', 'blue', 'amber', 'slate'][Math.floor(Math.random() * 4)],
      unread: 0,
      next: `${day.slice(0, 3)}, ${time.split('–')[0].trim()}`,
      units,
      level: formLevel,
      semester: formSemester,
      department,
      category,
      lecturer: {
        name: lecturerName,
        title: 'Course Instructor',
        email: `${lecturerName.toLowerCase().replace(/\s+/g, '.')}@example.edu`,
        office: 'Faculty Block B',
      },
      rep: {
        name: 'Daniel Chukwu',
        role: 'Class Representative',
        contact: '+234 803 123 4567',
      },
      schedule: {
        day,
        time,
        venue,
      },
      description: `Course syllabus and curriculum for ${name}. Covers theoretical concepts, practical lab exercises, and modern industry applications.`,
      progress: 0,
      attendance: 100,
      materials: [],
      assessments: [
        {
          id: `ass-${Date.now()}`,
          title: `${code} First Continuous Assessment`,
          type: 'Assignment',
          weight: '20%',
          dueDate: 'Due Fri, 11:59 PM',
          status: 'pending',
        },
      ],
      modules: [
        { week: 1, title: 'Course Orientation & Fundamentals', description: 'Overview of syllabus, scoring rubrics, and recommended literature.', completed: false },
        { week: 2, title: 'Core Theoretical Frameworks', description: 'Foundational models and analytical methodologies.', completed: false },
        { week: 3, title: 'Applied Lab Workshop', description: 'Practical implementations and problem-solving exercises.', completed: false },
      ],
      announcements: [],
      studyGroups: [],
    }

    // Persist to backend database with student relationship mapping
    api.courses.create({
      code,
      name,
      units,
      semester: formSemester,
      level: formLevel,
      department,
      lecturer_name: lecturerName,
      lecture_venue: venue,
      next_lecture: `${day.slice(0, 3)}, ${time.split('–')[0].trim()}`,
      color: newCourse.color,
    }).catch((err) => {
      console.warn('Backend course creation error:', err)
    })

    const updatedList = [...courseList, newCourse]
    setCourseList(updatedList)
    saveEnrolledCourses(updatedList)
    setSelectedLevel(formLevel)
    setSelectedSemester(formSemester)
    setCurrentStep('courses')
    setShowJoinModal(false)
    triggerToast(`Registered ${newCourse.code}: ${newCourse.name} in ${formLevel} (${formSemester})!`, 'success')
  }

  const handleConfirmDrop = () => {
    if (!courseToDrop) return
    const targetCode = courseToDrop.code
    const updatedList = courseList.filter((c) => c.code !== targetCode)
    setCourseList(updatedList)
    saveEnrolledCourses(updatedList)
    if (selectedCourse?.code === targetCode) {
      setSelectedCourse(null)
    }
    setCourseToDrop(null)
    triggerToast(`Dropped course ${targetCode}`, 'info')
  }

  // Toggle syllabus module completion
  const handleToggleModule = (courseCode: string, weekNumber: number) => {
    setCourseList((prev) =>
      prev.map((c) => {
        if (c.code !== courseCode) return c
        const modules = c.modules ? [...c.modules] : []
        const updatedModules = modules.map((m) =>
          m.week === weekNumber ? { ...m, completed: !m.completed } : m
        )
        const completedCount = updatedModules.filter((m) => m.completed).length
        const total = updatedModules.length || 1
        const progress = Math.round((completedCount / total) * 100)
        const updatedCourse = { ...c, modules: updatedModules, progress }

        if (selectedCourse?.code === courseCode) {
          setSelectedCourse(updatedCourse)
        }
        return updatedCourse
      })
    )
    triggerToast(`Syllabus progress updated!`, 'info')
  }

  // Reschedule Lecture (Rep Tool)
  const handleSaveReschedule = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!rescheduleCourse) return
    const form = new FormData(e.currentTarget)
    const venue = String(form.get('venue') || '').trim()
    const day = String(form.get('day') || '').trim()
    const time = String(form.get('time') || '').trim()

    const updated = {
      ...rescheduleCourse,
      schedule: {
        day: day || rescheduleCourse.schedule?.day || 'Mondays',
        time: time || rescheduleCourse.schedule?.time || '10:00 AM – 12:00 PM',
        venue: venue || rescheduleCourse.schedule?.venue || 'Lecture Hall B',
      },
      next: `${day.slice(0, 3)}, ${time.split('–')[0].trim()}`,
    }

    setCourseList((prev) =>
      prev.map((c) => (c.code === rescheduleCourse.code ? updated : c))
    )
    if (selectedCourse?.code === rescheduleCourse.code) {
      setSelectedCourse(updated)
    }
    setRescheduleCourse(null)
    triggerToast(`Rescheduled ${updated.code} to ${updated.schedule?.venue} (${updated.schedule?.day})!`, 'success')
  }

  // Broadcast Announcement (Rep Tool)
  const handleSendBroadcast = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!broadcastCourse) return
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const content = String(form.get('content') || '').trim()
    const urgent = Boolean(form.get('urgent'))

    if (!title || !content) return

    const newAnnouncement: CourseAnnouncement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: 'Just now',
      author: 'Daniel Chukwu · Course Rep',
      urgent,
    }

    const updatedCourse: Course = {
      ...broadcastCourse,
      unread: (broadcastCourse.unread || 0) + 1,
      announcements: [newAnnouncement, ...(broadcastCourse.announcements || [])],
    }

    setCourseList((prev) =>
      prev.map((c) => (c.code === broadcastCourse.code ? updatedCourse : c))
    )
    if (selectedCourse?.code === broadcastCourse.code) {
      setSelectedCourse(updatedCourse)
    }
    setBroadcastCourse(null)
    triggerToast(`Announcement broadcasted to enrolled students in ${broadcastCourse.code}!`, 'success')
  }

  // Upload Material
  const handleUploadMaterialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCourse) return
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const type = (form.get('type') || 'slides') as CourseMaterial['type']
    const week = Number(form.get('week') || 1)

    if (!title) return

    const newMat: CourseMaterial = {
      id: `mat-${Date.now()}`,
      title,
      type,
      fileSize: '3.4 MB PDF',
      uploadDate: 'Just now',
      uploadedBy: 'Peter Chijioke (Student)',
      week,
    }

    const updated = {
      ...selectedCourse,
      materials: [newMat, ...(selectedCourse.materials || [])],
    }

    setCourseList((prev) =>
      prev.map((c) => (c.code === selectedCourse.code ? updated : c))
    )
    setSelectedCourse(updated)
    setShowUploadModal(false)
    triggerToast(`Material "${title}" uploaded to ${selectedCourse.code}!`, 'success')
  }

  // Add Course Assessment Task
  const handleAddTaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCourse) return
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '').trim()
    const type = (form.get('type') || 'Assignment') as CourseAssessment['type']
    const weight = String(form.get('weight') || '15%').trim()
    const dueDate = String(form.get('dueDate') || 'Next Week').trim()

    if (!title) return

    const newTask: CourseAssessment = {
      id: `task-${Date.now()}`,
      title,
      type,
      weight,
      dueDate,
      status: 'pending',
    }

    const updated = {
      ...selectedCourse,
      assessments: [...(selectedCourse.assessments || []), newTask],
    }

    setCourseList((prev) =>
      prev.map((c) => (c.code === selectedCourse.code ? updated : c))
    )
    setSelectedCourse(updated)
    setShowTaskModal(false)
    triggerToast(`Assessment task "${title}" added!`, 'success')
  }

  // Toggle study group membership
  const handleToggleGroupJoin = (groupId: string) => {
    if (!selectedCourse) return
    const groups = (selectedCourse.studyGroups || []).map((g) => {
      if (g.id === groupId) {
        const isJoined = !g.isJoined
        return {
          ...g,
          isJoined,
          membersCount: isJoined ? g.membersCount + 1 : Math.max(1, g.membersCount - 1),
        }
      }
      return g
    })

    const updated = { ...selectedCourse, studyGroups: groups }
    setCourseList((prev) =>
      prev.map((c) => (c.code === selectedCourse.code ? updated : c))
    )
    setSelectedCourse(updated)
    triggerToast(`Study group membership updated!`, 'info')
  }

  // Create new study group
  const handleCreateGroupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCourse) return
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') || '').trim()
    const meetingTime = String(form.get('time') || 'Saturdays 2:00 PM').trim()

    if (!name) return

    const newGroup: StudyGroup = {
      id: `group-${Date.now()}`,
      name,
      meetingTime,
      membersCount: 1,
      isJoined: true,
    }

    const updated = {
      ...selectedCourse,
      studyGroups: [...(selectedCourse.studyGroups || []), newGroup],
    }

    setCourseList((prev) =>
      prev.map((c) => (c.code === selectedCourse.code ? updated : c))
    )
    setSelectedCourse(updated)
    setShowGroupModal(false)
    triggerToast(`Study group "${name}" created!`, 'success')
  }

  return (
    <>
      <PageHeader
        title={
          currentStep === 'levels'
            ? 'Academic Curriculum & Levels'
            : currentStep === 'semesters'
            ? `${selectedLevel} Semesters`
            : `${selectedLevel} · ${selectedSemester}`
        }
        subtitle={
          currentStep === 'levels'
            ? 'Select or create an academic study level to organize your semesters and course registrations.'
            : currentStep === 'semesters'
            ? `Choose or create a semester under ${selectedLevel} to access lecture timetables and registered subjects.`
            : 'Manage your enrolled courses, weekly timetables, syllabus completion, and learning resources.'
        }
        action={
          <div className="top-actions" style={{ gap: '10px' }}>
            {currentStep === 'levels' && (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setNewLevelInput('')
                  setShowAddLevelModal(true)
                }}
              >
                <Plus /> Add Level
              </button>
            )}
            {currentStep === 'semesters' && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentStep('levels')}
                >
                  &larr; All Levels
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setNewSemesterInput('')
                    setShowAddSemesterModal(true)
                  }}
                >
                  <Plus /> Add Semester
                </button>
              </>
            )}
            {currentStep === 'courses' && (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentStep('semesters')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  &larr; Switch Semester
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowRegSlip(true)}
                  title="Print official course registration slip"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer style={{ width: '15px' }} /> Course slip
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setShowJoinModal(true)
                    setJoinTab('custom')
                  }}
                >
                  <Plus /> Register course
                </button>
              </>
            )}
          </div>
        }
      />

      {enrollNotice && (
        <div
          style={{
            background: 'rgba(67, 56, 202, 0.08)',
            border: '1px solid rgba(67, 56, 202, 0.25)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles style={{ width: '18px', height: '18px', color: '#4338ca', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                Enroll Your Courses to Unlock Academic Records &amp; Analytics
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Academic Records automatically calculates your CGPA, credit units, and official transcripts directly from the courses you enroll here.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowJoinModal(true)
              setJoinTab('custom')
            }}
            className="primary-button"
            style={{ fontSize: '12px', padding: '8px 14px' }}
          >
            <Plus style={{ width: '14px' }} /> Enroll Courses
          </button>
        </div>
      )}

      {/* ====================================================================
          STAGE 1: ACADEMIC LEVELS DIRECTORY (YEARS OF STUDY)
          ==================================================================== */}
      {currentStep === 'levels' && (
        <div>
          {/* Active Session Hero Banner */}
          <div className="active-session-hero">
            <div className="active-session-hero-left">
              <div className="active-session-hero-icon">
                <GraduationCap style={{ width: '26px', height: '26px' }} />
              </div>
              <div>
                <span className="active-session-hero-tag">CURRENT ACTIVE SESSION</span>
                <h3 className="active-session-hero-title">{activeLevel} &bull; {activeSemesterName}</h3>
                <p className="active-session-hero-sub">
                  {coursesInActiveCurrentSemester.length} course{coursesInActiveCurrentSemester.length === 1 ? '' : 's'} registered &bull; {activeCurrentSemesterUnits} Credit Units enrolled
                </p>
              </div>
            </div>
            <button
              type="button"
              className="active-session-hero-btn"
              onClick={() => {
                setSelectedLevel(activeLevel)
                setSelectedSemester(activeSemesterName)
                setCurrentStep('courses')
              }}
            >
              Open Current Semester <ChevronRight style={{ width: '16px' }} />
            </button>
          </div>

          <div className="hub-section-header">
            <h3>Select Academic Level (Year of Study)</h3>
            <p>Each academic level organizes the respective semester curriculums and courses.</p>
          </div>

          <div className="levels-grid">
            {levels.map((lvl) => {
              const lvlCourses = courseList.filter((c) => (c.level || '400 Level') === lvl)
              const isCurrent = activeLevel === lvl

              return (
                <div
                  key={lvl}
                  className={`level-card ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => {
                    setSelectedLevel(lvl)
                    setCurrentStep('semesters')
                  }}
                >
                  <div className="level-card-top">
                    <div className="level-card-icon">
                      <Layers style={{ width: '20px', height: '20px' }} />
                    </div>
                    <span className={`level-status-pill ${isCurrent ? 'current' : 'normal'}`}>
                      {isCurrent ? 'Current Year' : 'Academic Level'}
                    </span>
                  </div>

                  <div className="level-card-body">
                    <h4>{lvl}</h4>
                    <p>Undergraduate curriculum and departmental registrations.</p>
                    <div className="level-card-meta-line">
                      <span className="level-card-meta-item">
                        <BookOpen style={{ width: '13px' }} />
                        <strong>{lvlCourses.length}</strong> courses registered
                      </span>
                    </div>
                  </div>

                  <div className="level-card-footer">
                    <span>View Semesters</span>
                    <ChevronRight style={{ width: '16px' }} />
                  </div>
                </div>
              )
            })}

            {/* Add Level Card */}
            <button
              type="button"
              className="add-action-card"
              onClick={() => {
                setNewLevelInput('')
                setShowAddLevelModal(true)
              }}
            >
              <div className="add-action-card-icon">
                <Plus style={{ width: '18px', height: '18px' }} />
              </div>
              <strong>Add Academic Level</strong>
              <span>e.g. 500 Level, 600 Level, Masters, PGD</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          STAGE 2: SEMESTERS HUB FOR SELECTED LEVEL
          ==================================================================== */}
      {currentStep === 'semesters' && (
        <div>
          {/* Breadcrumbs Bar */}
          <div className="courses-breadcrumb-bar">
            <div className="courses-breadcrumbs">
              <button
                type="button"
                className="breadcrumb-btn"
                onClick={() => setCurrentStep('levels')}
              >
                <Layers style={{ width: '13px' }} /> Academic Levels
              </button>
              <span className="breadcrumb-sep"><ChevronRight style={{ width: '14px' }} /></span>
              <span className="breadcrumb-btn active">
                {selectedLevel}
              </span>
            </div>
            <button
              type="button"
              className="breadcrumb-back-link"
              onClick={() => setCurrentStep('levels')}
            >
              &larr; Back to all levels
            </button>
          </div>

          <div className="hub-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3>{selectedLevel} Semesters</h3>
              <p>Select a semester under {selectedLevel} to view or enroll courses.</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setNewSemesterInput('')
                setShowAddSemesterModal(true)
              }}
              style={{ fontSize: '12px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '13px' }} /> Add Semester
            </button>
          </div>

          <div className="semesters-grid">
            {semesters.map((sem) => {
              const semCourses = coursesInSelectedLevel.filter((c) => (c.semester || 'First Semester') === sem)
              const semUnits = semCourses.reduce((acc, c) => acc + (c.units || 3), 0)
              const hasCourses = semCourses.length > 0

              return (
                <div key={sem} className="semester-card">
                  <div className="semester-card-header">
                    <div className="semester-card-title-group">
                      <h4>{sem}</h4>
                      <p>{selectedLevel} &bull; Academic Curriculum</p>
                    </div>
                    <span className={`level-status-pill ${hasCourses ? 'current' : 'normal'}`}>
                      {hasCourses ? `${semCourses.length} Registered` : 'Open'}
                    </span>
                  </div>

                  <div className="semester-card-stats">
                    <div className="semester-stat-cell">
                      <span>Courses</span>
                      <strong>{semCourses.length}</strong>
                    </div>
                    <div className="semester-stat-cell">
                      <span>Credit Load</span>
                      <strong>{semUnits} / 24 Units</strong>
                    </div>
                  </div>

                  <div className="semester-card-actions">
                    <button
                      type="button"
                      className="primary-button"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '12.5px', padding: '9px 14px' }}
                      onClick={() => {
                        setSelectedSemester(sem)
                        setCurrentStep('courses')
                      }}
                    >
                      {hasCourses ? 'Open Semester Courses' : 'Register Courses'} &rarr;
                    </button>
                    {hasCourses && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '9px 12px' }}
                        title="Print registration slip for this semester"
                        onClick={() => {
                          setSelectedSemester(sem)
                          setShowRegSlip(true)
                        }}
                      >
                        <Printer style={{ width: '14px' }} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add Custom Semester Card */}
            <button
              type="button"
              className="add-action-card"
              onClick={() => {
                setNewSemesterInput('')
                setShowAddSemesterModal(true)
              }}
            >
              <div className="add-action-card-icon">
                <Plus style={{ width: '18px', height: '18px' }} />
              </div>
              <strong>Add Academic Semester</strong>
              <span>e.g. Harmattan, Summer Term, Sandwich</span>
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          STAGE 3: DEDICATED SEMESTER COURSE WORKSPACE
          ==================================================================== */}
      {currentStep === 'courses' && (
        <div>
          {/* Breadcrumbs Bar */}
          <div className="courses-breadcrumb-bar">
            <div className="courses-breadcrumbs">
              <button
                type="button"
                className="breadcrumb-btn"
                onClick={() => setCurrentStep('levels')}
                title="Go to Academic Levels"
              >
                <Layers style={{ width: '13px' }} /> All Levels
              </button>
              <span className="breadcrumb-sep"><ChevronRight style={{ width: '14px' }} /></span>
              <button
                type="button"
                className="breadcrumb-btn"
                onClick={() => setCurrentStep('semesters')}
                title={`Go to ${selectedLevel} Semesters`}
              >
                {selectedLevel}
              </button>
              <span className="breadcrumb-sep"><ChevronRight style={{ width: '14px' }} /></span>
              <span className="breadcrumb-btn active">
                {selectedSemester}
              </span>
            </div>
          </div>

      {/* Course Stats & Overview Bar */}
      <div className="courses-stats-banner">
        <div className="course-stat-item">
          <div className="course-stat-icon indigo">
            <BookOpen />
          </div>
          <div className="course-stat-info">
            <span>Enrolled courses</span>
            <strong>{coursesInSelectedSemester.length}</strong>
            <small>{selectedLevel} · {selectedSemester}</small>
          </div>
        </div>

        <div className="course-stat-item">
          <div className="course-stat-icon blue">
            <Award />
          </div>
          <div className="course-stat-info">
            <span>Semester credits</span>
            <strong>{semesterUnits} Units</strong>
            <small>NUC max load: 24 Units</small>
          </div>
        </div>

        <div className="course-stat-item">
          <div className="course-stat-icon emerald">
            <CheckCircle2 />
          </div>
          <div className="course-stat-info">
            <span>Syllabus covered</span>
            <strong>{semesterAvgProgress}%</strong>
            <small>Active semester average</small>
          </div>
        </div>

        <div className="course-stat-item">
          <div className="course-stat-icon amber">
            <CalendarDays />
          </div>
          <div className="course-stat-info">
            <span>Class attendance</span>
            <strong>{semesterAvgAttendance}%</strong>
            <small>Good standing (&gt;75%)</small>
          </div>
        </div>

        <div className="course-stats-actions">
          <button
            type="button"
            className={`secondary-button ${repMode ? 'active' : ''}`}
            onClick={() => {
              setRepMode(!repMode)
              triggerToast(
                !repMode ? 'Course Representative Tools Activated!' : 'Course Representative Mode disabled',
                'info'
              )
            }}
            title="Toggle Course Representative Tools"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: repMode ? '#eef2ff' : undefined,
              borderColor: repMode ? '#6366f1' : undefined,
              color: repMode ? '#4338ca' : undefined,
            }}
          >
            <ShieldCheck style={{ width: '16px' }} />
            {repMode ? 'Rep Tools: Active' : 'Rep Mode'}
          </button>
        </div>
      </div>

      {/* Course Rep Callout Banner if enabled */}
      {repMode && (
        <div className="rep-mode-callout">
          <div className="rep-callout-content">
            <div className="rep-badge-symbol">
              <ShieldCheck />
            </div>
            <div className="rep-callout-text">
              <h3>Course Representative Admin Workspace</h3>
              <p>
                You have elevated permissions for Computer Science 400L. Reschedule class venues, update timetable hours, and broadcast notices directly to classmates.
              </p>
            </div>
          </div>
          <div className="rep-callout-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                if (courseList.length > 0) setBroadcastCourse(courseList[0])
              }}
              style={{ fontSize: '11px', padding: '8px 12px' }}
            >
              <Bell style={{ width: '14px' }} /> Broadcast announcement
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                if (courseList.length > 0) setRescheduleCourse(courseList[0])
              }}
              style={{ fontSize: '11px', padding: '8px 12px' }}
            >
              <Clock3 style={{ width: '14px' }} /> Change lecture venue
            </button>
          </div>
        </div>
      )}

      {/* Controls Container */}
      <div className="courses-toolbar-container">
        <div className="courses-controls-row">
          <div className="courses-search-group">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, title, lecturer, venue..."
              aria-label="Search courses"
            />
            {query && (
              <button
                type="button"
                className="courses-search-clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X />
              </button>
            )}
          </div>

          <div className="courses-filter-dropdowns">
            {/* Department selector */}
            <div className="course-select-wrap">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                aria-label="Filter by department"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'All' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
              <ChevronDown className="course-select-icon" />
            </div>

            {/* Sort selector */}
            <div className="course-select-wrap">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort courses"
              >
                <option value="code">Sort: Code (A–Z)</option>
                <option value="name">Sort: Course Name</option>
                <option value="units">Sort: Units (High–Low)</option>
                <option value="progress">Sort: Syllabus Progress</option>
                <option value="next">Sort: Next Lecture</option>
              </select>
              <ChevronDown className="course-select-icon" />
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle" role="radiogroup" aria-label="View layout">
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid layout"
              >
                <Grid /> Grid
              </button>
              <button
                type="button"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                aria-label="Table layout"
              >
                <List /> Table
              </button>
            </div>
          </div>
        </div>

        {/* Tab Filters for Active Semester */}
        <div className="courses-tabs-row">
          <div className="courses-tab-pills">
            {(
              [
                { label: 'All Courses', value: 'All', count: coursesInSelectedSemester.length },
                {
                  label: 'Core Courses',
                  value: 'Core',
                  count: coursesInSelectedSemester.filter((c) => c.category === 'Core').length,
                },
                {
                  label: 'Electives',
                  value: 'Elective',
                  count: coursesInSelectedSemester.filter((c) => c.category === 'Elective').length,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`course-tab-pill ${activeTab === tab.value ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label} <span>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="courses-count-summary">
            Showing <strong>{filteredCourses.length}</strong> of {coursesInSelectedSemester.length} courses in {selectedLevel} · {selectedSemester}
          </div>
        </div>
      </div>

      {/* Course List: Grid View */}
      {viewMode === 'grid' && (
        <div className="course-cards-rich">
          {filteredCourses.map((c) => (
            <div className="course-card-rich" key={c.code}>
              <div className="course-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`course-avatar ${c.color}`}>
                    {c.code.split(' ')[1] || c.code}
                  </span>
                  <div>
                    <div className="course-card-badge-row">
                      <span className="course-code-tag">{c.code}</span>
                      <span className="course-unit-pill">{c.units || 3} Units</span>
                      <span
                        className={`course-category-pill ${
                          c.category === 'Elective' ? 'elective' : 'core'
                        }`}
                      >
                        {c.category || 'Core'}
                      </span>
                    </div>
                    <small style={{ color: '#64748b', fontSize: '10px' }}>
                      {c.department || 'Computer Science'} · {c.semester || '1st Semester'}
                    </small>
                  </div>
                </div>

                {c.unread > 0 && (
                  <span
                    className="course-pill urgent-pill"
                    style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Bell style={{ width: '12px' }} /> {c.unread} new
                  </span>
                )}
              </div>

              <div className="course-card-body">
                <h3>{c.name}</h3>
                <p className="course-card-desc">
                  {c.description || 'Comprehensive curriculum including lectures, practicals and projects.'}
                </p>
              </div>

              <div className="course-card-details-grid">
                <div className="course-detail-item">
                  <User />
                  <span>Lecturer:</span>
                  <strong>{c.lecturer?.name || 'Faculty Lecturer'}</strong>
                </div>

                <div className="course-detail-item">
                  <MapPin />
                  <span>Venue:</span>
                  <strong>{c.schedule?.venue || 'Lecture Hall B'}</strong>
                </div>

                <div className="course-detail-item">
                  <Clock3 />
                  <span>Schedule:</span>
                  <span>
                    {c.schedule?.day || 'Mon'}, {c.schedule?.time || '10:00 AM – 12:00 PM'}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="course-card-progress">
                <div className="progress-label-row">
                  <span>Syllabus covered</span>
                  <strong>{c.progress || 0}%</strong>
                </div>
                <div className="course-progress-track">
                  <div
                    className="course-progress-fill"
                    style={{ width: `${c.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="course-card-footer">
                <button
                  type="button"
                  className="card-action-btn-main"
                  onClick={() => {
                    setSelectedCourse(c)
                    setHubTab('overview')
                  }}
                >
                  <BookOpen style={{ width: '14px' }} /> Open course hub
                </button>

                <button
                  type="button"
                  className="card-icon-action"
                  title="View Materials & Notes"
                  onClick={() => {
                    setSelectedCourse(c)
                    setHubTab('materials')
                  }}
                >
                  <FileText />
                </button>

                <Link
                  href="/dashboard/groups"
                  className="card-icon-action"
                  title="Course Group Discussion"
                >
                  <MessageCircle />
                </Link>

                {repMode && (
                  <button
                    type="button"
                    className="card-icon-action"
                    title="Rep tool: Reschedule Lecture or Room"
                    onClick={() => setRescheduleCourse(c)}
                  >
                    <Clock3 />
                  </button>
                )}

                <button
                  type="button"
                  className="card-icon-action danger"
                  title="Drop course"
                  onClick={() => setCourseToDrop(c)}
                >
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course List: Table View */}
      {viewMode === 'table' && (
        <div className="courses-table-panel">
          <div className="courses-table-scroll">
            <table className="academic-courses-table">
              <thead>
                <tr>
                  <th>Course Code & Title</th>
                  <th>Units</th>
                  <th>Category</th>
                  <th>Lecturer in Charge</th>
                  <th>Lecture Schedule</th>
                  <th>Room Venue</th>
                  <th>Progress</th>
                  <th>Attendance</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c) => (
                  <tr key={c.code}>
                    <td>
                      <div className="table-course-cell">
                        <span className={`course-avatar ${c.color}`}>
                          {c.code.split(' ')[1] || c.code}
                        </span>
                        <div>
                          <strong>{c.code}</strong>
                          <span>{c.name}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="course-unit-pill">{c.units || 3} Units</span>
                    </td>
                    <td>
                      <span
                        className={`course-category-pill ${
                          c.category === 'Elective' ? 'elective' : 'core'
                        }`}
                      >
                        {c.category || 'Core'}
                      </span>
                    </td>
                    <td>
                      <div className="table-lecturer-cell">
                        <strong>{c.lecturer?.name || 'Staff'}</strong>
                        <small>{c.lecturer?.email || 'faculty@example.edu'}</small>
                      </div>
                    </td>
                    <td>
                      {c.schedule?.day || 'Mon'}, {c.schedule?.time || '10:00 AM'}
                    </td>
                    <td>
                      <strong>{c.schedule?.venue || 'Lecture Hall B'}</strong>
                    </td>
                    <td style={{ minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className="course-progress-track"
                          style={{ width: '60px', height: '5px' }}
                        >
                          <div
                            className="course-progress-fill"
                            style={{ width: `${c.progress || 0}%` }}
                          />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: 700 }}>
                          {c.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: '#059669', fontWeight: 700 }}>
                        {c.attendance || 90}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="card-action-btn-main"
                          style={{ padding: '6px 10px', fontSize: '10px' }}
                          onClick={() => {
                            setSelectedCourse(c)
                            setHubTab('overview')
                          }}
                        >
                          Open hub
                        </button>
                        <button
                          type="button"
                          className="card-icon-action danger"
                          onClick={() => setCourseToDrop(c)}
                          title="Drop course"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <Panel style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: '#eef2ff',
              color: '#4338ca',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <BookOpen style={{ width: '26px', height: '26px' }} />
          </div>
          {coursesInSelectedSemester.length === 0 ? (
            <>
              <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700 }}>
                No courses registered in {selectedLevel} · {selectedSemester}
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', margin: '0 auto 20px', maxWidth: '520px', lineHeight: 1.5 }}>
                Under the Nigerian University (NUC) system, course registration is organized strictly by Level and Semester. You haven&apos;t enrolled any courses in this semester yet.
              </p>

              {courseList.length > 0 && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 20px',
                    margin: '0 auto 20px',
                    maxWidth: '520px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--foreground)' }}>
                      You have {courseList.length} course{courseList.length > 1 ? 's' : ''} enrolled in {courseList[0]?.level || '400 Level'}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      Switch your active view to see your registered courses and lecture timetable.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      setSelectedLevel(courseList[0]?.level || '400 Level')
                      setSelectedSemester('First Semester')
                    }}
                    style={{ fontSize: '12px', padding: '7px 14px', whiteSpace: 'nowrap' }}
                  >
                    Switch to {courseList[0]?.level || '400 Level'} &rarr;
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setShowJoinModal(true)
                    setJoinTab('custom')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus style={{ width: '15px' }} /> Register course for this semester
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowJoinModal(true)
                    setJoinTab('catalog')
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen style={{ width: '15px' }} /> Browse departmental catalog
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700 }}>No courses match your filter</h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: '0 0 16px' }}>
                No registered courses in {selectedLevel} · {selectedSemester} matched &quot;{query}&quot;.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setQuery('')
                    setDepartmentFilter('All')
                    setActiveTab('All')
                  }}
                >
                  Reset search & filters
                </button>
              </div>
            </>
          )}
        </Panel>
      )}
        </div>
      )}

      {/* ====================================================================
          MODAL 1: COMPREHENSIVE COURSE DETAIL WORKSPACE HUB
          ==================================================================== */}
      {selectedCourse && (
        <div
          className="course-hub-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedCourse(null)}
        >
          <div className="course-hub-modal" role="dialog" aria-labelledby="course-hub-title">
            {/* Modal Header */}
            <div className="course-hub-header">
              <div className="course-hub-header-lead">
                <span className={`course-hub-avatar ${selectedCourse.color}`}>
                  {selectedCourse.code.split(' ')[1] || selectedCourse.code}
                </span>
                <div className="course-hub-title-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 id="course-hub-title">{selectedCourse.code}: {selectedCourse.name}</h2>
                    <span
                      className={`course-category-pill ${
                        selectedCourse.category === 'Elective' ? 'elective' : 'core'
                      }`}
                    >
                      {selectedCourse.category || 'Core'}
                    </span>
                  </div>
                  <div className="course-hub-meta-line">
                    <span className="course-unit-pill">{selectedCourse.units || 3} Credit Units</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {selectedCourse.department || 'Computer Science'} · {selectedCourse.semester || '1st Semester'} · 400 Level
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="icon-btn"
                onClick={() => setSelectedCourse(null)}
                aria-label="Close course hub"
              >
                <X />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <nav className="course-hub-nav">
              <button
                type="button"
                className={`course-hub-nav-btn ${hubTab === 'overview' ? 'active' : ''}`}
                onClick={() => setHubTab('overview')}
              >
                <Layers /> Overview & Syllabus
              </button>
              <button
                type="button"
                className={`course-hub-nav-btn ${hubTab === 'materials' ? 'active' : ''}`}
                onClick={() => setHubTab('materials')}
              >
                <FileText /> Study Materials <em>{selectedCourse.materials?.length || 0}</em>
              </button>
              <button
                type="button"
                className={`course-hub-nav-btn ${hubTab === 'assessments' ? 'active' : ''}`}
                onClick={() => setHubTab('assessments')}
              >
                <Award /> Assessments & Deadlines <em>{selectedCourse.assessments?.length || 0}</em>
              </button>
              <button
                type="button"
                className={`course-hub-nav-btn ${hubTab === 'announcements' ? 'active' : ''}`}
                onClick={() => setHubTab('announcements')}
              >
                <Bell /> Announcements <em>{selectedCourse.announcements?.length || 0}</em>
              </button>
              <button
                type="button"
                className={`course-hub-nav-btn ${hubTab === 'groups' ? 'active' : ''}`}
                onClick={() => setHubTab('groups')}
              >
                <Users /> Study Groups <em>{selectedCourse.studyGroups?.length || 0}</em>
              </button>
            </nav>

            {/* Modal Body */}
            <div className="course-hub-body">
              {/* TAB 1: OVERVIEW & SYLLABUS */}
              {hubTab === 'overview' && (
                <>
                  <div className="course-overview-grid">
                    <div className="overview-box">
                      <h4>
                        <BookOpen /> Course Description & Learning Goals
                      </h4>
                      <p>{selectedCourse.description}</p>
                      <div
                        style={{
                          marginTop: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'var(--card)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <MapPin style={{ color: '#4338ca', width: '20px' }} />
                        <div>
                          <strong style={{ display: 'block', fontSize: '11px', color: '#0f172a' }}>
                            Lecture Venue: {selectedCourse.schedule?.venue}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            {selectedCourse.schedule?.day} at {selectedCourse.schedule?.time}
                          </span>
                        </div>
                        <Link
                          href="/dashboard/calendar"
                          className="text-button"
                          style={{ marginLeft: 'auto' }}
                        >
                          View timetable <ChevronRight />
                        </Link>
                      </div>
                    </div>

                    <div className="overview-box">
                      <h4>
                        <User /> Course Staff & Contacts
                      </h4>
                      <div className="contact-card-row">
                        <div className="contact-card-avatar">
                          {selectedCourse.lecturer?.name.split(' ').map((n) => n[0]).slice(0, 2).join('') || 'DR'}
                        </div>
                        <div className="contact-card-info">
                          <strong>{selectedCourse.lecturer?.name || 'Dr. Adaeze Okafor'}</strong>
                          <small>{selectedCourse.lecturer?.title || 'Course Lecturer'}</small>
                          <small style={{ color: '#4338ca' }}>{selectedCourse.lecturer?.email}</small>
                        </div>
                      </div>

                      <div className="contact-card-row" style={{ marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                        <div className="contact-card-avatar" style={{ background: '#ecfdf5', color: '#059669' }}>
                          CR
                        </div>
                        <div className="contact-card-info">
                          <strong>{selectedCourse.rep?.name || 'Daniel Chukwu'}</strong>
                          <small>Class Representative</small>
                          <small style={{ color: '#059669' }}>{selectedCourse.rep?.contact}</small>
                        </div>
                        <Link
                          href="/dashboard/messages"
                          className="secondary-button"
                          style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: '10px' }}
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* 12-Week Interactive Syllabus Checklist */}
                  <div className="overview-box" style={{ background: 'var(--card)' }}>
                    <div className="syllabus-section-header">
                      <div>
                        <h3>
                          <CheckCircle2 style={{ color: '#10b981' }} /> Interactive Syllabus & Module Tracker
                        </h3>
                        <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
                          Check off topics as you study. Your progress is dynamically updated in your academic dashboard.
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#4338ca' }}>
                          {selectedCourse.progress || 0}% Done
                        </span>
                      </div>
                    </div>

                    <div className="syllabus-modules-list">
                      {selectedCourse.modules?.map((m) => (
                        <div
                          key={m.week}
                          className={`syllabus-module-item ${m.completed ? 'is-completed' : ''}`}
                          onClick={() => handleToggleModule(selectedCourse.code, m.week)}
                          role="checkbox"
                          aria-checked={m.completed}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault()
                              handleToggleModule(selectedCourse.code, m.week)
                            }
                          }}
                        >
                          <div className="module-checkbox">
                            {m.completed && <Check />}
                          </div>
                          <div className="module-content">
                            <div className="module-content-top">
                              <span className="module-week-tag">Week {m.week}</span>
                              <strong>{m.title}</strong>
                            </div>
                            <p>{m.description}</p>
                          </div>
                        </div>
                      ))}

                      {(!selectedCourse.modules || selectedCourse.modules.length === 0) && (
                        <p style={{ color: '#94a3b8', fontSize: '11px' }}>
                          No detailed syllabus topics loaded for this course yet.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: STUDY MATERIALS & NOTES */}
              {hubTab === 'materials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="materials-tab-toolbar">
                    <div className="materials-filter-pills">
                      {(['all', 'slides', 'notes', 'past_question', 'syllabus'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          type="button"
                          className={`materials-filter-pill ${materialFilter === filterKey ? 'active' : ''}`}
                          onClick={() => setMaterialFilter(filterKey)}
                        >
                          {filterKey === 'all'
                            ? 'All Files'
                            : filterKey === 'slides'
                            ? 'Lecture Slides'
                            : filterKey === 'notes'
                            ? 'Study Notes'
                            : filterKey === 'past_question'
                            ? 'Past Questions'
                            : 'Syllabus PDF'}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setShowUploadModal(true)}
                      style={{ padding: '8px 12px', fontSize: '11px' }}
                    >
                      <Upload style={{ width: '14px' }} /> Upload new file
                    </button>
                  </div>

                  <div className="materials-card-list">
                    {selectedCourse.materials
                      ?.filter((m) => (materialFilter === 'all' ? true : m.type === materialFilter))
                      .map((mat) => (
                        <div className="material-item-card" key={mat.id}>
                          <div className="material-item-lead">
                            <div
                              className={`material-type-icon ${
                                mat.type === 'past_question'
                                  ? 'past'
                                  : mat.type === 'slides'
                                  ? 'slides'
                                  : 'pdf'
                              }`}
                            >
                              <FileText />
                            </div>
                            <div className="material-item-copy">
                              <strong>{mat.title}</strong>
                              <small>
                                {mat.fileSize} · Uploaded {mat.uploadDate} by {mat.uploadedBy}
                              </small>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => triggerToast(`Downloading ${mat.title}...`, 'info')}
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px' }}
                            >
                              <Download style={{ width: '13px' }} /> Download
                            </button>
                          </div>
                        </div>
                      ))}

                    {(!selectedCourse.materials || selectedCourse.materials.length === 0) && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '30px' }}>
                        No course documents uploaded yet. Be the first to share slides or notes!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ASSESSMENTS & DEADLINES */}
              {hubTab === 'assessments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Continuous Assessment Breakdown</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                        Track coursework, tests, quizzes and exam weights.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setShowTaskModal(true)}
                      style={{ padding: '8px 12px', fontSize: '11px' }}
                    >
                      <Plus style={{ width: '14px' }} /> Add assessment task
                    </button>
                  </div>

                  <div className="assessments-grid-list">
                    {selectedCourse.assessments?.map((ass) => (
                      <div className="assessment-card-item" key={ass.id}>
                        <div className="assessment-top">
                          <span className="assessment-type-pill">{ass.type}</span>
                          <span
                            className={`assessment-status-badge ${
                              ass.status === 'graded'
                                ? 'graded'
                                : ass.status === 'submitted'
                                ? 'submitted'
                                : 'pending'
                            }`}
                          >
                            {ass.status === 'graded' ? `Score: ${ass.score}` : ass.status.toUpperCase()}
                          </span>
                        </div>
                        <h4>{ass.title}</h4>
                        <div className="assessment-meta-footer">
                          <span>
                            <Clock3 style={{ width: '12px', display: 'inline', marginRight: '4px' }} />
                            {ass.dueDate}
                          </span>
                          <strong>Weight: {ass.weight}</strong>
                        </div>
                      </div>
                    ))}

                    {(!selectedCourse.assessments || selectedCourse.assessments.length === 0) && (
                      <p style={{ color: '#94a3b8', fontSize: '12px', gridColumn: '1/-1' }}>
                        No pending assessments scheduled for this course.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: ANNOUNCEMENTS */}
              {hubTab === 'announcements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Course Notice Board</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                        Official updates from {selectedCourse.lecturer?.name} and your class rep.
                      </p>
                    </div>
                    {repMode && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => setBroadcastCourse(selectedCourse)}
                        style={{ padding: '8px 12px', fontSize: '11px' }}
                      >
                        <Bell style={{ width: '14px' }} /> Post announcement
                      </button>
                    )}
                  </div>

                  <div className="announcement-list" style={{ padding: 0 }}>
                    {selectedCourse.announcements?.map((item) => (
                      <article
                        className={`announcement ${item.urgent ? 'urgent' : ''}`}
                        key={item.id}
                        style={{ padding: '14px', background: 'var(--card)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '10px' }}
                      >
                        <div className="announcement-icon">
                          <Bell />
                        </div>
                        <div className="announcement-copy">
                          <div className="announcement-meta">
                            <Pill>{selectedCourse.code}</Pill>
                            {item.urgent && <Pill tone="urgent-pill">Urgent</Pill>}
                            <span className="time">{item.date}</span>
                          </div>
                          <h3>{item.title}</h3>
                          <p>{item.content}</p>
                          <span className="author">{item.author}</span>
                        </div>
                      </article>
                    ))}

                    {(!selectedCourse.announcements || selectedCourse.announcements.length === 0) && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '30px' }}>
                        No active announcements for {selectedCourse.code}. All up to date!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: STUDY GROUPS */}
              {hubTab === 'groups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Peer Study Groups & Circles</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
                        Collaborate with classmates enrolled in {selectedCourse.code}.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setShowGroupModal(true)}
                      style={{ padding: '8px 12px', fontSize: '11px' }}
                    >
                      <Plus style={{ width: '14px' }} /> Create study group
                    </button>
                  </div>

                  <div className="study-groups-container">
                    {selectedCourse.studyGroups?.map((group) => (
                      <div className="study-group-card" key={group.id}>
                        <div className="study-group-info">
                          <strong>{group.name}</strong>
                          <span>
                            <Users style={{ width: '13px', display: 'inline', marginRight: '4px' }} />
                            {group.membersCount} classmates enrolled · Meeting: {group.meetingTime}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className={group.isJoined ? 'secondary-button' : 'primary-button'}
                            onClick={() => handleToggleGroupJoin(group.id)}
                            style={{ fontSize: '11px', padding: '7px 12px' }}
                          >
                            {group.isJoined ? 'Joined ✓' : 'Join group'}
                          </button>
                          <Link
                            href="/dashboard/groups"
                            className="secondary-button"
                            style={{ fontSize: '11px', padding: '7px 12px' }}
                          >
                            Open chat
                          </Link>
                        </div>
                      </div>
                    ))}

                    {(!selectedCourse.studyGroups || selectedCourse.studyGroups.length === 0) && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '30px' }}>
                        No study circles formed yet. Create the first study group for this course!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: JOIN / REGISTER COURSE MODAL (Catalog + Custom)
          ==================================================================== */}
      {showJoinModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowJoinModal(false)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 600px)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Academic Course Registration</p>
                <h2>Enroll Courses in {selectedLevel}</h2>
                <p>Register departmental core or elective courses for <strong>{selectedSemester}</strong>.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowJoinModal(false)}
                aria-label="Close join course modal"
              >
                <X />
              </button>
            </div>

            {/* Modal Tabs: Catalog vs Custom Registration */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className={`secondary-button ${joinTab === 'catalog' ? 'active' : ''}`}
                onClick={() => setJoinTab('catalog')}
                style={{
                  fontSize: '12px',
                  padding: '7px 14px',
                  backgroundColor: joinTab === 'catalog' ? '#4338ca' : undefined,
                  color: joinTab === 'catalog' ? '#fff' : undefined,
                  borderColor: joinTab === 'catalog' ? '#4338ca' : undefined,
                }}
              >
                <BookOpen style={{ width: '13px', marginRight: '6px' }} /> Available Catalog
              </button>
              <button
                type="button"
                className={`secondary-button ${joinTab === 'custom' ? 'active' : ''}`}
                onClick={() => setJoinTab('custom')}
                style={{
                  fontSize: '12px',
                  padding: '7px 14px',
                  backgroundColor: joinTab === 'custom' ? '#4338ca' : undefined,
                  color: joinTab === 'custom' ? '#fff' : undefined,
                  borderColor: joinTab === 'custom' ? '#4338ca' : undefined,
                }}
              >
                <Plus style={{ width: '13px', marginRight: '6px' }} /> Custom Course Form
              </button>
            </div>

            {joinTab === 'catalog' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px' }}>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                  Recommended curriculum courses for <strong>{selectedLevel} · {selectedSemester}</strong>:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                  {(() => {
                    const catalogToDisplay = backendCatalog.length > 0 ? backendCatalog : availableCatalogCourses
                    if (catalogToDisplay.length === 0) {
                      return (
                        <div style={{ padding: '36px 16px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                          <BookOpen style={{ width: '28px', height: '28px', color: '#6366f1', margin: '0 auto 10px', opacity: 0.8 }} />
                          <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 600 }}>No Course Catalog Entries</h4>
                          <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--muted-foreground)', maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto' }}>
                            No courses found for {selectedLevel}. You can register any real course using the custom course form.
                          </p>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => setJoinTab('custom')}
                            style={{ fontSize: '12px', padding: '7px 16px' }}
                          >
                            <Plus style={{ width: '13px', marginRight: '6px' }} /> Open Custom Course Form
                          </button>
                        </div>
                      )
                    }

                    return catalogToDisplay
                      .filter((c: any) => {
                        if (c.level && c.level === selectedLevel) return true
                        return true
                      })
                      .map((item: any) => {
                        const isAlreadyEnrolled = courseList.some((c) => c.code === item.code)
                        return (
                          <div
                            key={item.code}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>{item.code}</strong>
                                <span className="course-unit-pill">{item.units || 3} Units</span>
                                <span className={`course-category-pill ${item.category === 'Elective' ? 'elective' : 'core'}`}>
                                  {item.category || 'Core'}
                                </span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>
                                  {item.level || selectedLevel} · {item.semester || selectedSemester}
                                </span>
                              </div>
                              <h4 style={{ margin: '4px 0 2px', fontSize: '13px', fontWeight: 600 }}>{item.name}</h4>
                              <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Lecturer: {item.lecturer?.name || 'Faculty Staff'} &bull; Venue: {item.schedule?.venue || 'Lecture Hall'}
                              </p>
                            </div>
                            <div>
                              {isAlreadyEnrolled ? (
                                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Check style={{ width: '13px' }} /> Enrolled
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="primary-button"
                                  onClick={() => handleJoinCatalogCourse(item)}
                                  style={{ fontSize: '11px', padding: '6px 12px' }}
                                >
                                  Enroll in {selectedLevel}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCustomJoin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                {/* Level & Semester Hierarchy Selectors */}
                <div className="event-field-grid">
                  <label>
                    Academic Level (Year) *
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select name="level" defaultValue={selectedLevel} style={{ flex: 1 }}>
                        {levels.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setNewLevelInput('')
                          setShowAddLevelModal(true)
                        }}
                        title="Add custom level"
                        style={{ padding: '0 10px', fontSize: '12px' }}
                      >
                        +
                      </button>
                    </div>
                  </label>
                  <label>
                    Academic Semester *
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        name="semester"
                        defaultValue={selectedSemester === 'All Semesters' ? 'First Semester' : selectedSemester}
                        style={{ flex: 1 }}
                      >
                        {semesters.map((sem) => (
                          <option key={sem} value={sem}>{sem}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          setNewSemesterInput('')
                          setShowAddSemesterModal(true)
                        }}
                        title="Add custom semester"
                        style={{ padding: '0 10px', fontSize: '12px' }}
                      >
                        +
                      </button>
                    </div>
                  </label>
                </div>

                <div className="event-field-grid">
                  <label>
                    Course code *
                    <input name="code" required placeholder="e.g. CSC 409" autoFocus />
                  </label>
                  <label>
                    Course title *
                    <input name="name" required placeholder="e.g. Cloud Computing & Distributed Systems" />
                  </label>
                </div>

                <div className="event-field-grid">
                  <label>
                    Credit hours / units *
                    <select name="units" defaultValue="3">
                      <option value="1">1 Credit Unit (Practical / Seminar)</option>
                      <option value="2">2 Credit Units (Standard Lecture)</option>
                      <option value="3">3 Credit Units (Core Course)</option>
                      <option value="4">4 Credit Units (Heavy Lab / Math)</option>
                      <option value="6">6 Credit Units (SIWES / Final Project)</option>
                    </select>
                  </label>
                  <label>
                    Course category
                    <select name="category" defaultValue="Core">
                      <option value="Core">Core Departmental</option>
                      <option value="Elective">Departmental Elective</option>
                      <option value="General">General Studies (GST / NUC)</option>
                    </select>
                  </label>
                </div>

                <div className="event-field-grid">
                  <label>
                    Department
                    <input name="department" defaultValue="Computer Science" placeholder="e.g. Computer Science" />
                  </label>
                  <label>
                    Lecturer in charge
                    <input name="lecturer" placeholder="e.g. Dr. A. Adeyemi" />
                  </label>
                </div>

                <div className="event-field-grid">
                  <label>
                    Class venue / lecture hall
                    <input name="venue" placeholder="e.g. Lecture Hall B" />
                  </label>
                  <label>
                    Lecture day
                    <select name="day" defaultValue="Mondays">
                      <option value="Mondays">Mondays</option>
                      <option value="Tuesdays">Tuesdays</option>
                      <option value="Wednesdays">Wednesdays</option>
                      <option value="Thursdays">Thursdays</option>
                      <option value="Fridays">Fridays</option>
                    </select>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}>
                    Time window
                  </label>
                  <input name="time" defaultValue="10:00 AM – 12:00 PM" style={{ width: '100%' }} />
                </div>

                <div className="dialog-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setShowJoinModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    <Plus /> Register course in {selectedLevel}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE ACADEMIC LEVEL
          ==================================================================== */}
      {showAddLevelModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowAddLevelModal(false)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 420px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Academic Structure</p>
                <h2>Create Academic Level</h2>
                <p>Add a study level (e.g. 500 Level, 600 Level, Postgraduate PGD, Masters).</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowAddLevelModal(false)}
                aria-label="Close add level modal"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateLevel} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <label>
                Level Name *
                <input
                  value={newLevelInput}
                  onChange={(e) => setNewLevelInput(e.target.value)}
                  placeholder="e.g. 500 Level or Masters"
                  required
                  autoFocus
                />
              </label>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddLevelModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Plus /> Create Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CREATE ACADEMIC SEMESTER
          ==================================================================== */}
      {showAddSemesterModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowAddSemesterModal(false)}
        >
          <div className="event-dialog" style={{ width: 'min(100%, 420px)' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Academic Semester</p>
                <h2>Create Semester for {selectedLevel}</h2>
                <p>Add a semester term (e.g. Harmattan Semester, Rain Semester, Summer Session).</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowAddSemesterModal(false)}
                aria-label="Close add semester modal"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateSemester} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <label>
                Semester Name *
                <input
                  value={newSemesterInput}
                  onChange={(e) => setNewSemesterInput(e.target.value)}
                  placeholder="e.g. Harmattan Semester or Summer Session"
                  required
                  autoFocus
                />
              </label>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowAddSemesterModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Plus /> Create Semester
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: OFFICIAL COURSE REGISTRATION SLIP MODAL
          ==================================================================== */}
      {showRegSlip && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowRegSlip(false)}
        >
          <div className="reg-slip-dialog">
            <div className="slip-header-brand">
              <div className="slip-seal">
                <div className="slip-seal-badge">EU</div>
                <div className="slip-seal-text">
                  <h2>EXAMPLE UNIVERSITY</h2>
                  <p>Faculty of Science · Department of Computer Science</p>
                  <p><strong>Official Course Registration Slip · 2026/2027 Academic Session</strong></p>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowRegSlip(false)}
                aria-label="Close registration slip"
              >
                <X />
              </button>
            </div>

            <div className="slip-meta-grid">
              <div>
                <label>Student Name</label>
                <strong>Peter Chijioke</strong>
              </div>
              <div>
                <label>Matric / Reg Number</label>
                <strong>EU/2023/CSC/408</strong>
              </div>
              <div>
                <label>Level & Semester</label>
                <strong>{selectedLevel} · {selectedSemester}</strong>
              </div>
              <div>
                <label>Department</label>
                <strong>Computer Science</strong>
              </div>
              <div>
                <label>Total Registered Load</label>
                <strong>{semesterUnits} Credit Units</strong>
              </div>
              <div>
                <label>Registration Status</label>
                <strong style={{ color: '#16a34a' }}>APPROVED & VALIDATED</strong>
              </div>
            </div>

            <table className="slip-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Course Code</th>
                  <th>Course Title</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Lecturer in Charge</th>
                </tr>
              </thead>
              <tbody>
                {coursesInSelectedSemester.map((c, idx) => (
                  <tr key={c.code}>
                    <td>{idx + 1}</td>
                    <td><strong>{c.code}</strong></td>
                    <td>{c.name}</td>
                    <td><strong>{c.units || 3}</strong></td>
                    <td>{c.category || 'Core'}</td>
                    <td>{c.lecturer?.name || 'Staff'}</td>
                  </tr>
                ))}
                {coursesInSelectedSemester.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No courses currently registered for {selectedLevel} · {selectedSemester}.
                    </td>
                  </tr>
                )}
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan={3} style={{ textAlign: 'right' }}>Total Credit Load:</td>
                  <td><strong>{semesterUnits} Units</strong></td>
                  <td colSpan={2}>Maximum Allowed: 24 Units (NUC standard)</td>
                </tr>
              </tbody>
            </table>

            <div className="slip-signatures-row">
              <div className="slip-sig-box">
                <strong>Peter Chijioke</strong>
                <span>Student Signature / Date</span>
              </div>
              <div className="slip-sig-box">
                <strong>Dr. Adaeze Okafor</strong>
                <span>Course Advisor Signature</span>
              </div>
              <div className="slip-sig-box">
                <strong>Prof. K. Bassey</strong>
                <span>Head of Department (HOD)</span>
              </div>
            </div>

            <div className="dialog-actions" style={{ marginTop: '28px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowRegSlip(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  window.print()
                  triggerToast('Opening print dialog for course registration slip...', 'info')
                }}
              >
                <Printer style={{ width: '15px' }} /> Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: RESCHEDULE / CHANGE VENUE (Rep Tool)
          ==================================================================== */}
      {rescheduleCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setRescheduleCourse(null)}
        >
          <form className="event-dialog" onSubmit={handleSaveReschedule}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Course Rep Management</p>
                <h2>Change Lecture Venue / Time</h2>
                <p>Update class details for {rescheduleCourse.code}: {rescheduleCourse.name}.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setRescheduleCourse(null)}
                aria-label="Close venue reschedule"
              >
                <X />
              </button>
            </div>

            <label>
              New Lecture Venue
              <input
                name="venue"
                required
                defaultValue={rescheduleCourse.schedule?.venue || 'Lecture Hall B'}
                placeholder="e.g. ICT Centre Hall 2"
                autoFocus
              />
            </label>

            <div className="event-field-grid">
              <label>
                Lecture Day
                <select name="day" defaultValue={rescheduleCourse.schedule?.day || 'Mondays'}>
                  <option value="Mondays">Mondays</option>
                  <option value="Tuesdays">Tuesdays</option>
                  <option value="Wednesdays">Wednesdays</option>
                  <option value="Thursdays">Thursdays</option>
                  <option value="Fridays">Fridays</option>
                </select>
              </label>
              <label>
                Time window
                <input
                  name="time"
                  required
                  defaultValue={rescheduleCourse.schedule?.time || '10:00 AM – 12:00 PM'}
                />
              </label>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setRescheduleCourse(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Check /> Save & Broadcast Venue Update
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 5: BROADCAST ANNOUNCEMENT (Rep Tool)
          ==================================================================== */}
      {broadcastCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setBroadcastCourse(null)}
        >
          <form className="event-dialog" onSubmit={handleSendBroadcast}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Class Announcement</p>
                <h2>Broadcast Notice to {broadcastCourse.code}</h2>
                <p>Send an official bulletin to all enrolled classmates.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setBroadcastCourse(null)}
                aria-label="Close broadcast"
              >
                <X />
              </button>
            </div>

            <label>
              Announcement Headline
              <input
                name="title"
                required
                placeholder="e.g. Midterm quiz postponed by 1 week"
                autoFocus
              />
            </label>

            <label>
              Detailed notice
              <textarea
                name="content"
                required
                rows={4}
                style={{
                  width: '100%',
                  border: '1px solid #dbe3ef',
                  borderRadius: '7px',
                  padding: '10px 11px',
                  font: 'inherit',
                  fontSize: '12px',
                  outline: 'none',
                }}
                placeholder="Write the full briefing for students..."
              />
            </label>

            <label className="check-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="urgent" />
              <span>Mark as high-priority urgent notice</span>
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setBroadcastCourse(null)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Bell /> Send announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 6: UPLOAD MATERIAL DIALOG
          ==================================================================== */}
      {showUploadModal && selectedCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowUploadModal(false)}
        >
          <form className="event-dialog" onSubmit={handleUploadMaterialSubmit}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">{selectedCourse.code}</p>
                <h2>Upload study material</h2>
                <p>Share lecture slides, past questions, or personal study notes.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowUploadModal(false)}
                aria-label="Close upload dialog"
              >
                <X />
              </button>
            </div>

            <label>
              Document title
              <input
                name="title"
                required
                placeholder="e.g. Module 4: Cloud Security Framework PDF"
                autoFocus
              />
            </label>

            <div className="event-field-grid">
              <label>
                Category
                <select name="type" defaultValue="slides">
                  <option value="slides">Lecture Slides</option>
                  <option value="notes">Study Notes</option>
                  <option value="past_question">Past Questions & Solutions</option>
                  <option value="syllabus">Syllabus / Outline</option>
                </select>
              </label>
              <label>
                Syllabus Week
                <select name="week" defaultValue="4">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Upload /> Upload & publish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 7: ADD ASSESSMENT TASK DIALOG
          ==================================================================== */}
      {showTaskModal && selectedCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowTaskModal(false)}
        >
          <form className="event-dialog" onSubmit={handleAddTaskSubmit}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">{selectedCourse.code}</p>
                <h2>Add Coursework / Assessment</h2>
                <p>Record a test, assignment or quiz to track your grades.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowTaskModal(false)}
                aria-label="Close task dialog"
              >
                <X />
              </button>
            </div>

            <label>
              Assessment Title
              <input
                name="title"
                required
                placeholder="e.g. Lab Exercise 3: Socket Programming"
                autoFocus
              />
            </label>

            <div className="event-field-grid">
              <label>
                Type
                <select name="type" defaultValue="Assignment">
                  <option value="Assignment">Assignment</option>
                  <option value="Test">Mid-Semester Test</option>
                  <option value="Quiz">Quick Quiz</option>
                  <option value="Project">Course Project</option>
                  <option value="Exam">Final Exam</option>
                </select>
              </label>
              <label>
                Weight Percentage
                <input name="weight" defaultValue="15%" placeholder="e.g. 20%" />
              </label>
            </div>

            <label>
              Due Date / Schedule
              <input name="dueDate" defaultValue="Due Fri Oct 23, 11:59 PM" />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Plus /> Save task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 8: CREATE STUDY GROUP DIALOG
          ==================================================================== */}
      {showGroupModal && selectedCourse && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setShowGroupModal(false)}
        >
          <form className="event-dialog" onSubmit={handleCreateGroupSubmit}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow">{selectedCourse.code}</p>
                <h2>Create Study Circle</h2>
                <p>Form a collaborative study team with classmates.</p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowGroupModal(false)}
                aria-label="Close group dialog"
              >
                <X />
              </button>
            </div>

            <label>
              Study Group Name
              <input
                name="name"
                required
                placeholder="e.g. Algorithms Revision Squad"
                autoFocus
              />
            </label>

            <label>
              Regular Meeting Time & Venue
              <input
                name="time"
                defaultValue="Saturdays 3:00 PM @ Library Room 4"
                placeholder="e.g. Thursdays 4:00 PM"
              />
            </label>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowGroupModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                <Users /> Launch study group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================================
          MODAL 9: DROP COURSE CONFIRMATION
          ==================================================================== */}
      {courseToDrop && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && setCourseToDrop(null)}
        >
          <div className="event-dialog" style={{ maxWidth: '440px' }}>
            <div className="dialog-header">
              <div>
                <p className="eyebrow" style={{ color: '#dc2626' }}>
                  Drop Course
                </p>
                <h2>Unenroll from {courseToDrop.code}?</h2>
                <p>
                  Are you sure you want to drop <strong>{courseToDrop.name}</strong>? You will lose access to course materials and class announcements.
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setCourseToDrop(null)}
                aria-label="Close drop dialog"
              >
                <X />
              </button>
            </div>

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setCourseToDrop(null)}
              >
                Keep course
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleConfirmDrop}
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
              >
                <Trash2 /> Yes, drop course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          FLOATING TOASTS NOTIFICATION LAYER
          ==================================================================== */}
      <div className="courses-toast-wrap" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`courses-toast ${toast.type}`}>
            {toast.type === 'success' ? <CheckCircle2 /> : <Sparkles />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}
