"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bookmark, Send, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"

export default function Chat() {
  const [query, setQuery] = useState("")
  const [messages, setMessages] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [productTags, setProductTags] = useState([])
  const [intent, setIntent] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isTouchDragging, setIsTouchDragging] = useState(false)
  const [touchDragProduct, setTouchDragProduct] = useState(null)
  const isMobile = useMobile()

  const inputRef = useRef(null)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const suggestions = [
    "What's the best tent for Glastonbury?",
    "Do you have a roof tent for an Audi A6?",
    "Can I rent camping gear in Cornwall?",
  ]

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, loading])

  const handleSend = async () => {
    if (!query.trim() && productTags.length === 0) return

    const fullQuery = `${query} ${productTags.map((tag) => tag).join(" ")}`.trim()
    const newMessage = { role: "user", content: fullQuery }

    setMessages([...messages, newMessage])
    setQuery("")
    setLoading(true)
    setShowSuggestions(false)

    try {
      const res = await fetch("http://localhost:8182/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fullQuery }),
      })

      const data = await res.json()
      setIntent(data.intent)

      if (data.intent === "compare") {
        const compareText = `Comparing ${productTags.join(" vs ")}`
        setMessages((prev) => [...prev, { role: "assistant", content: compareText }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.result }])
      }

      setProducts(data.products || [])
      setProductTags([])
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  // Standard drag and drop for desktop
  const handleDragOver = (event) => {
    event.preventDefault()
    if (!isDraggingOver) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDraggingOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDraggingOver(false)
    const title = event.dataTransfer.getData("product-title")
    if (title && !productTags.includes(title)) {
      setProductTags((prev) => [...prev, title])
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  // Touch-based drag and drop for mobile
  const handleTouchStart = (product) => {
    if (isMobile) {
      setIsTouchDragging(true)
      setTouchDragProduct(product)
    }
  }

  const handleTouchEnd = (event) => {
    if (isMobile && isTouchDragging && touchDragProduct) {
      // Check if touch ended over the input area
      const inputRect = document.getElementById("search-input-area").getBoundingClientRect()
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

      setIsTouchDragging(false)
      setTouchDragProduct(null)
    }
  }

  const removeTag = (tagToRemove) => {
    setProductTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#3D43DB] text-white">
      {/* Status bar - mobile only */}
      <div className="flex justify-between items-center px-4 py-2 bg-[#3D43DB] md:hidden">
        <div className="text-sm font-medium">9:41</div>
        <div className="flex items-center gap-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 15V9H8V15H6Z" fill="white" />
            <path d="M10 17V7H12V17H10Z" fill="white" />
            <path d="M14 21V3H16V21H14Z" fill="white" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5Z"
              stroke="white"
            />
            <path d="M12 7V12L15 15" stroke="white" strokeLinecap="round" />
          </svg>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="6" width="18" height="12" rx="2" stroke="white" />
            <path d="M7 15V9L12 12L17 9V15" stroke="white" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-3 border-b border-[#5C62FF]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#5C62FF] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
              <path d="M8 12L16 12" stroke="white" strokeWidth="2" />
              <path d="M12 8L12 16" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">Dechatlon</h1>
        </div>
        <div className="flex gap-3">
          <Bookmark className="w-5 h-5" />
          <X className="w-5 h-5" />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-3 pb-20" ref={chatContainerRef} onDragOver={(e) => e.preventDefault()}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 -mt-8">
            <div className="space-y-2 text-center max-w-xs">
              <h2 className="text-2xl font-bold">Is a camping trip on the cards?</h2>
              <p className="text-base opacity-90">Our virtual assistant Dechatlon will help you prep.</p>
            </div>

            {showSuggestions && (
              <div className="w-full max-w-xs space-y-2 mt-6">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full p-3 bg-[#4E54E1] rounded-full text-left text-sm hover:bg-[#5C62FF] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        <div className="space-y-3 max-w-xs mx-auto">
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2"
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[#5C62FF] flex items-center justify-center flex-shrink-0 mt-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                      <path d="M8 12L16 12" stroke="white" strokeWidth="2" />
                      <path d="M12 8L12 16" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl max-w-[85%] text-sm ${
                    msg.role === "user" ? "bg-white text-[#3D43DB] ml-auto" : "bg-[#5C62FF]"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[#3D43DB] text-xs font-bold">U</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#5C62FF] flex items-center justify-center flex-shrink-0 mt-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                  <path d="M8 12L16 12" stroke="white" strokeWidth="2" />
                  <path d="M12 8L12 16" stroke="white" strokeWidth="2" />
                </svg>
              </div>
              <div className="p-3 rounded-xl bg-[#5C62FF] flex items-center">
                <div className="flex space-x-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Product carousel */}
      {products.length > 0 && intent !== "compare" && (
        <div className="bg-[#4E54E1] p-3">
          <div className="overflow-x-auto pb-2 flex gap-3 snap-x snap-mandatory">
            {products.map((p, idx) => (
              <Card
                key={idx}
                draggable={!isMobile}
                onDragStart={(e) => {
                  if (!isMobile) {
                    e.dataTransfer.setData("product-title", p.title)
                    e.currentTarget.classList.add("opacity-60", "scale-95")
                  }
                }}
                onDragEnd={(e) => {
                  if (!isMobile) {
                    e.currentTarget.classList.remove("opacity-60", "scale-95")
                  }
                }}
                onTouchStart={() => handleTouchStart(p)}
                onTouchEnd={handleTouchEnd}
                className="inline-block w-36 flex-shrink-0 snap-center shadow-lg bg-white text-black rounded-xl transition-all duration-200 hover:shadow-xl relative group"
              >
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white text-[#3D43DB] px-2 py-1 rounded text-xs font-medium">
                    {isMobile ? "Tap and hold" : "Drag to search"}
                  </div>
                </div>
                <CardContent className="p-2 space-y-1.5">
                  <img
                    src={p.image || "/placeholder.svg"}
                    alt={p.title}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="font-semibold text-xs truncate">{p.title}</div>
                  <div className="text-[10px] text-gray-700">
                    {p.brand} – {p.price}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-0 p-3 bg-[#3D43DB]">
        <div
          id="search-input-area"
          className="relative max-w-xs mx-auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={(e) => {
            e.preventDefault()
            e.currentTarget.classList.add("ring-2", "ring-white", "ring-opacity-70")
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.currentTarget.classList.remove("ring-2", "ring-white", "ring-opacity-70")
          }}
        >
          {productTags.length > 0 && (
            <div className="absolute -top-12 left-0 right-0 bg-[#4E54E1] p-2 rounded-t-xl flex flex-wrap gap-1.5">
              {productTags.map((tag, idx) => (
                <div
                  key={idx}
                  className="bg-white text-[#3D43DB] text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="text-[10px] hover:bg-gray-200 rounded-full w-3.5 h-3.5 flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-center gap-2 bg-[#4E54E1] rounded-full px-3 py-1.5 ${
              productTags.length > 0 ? "rounded-t-none" : ""
            } transition-all duration-200 border-2 border-transparent ${
              isDraggingOver || isTouchDragging ? "border-white border-dashed bg-[#5C62FF]" : ""
            }`}
          >
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDraggingOver || isTouchDragging ? "Drop product here..." : "Type a question..."}
              className="flex-1 border-none bg-transparent text-white text-sm placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-1"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="rounded-full bg-white text-[#3D43DB] hover:bg-white/90 h-8 w-8 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Touch drag indicator - only visible when dragging on mobile */}
      {isTouchDragging && touchDragProduct && (
        <div
          className="fixed top-0 left-0 pointer-events-none z-50 flex items-center justify-center"
          style={{
            transform: `translate(calc(${window.innerWidth / 2}px - 50%), calc(${window.innerHeight / 2}px - 50%))`,
          }}
        >
          <div className="bg-white text-[#3D43DB] px-3 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
            Drag to search box
          </div>
        </div>
      )}
    </div>
  )
}
