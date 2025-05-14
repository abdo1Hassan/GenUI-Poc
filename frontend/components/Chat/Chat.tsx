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
  const [productTags, setProductTags] = useState<string[]>([])
  const [intent, setIntent] = useState("")
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [touchDragProduct, setTouchDragProduct] = useState<Product | null>(null)

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() && productTags.length === 0) return

    // Combine input value with product tags
    const fullQuery = `${inputValue} ${productTags.map((tag) => tag).join(" ")}`.trim()

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
                nature: "Camping essentials",
              },
              {
                id: "2",
                title: "Water Bottle",
                brand: "Hydro Brand",
                price: "$24.99",
                image: "/reusable-water-bottle.png",
                nature: "Water activities",
              },
              {
                id: "3",
                title: "Sleeping Bag",
                brand: "Comfort Brand",
                price: "$89.99",
                image: "/placeholder.svg?key=fih1r",
                nature: "Camping essentials",
              },
              {
                id: "4",
                title: "Kayak",
                brand: "Water Brand",
                price: "$499.99",
                image: "/placeholder.svg?key=41hb2",
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
        const compareText = `Comparing ${productTags.join(" vs ")}`
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
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    if (!isDraggingOver) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDraggingOver(false)
    const title = event.dataTransfer.getData("product-title")
    if (title && !productTags.includes(title)) {
      setProductTags((prev) => [...prev, title])
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  // Touch-based drag and drop for mobile
  const handleTouchStart = (product: Product) => {
    setIsTouchDragging(true)
    setTouchDragProduct(product)
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (isTouchDragging && touchDragProduct) {
      // Check if touch ended over the input area
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
          // Add the product as a tag
          if (!productTags.includes(touchDragProduct.title)) {
            setProductTags((prev) => [...prev, touchDragProduct.title])
          }
        }
      }

      setIsTouchDragging(false)
      setTouchDragProduct(null)
    }
  }

  const removeTag = (tagToRemove: string) => {
    setProductTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  // Listen for touch drag events from Canvas
  useEffect(() => {
    const handleTouchDrag = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.product) {
        setTouchDragProduct(customEvent.detail.product)
        setIsTouchDragging(true)
      }
    }

    window.addEventListener("touchDragStart", handleTouchDrag as EventListener)
    return () => {
      window.removeEventListener("touchDragStart", handleTouchDrag as EventListener)
    }
  }, [])

  return (
    <div className={styles.container}>
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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Product tags */}
        {productTags.length > 0 && (
          <div className={styles.productTags}>
            {productTags.map((tag, idx) => (
              <div key={idx} className={styles.productTag}>
                {tag}
                <div className={styles.removeTag} onClick={() => removeTag(tag)}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L7 7M1 7L7 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            placeholder={isDraggingOver || isTouchDragging ? "Drop product here..." : "Exploring..."}
            rows={1}
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

      {/* Touch drag indicator - only visible when dragging on mobile */}
      {isTouchDragging && touchDragProduct && <div className={styles.dragIndicator}>Drag to input area</div>}
    </div>
  )
}
