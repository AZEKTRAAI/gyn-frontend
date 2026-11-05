import styles from './panel.module.css'

export function Forbidden() {
  return (
    <div className={styles.box}>
      <h1>Not allowed</h1>
      <p>Your role does not include this section. Ask a Super Administrator if you need access.</p>
    </div>
  )
}
