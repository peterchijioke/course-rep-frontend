import Link from 'next/link'
import { ChevronRight, GraduationCap } from 'lucide-react'
import { Pill } from '@/components/pill'
import { LandingHeader } from '@/components/marketing/header'
import { SiteFooter } from '@/components/marketing/footer'

export default function AboutPage() {
  return (
    <main className="landing-page landing-info-page">
      <LandingHeader />

      <section className="about-hero">
        <Pill tone="landing-pill">
          <GraduationCap /> About Course Rep
        </Pill>
        <h1>A better way to experience university.</h1>
        <p>
          Course Rep was created to make academic life feel less scattered, more connected,
          and easier to navigate.
        </p>
      </section>

      <section className="about-story">
        <div>
          <p className="eyebrow">Why we built it</p>
          <h2>Students deserve a clearer path through every semester.</h2>
        </div>
        <div>
          <p>
            Important updates live in one place, class conversations in another, and academic
            records are often difficult to understand. Course Rep brings those pieces together in
            one calm workspace.
          </p>
          <p>
            Whether you are checking your next lecture, joining a study group, or planning your next
            academic move, Course Rep helps you stay informed and in control.
          </p>
        </div>
      </section>

      <section className="about-values">
        <article>
          <span>01</span>
          <h3>Clarity over clutter</h3>
          <p>Simple tools and useful information, without the noise.</p>
        </article>
        <article>
          <span>02</span>
          <h3>Progress together</h3>
          <p>Better academic journeys are built through community.</p>
        </article>
        <article>
          <span>03</span>
          <h3>Designed for students</h3>
          <p>Every feature starts with the realities of campus life.</p>
        </article>
      </section>

      <section className="landing-bottom">
        <p className="eyebrow">Your semester starts here</p>
        <h2>Make academic life feel more manageable.</h2>
        <Link href="/register" className="primary-button landing-primary">
          Get started with Course Rep <ChevronRight />
        </Link>
      </section>

      <SiteFooter />
    </main>
  )
}
