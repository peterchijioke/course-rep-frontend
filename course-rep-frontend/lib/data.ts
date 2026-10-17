export interface CourseMaterial {
  id: string
  title: string
  type: 'slides' | 'notes' | 'past_question' | 'syllabus' | 'assignment'
  fileSize: string
  uploadDate: string
  uploadedBy: string
  week?: number
}

export interface CourseAssessment {
  id: string
  title: string
  type: 'Assignment' | 'Test' | 'Quiz' | 'Exam' | 'Project'
  weight: string
  dueDate: string
  status: 'pending' | 'submitted' | 'graded'
  score?: string
}

export interface CourseModule {
  week: number
  title: string
  description: string
  completed: boolean
}

export interface CourseAnnouncement {
  id: string
  title: string
  content: string
  date: string
  author: string
  urgent?: boolean
}

export interface StudyGroup {
  id: string
  name: string
  membersCount: number
  meetingTime: string
  isJoined?: boolean
}

export interface Course {
  code: string
  name: string
  color: string
  unread: number
  next: string
  units?: number
  level?: string
  semester?: 'First Semester' | 'Second Semester'
  department?: string
  category?: 'Core' | 'Elective'
  lecturer?: {
    name: string
    title: string
    email: string
    office: string
  }
  rep?: {
    name: string
    role: string
    contact: string
  }
  schedule?: {
    day: string
    time: string
    venue: string
  }
  description?: string
  progress?: number
  attendance?: number
  materials?: CourseMaterial[]
  assessments?: CourseAssessment[]
  modules?: CourseModule[]
  announcements?: CourseAnnouncement[]
  studyGroups?: StudyGroup[]
}

