"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import styles from "./Chat.module.css"
import SearchingIndicator from "../SearchingIndicator/SearchingIndicator"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
}

interface SpecialContent {
  type: "search" | "image" | "products"
  query: string
}

interface MessageWithContent extends Message {
  specialContent?: SpecialContent
}

interface Product {
  id: string
  title: string
  brand: string
  price: string
  image: string
  url: string
  nature?: string
}

interface ChatProps {
  onMessageSent?: () => void
}

export default function Chat({ onMessageSent }: ChatProps) {
  // Messages state
  const [messages, setMessages] = useState<MessageWithContent[]>([
    { id: "1", text: "Hello! How can I help you today?", sender: "bot" },
  ])

  // Input and loading states
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Search related states
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchIndicator, setShowSearchIndicator] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Product related states (from previous implementation)
  const [products, setProducts] = useState<Product[]>([])
  const [productTags, setProductTags] = useState<Product[]>([])
  const [intent, setIntent] = useState("")
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [touchDragProducts, setTouchDragProducts] = useState<Product[]>([])

  // Drag-over state
  const [isProductDragOver, setIsProductDragOver] = useState(false)

  // Detect if canvas is maximized (topFocused)
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false)
  useEffect(() => {
    const handleFocusMode = () => {
      // Check if the AppLayout focusMode is topFocused
      const appLayout = document.querySelector('[class*="topSection"]')
      if (appLayout && appLayout.className.includes("topFocused")) {
        setIsCanvasMaximized(true)
      } else {
        setIsCanvasMaximized(false)
      }
    }
    window.addEventListener("userMessageSent", handleFocusMode)
    window.addEventListener("searchTriggered", handleFocusMode)
    window.addEventListener("productsLoaded", handleFocusMode)
    // Also check on mount
    handleFocusMode()
    return () => {
      window.removeEventListener("userMessageSent", handleFocusMode)
      window.removeEventListener("searchTriggered", handleFocusMode)
      window.removeEventListener("productsLoaded", handleFocusMode)
    }
  }, [])

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const searchIndicatorTimer = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      if (searchIndicatorTimer.current) {
        clearTimeout(searchIndicatorTimer.current)
        searchIndicatorTimer.current = null
      }
    }
  }, [])

  // Resize textarea as content changes
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    resizeTextarea()
  }, [inputValue])

  // Log productTags changes
  useEffect(() => {
    console.log("[DEBUG] productTags:", productTags)
  }, [productTags])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() && productTags.length === 0) return

    // Combine input value with product tags
    const fullQuery = `${inputValue} ${productTags.map((tag) => tag.title).join(" ")}`.trim()

    const userMessage: MessageWithContent = {
      id: Date.now().toString(),
      text: fullQuery,
      sender: "user",
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Emit event that user sent a message
    const userMessageEvent = new CustomEvent("userMessageSent", {
      detail: { message: fullQuery },
    })
    window.dispatchEvent(userMessageEvent)

    // Call the onMessageSent callback if provided
    if (onMessageSent) {
      onMessageSent()
    }

    // Check for trigger words to show special content
    const lowerCaseInput = fullQuery.toLowerCase()
    const isSearchQuery =
      lowerCaseInput.includes("search") || lowerCaseInput.includes("find") || lowerCaseInput.includes("look for")

    // If it's a search query, set searching state
    if (isSearchQuery) {
      setIsSearching(true)
      setSearchQuery(fullQuery)
      setShowSearchIndicator(false)

      // Trigger search results in Canvas component via custom event after a delay
      setTimeout(() => {
        const searchEvent = new CustomEvent("searchTriggered", {
          detail: { query: fullQuery },
        })
        window.dispatchEvent(searchEvent as Event)
      }, 2500)
    }

    try {
      // Make API call to backend (preserved from original implementation)
      const res = await fetch("http://localhost:8182/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fullQuery }),
      }).catch(() => {
        // Mock response if API is not available
        return {
          ok: true,
          json: async () => ({
            intent: lowerCaseInput.includes("compare") ? "compare" : "search",
            result: `Here are some results for "${fullQuery}"`,
            products: [
              {
                id: "1",
                title: "Camping Tent",
                brand: "Outdoor Brand",
                price: "$149.99",
                image: "/camping-tent.png",
                url: "/camping-tent",
                nature: "Camping essentials",
              },
              {
                id: "2",
                title: "Water Bottle",
                brand: "Hydro Brand",
                price: "$24.99",
                image: "/reusable-water-bottle.png",
                url: "/water-bottle",
                nature: "Water activities",
              },
              {
                id: "3",
                title: "Sleeping Bag",
                brand: "Comfort Brand",
                price: "$89.99",
                image: "/placeholder.svg?key=fih1r",
                url: "/sleeping-bag",
                nature: "Camping essentials",
              },
              {
                id: "4",
                title: "Kayak",
                brand: "Water Brand",
                price: "$499.99",
                image: "/placeholder.svg?key=41hb2",
                url: "/kayak",
                nature: "Kayaking",
              },
            ],
          }),
        }
      })

      const data = await res.json()
      setIntent(data.intent)

      // Add nature property to products based on their titles
      const productsWithNature = (data.products || []).map((product: Product) => {
        // Extract nature from product title or set default
        let nature = "Other"
        if (product.title.toLowerCase().includes("tent") || product.title.toLowerCase().includes("sleeping")) {
          nature = "Camping essentials"
        } else if (product.title.toLowerCase().includes("water")) {
          nature = "Water activities"
        } else if (product.title.toLowerCase().includes("kayak")) {
          nature = "Kayaking"
        } else if (product.title.toLowerCase().includes("swim")) {
          nature = "Swimming"
        } else if (product.title.toLowerCase().includes("surf")) {
          nature = "Surfing"
        }

        return {
          ...product,
          nature: product.nature || nature,
        }
      })

      // Dispatch event with products for Canvas component
      const productsEvent = new CustomEvent("productsLoaded", {
        detail: { products: productsWithNature },
      })
      window.dispatchEvent(productsEvent as Event)

      // Handle response based on intent
      if (data.intent === "compare") {
        const compareText = `Comparing ${productTags.map((tag) => tag.title).join(" vs ")}`
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: compareText,
            sender: "bot",
            specialContent: {
              type: "products",
              query: fullQuery,
            },
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: data.result,
            sender: "bot",
            specialContent: isSearchQuery
              ? {
                  type: "search",
                  query: fullQuery,
                }
              : undefined,
          },
        ])
      }

      // Set products from API response
      setProducts(productsWithNature || [])
      // Only clear productTags after message send, not after every drag/drop
      setProductTags([])

      // Show search indicator if it's a search query
      if (isSearchQuery) {
        setShowSearchIndicator(true)

        if (searchIndicatorTimer.current) {
          clearTimeout(searchIndicatorTimer.current)
        }

        searchIndicatorTimer.current = setTimeout(() => {
          setShowSearchIndicator(false)
        }, 8000)
      }
    } catch (e) {
      // Handle error
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Something went wrong.",
          sender: "bot",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  // Product drag and drop functionality (preserved from original implementation)
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsProductDragOver(true)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsProductDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsProductDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsProductDragOver(false)
    let productJson = event.dataTransfer.getData("application/json")
    if (!productJson) {
      productJson = event.dataTransfer.getData("product-object")
    }
    let products: Product[] = []
    try {
      const parsed = JSON.parse(productJson)
      if (Array.isArray(parsed)) {
        products = parsed
      } else if (parsed && typeof parsed === 'object') {
        products = [parsed]
      }
    } catch (e) {
      products = []
    }
    // Debug: log products and previous productTags
    console.log('[DEBUG] Dropped products:', products)
    setProductTags(prev => {
      console.log('[DEBUG] Previous productTags:', prev)
      // Combine previous tags and dropped products
      const combined = [...prev, ...products]
      // Deduplicate by unique property (url)
      const seen = new Set()
      const deduped = []
      for (const tag of combined) {
        const key = tag.url // Use url for uniqueness
        if (!seen.has(key)) {
          seen.add(key)
          deduped.push(tag)
        }
      }
      return deduped
    })
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  // Touch-based drag and drop for mobile
  const handleTouchStart = (product: Product) => {
    setIsTouchDragging(true)
    setTouchDragProducts([product])
  }

  const handleTouchEnd = (event: TouchEvent) => {
    if (isTouchDragging && touchDragProducts.length > 0) {
      const inputRect = inputAreaRef.current?.getBoundingClientRect()
      if (inputRect) {
        const touchX = event.changedTouches[0].clientX
        const touchY = event.changedTouches[0].clientY

        if (
          touchX >= inputRect.left &&
          touchX <= inputRect.right &&
          touchY >= inputRect.top &&
          touchY <= inputRect.bottom
        ) {
          setProductTags((prev) => {
            const existingIds = new Set(prev.map((tag) => tag.id))
            const newProducts = touchDragProducts.filter((product) => !existingIds.has(product.id))
            return [...prev, ...newProducts]
          })
          if (textareaRef.current) {
            textareaRef.current.focus()
          }
        }
      }

      setIsTouchDragging(false)
      setTouchDragProducts([])
      setIsProductDragOver(false)
    }
  }

  // Listen for touch drag events from Canvas
  useEffect(() => {
    const handleTouchDrag = (event: Event) => {
      const customEvent = event as CustomEvent
      if (Array.isArray(customEvent.detail?.products)) {
        setTouchDragProducts(customEvent.detail.products)
        setIsTouchDragging(true)
      } else if (customEvent.detail?.product) {
        setTouchDragProducts([customEvent.detail.product])
        setIsTouchDragging(true)
      }
    }

    window.addEventListener("touchDragStart", handleTouchDrag as EventListener)
    return () => {
      window.removeEventListener("touchDragStart", handleTouchDrag as EventListener)
    }
  }, [])

  // Add touch event handlers to input area for mobile drag-and-drop
  useEffect(() => {
    const inputArea = inputAreaRef.current
    if (!inputArea) return

    const handleTouchMove = (event: TouchEvent) => {
      if (isTouchDragging && touchDragProducts.length > 0) {
        setIsProductDragOver(true)
      }
    }
    const handleTouchEnd = (event: TouchEvent) => {
      if (isTouchDragging && touchDragProducts.length > 0) {
        const inputRect = inputArea.getBoundingClientRect()
        const touch = event.changedTouches[0]
        if (
          touch.clientX >= inputRect.left &&
          touch.clientX <= inputRect.right &&
          touch.clientY >= inputRect.top &&
          touch.clientY <= inputRect.bottom
        ) {
          setProductTags(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newProducts = touchDragProducts.filter(p => !existingIds.has(p.id))
            return [...prev, ...newProducts]
          })
        }
        setIsTouchDragging(false)
        setTouchDragProducts([])
        setIsProductDragOver(false)
      }
    }
    inputArea.addEventListener("touchmove", handleTouchMove)
    inputArea.addEventListener("touchend", handleTouchEnd)
    return () => {
      inputArea.removeEventListener("touchmove", handleTouchMove)
      inputArea.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isTouchDragging, touchDragProducts, productTags])

  const removeTag = (idToRemove: string) => {
    setProductTags((prev) => prev.filter((tag) => tag.id !== idToRemove))
  }

  return (
    <div className={`${styles.container} ${isCanvasMaximized ? "canvasMaximized" : ""}`}>
      <div className={styles.messageList}>
        {messages.map((message) => (
          <div key={message.id} className={styles.messageGroup}>
            <div className={styles.senderLabel}>{message.sender === "user" ? "" : "AI Assistant"}</div>
            <div className={`${styles.message} ${message.sender === "user" ? styles.userMessage : styles.botMessage}`}>
              {message.text}
            </div>
            {/* Show search indicator below the response when the message is from the bot and it's a search query */}
            {message.sender === "bot" &&
              message.specialContent?.type === "search" &&
              isSearching &&
              showSearchIndicator && <SearchingIndicator query={searchQuery} visible={showSearchIndicator} />}
          </div>
        ))}

        {/* Remove the product carousel from here since products will now be in Canvas */}

        {/* Loading indicator */}
        {isLoading && (
          <div className={styles.messageGroup}>
            <div className={styles.senderLabel}>AI Assistant</div>
            <div className={`${styles.message} ${styles.botMessage}`}>
              <div className={styles.loadingDots}>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          </div>
        )}

        {/* Show the searching indicator outside of the message flow only when there are no search-related messages yet */}
        {isSearching &&
          showSearchIndicator &&
          !messages.some((m) => m.sender === "bot" && m.specialContent?.type === "search") && (
            <div className={styles.messageGroup}>
              <SearchingIndicator query={searchQuery} visible={showSearchIndicator} />
            </div>
          )}

        <div ref={messagesEndRef} />
      </div>

      <div
        className={styles.inputContainer}
        ref={inputAreaRef}
        style={{ position: "relative" }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isProductDragOver && (
          <div className={styles.dragOverlay}>
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#ffcd4e",
              fontWeight: 600,
              fontSize: 16,
              pointerEvents: "none"
            }}>
              Drop product here to add
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className={styles.inputForm} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Product chips inside the input bar, before the textarea */}
          {productTags.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row", gap: 4, alignItems: "center", maxWidth: 220, overflowX: "auto" }}>
              {productTags.map((tag, idx) => (
                <div key={tag.id || idx} className={styles.productChip}>
                  <img
                    src={tag.image}
                    alt={tag.title}
                    className={styles.productChipImg}
                  />
                  <button
                    type="button"
                    className={styles.productChipClose}
                    onClick={() => removeTag(tag.id)}
                    aria-label={`Remove ${tag.title}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L7 7M1 7L7 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            placeholder={isDraggingOver || isTouchDragging ? "Drop product here..." : "Exploring..."}
            rows={1}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={(!inputValue.trim() && productTags.length === 0) || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.70853 5.83408C5.70853 3.46349 7.62998 1.54175 10.0002 1.54175C12.3704 1.54175 14.2919 3.46349 14.2919 5.83408V9.58466C14.2919 11.9552 12.3704 13.877 10.0002 13.877C7.62998 13.877 5.70853 11.9552 5.70853 9.58466V5.83408ZM10.0002 3.04198C8.4584 3.04198 7.20853 4.29204 7.20853 5.83408V9.58466C7.20853 11.1267 8.4584 12.3768 10.0002 12.3768C11.542 12.3768 12.7919 11.1267 12.7919 9.58466V5.83408C12.7919 4.29204 11.542 3.04198 10.0002 3.04198ZM4.65724 11.0973L4.95752 11.7847C5.80692 13.7291 7.74602 15.0855 10.0002 15.0855C12.2544 15.0855 14.1935 13.7291 15.0429 11.7847L15.3432 11.0973L16.7177 11.698L16.4174 12.3854C15.4332 14.6384 13.2962 16.2748 10.7502 16.546V18.461H9.2502V16.546C6.70418 16.2748 4.56724 14.6384 3.58299 12.3854L3.28271 11.698L4.65724 11.0973Z"
                fill="#101010"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
