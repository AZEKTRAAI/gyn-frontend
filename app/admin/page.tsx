import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'GYN internal dashboard preview with sample data.',
  robots: { index: false, follow: false },
}

// ─── Sample data (all fabricated for UI preview) ─────────────────────────────

const TICKET_COUNTS = [
  { label: 'Full Scholarship', count: 15, color: '#00689D' },
  { label: 'Partial Scholarship', count: 10, color: '#26BDE2' },
  { label: 'Forum Access', count: 42, color: '#FCC30B' },
  { label: 'Self-Funded', count: 23, color: '#F2692C' },
  { label: 'Invitation Letter', count: 7, color: '#48783F' },
]

const DAILY_REGS = [
  { date: 'Oct 8', count: 3 },
  { date: 'Oct 9', count: 7 },
  { date: 'Oct 10', count: 12 },
  { date: 'Oct 11', count: 9 },
  { date: 'Oct 12', count: 5 },
  { date: 'Oct 13', count: 14 },
  { date: 'Oct 14', count: 18 },
  { date: 'Oct 15', count: 11 },
  { date: 'Oct 16', count: 6 },
]

const REVENUE = [
  { tier: 'Forum Access ($199)', revenue: 8358, color: '#FCC30B' },
  { tier: 'Self-Funded ($349)', revenue: 8027, color: '#F2692C' },
  { tier: 'Invitation Letter ($49)', revenue: 343, color: '#48783F' },
]

const SCHOLARSHIP_STATUS = [
  { status: 'Applied', count: 187, color: '#8E9BCB' },
  { status: 'Under review', count: 42, color: '#FCC30B' },
  { status: 'Accepted', count: 25, color: '#48783F' },
  { status: 'Waitlisted', count: 15, color: '#F2692C' },
  { status: 'Rejected', count: 105, color: '#C52035' },
]

const TOP_COUNTRIES = [
  { country: 'Pakistan', count: 34 },
  { country: 'Nigeria', count: 28 },
  { country: 'Bangladesh', count: 22 },
  { country: 'India', count: 19 },
  { country: 'Malaysia', count: 14 },
  { country: 'Kenya', count: 11 },
  { country: 'Nepal', count: 9 },
  { country: 'USA', count: 8 },
]

const RECENT_REGS = [
  { ref: 'GYN-0297', name: 'Amira Hassan', ticket: 'Forum Access', date: '16 Oct', country: 'Egypt', status: 'Confirmed' },
  { ref: 'GYN-0296', name: 'Raj Patel', ticket: 'Self-Funded', date: '16 Oct', country: 'India', status: 'Confirmed' },
  { ref: 'GYN-0295', name: 'Chidi Okonkwo', ticket: 'Forum Access', date: '15 Oct', country: 'Nigeria', status: 'Confirmed' },
  { ref: 'GYN-0294', name: 'Sara Kim', ticket: 'Invitation Letter', date: '15 Oct', country: 'South Korea', status: 'Confirmed' },
  { ref: 'GYN-0293', name: 'Fatima Al Zahra', ticket: 'Self-Funded', date: '15 Oct', country: 'UAE', status: 'Pending' },
]

// ─── SVG Bar chart ────────────────────────────────────────────────────────────