export const courses: Course[] = [
  {
    code: 'CSC 401',
    name: 'Software Engineering',
    color: 'indigo',
    unread: 2,
    next: 'Mon, 10:00 AM',
    units: 3,
    level: '400 Level',
    semester: 'First Semester',
    department: 'Computer Science',
    category: 'Core',
    lecturer: {
      name: 'Dr. Adaeze Okafor',
      title: 'Senior Lecturer & Head of Software Labs',
      email: 'a.okafor@example.edu',
      office: 'Faculty Block B, Room 204',
    },
    rep: {
      name: 'Daniel Chukwu',
      role: 'Class Representative',
      contact: '+234 803 123 4567',
    },
    schedule: {
      day: 'Mondays',
      time: '10:00 AM – 12:00 PM',
      venue: 'Lecture Hall B',
    },
    description:
      'Comprehensive study of agile methodologies, software architectural styles, requirement elicitation, test-driven development, CI/CD automation, and design patterns for large-scale enterprise systems.',
    progress: 68,
    attendance: 94,
    materials: [
      {
        id: 'mat-1',
        title: 'Module 1: Introduction to Agile & Scrum Framework',
        type: 'slides',
        fileSize: '4.2 MB PDF',
        uploadDate: '3 days ago',
        uploadedBy: 'Dr. Adaeze Okafor',
        week: 1,
      },
      {
        id: 'mat-2',
        title: 'Module 2 & 3: Microservices vs Monolith Architecture Notes',
        type: 'notes',
        fileSize: '1.8 MB PDF',
        uploadDate: '1 week ago',
        uploadedBy: 'Daniel Chukwu (Rep)',
        week: 3,
      },
      {
        id: 'mat-3',
        title: 'CSC 401 2024/2025 First Semester Past Questions & Solutions',
        type: 'past_question',
        fileSize: '3.1 MB PDF',
        uploadDate: '2 weeks ago',
        uploadedBy: 'Peter Chijioke',
      },
      {
        id: 'mat-4',
        title: 'Official Course Syllabus & Grading Rubric',
        type: 'syllabus',
        fileSize: '650 KB PDF',
        uploadDate: '1 month ago',
        uploadedBy: 'Dr. Adaeze Okafor',
      },
    ],
    assessments: [
      {
        id: 'ass-1',
        title: 'Agile User Stories & Sprint Backlog Assignment',
        type: 'Assignment',
        weight: '15%',
        dueDate: 'Due Fri Oct 16, 11:59 PM',
        status: 'pending',
      },
      {
        id: 'ass-2',
        title: 'Mid-Semester Test (Lecture Hall B)',
        type: 'Test',
        weight: '25%',
        dueDate: 'Due Mon Nov 02, 10:00 AM',
        status: 'pending',
      },
      {
        id: 'ass-3',
        title: 'Quiz 1: Design Patterns (Singleton & Factory)',
        type: 'Quiz',
        weight: '10%',
        dueDate: 'Completed Oct 05',
        status: 'graded',
        score: '18 / 20',
      },
      {
        id: 'ass-4',
        title: 'Final Examination (Comprehensive)',
        type: 'Exam',
        weight: '50%',
        dueDate: 'Dec 14, 2026',
        status: 'pending',
      },
    ],
    modules: [
      { week: 1, title: 'Introduction to Modern Software Engineering & Lifecycles', description: 'Waterfall, Agile, Scrum, Kanban, Extreme Programming (XP)', completed: true },
      { week: 2, title: 'Requirements Engineering & UML Modeling', description: 'Use case diagrams, sequence diagrams, class diagrams, user stories', completed: true },
      { week: 3, title: 'Software Architectural Styles & Patterns', description: 'Layered, Hexagonal, Event-driven, Microservices vs Monoliths', completed: true },
      { week: 4, title: 'Design Patterns in Practice (GoF Patterns)', description: 'Creational, Structural, and Behavioral patterns implemented in code', completed: true },
      { week: 5, title: 'Refactoring & Clean Code Principles (SOLID)', description: 'Technical debt identification, code smells, code review best practices', completed: false },
      { week: 6, title: 'Automated Testing, TDD & CI/CD Pipelines', description: 'Unit testing, integration testing, GitHub Actions, Docker containers', completed: false },
      { week: 7, title: 'Software Security & Secure By Design', description: 'OWASP Top 10, authentication protocols, input validation', completed: false },
      { week: 8, title: 'Mid-Semester Review & Team Sprint Progress', description: 'Team project milestone 1 evaluation and critique', completed: false },
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'Lecture venue changed to Lecture Hall B',
        content: "Today's Software Engineering lecture will hold at Lecture Hall B instead of ICT Centre due to projector maintenance.",
        date: '12 min ago',
        author: 'Dr. Adaeze Okafor',
        urgent: true,
      },
      {
        id: 'ann-2',
        title: 'Sprint Backlog assignment submission portal is now open',
        content: 'Please submit your team repository link along with the sprint burn-down PDF on the university portal.',
        date: '2 days ago',
        author: 'Daniel Chukwu · Course Rep',
        urgent: false,
      },
    ],
    studyGroups: [
      { id: 'sg-1', name: 'CSC 401 Sprint Builders', membersCount: 14, meetingTime: 'Wednesdays 4:00 PM', isJoined: true },
      { id: 'sg-2', name: 'Exam Prep & Past Questions Squad', membersCount: 22, meetingTime: 'Saturdays 11:00 AM', isJoined: false },
    ],
  },
  {
    code: 'CSC 403',
    name: 'Artificial Intelligence',
    color: 'blue',
    unread: 1,
    next: 'Tue, 12:00 PM',
    units: 3,
    level: '400 Level',
    semester: 'First Semester',
    department: 'Computer Science',
    category: 'Core',
    lecturer: {
      name: 'Prof. Kingsley Bassey',
      title: 'Professor of Computational Intelligence',
      email: 'k.bassey@example.edu',
      office: 'AI Research Wing, Room 102',
    },
    rep: {
      name: 'Daniel Chukwu',
      role: 'Class Representative',
      contact: '+234 803 123 4567',
    },
    schedule: {
      day: 'Tuesdays',
      time: '12:00 PM – 2:00 PM',
      venue: 'ICT Centre Lab 1',
    },
    description:
      'Heuristic search techniques (A*, Minimax, Alpha-Beta pruning), knowledge representation, probabilistic reasoning, machine learning foundations, and neural network architectures.',
    progress: 55,
    attendance: 90,
    materials: [
      {
        id: 'mat-201',
        title: 'Informed vs Uninformed Search Algorithms Slides',
        type: 'slides',
        fileSize: '5.6 MB PDF',
        uploadDate: '4 days ago',
        uploadedBy: 'Prof. Kingsley Bassey',
        week: 2,
      },
      {
        id: 'mat-202',
        title: 'Python Implementation: A* Algorithm Jupyter Notebook',
        type: 'notes',
        fileSize: '950 KB IPYNB/PDF',
        uploadDate: '1 week ago',
        uploadedBy: 'Prof. Kingsley Bassey',
        week: 3,
      },
      {
        id: 'mat-203',
        title: 'CSC 403 5-Year Past Questions Compilation (2020-2025)',
        type: 'past_question',
        fileSize: '4.8 MB PDF',
        uploadDate: '3 weeks ago',
        uploadedBy: 'Daniel Chukwu (Rep)',
      },
    ],
    assessments: [
      {
        id: 'ass-201',
        title: 'Search Algorithms Python Implementation Assignment',
        type: 'Assignment',
        weight: '20%',
        dueDate: 'Due Fri Oct 16, 11:59 PM',
        status: 'pending',
      },
      {
        id: 'ass-202',
        title: 'Continuous Assessment Test 1',
        type: 'Test',
        weight: '20%',
        dueDate: 'Tue Nov 10, 12:00 PM',
        status: 'pending',
      },
    ],
    modules: [
      { week: 1, title: 'Introduction to Intelligent Agents & AI Environments', description: 'Rationality, PEAS description, environment types', completed: true },
      { week: 2, title: 'Uninformed Search Strategies (BFS, DFS, UCS)', description: 'Completeness, time and space complexity, optimality', completed: true },
      { week: 3, title: 'Informed / Heuristic Search (Greedy, A* Search)', description: 'Admissible heuristics, consistent heuristics, graph search', completed: true },
      { week: 4, title: 'Adversarial Search & Game Playing', description: 'Minimax algorithm, Alpha-Beta pruning, evaluation functions', completed: false },
      { week: 5, title: 'Constraint Satisfaction Problems (CSP)', description: 'Backtracking search, forward checking, constraint propagation', completed: false },
      { week: 6, title: 'Knowledge Representation & First-Order Logic', description: 'Syntax, semantics, inference engines, resolution refutation', completed: false },
    ],
    announcements: [
      {
        id: 'ann-201',
        title: 'Assignment submission deadline reminder',
        content: 'Remember to submit your search algorithms assignment before Friday at 11:59 PM through the online classroom.',
        date: '2 hrs ago',
        author: 'Daniel Chukwu · Course Rep',
        urgent: false,
      },
    ],
    studyGroups: [
      { id: 'sg-201', name: 'AI & Neural Nets Study Cell', membersCount: 18, meetingTime: 'Thursdays 3:00 PM', isJoined: true },
    ],
  },
  {
    code: 'CSC 405',
    name: 'Computer Networks',
    color: 'amber',
    unread: 0,
    next: 'Wed, 9:00 AM',
    units: 3,
    level: '400 Level',
    semester: 'First Semester',
    department: 'Computer Science',
    category: 'Core',
    lecturer: {
      name: 'Engr. Dr. Bello Sanusi',
      title: 'Associate Professor of Network Engineering',
      email: 'b.sanusi@example.edu',
      office: 'Engineering Complex, Room 311',
    },
    rep: {
      name: 'Daniel Chukwu',
      role: 'Class Representative',
      contact: '+234 803 123 4567',
    },
    schedule: {
      day: 'Wednesdays',
      time: '9:00 AM – 11:00 AM',
      venue: 'Networking Lab A',
    },
    description:
      'In-depth study of computer network protocols, OSI and TCP/IP stack, routing algorithms (OSPF, BGP), congestion control, socket programming, Wireshark packet analysis, and SDN architecture.',
    progress: 42,
    attendance: 88,
    materials: [
      {
        id: 'mat-301',
        title: 'TCP/IP Protocol Suite & Subnetting Guide',
        type: 'slides',
        fileSize: '3.8 MB PDF',
        uploadDate: '5 days ago',
        uploadedBy: 'Engr. Dr. Bello Sanusi',
        week: 2,
      },
      {
        id: 'mat-302',
        title: 'Cisco Packet Tracer Lab Topology Manual',
        type: 'notes',
        fileSize: '2.4 MB PDF',
        uploadDate: '2 weeks ago',
        uploadedBy: 'Engr. Dr. Bello Sanusi',
        week: 3,
      },
    ],
    assessments: [
      {
        id: 'ass-301',
        title: 'Network Subnetting & Design Test',
        type: 'Test',
        weight: '25%',
        dueDate: 'Due Fri Oct 16, 11:59 PM',
        status: 'pending',
      },
    ],
    modules: [
      { week: 1, title: 'Network Architecture & Physical Layer Fundamentals', description: 'Transmission media, modulation, topology designs', completed: true },
      { week: 2, title: 'Data Link Layer & MAC Protocols (Ethernet, CSMA/CD)', description: 'Error detection/correction, CRC, framing', completed: true },
      { week: 3, title: 'IPv4 & IPv6 Addressing, Subnetting & CIDR', description: 'Classless addressing, VLSM calculations, NAT', completed: false },
      { week: 4, title: 'Routing Protocols & Algorithms (Distance Vector vs Link State)', description: 'Dijkstra algorithm, Bellman-Ford, OSPF, BGP', completed: false },
    ],
    announcements: [],
    studyGroups: [
      { id: 'sg-301', name: 'Packet Tracer Lab Group', membersCount: 9, meetingTime: 'Wednesdays 12:00 PM', isJoined: false },
    ],
  },
  {
    code: 'CSC 407',
    name: 'Information Security',
    color: 'slate',
    unread: 0,
    next: 'Thu, 2:00 PM',
    units: 3,
    level: '400 Level',
    semester: 'First Semester',
    department: 'Computer Science',
    category: 'Core',
    lecturer: {
      name: 'Dr. Fatima Umar',
      title: 'Senior Cyber Security Consultant',
      email: 'f.umar@example.edu',
      office: 'Cyber Defence Centre, Room 05',
    },
    rep: {
      name: 'Daniel Chukwu',
      role: 'Class Representative',
      contact: '+234 803 123 4567',
    },
    schedule: {
      day: 'Thursdays',
      time: '2:00 PM – 4:00 PM',
      venue: 'Lecture Hall C',
    },
    description:
      'Cryptography (symmetric and asymmetric ciphers, RSA, AES), public key infrastructure (PKI), authentication protocols, web security vulnerabilities, penetration testing foundations, and threat modeling.',
    progress: 75,
    attendance: 96,
    materials: [
      {
        id: 'mat-401',
        title: 'Applied Cryptography: RSA, Elliptic Curves & AES Slides',
        type: 'slides',
        fileSize: '4.9 MB PDF',
        uploadDate: '6 days ago',
        uploadedBy: 'Dr. Fatima Umar',
        week: 3,
      },
      {
        id: 'mat-402',
        title: 'Web Application Security & OWASP Top 10 Lab Guide',
        type: 'notes',
        fileSize: '2.1 MB PDF',
        uploadDate: '2 weeks ago',
        uploadedBy: 'Dr. Fatima Umar',
        week: 4,
      },
    ],
    assessments: [
      {
        id: 'ass-401',
        title: 'RSA Cryptanalysis & Python Decryption Lab',
        type: 'Assignment',
        weight: '20%',
        dueDate: 'Due Thu Oct 22, 11:59 PM',
        status: 'pending',
      },
    ],
    modules: [
      { week: 1, title: 'Security Principles: CIA Triad & Threat Modeling', description: 'Confidentiality, Integrity, Availability, STRIDE framework', completed: true },
      { week: 2, title: 'Classical & Symmetric Cryptography (DES, 3DES, AES)', description: 'Stream ciphers, block ciphers, cipher modes of operation', completed: true },
      { week: 3, title: 'Asymmetric Cryptography & Digital Signatures (RSA, ECC)', description: 'Number theory fundamentals, Diffie-Hellman key exchange', completed: true },
      { week: 4, title: 'Public Key Infrastructure (PKI) & Certificates', description: 'X.509 certificates, Certificate Authorities, TLS/SSL handshake', completed: false },
    ],
    announcements: [],
    studyGroups: [],
  },
]

