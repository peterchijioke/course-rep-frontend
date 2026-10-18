import Link from 'next/link'
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Store,
} from 'lucide-react'
import { Pill } from '@/components/pill'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'

export default function HomePage() {
  return (
    <main className="landing-page">
      <LandingHeader />

      <section className="landing-hero">
        <div className="landing-copy">
          <Pill tone="landing-pill">
            <Sparkles /> Built for better semesters
          </Pill>
          <h1>
            Your academic life, <em>finally in one place.</em>
          </h1>
          <p>
            Course Rep brings courses, announcements, timetables, conversations, and academic
            insights together so students can focus on making progress.
          </p>
          <div className="landing-cta">
            <Link href="/register" className="primary-button landing-primary">
              Start your semester <ChevronRight />
            </Link>
            <Link href="/login" className="landing-secondary">
              Explore the workspace <ArrowUpRight />
            </Link>
          </div>
          <div className="landing-trust">
            <span>
              <Check /> Used by students who want clarity
            </span>
            <span>
              <ShieldCheck /> Built for campus life
            </span>
          </div>
        </div>

        <div className="landing-preview">
          <div className="preview-window">
            <div className="preview-top">
              <span />
              <span />
              <span />
              <small>Course Rep workspace</small>
            </div>
            <div className="preview-body">
              <aside>
                <strong>Course Rep</strong>
                <span className="preview-active">Overview</span>
                <span>My courses</span>
                <span>Calendar</span>
                <span>Prof. Zikora</span>
              </aside>
              <div>
                <p className="eyebrow">Your academic command centre</p>
                <h3>Good morning, Peter</h3>
                <div className="preview-stats">
                  <b>
                    4<small>courses</small>
                  </b>
                  <b>
                    6<small>lectures</small>
                  </b>
                  <b>
                    3<small>deadlines</small>
                  </b>
                </div>
                <div className="preview-card">
                  <span>Next lecture</span>
                  <strong>Software Engineering</strong>
                  <small>Today · 10:00 AM · Lecture Hall B</small>
                </div>
                <div className="preview-card preview-ai">
                  <Sparkles />
                  <div>
                    <strong>Prof. Zikora</strong>
                    <small>Ask anything about your academic record.</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-proof">
        <span>Everything you need to stay in sync</span>
        <strong>Courses</strong>
        <strong>Calendar</strong>
        <strong>Community</strong>
        <strong>Academic insight</strong>
      </section>

      <section className="landing-features" id="features">
        <div>
          <p className="eyebrow">One calm workspace</p>
          <h2>Less chasing. More learning.</h2>
          <p>Every part of your student life is connected, clear, and easy to act on.</p>
        </div>
        <div className="feature-grid">
          <article>
            <CalendarDays />
            <h3>Know what&apos;s next</h3>
            <p>Keep lectures, deadlines, and personal events in one dependable calendar.</p>
          </article>
          <article>
            <MessageCircle />
            <h3>Stay connected</h3>
            <p>Talk with classmates, create study groups, and keep conversations focused.</p>
          </article>
          <article>
            <Store />
            <h3>Trade on campus</h3>
            <p>Buy, sell, and share course materials, devices, and everyday student essentials.</p>
            <Link href="/login" className="feature-link">
              Explore marketplace <ChevronRight />
            </Link>
          </article>
          <article id="atlas">
            <Sparkles />
            <h3>Understand your progress</h3>
            <p>Ask Prof. Zikora to help you make sense of the academic record you uploaded.</p>
          </article>
        </div>
      </section>

      <section className="landing-bottom" id="how-it-works">
        <p className="eyebrow">Your semester, simplified</p>
        <h2>Start with clarity. Finish with confidence.</h2>
        <Link href="/register" className="primary-button landing-primary">
          Create your free account <ChevronRight />
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
