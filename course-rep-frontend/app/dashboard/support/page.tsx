import { Headphones, Mail, Phone } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'

export default function SupportCenterPage() {
  return (
    <>
      <PageHeader
        title="Support center"
        subtitle="We're here to help you stay on track with your academic journey."
      />

      <div className="support-hero">
        <div className="support-hero-icon">
          <Headphones />
        </div>
        <div>
          <p className="eyebrow">Need a hand?</p>
          <h2>Let&apos;s get things sorted.</h2>
          <p>
            Reach out to the Gradia support team for help with your account,
            courses, messages, or anything else in your workspace.
          </p>
        </div>
      </div>

      <div className="support-grid">
        <Panel className="support-card">
          <div className="support-icon support-email">
            <Mail />
          </div>
          <div>
            <p className="eyebrow">Email support</p>
            <h2>Send us an email</h2>
            <p>For detailed questions or issues that need a little more context.</p>
            <a href="mailto:support@courserep.app">support@courserep.app</a>
            <small>We usually reply within one business day.</small>
          </div>
        </Panel>

        <Panel className="support-card">
          <div className="support-icon support-phone">
            <Phone />
          </div>
          <div>
            <p className="eyebrow">Phone support</p>
            <h2>Talk to our team</h2>
            <p>
              For urgent account or access issues, give us a call during support
              hours.
            </p>
            <a href="tel:+2348001234567">+234 800 123 4567</a>
            <small>Monday–Friday, 9:00 AM–5:00 PM WAT</small>
          </div>
        </Panel>
      </div>

      <Panel className="support-note">
        <strong>Before you contact us</strong>
        <span>
          Include your university, level, and a short description of the issue so
          we can help you faster.
        </span>
      </Panel>
    </>
  )
}