export const availableCatalogCourses: Course[] = []

export const ENROLLED_COURSES_STORAGE_KEY = 'courserep_enrolled_courses_v1'
export const ACADEMIC_LEVELS_STORAGE_KEY = 'courserep_academic_levels_v1'
export const DEFAULT_ACADEMIC_LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level']

export const ACADEMIC_SEMESTERS_STORAGE_KEY = 'courserep_academic_semesters_v1'
export const DEFAULT_ACADEMIC_SEMESTERS = ['First Semester', 'Second Semester']

export function getAcademicLevels(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_ACADEMIC_LEVELS
  }
  try {
    const raw = localStorage.getItem(ACADEMIC_LEVELS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ACADEMIC_LEVELS_STORAGE_KEY, JSON.stringify(DEFAULT_ACADEMIC_LEVELS))
      return DEFAULT_ACADEMIC_LEVELS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACADEMIC_LEVELS
  } catch {
    return DEFAULT_ACADEMIC_LEVELS
  }
}

export function saveAcademicLevels(levels: string[]): string[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACADEMIC_LEVELS_STORAGE_KEY, JSON.stringify(levels))
    window.dispatchEvent(new Event('academic-levels-updated'))
  }
  return levels
}

export function getAcademicSemesters(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_ACADEMIC_SEMESTERS
  }
  try {
    const raw = localStorage.getItem(ACADEMIC_SEMESTERS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(ACADEMIC_SEMESTERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACADEMIC_SEMESTERS))
      return DEFAULT_ACADEMIC_SEMESTERS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACADEMIC_SEMESTERS
  } catch {
    return DEFAULT_ACADEMIC_SEMESTERS
  }
}

