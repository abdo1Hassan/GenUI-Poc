"use client"

import type React from "react"
import { useEffect, useState } from "react"
import ReactDOM from "react-dom"
import styles from "./SearchResults.module.css"
import transitions from "./transitions.module.css"
import { useMobile } from "../../hooks/use-mobile"

interface Product {
  id: string
  title: string
  brand: string
  price: string
  image: string
  nature?: string // Add nature property for categorization
}

interface SearchResultsProps {
  products: Product[]
}

const SearchResults: React.FC<SearchResultsProps> = ({ products }) => {
  // Add state for selected chip
  const [selectedChip, setSelectedChip] = useState<string>("")
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [chipAnimation, setChipAnimation] = useState<"idle" | "slideOut" | "slideIn">("idle")
  const [pendingProductIndex, setPendingProductIndex] = useState<number | null>(null)
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null)
  const isMobile = useMobile()

  // Track if a drag is in progress
  const [isDragging, setIsDragging] = useState(false)

  // Long press drag state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [touchStartPosition, setTouchStartPosition] = useState<{ x: number; y: number } | null>(null)

  // Long press threshold (ms)
  const LONG_PRESS_THRESHOLD = 400
  const MOVE_TOLERANCE = 10 // px

  // Track selected products for multi-select
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])

  const handleProductSelect = (product: Product) => {
    setSelectedProducts(prev => {
      const alreadySelected = prev.some(p => p.id === product.id)
      if (alreadySelected) {
        return prev.filter(p => p.id !== product.id)
      } else {
        return [...prev, product]
      }
    })
  }

  // Helper: ensure product is selected before drag
  const ensureProductSelected = (product: Product) => {
    setSelectedProducts(prev => {
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, product]
    })
  }

  // Handle touch start for long-press drag
  const handleTouchStart = (product: Product, e?: React.TouchEvent) => {
    ensureProductSelected(product)
    if (e) {
      const touch = e.touches[0]
      setTouchStartPosition({ x: touch.clientX, y: touch.clientY })
    }
    const timer = setTimeout(() => {
      // Only dispatch if still holding
      let dragProducts: Product[] = []
      if (selectedProducts.length > 1 && selectedProducts.some(p => p.id === product.id)) {
        dragProducts = selectedProducts
      } else {
        dragProducts = [product]
      }
      const touchDragEvent = new CustomEvent("touchDragStart", {
        detail: { products: dragProducts },
      })
      window.dispatchEvent(touchDragEvent)
      setDraggedProduct(product)
      setLongPressTimer(null)
    }, LONG_PRESS_THRESHOLD)
    setLongPressTimer(timer)
  }

  // Handle touch move: cancel if moved too far
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPosition) {
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartPosition.x
      const dy = touch.clientY - touchStartPosition.y
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_TOLERANCE) {
        if (longPressTimer) {
          clearTimeout(longPressTimer)
          setLongPressTimer(null)
        }
      }
    }
  }

  // Handle touch end: cancel timer if not triggered
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
    setTouchStartPosition(null)
    setDraggedProduct(null)
  }

  // Extract unique natures from products to use as categories
  const productNatures = Array.from(new Set(products.map((p) => p.nature || "Other")))

  // Create chips from product natures, using the first product's image for each nature
  const chips = productNatures.map((nature) => {
    const firstProduct = products.find((p) => (p.nature || "Other") === nature)
    return {
      image: firstProduct?.image || "/placeholder.svg",
      label: nature,
    }
  })

  // Handler for chip selection
  const handleChipClick = (chipLabel: string) => {
    if (selectedChip !== chipLabel) {
      setSelectedChip(chipLabel)
    }
  }

  // Handler for product click
  const handleProductClick = (index: number) => {
    if (isDragging) return
    const focusChatEvent = new CustomEvent("focusChat")
    window.dispatchEvent(focusChatEvent)
    setSelectedProductIndex(index)
  }

  // Handler for closing product detail
  const handleCloseProductDetail = () => {
    setSelectedProductIndex(null)
  }

  // Handler for next product with animation
  const handleNextProductAnimated = () => {
    if (
      selectedProductIndex !== null &&
      selectedProductIndex < filteredProducts.length - 1 &&
      chipAnimation === "idle"
    ) {
      setChipAnimation("slideOut")
      setPendingProductIndex(selectedProductIndex + 1)
    }
  }

  // Animation effect: after slideOut, switch product and slideIn
  useEffect(() => {
    if (chipAnimation === "slideOut") {
      const timer = setTimeout(() => {
        if (pendingProductIndex !== null) {
          setSelectedProductIndex(pendingProductIndex)
          setChipAnimation("slideIn")
        }
      }, 300) // match CSS duration
      return () => clearTimeout(timer)
    } else if (chipAnimation === "slideIn") {
      const timer = setTimeout(() => {
        setChipAnimation("idle")
        setPendingProductIndex(null)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [chipAnimation, pendingProductIndex])

  // Remove default chip selection
  useEffect(() => {
    if (!selectedChip) {
      setSelectedChip("");
    }
  }, [chips]); // Run when chips change

  // When product changes, reset image index
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedProductIndex])

  // Filter products based on selected chip
  const filteredProducts = selectedChip
    ? products.filter((product) => (product.nature || "Other") === selectedChip)
    : products; // Show all products by default

  // Handle drag start for products
  const handleDragStart = (e: React.DragEvent, product: Product) => {
    ensureProductSelected(product)
    setIsDragging(true)
    setDraggedProduct(product)
    let dragProducts: Product[] = []
    // Use latest selectedProducts after ensuring selection
    const latestSelected = selectedProducts.some(p => p.id === product.id)
      ? selectedProducts
      : [...selectedProducts, product]
    dragProducts = latestSelected.length > 1 ? latestSelected : [product]
    e.dataTransfer.setData("application/json", JSON.stringify(dragProducts))
    e.dataTransfer.setData("product-object", JSON.stringify(dragProducts))
    e.dataTransfer.effectAllowed = "move"
  }

  // Handle drag end for products
  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedProduct(null)
  }

  return (
    <div
      className={styles.container}
      style={{
        background: "rgba(245, 244, 245, 1)",
        borderRadius: "0 0 20px 20px",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Top section with chips */}
      <div
        style={{
          display: selectedProductIndex !== null ? "none" : "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          gap: "10px",
          padding: "48px 24px 4px",
          alignSelf: "stretch",
        }}
      >
        {/* Chips row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginLeft: -8,
            marginTop: 12,
            overflowX: "auto",
            whiteSpace: "nowrap",
            width: "100%",
          }}
        >
          {chips.map((chip) => {
            const isSelected = chip.label === selectedChip
            return (
              <div
                key={chip.label}
                className={styles.chip}
                style={{
                  background: isSelected ? "rgba(255, 205, 78, 1)" : "white",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                  padding: "4px",
                  borderRadius: "999px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => handleChipClick(chip.label)}
              >
                <div
                  style={{
                    background: isSelected ? "rgba(245, 244, 245, 1)" : "#fff",
                    width: 40,
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "999px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={chip.image || "/placeholder.svg"}
                    alt={chip.label}
                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "999px" }}
                  />
                </div>
                <span
                  style={{
                    color: "#000",
                    fontSize: "12px",
                    fontFamily: "Decathlon Text",
                    fontWeight: 500,
                    lineHeight: "130%",
                    padding: "0 12px",
                  }}
                >
                  {chip.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Product grid section */}
      <div
        style={{
          display: selectedProductIndex !== null ? "none" : "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "10px",
          alignSelf: "stretch",
        }}
      >
        <div
          style={{
            background: "#fff",
            width: "100%", // full width of parent/canvas
            maxWidth: 400, // match canvas max width
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 20,
            position: "relative",
            overflow: "hidden",
            padding: "32px 16px 0 16px", // equal left/right padding
          }}
        >
          {/* Heading */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 4,
              position: "absolute",
              top: 24,
              left: 21,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="14" height="16" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.33337 1.97202L8.03421 3.81179C8.65513 5.44178 9.89147 6.67813 11.5215 7.29912L13.3613 7.99998L11.5215 8.70085C9.89147 9.32184 8.65513 10.5582 8.03421 12.1882L7.33337 14.0279L6.63248 12.1882C6.01148 10.5582 4.77514 9.32184 3.1451 8.70084L1.30541 7.99998L3.1451 7.29912C4.77514 6.67813 6.01148 5.44178 6.63247 3.81177L7.33337 1.97202ZM5.07537 7.99998C5.98593 8.58125 6.75205 9.34736 7.33332 10.2579C7.91457 9.34736 8.68069 8.58125 9.59126 7.99998C8.68069 7.41872 7.91457 6.65261 7.33332 5.74205C6.75205 6.6526 5.98593 7.41872 5.07537 7.99998Z"
                  fill="#FFCD4E"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M4.57824 4.3694C3.54813 4.71277 2.63249 5.6284 2.28912 6.65853C1.94575 5.6284 1.0301 4.71277 0 4.3694C1.0301 4.02603 1.94575 3.11039 2.28912 2.08028C2.63249 3.11039 3.54813 4.02603 4.57824 4.3694Z"
                  fill="#FFCD4E"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.98257 1.37347C6.41023 1.60239 5.83797 2.06021 5.6091 2.74695C5.38017 2.06021 4.80788 1.60239 4.2356 1.37347C4.92234 1.14456 5.38017 0.57228 5.6091 0C5.83797 0.57228 6.41023 1.03011 6.98257 1.37347Z"
                  fill="#FFCD4E"
                />
              </svg>
              <span
                style={{
                  color: "rgba(255, 205, 78, 1)",
                  fontSize: "12px",
                  fontFamily: "Decathlon Text",
                  fontWeight: 400,
                  lineHeight: "133%",
                }}
              >
                Based on your interest
              </span>
            </div>
            <span
              style={{
                color: "#000",
                fontSize: "22px",
                fontFamily: "Decathlon Text", // Use Decathlon Text for cluster name
                fontWeight: 600,
                lineHeight: "118%",
                alignSelf: "stretch",
              }}
            >
              {selectedChip}
            </span>
          </div>

          {/* Product list: one column, each card full width, horizontal bar style */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 64 }}>
            {filteredProducts.map((product, index) => {
              const isSelected = selectedProducts.some(p => p.id === product.id)
              const key = product.id ? String(product.id) : `product-${index}`
              return (
                <div
                  key={key}
                  className={styles.productCard + (isSelected ? ' ' + styles.selected : '')}
                  style={{
                    width: "100%",
                    maxWidth: 400,
                    margin: "0 auto",
                    minHeight: 56,
                    height: 56,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "0 12px",
                    boxSizing: "border-box",
                  }}
                  draggable={true}
                  onMouseDown={e => ensureProductSelected(product)}
                  onTouchStart={e => { ensureProductSelected(product); handleTouchStart(product, e) }}
                  onDragStart={e => handleDragStart(e, product)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleProductClick(index)}
                  tabIndex={0}
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", marginRight: 16, border: "2px solid #ffcd4e", background: "#f5f4f5" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#181818", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{product.title}</div>
                    <div style={{ fontSize: 12, color: "#616161", fontWeight: 600, background: "#fffae3", borderRadius: 6, padding: "1px 7px", marginTop: 2 }}>{`€${product.price}`}</div>
                  </div>
                  {isSelected && (
                    <div style={{position: 'absolute', top: 6, right: 6, background: '#ffcd4e', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)'}}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 6.5L5 8.5L9 4.5" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Product Detail View */}
      {selectedProductIndex !== null && (
        <div
          style={{
            width: "100%",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(245, 244, 245, 1)",
            borderRadius: "0 0 20px 20px",
            gap: 0,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              width: 390,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 10,
              padding: "0 27px",
              margin: "-120px 0 8px 0", // moved bar further up from -36px to -48px
            }}
          >
            {/* Next product preview */}
            <div
              style={{
                background: "#fff",
                height: 48,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
                padding: "4px 4px 4px 24px", // increased left padding
                borderRadius: 8,
                boxShadow: "0px 4px 22.1px 0px rgba(0,0,0,0.05)",
                overflow: "visible", // allow label to show above
                minWidth: 200, // widened from 120
                maxWidth: 260, // widened from 180
                cursor: selectedProductIndex < filteredProducts.length - 1 ? "pointer" : "default",
                position: "relative", // for stacking
              }}
              onClick={handleNextProductAnimated}
            >
              {selectedProductIndex < filteredProducts.length - 1 && (
                <>
                  {/* Outgoing chip (slide out) */}
                  {chipAnimation === "slideOut" && (
                    <div
                      className={transitions.slideOut}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 2,
                        background: "transparent",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(245,244,245,1)",
                          width: 40,
                          height: 40,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={filteredProducts[selectedProductIndex + 1]?.image || "/placeholder.svg"}
                          alt={filteredProducts[selectedProductIndex + 1]?.title}
                          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}
                        />
                      </div>
                      <span
                        style={{
                          color: "#000",
                          fontSize: 12,
                          fontFamily: "Decathlon Text",
                          fontWeight: 500,
                          lineHeight: "130%",
                          textAlign: "left",
                          maxWidth: 140, // increased from 80
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {filteredProducts[selectedProductIndex + 1]?.title}
                      </span>
                    </div>
                  )}
                  {/* Incoming chip (slide in) */}
                  {chipAnimation === "slideIn" && pendingProductIndex !== null && (
                    <div
                      className={transitions.slideIn}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 1,
                        background: "transparent",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(245,244,245,1)",
                          width: 40,
                          height: 40,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={filteredProducts[pendingProductIndex + 1]?.image || "/placeholder.svg"}
                          alt={filteredProducts[pendingProductIndex + 1]?.title}
                          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}
                        />
                      </div>
                      <span
                        style={{
                          color: "#000",
                          fontSize: 12,
                          fontFamily: "Decathlon Text",
                          fontWeight: 500,
                          lineHeight: "130%",
                          textAlign: "left",
                          maxWidth: 140, // increased from 80
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {filteredProducts[pendingProductIndex + 1]?.title}
                      </span>
                    </div>
                  )}
                  {/* Default/idle chip */}
                  {(chipAnimation === "idle" || (chipAnimation === "slideIn" && pendingProductIndex === null)) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        zIndex: 0,
                        background: "transparent",
                      }}
                    >
                      <div
                        style={{
                          background: "rgba(245,244,245,1)",
                          width: 40,
                          height: 40,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={filteredProducts[selectedProductIndex + 1]?.image || "/placeholder.svg"}
                          alt={filteredProducts[selectedProductIndex + 1]?.title}
                          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }}
                        />
                      </div>
                      <span
                        style={{
                          color: "#000",
                          fontSize: 12,
                          fontFamily: "Decathlon Text",
                          fontWeight: 500,
                          lineHeight: "130%",
                          textAlign: "left",
                          maxWidth: 140, // increased from 80
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {filteredProducts[selectedProductIndex + 1]?.title}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Close button */}
            <button
              style={{
                background: "#fff",
                width: 48,
                height: 48,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "999px",
                border: "none",
                position: "relative",
                boxShadow: "0px 4px 22.1px 0px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onClick={handleCloseProductDetail}
              aria-label="Close"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M11.9999 10.9391L17.1695 5.76947L18.2302 6.83013L13.0605 11.9998L18.2302 17.1695L17.1695 18.2301L11.9999 13.0605L6.83019 18.2301L5.76953 17.1695L10.9392 11.9998L5.76953 6.83013L6.83019 5.76947L11.9999 10.9391Z"
                  fill="#616161"
                />
              </svg>
            </button>
          </div>

          {/* Main product story area */}
          <div
            style={{
              background: "#fff",
              width: 336,
              height: 400, // shortened from 508
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center", // changed from flex-end to center
              borderRadius: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 22.1px 0px rgba(0,0,0,0.05)",
              marginBottom: 60,
              marginTop: 12, // moved up from 12 to 0
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                width: 298,
                height: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                position: "absolute",
                top: 19,
                left: 21,
              }}
            >
              {/* Removed references to images */}
            </div>
            {/* Product image only, centered */}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "row", // keep as row if you want image to be centered horizontally
                alignItems: "center", // center vertically
                justifyContent: "center", // center horizontally
                position: "relative", // Make relative for overlay positioning
              }}
            >
              {/* Top blur overlay */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 90, // increased from 40 to 70 for more coverage
                  pointerEvents: "none",
                  background: "linear-gradient(to bottom, rgba(245,244,245,0.85) 70%, rgba(245,244,245,0) 100%)",
                  zIndex: 2,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              />
              {/* Bottom blur overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: 70, // increased from 40 to 70 for more coverage
                  pointerEvents: "none",
                  background: "linear-gradient(to top, rgba(245,244,245,0.85) 70%, rgba(245,244,245,0) 100%)",
                  zIndex: 2,
                  borderBottomLeftRadius: 16,
                  borderBottomRightRadius: 16,
                }}
              />
              {filteredProducts[selectedProductIndex] && (
                <img
                  src={filteredProducts[selectedProductIndex].image || "/placeholder.svg"}
                  alt={filteredProducts[selectedProductIndex].title}
                  style={{ width: "100%", height: "auto", objectFit: "cover", borderRadius: 16, zIndex: 1 }}
                />
              )}
            </div>
            {/* Overlay card at bottom */}
            <div
              style={{
                background: "#fff",
                width: 274,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 8,
                position: "absolute",
                left: 31,
                bottom: 24, // move to the very bottom, above the border radius
                boxShadow: "0px 4px 22.1px 0px rgba(0,0,0,0.05)",
                overflow: "hidden",
                zIndex: 3, // above blur overlays
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div
                  style={{
                    height: 48,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0 4px",
                  }}
                >
                  <span
                    style={{
                      color: "#000",
                      fontSize: 14,
                      fontFamily: "Decathlon Text",
                      fontWeight: 500,
                      lineHeight: "170%",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                  >
                    {filteredProducts[selectedProductIndex].title.length > 18
                      ? filteredProducts[selectedProductIndex].title.slice(0, 18) + "..."
                      : filteredProducts[selectedProductIndex].title}
                  </span>
                  <span
                    style={{
                      color: "#3643BA",
                      fontSize: 12,
                      fontFamily: "Decathlon Text",
                      fontWeight: 400,
                      lineHeight: "133%",
                    }}
                  >
                    Find in the shop
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(245,244,245,1)",
                    width: 48,
                    height: 48,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 9.6,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={filteredProducts[selectedProductIndex].image || "/placeholder.svg"}
                    alt={filteredProducts[selectedProductIndex].title}
                    style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResults
