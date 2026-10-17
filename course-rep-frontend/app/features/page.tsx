import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Pill } from '@/components/pill'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'

export default function FeaturesPage() {
  const cards = [
    ['Courses', 'See your classes, materials, and next steps without hunting through different platforms.'],
    ['Calendar', 'Keep lectures, deadlines, and personal events in one clear academic rhythm.'],
    ['Community', 'Create study groups, message classmates, and share useful resources.'],
  ]

  return (
    <main className="landing-page landing-info-page">
      <LandingHeader />

      <section className="info-hero">
        <Pill tone="landing-pill">
          <Sparkles /> Everything in sync
        </Pill>
        <h1>One workspace for your whole semester.</h1>
        <p>
          Course Rep keeps the details that matter close at hand, from course updates to conversations with your classmates.
        </p>
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