export function saveAcademicSemesters(semesters: string[]): string[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACADEMIC_SEMESTERS_STORAGE_KEY, JSON.stringify(semesters))
    window.dispatchEvent(new Event('academic-semesters-updated'))
  }
  return semesters
}

export function getEnrolledCourses(): Course[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = localStorage.getItem(ENROLLED_COURSES_STORAGE_KEY)
    if (!raw) {
      return []
    }
    return JSON.parse(raw) as Course[]
  } catch {
    return []
  }
}

export function saveEnrolledCourses(updatedList: Course[]): Course[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ENROLLED_COURSES_STORAGE_KEY, JSON.stringify(updatedList))
    window.dispatchEvent(new Event('enrolled-courses-updated'))
  }
  return updatedList
}

export interface SelectableCourseItem {
  code: string
  name: string
  units: number
  category: string
  source: 'enrolled' | 'catalog'
}

export function getAllSelectableCourses(): SelectableCourseItem[] {
  const enrolled = getEnrolledCourses()
  const map = new Map<string, SelectableCourseItem>()

  enrolled.forEach((c) => {
    map.set(c.code, {
      code: c.code,
      name: c.name,
      units: c.units || 3,
      category: c.category || 'Core',
      source: 'enrolled',
    })
  })

  availableCatalogCourses.forEach((c) => {
    if (!map.has(c.code)) {
      map.set(c.code, {
        code: c.code,
        name: c.name,
        units: c.units || 3,
        category: c.category || 'Elective',
        source: 'catalog',
      })
    }
  })

  return Array.from(map.values())
}

