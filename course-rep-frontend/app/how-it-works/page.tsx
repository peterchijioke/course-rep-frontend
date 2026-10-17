import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Pill } from '@/components/pill'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'

export default function HowItWorksPage() {
  const cards = [
    ['1. Set up', 'Create your account and tell us about your institution, department, and level.'],
    ['2. Stay in sync', 'Follow courses, check announcements, and keep your academic calendar current.'],
    ['3. Make progress', 'Use groups and Prof. Zikora to turn information into your next best action.'],
  ]

  return (
    <main className="landing-page landing-info-page">
      <LandingHeader />

      <section className="info-hero">
        <Pill tone="landing-pill">
          <Sparkles /> Simple by design
        </Pill>
        <h1>A calmer way to move through campus life.</h1>
        <p>Course Rep turns a busy semester into a few clear, repeatable steps.</p>
        <Link href="/register" className="primary-button landing-primary">
          Start with Course Rep <ChevronRight />
        </Link>
      </section>

      <section className="info-cards">
        {cards.map(([title, text], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <SiteFooter />
    </main>
  )
}
