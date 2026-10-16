import type { HomeContent } from '@/features/home/schema'

interface Props {
  objectives: HomeContent['objectives']
}

export function ObjectivesSection({ objectives }: Props) {
  return (
    <section
      style={{ background: '#EEF2F6', paddingBlock: 'clamp(80px,9vw,144px)' }}
      aria-labelledby="obj-hd"
    >
      <div className="wrap">
        <h2
          id="obj-hd"
          style={{
            fontFamily: 'var(--font-host-grotesk, var(--fb))',
            fontSize: 'clamp(1.875rem,3.5vw,3rem)',
            fontWeight: 600,
            letterSpacing: '-0.008em',
            lineHeight: 1.08,
            color: '#0E1530',
            marginBottom: 'clamp(32px,4vw,48px)',
          }}
        >
          {objectives.heading}
        </h2>

        {/* Ruled grid — 1px border between cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            borderTop: '1px solid rgba(14,21,48,.15)',
            borderLeft: '1px solid rgba(14,21,48,.15)',
          }}
          role="list"
        >
          {objectives.items.map((item) => (
            <div
              key={item.title}
              role="listitem"
              style={{
                borderRight: '1px solid rgba(14,21,48,.15)',
                borderBottom: '1px solid rgba(14,21,48,.15)',
                padding: '1.5rem 1.75rem',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-host-grotesk, var(--fb))',
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: '#0E1530',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: '#202F60',
                  lineHeight: 1.55,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