export type AnnouncementItem = [string, string, string, string, string, boolean]

export const announcements: AnnouncementItem[] = [
  ['CSC 401', 'Lecture venue changed', "Today's Software Engineering lecture will hold at Lecture Hall B instead of ICT Centre.", '12 min ago', 'Dr. Adaeze Okafor', true],
  ['CSC 403', 'Assignment submission deadline', 'Remember to submit your search algorithms assignment before Friday at 11:59 PM.', '2 hrs ago', 'Daniel Chukwu · Course Rep', false],
  ['Department', 'Departmental seminar scheduled', 'Join us this Friday for a conversation on building reliable systems in Africa.', 'Yesterday', 'Computer Science Department', false],
]

export const upcomingDeadlines = [
  { day: '10', month: 'OCT', course: 'CSC 403', title: 'Search Algorithms Assignment', timeLeft: '2 days left', due: 'Due Friday, 11:59 PM' },
  { day: '16', month: 'OCT', course: 'CSC 405', title: 'Network Design Test', timeLeft: '8 days left', due: 'Due Friday, 11:59 PM' },
]

export interface CalendarEvent {
  title: string
  course: string
  date: string
  time: string
  location: string
  tone: string
  removable: boolean
}

export const initialCalendarEvents: CalendarEvent[] = [
  { title: 'Software Engineering', course: 'CSC 401', date: 'Mon 12', time: '10:00 AM – 12:00 PM', location: 'Lecture Hall B', tone: 'indigo-bar', removable: false },
  { title: 'Artificial Intelligence', course: 'CSC 403', date: 'Mon 12', time: '2:00 PM – 4:00 PM', location: 'ICT Centre', tone: 'blue-bar', removable: false },
]

