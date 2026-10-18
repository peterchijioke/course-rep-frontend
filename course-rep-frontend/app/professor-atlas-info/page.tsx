import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Pill } from '@/components/pill'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'

export default function ProfessorAtlasInfoPage() {
  const cards = [
    ['Understand', 'Ask about grades, credits, course progress, and academic standing.'],
    ['Prioritize', 'Get a clearer view of what deserves your attention this week.'],
    ['Plan ahead', 'Use your record as a starting point for thoughtful academic decisions.'],
  ]

  return (
    <main className="landing-page landing-info-page">
      <LandingHeader />

      <section className="info-hero">
        <Pill tone="landing-pill">
          <Sparkles /> Your academic analyst
        </Pill>
        <h1>Ask better questions about your academic record.</h1>
        <p>
          Prof. Zikora helps you understand the record you have uploaded, spot patterns, and plan your next move with more confidence.
        </p>
        <Link href="/register" className="primary-button landing-primary">
          Start with Gradia <ChevronRight />
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
