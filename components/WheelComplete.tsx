// Booking-confirmed moment: 16 SDG wedges build the wheel, a yellow ball bounces in and lands in the gap,
// becomes the 17th wedge (SDG 7), rings burst out and a check draws in the centre. Pure CSS, plays once.
// Base styles are the finished frame, so reduced motion simply shows the completed wheel.
import styles from './WheelComplete.module.css'

// Official SDG colours, goal 1..17
const SDG = ['#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', '#26BDE2', '#FCC30B', '#A21942', '#FD6925',
  '#DD1367', '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', '#00689D', '#19486A']
const C = 80, R_IN = 44, R_OUT = 70, STEP = 360 / 17, GAP = 2.2
const LAND = 6 // goal 7 (yellow) sits at the top and is the one the ball completes

const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`
}
function wedge(i: number) {
  const mid = -90 + (i - LAND) * STEP
  const a0 = mid - STEP / 2 + GAP / 2, a1 = mid + STEP / 2 - GAP / 2
  return `M${pt(R_OUT, a0)} A${R_OUT} ${R_OUT} 0 0 1 ${pt(R_OUT, a1)} L${pt(R_IN, a1)} A${R_IN} ${R_IN} 0 0 0 ${pt(R_IN, a0)}Z`
}
const SPARKS = [-150, -115, -65, -30, 20, 160]

export function WheelComplete({ size = 120 }: { size?: number }) {
  return (
    <svg className={styles.wheel} width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      {SDG.map((fill, i) =>
        i === LAND ? null : (
          <path key={i} className={styles.wedge} d={wedge(i)} fill={fill} style={{ animationDelay: `${((i - LAND + 17) % 17) * 22}ms` }} />
        ),
      )}
      <path className={styles.landed} d={wedge(LAND)} fill={SDG[LAND]} />
      <g className={styles.burst}>
        <circle cx={C} cy={C - 57} r="10" />
        <circle cx={C} cy={C - 57} r="10" />
        {SPARKS.map((deg) => (
          <line key={deg} x1={C} y1={C - 57} x2={C + 30 * Math.cos((deg * Math.PI) / 180)} y2={C - 57 + 30 * Math.sin((deg * Math.PI) / 180)} />
        ))}
      </g>
      {/* x and y animate on separate groups so the fall traces an arc, not a straight line */}
      <g className={styles.ballX}>
        <g className={styles.ballY}>
          <circle className={styles.ball} cx={C} cy={C - 57} r="9" fill={SDG[LAND]} />
        </g>
      </g>
      <path className={styles.check} d="M64 81l11 11 21-24" pathLength={1} />
    </svg>
  )
}