export interface MarketItem {
  id?: string
  title: string
  seller: string
  price: string
  tag: string
  location?: string
  condition?: string
  phone?: string
  verified?: boolean
  description?: string
  date?: string
  imageTone?: string
}

export const initialMarketItems: MarketItem[] = [
  {
    id: 'mkt-1',
    title: 'CSC 403 Past Questions & Worked Solutions (2019–2025)',
    seller: 'Amaka Nwosu',
    price: '₦2,500',
    tag: 'Study materials',
    location: 'Faculty of Science Quad / Digital PDF',
    condition: 'Digital PDF + Hardcopy',
    phone: '+234 812 345 6789',
    verified: true,
    description: 'Comprehensive compilation of 6 years past examination questions for Artificial Intelligence with step-by-step heuristic search solutions.',
    date: '2 hrs ago',
    imageTone: 'blue',
  },
  {
    id: 'mkt-2',
    title: 'Casio fx-991EX ClassWiz Scientific Calculator',
    seller: 'David Obi',
    price: '₦8,000',
    tag: 'Electronics',
    location: 'Hall 3 Boys Hostel (Block B)',
    condition: 'Gently Used (Original Solar)',
    phone: '+234 803 987 6543',
    verified: true,
    description: 'Authentic Casio scientific calculator, perfect for Numerical Analysis (MTH 401) and engineering computations. Clean screen and intact keypad.',
    date: '5 hrs ago',
    imageTone: 'emerald',
  },
  {
    id: 'mkt-3',
    title: 'Clean University Lab Coat · Size L (Unisex)',
    seller: 'Chinonso Eze',
    price: '₦6,500',
    tag: 'Campus essentials',
    location: 'Chemistry Complex / Main Gate',
    condition: 'Like New (Washed & Ironed)',
    phone: '+234 809 111 2233',
    verified: false,
    description: '100% thick white cotton lab coat with embroidered department crest and deep side pockets. Suitable for computer hardware and science labs.',
    date: '1 day ago',
    imageTone: 'amber',
  },
  {
    id: 'mkt-4',
    title: 'CSC 401 Software Engineering Complete Lecture Binder',
    seller: 'Mariam Yusuf',
    price: 'Free',
    tag: 'Study materials',
    location: 'Faculty Block B, Lecture Hall B',
    condition: 'Neat Handwriting & Typed Summaries',
    phone: '+234 814 555 7788',
    verified: true,
    description: 'Full lecture notes, UML diagrams, and software architectural pattern summaries prepared during Dr. Adaeze Okafor’s classes.',
    date: '2 days ago',
    imageTone: 'indigo',
  },
  {
    id: 'mkt-5',
    title: '4-Port USB 3.0 Hub & Ethernet RJ45 Adapter',
    seller: 'Emeka Balogun',
    price: '₦5,500',
    tag: 'Electronics',
    location: 'ICT Innovation Lab',
    condition: 'Brand New in Box',
    phone: '+234 802 444 3322',
    verified: true,
    description: 'High-speed gigabit LAN and USB hub. Essential for CSC 405 Computer Networks packet sniffing labs and Cisco packet tracer setups.',
    date: '3 days ago',
    imageTone: 'slate',
  },
  {
    id: 'mkt-6',
    title: 'Introduction to Algorithms (CLRS 3rd Edition Textbook)',
    seller: 'Blessing Adeyemi',
    price: '₦12,000',
    tag: 'Textbooks',
    location: 'Main University Library Foyer',
    condition: 'Good (Hardcover with Plastic Wrap)',
    phone: '+234 818 777 9900',
    verified: true,
    description: 'Standard computer science reference textbook covering sorting, graph algorithms, dynamic programming, and complexity classes.',
    date: '4 days ago',
    imageTone: 'purple',
  },
]

