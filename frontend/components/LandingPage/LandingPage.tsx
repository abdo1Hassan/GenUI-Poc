"use client"

import Image from "next/image"
import styles from "./LandingPage.module.css"

interface LandingPageProps {
  onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {

  return (
    <div className={styles.landingContainer}>
      <div className={styles.heroSection}>
        <Image
          src="/background.png"
          alt="Landing page background"
          fill
          sizes="100vw"
          style={{ objectFit: "contain", objectPosition: "center" }}
          priority
          className={styles.heroImage}
        />
        
        <button
          className={styles.startButton}
          onClick={onStart}
        >
          <Image
            src="/button.svg"
            alt="Start button"
            width={80}
            height={80}
            className={styles.buttonIcon}
          />
          <div className={styles.buttonGlow} />
        </button>
      </div>
    </div>
  )
}
