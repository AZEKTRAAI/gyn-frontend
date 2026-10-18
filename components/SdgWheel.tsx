// SDG 17-wedge wheel colours (official)
const SDG_WHEEL = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21',
  '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367',
  '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B',
  '#00689D', '#19486A',
]

function buildWheelPath(i: number): string {
  const C = 80, RI = 46, RO = 72, ST = 360 / 17, G = 2.4
  const m = -90 + i * ST
  const a0 = (m - ST / 2 + G / 2) * Math.PI / 180
  const a1 = (m + ST / 2 - G / 2) * Math.PI / 180
  const pt = (r: number, a: number) => `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`
  return `M${pt(RO, a0)} A${RO} ${RO} 0 0 1 ${pt(RO, a1)} L${pt(RI, a1)} A${RI} ${RI} 0 0 0 ${pt(RI, a0)}Z`
}

/** The 17-wedge SDG wheel used in the home and page heroes. Decorative. */
export function SdgWheel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 160" aria-hidden="true">
      {SDG_WHEEL.map((fill, i) => (
        <path key={i} d={buildWheelPath(i)} fill={fill} />
      ))}
    </svg>
  )
}