export interface DetailedAnnouncement {
  id: string
  course: string
  title: string
  body: string
  time: string
  author: string
  urgent: boolean
  pinned?: boolean
  read?: boolean
  category: 'Timetable' | 'Assessment' | 'Department' | 'General'
  venue?: string
}

export const detailedAnnouncements: DetailedAnnouncement[] = [
  {
    id: 'ann-1',
    course: 'CSC 401',
    title: 'Lecture venue relocated to Lecture Hall B',
    body: "Today's Software Engineering lecture with Dr. Adaeze Okafor will hold at Lecture Hall B instead of ICT Centre due to audio-visual repairs.",
    time: '12 min ago',
    author: 'Dr. Adaeze Okafor',
    urgent: true,
    pinned: true,
    read: false,
    category: 'Timetable',
    venue: 'Lecture Hall B',
  },
  {
    id: 'ann-2',
    course: 'CSC 403',
    title: 'Search Algorithms assignment portal opens for submission',
    body: 'Remember to submit your Python implementation and sprint report before Friday at 11:59 PM. Group submissions must include all matric numbers.',
    time: '2 hrs ago',
    author: 'Daniel Chukwu · Course Rep',
    urgent: false,
    pinned: true,
    read: false,
    category: 'Assessment',
  },
  {
    id: 'ann-3',
    course: 'Department',
    title: 'Departmental Academic Seminar on Reliable Distributed Systems',
    body: 'Join the Faculty of Science this Friday for an interactive industry conversation with guest software architects from Paystack and Flutterwave.',
    time: 'Yesterday',
    author: 'Computer Science Department',
    urgent: false,
    pinned: false,
    read: true,
    category: 'Department',
  },
  {
    id: 'ann-4',
    course: 'CSC 405',
    title: 'Continuous Assessment Test 1 Date Fixed',
    body: 'Engr. Dr. Bello Sanusi has confirmed the 25% Subnetting and OSI Network Design test for next Wednesday at 9:00 AM sharp in Networking Lab A.',
    time: '2 days ago',
    author: 'Engr. Dr. Bello Sanusi',
    urgent: true,
    pinned: false,
    read: true,
    category: 'Assessment',
    venue: 'Networking Lab A',
  },
  {
    id: 'ann-5',
    course: 'Faculty',
    title: 'Course Registration Portal Closure Deadline (2026/2027 Session)',
    body: 'All 400L students must finalize their online course forms and print their endorsed course slips before next Monday to prevent late registration penalties.',
    time: '3 days ago',
    author: 'Faculty Academic Officer',
    urgent: false,
    pinned: false,
    read: true,
    category: 'Administrative' as any,
  },
]

