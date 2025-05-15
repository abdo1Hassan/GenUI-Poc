"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import styles from "./StreamingText.module.css"

interface StreamingTextProps {
  text: string
  speed?: number
  isMarkdown?: boolean
  onComplete?: () => void
}

export default function StreamingText({ 
  text, 
  speed = 90, 
  isMarkdown = false,
  onComplete
}: StreamingTextProps) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index))
        index++
      } else {
        clearInterval(timer)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed, onComplete])

  if (isMarkdown) {
    return (
      <div className={`${styles.streamingText} ${isComplete ? styles.complete : ""}`}>
        <ReactMarkdown>{displayText}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className={`${styles.streamingText} ${isComplete ? styles.complete : ""}`}>
      {displayText}
    </div>
  )
}