function BarChart({
  data,
  id,
  title,
  width = 560,
  height = 220,
}: {
  data: { label: string; count: number; color: string }[]
  id: string
  title: string
  width?: number
  height?: number
}) {
  const max = Math.max(...data.map((d) => d.count))
  const barW = Math.floor((width - 40) / data.length) - 8
  const chartH = height - 50

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <title id={`${id}-title`}>{title}</title>
        {data.map((d, i) => {
          const barH = Math.round((d.count / max) * chartH)
          const x = 40 + i * (barW + 8)
          const y = chartH - barH + 10
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={barH} fill={d.color} />
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="11"
                fill="#3F3F3C"
                fontFamily="system-ui, sans-serif"
              >
                {d.count}
              </text>
              <text
                x={x + barW / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#76766F"
                fontFamily="system-ui, sans-serif"
              >
                {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
              </text>
            </g>
          )
        })}
        {/* Y axis */}
        <line x1={38} y1={10} x2={38} y2={chartH + 10} stroke="#DCDCD5" strokeWidth={1} />
      </svg>

      {/* Accessible data table fallback */}
      <details style={{ marginTop: '0.75rem' }}>
        <summary
          style={{
            fontSize: '0.75rem',
            color: 'var(--n-500)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          View as table
        </summary>
        <table style={{ marginTop: '0.5rem', width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th style={thStyle}>Label</th>
              <th style={thStyle}>Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td style={tdStyle}>{d.label}</td>
                <td style={tdStyle}>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

// ─── SVG Horizontal bar (for countries) ──────────────────────────────────────

function HorizBarChart({ data, id, title }: {
  data: { country: string; count: number }[]
  id: string
  title: string
}) {
  const max = data[0].count
  const rowH = 28
  const labelW = 90
  const chartW = 300
  const height = data.length * rowH + 20

  return (
    <figure>
      <svg
        viewBox={`0 0 ${labelW + chartW + 40} ${height}`}
        role="img"
        aria-labelledby={`${id}-title`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <title id={`${id}-title`}>{title}</title>
        {data.map((d, i) => {
          const barW = Math.round((d.count / max) * chartW)
          const y = i * rowH + 10
          return (
            <g key={d.country}>
              <text
                x={labelW - 6}
                y={y + 16}
                textAnchor="end"
                fontSize="11"
                fill="#5A5A55"
                fontFamily="system-ui, sans-serif"
              >
                {d.country}
              </text>
              <rect x={labelW} y={y + 4} width={barW} height={16} fill="#00689D" />
              <text
                x={labelW + barW + 5}
                y={y + 16}
                fontSize="11"
                fill="#3F3F3C"
                fontFamily="system-ui, sans-serif"
              >
                {d.count}
              </text>
            </g>
          )
        })}
      </svg>
      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ fontSize: '0.75rem', color: 'var(--n-500)', cursor: 'pointer' }}>
          View as table
        </summary>
        <table style={{ marginTop: '0.5rem', width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Registrations</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.country}>
                <td style={tdStyle}>{d.country}</td>
                <td style={tdStyle}>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

// ─── Line chart (daily regs) ──────────────────────────────────────────────────

function LineChart({ data, id, title }: {
  data: { date: string; count: number }[]
  id: string
  title: string
}) {
  const W = 560
  const H = 180
  const padL = 36
  const padB = 30
  const padT = 16
  const chartW = W - padL - 16
  const chartH = H - padB - padT
  const max = Math.max(...data.map((d) => d.count))
  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * chartW
    const y = padT + chartH - (d.count / max) * chartH
    return `${x},${y}`
  })

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${id}-title`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <title id={`${id}-title`}>{title}</title>
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke="#00689D"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const x = padL + (i / (data.length - 1)) * chartW
          const y = padT + chartH - (d.count / max) * chartH
          return (
            <g key={d.date}>
              <circle cx={x} cy={y} r="3.5" fill="#00689D" />
              <text
                x={x}
                y={H - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#76766F"
                fontFamily="system-ui, sans-serif"
              >
                {d.date}
              </text>
              <text
                x={x}
                y={y - 7}
                textAnchor="middle"
                fontSize="10"
                fill="#3F3F3C"
                fontFamily="system-ui, sans-serif"
              >
                {d.count}
              </text>
            </g>
          )
        })}
        <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="#DCDCD5" strokeWidth={1} />
        <line x1={padL} y1={H - padB} x2={W - 16} y2={H - padB} stroke="#DCDCD5" strokeWidth={1} />
      </svg>
      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ fontSize: '0.75rem', color: 'var(--n-500)', cursor: 'pointer' }}>
          View as table
        </summary>
        <table style={{ marginTop: '0.5rem', width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Registrations</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td style={tdStyle}>{d.date}</td>
                <td style={tdStyle}>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

const thStyle: React.CSSProperties = {
  background: '#0E1530',
  color: '#fff',
  padding: '0.375rem 0.5rem',
  textAlign: 'left',
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderBottom: '1px solid #DCDCD5',
  color: '#3F3F3C',
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--white)', padding: '1.5rem 1.25rem', borderTop: '3px solid var(--blue-deep)' }}>
      <p
        style={{
          fontFamily: 'var(--fd)',
          fontSize: 'clamp(1.125rem, 3vw, 2.25rem)',
          color: 'var(--navy-900)',
          lineHeight: 1,
          marginBottom: '0.375rem',
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--n-700)', fontWeight: 600, marginBottom: sub ? '0.25rem' : 0 }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--n-500)' }}>{sub}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const totalRevenue = REVENUE.reduce((s, r) => s + r.revenue, 0)
  const totalRegs = TICKET_COUNTS.reduce((s, t) => s + t.count, 0)

  return (
    <main id="main" style={{ paddingTop: '3.5rem', background: 'var(--paper)' }}>

      {/* Preview banner */}
      <div
        role="banner"
        style={{
          background: 'var(--yellow)',
          padding: '0.625rem',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy-900)' }}>
          Preview with sample data — all figures are fabricated for UI demonstration only.
        </p>
      </div>

      {/* Page header */}
      <section
        style={{ background: 'var(--navy-900)', paddingBlock: 'clamp(1.5rem, 3vw, 2.5rem)' }}
      >
        <div className="wrap">
          <h1
            className="d2"
            style={{ color: 'var(--white)', marginBottom: '0.25rem' }}
          >
            SISM 2026 Dashboard
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,.6)' }}>
            Registration overview — sample data only
          </p>
          <p style={{ marginTop: '1rem' }}>
            <a href="/admin/home" style={{ display: 'inline-flex', minHeight: 44, alignItems: 'center', padding: '10px 20px', borderRadius: 999, background: 'var(--yellow)', color: 'var(--navy-900)', fontWeight: 700 }}>
              Edit the home page
            </a>
          </p>
        </div>
      </section>

      <div className="wrap" style={{ paddingBlock: 'var(--sp)' }}>

        {/* Summary stats */}
        <section aria-labelledby="summary-hd" style={{ marginBottom: '3rem' }}>
          <h2
            id="summary-hd"
            className="d3"
            style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
          >
            At a glance
          </h2>
          <div className={styles.statsGrid}>
            <StatCard value={String(totalRegs)} label="Total registrations" sub="across all tiers" />
            <StatCard value={`$${totalRevenue.toLocaleString()}`} label="Revenue (USD)" sub="paid tiers only" />
            <StatCard value="187" label="Scholarship applications" sub="closed 11 Oct" />
            <StatCard value="25" label="Accepted scholars" sub="results 16 Oct" />
            <StatCard value="43" label="Videos published" />
            <StatCard value="12" label="Media files" sub="gallery, renders" />
          </div>
        </section>

        {/* Charts row */}
        <div className={styles.chartsGrid}>
          {/* Registrations by ticket */}
          <section
            aria-labelledby="by-ticket-hd"
            style={{ background: 'var(--white)', padding: '1.5rem' }}
          >
            <h2
              id="by-ticket-hd"
              className="d3"
              style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
            >
              Registrations by ticket
            </h2>
            <BarChart
              data={TICKET_COUNTS}
              id="chart-ticket"
              title="Registrations by ticket type"
            />
          </section>

          {/* Registrations by day */}
          <section
            aria-labelledby="by-day-hd"
            style={{ background: 'var(--white)', padding: '1.5rem' }}
          >
            <h2
              id="by-day-hd"
              className="d3"
              style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
            >
              Registrations by day
            </h2>
            <LineChart
              data={DAILY_REGS}
              id="chart-daily"
              title="Daily registration count"
            />
          </section>

          {/* Revenue by tier */}
          <section
            aria-labelledby="revenue-hd"
            style={{ background: 'var(--white)', padding: '1.5rem' }}
          >
            <h2
              id="revenue-hd"
              className="d3"
              style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
            >
              Revenue by tier (USD)
            </h2>
            <BarChart
              data={REVENUE.map((r) => ({ label: r.tier, count: r.revenue, color: r.color }))}
              id="chart-revenue"
              title="Revenue by ticket tier in USD"
            />
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--n-500)',
                marginTop: '0.75rem',
              }}
            >
              Total: ${totalRevenue.toLocaleString()} USD
            </p>
          </section>

          {/* Scholarship applications by status */}
          <section
            aria-labelledby="schol-hd"
            style={{ background: 'var(--white)', padding: '1.5rem' }}
          >
            <h2
              id="schol-hd"
              className="d3"
              style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
            >
              Scholarship applications by status
            </h2>
            <BarChart
              data={SCHOLARSHIP_STATUS.map((s) => ({ label: s.status, count: s.count, color: s.color }))}
              id="chart-schol"
              title="Scholarship application statuses"
            />
          </section>
        </div>

        {/* Top countries */}
        <section
          aria-labelledby="countries-hd"
          style={{ background: 'var(--white)', padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h2
            id="countries-hd"
            className="d3"
            style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
          >
            Top countries
          </h2>
          <HorizBarChart
            data={TOP_COUNTRIES}
            id="chart-countries"
            title="Registrations by country (top 8)"
          />
        </section>

        {/* Recent registrations table */}
        <section
          aria-labelledby="recent-hd"
          style={{ background: 'var(--white)', padding: '1.5rem', marginBottom: '2rem' }}
        >
          <h2
            id="recent-hd"
            className="d3"
            style={{ color: 'var(--navy-900)', marginBottom: '1.25rem' }}
          >
            Recent registrations
          </h2>
          <div role="region" aria-label="Recent registrations table" tabIndex={0} style={{ overflowX: 'auto' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}
              aria-label="Recent registration records"
            >
              <thead>
                <tr>
                  {['Reference', 'Name', 'Ticket', 'Date', 'Country', 'Status'].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_REGS.map((r) => (
                  <tr key={r.ref}>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8125rem' }}>{r.ref}</td>
                    <td style={tdStyle}>{r.name}</td>
                    <td style={tdStyle}>{r.ticket}</td>
                    <td style={tdStyle}>{r.date}</td>
                    <td style={tdStyle}>{r.country}</td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.125rem 0.4rem',
                          background: r.status === 'Confirmed' ? '#48783F' : '#D6A200',
                          color: r.status === 'Confirmed' ? '#fff' : '#0E1530',
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  )
}