export interface NigerianTertiaryInsight {
  institution: string
  faculty: string
  department: string
  level: string
  currentSession: string
  semester: string
  cgpa: {
    current: number
    scale: number
    classOfDegree: string
    totalUnitsEarned: number
    totalUnitsRequired: number
    targetCGPA: number
    targetClass: string
  }
  gradingScale: {
    grade: string
    range: string
    points: number
    description: string
  }[]
  sessionPacing: {
    currentWeek: number
    totalWeeks: number
    status: string
    daysToExams: number
    syllabusPacingScore: number
    strikeResilience: string
  }
  continuousAssessmentBreakdown: {
    courseCode: string
    courseTitle: string
    units: number
    caScore: number
    caMax: number
    examWeight: number
    minExamForA: number
    status: string
  }[]
  departmentBenchmarks: {
    cohortSize: number
    firstClassCount: number
    secondClassUpperCount: number
    averageCGPA: number
    courseRepResponseSpeed: string
    lectureAttendanceRate: number
  }
}

export const nigerianTertiaryData: NigerianTertiaryInsight = {
  institution: 'Example University of Science & Technology',
  faculty: 'Faculty of Natural & Applied Sciences',
  department: 'Department of Computer Science',
  level: '400 Level',
  currentSession: '2026/2027 Academic Session',
  semester: 'First Semester',
  cgpa: {
    current: 4.38,
    scale: 5.0,
    classOfDegree: 'Second Class Upper Division (2:1)',
    totalUnitsEarned: 118,
    totalUnitsRequired: 152,
    targetCGPA: 4.52,
    targetClass: 'First Class Honours (4.50 – 5.00)',
  },
  gradingScale: [
    { grade: 'A', range: '70% – 100%', points: 5.0, description: 'Excellent / First Class standard' },
    { grade: 'B', range: '60% – 69%', points: 4.0, description: 'Very Good / Second Class Upper' },
    { grade: 'C', range: '50% – 59%', points: 3.0, description: 'Good / Second Class Lower' },
    { grade: 'D', range: '45% – 49%', points: 2.0, description: 'Fair / Third Class' },
    { grade: 'F', range: '0% – 44%', points: 0.0, description: 'Fail / Carry Over required' },
  ],
  sessionPacing: {
    currentWeek: 7,
    totalWeeks: 15,
    status: 'Active Academic Session (Normal Calendar)',
    daysToExams: 42,
    syllabusPacingScore: 68,
    strikeResilience: 'High Stability (Zero Distruption Indexed)',
  },
  continuousAssessmentBreakdown: [
    {
      courseCode: 'CSC 401',
      courseTitle: 'Software Engineering',
      units: 3,
      caScore: 26,
      caMax: 30,
      examWeight: 70,
      minExamForA: 44, // 26 + 44 = 70 (A)
      status: 'First Class Trajectory',
    },
    {
      courseCode: 'CSC 403',
      courseTitle: 'Artificial Intelligence',
      units: 3,
      caScore: 24,
      caMax: 30,
      examWeight: 70,
      minExamForA: 46, // 24 + 46 = 70 (A)
      status: 'Strong Standing',
    },
    {
      courseCode: 'CSC 405',
      courseTitle: 'Computer Networks',
      units: 3,
      caScore: 22,
      caMax: 30,
      examWeight: 70,
      minExamForA: 48, // 22 + 48 = 70 (A)
      status: 'On Target',
    },
    {
      courseCode: 'CSC 407',
      courseTitle: 'Information Security',
      units: 3,
      caScore: 27,
      caMax: 30,
      examWeight: 70,
      minExamForA: 43, // 27 + 43 = 70 (A)
      status: 'First Class Trajectory',
    },
  ],
  departmentBenchmarks: {
    cohortSize: 148,
    firstClassCount: 12,
    secondClassUpperCount: 64,
    averageCGPA: 3.64,
    courseRepResponseSpeed: 'Under 5 minutes',
    lectureAttendanceRate: 92,
  },
}

