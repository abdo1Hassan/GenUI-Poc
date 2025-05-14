"use client"

import { useState, useEffect } from "react"
import styles from "./Layout.module.css"
import Canvas from "../Canvas/Canvas"
import Chat from "../Chat/Chat"

export default function AppLayout() {
  const [focusMode, setFocusMode] = useState<"topFocused" | "bottomFocused">("bottomFocused")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleFocus = () => {
    setFocusMode((prev) => (prev === "topFocused" ? "bottomFocused" : "topFocused"))
  }

  // Listen for user message events to focus the chat
  useEffect(() => {
    const handleUserMessage = () => {
      setFocusMode("bottomFocused")
    }

    window.addEventListener("userMessageSent", handleUserMessage)
    return () => {
      window.removeEventListener("userMessageSent", handleUserMessage)
    }
  }, [])

  // Custom event listener for search triggers
  useEffect(() => {
    const handleSearchTrigger = (event: Event) => {
      const customEvent = event as CustomEvent
      setSearchQuery(customEvent.detail.query)
      setShowSearchResults(true)
      // Automatically focus the top component when search is triggered
      setFocusMode("topFocused")
    }

    // Add event listener
    window.addEventListener("searchTriggered", handleSearchTrigger as EventListener)

    // Clean up
    return () => {
      window.removeEventListener("searchTriggered", handleSearchTrigger as EventListener)
    }
  }, [])

  // Add listener for products loaded event
  useEffect(() => {
    const handleProductsLoaded = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.products && customEvent.detail.products.length > 0) {
        // When products are loaded, ensure search results are visible
        setShowSearchResults(true)
        // Focus the top component to show the products
        setFocusMode("topFocused")
      }
    }

    window.addEventListener("productsLoaded", handleProductsLoaded as EventListener)

    return () => {
      window.removeEventListener("productsLoaded", handleProductsLoaded as EventListener)
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={`${styles.topSection} ${styles[focusMode]}`}>
        <Canvas showSearchResults={showSearchResults} />
      </div>

      <div className={styles.dividerBar} onClick={toggleFocus}>
        <div className={styles.handle}></div>
      </div>

      <div className={`${styles.bottomSection} ${styles[focusMode]}`}>
        <Chat onMessageSent={() => setFocusMode("bottomFocused")} />
      </div>
    </div>
  )
}
