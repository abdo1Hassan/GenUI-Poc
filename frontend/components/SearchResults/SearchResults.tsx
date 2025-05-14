"use client"

import type React from "react"
import { useEffect, useState } from "react"
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

  // Extract unique natures from products to use as categories
  const productNatures = Array.from(new Set(products.map((p) => p.nature || "Other")))

  // Create chips from product natures
  const chips = productNatures.map((nature) => ({
    image: `/placeholder.svg?height=40&width=40&query=${encodeURIComponent(nature)}`,
    label: nature,
  }))

  // Handler for chip selection
  const handleChipClick = (chipLabel: string) => {
    if (selectedChip !== chipLabel) {
      setSelectedChip(chipLabel)
    }
  }

  // Handler for product click
  const handleProductClick = (index: number) => {
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

  // Set first chip as selected by default
  useEffect(() => {
    if (chips.length > 0) {
      setSelectedChip(chips[0].label)
    }
  }, [chips]) // Run when chips change

  // When product changes, reset image index
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedProductIndex])

  // Filter products based on selected chip
  const filteredProducts = selectedChip
    ? products.filter((product) => (product.nature || "Other") === selectedChip)
    : products.slice(0, 4) // Default to showing first 4 products if no chip selected

  // Handle drag start for products
  const handleDragStart = (e: React.DragEvent, product: Product) => {
    e.dataTransfer.setData("product-title", product.title)
    e.dataTransfer.effectAllowed = "move"

    // Create a drag image
    const dragImage = document.createElement("div")
    dragImage.className = styles.dragImage
    dragImage.innerHTML = `
      <div style="
        background: #ffcd4e;
        color: #000;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ">${product.title}</div>
    `
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 75, 25)

    // Set timeout to remove the drag image element
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)

    setDraggedProduct(product)
    e.currentTarget.style.opacity = "0.6"
    e.currentTarget.style.transform = "scale(0.95)"
  }

  // Handle drag end for products
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = ""
    e.currentTarget.style.transform = ""
    setDraggedProduct(null)
  }

  // Handle touch start for mobile drag
  const handleTouchStart = (product: Product) => {
    // Dispatch custom event for touch drag
    const touchDragEvent = new CustomEvent("touchDragStart", {
      detail: { product },
    })
    window.dispatchEvent(touchDragEvent)
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
          {chips.map((chip, index) => {
            const isSelected = chip.label === selectedChip
            return (
              <div
                key={index}
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
            width: 400, // widened from 336
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            borderRadius: 20,
            position: "relative",
            overflow: "hidden",
            padding: "32px 0 0 0",
          }}
        >
          {/* Heading */}
          <div
            style={{
              width: 195,
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

          {/* Product grid */}
          <div
            style={{
              width: 380, // widened from 315
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 12,
              marginTop: 72, // Add margin to push below heading
              marginLeft: 12,
              marginBottom: 24,
            }}
          >
            {/* Product cards */}
            {filteredProducts.map((product, index) => (
              <div
                key={index}
                className={styles.productCard}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(245, 244, 245, 1)",
                  borderRadius: 11.5,
                  padding: 10,
                  width: "100%",
                  marginBottom: 0,
                  cursor: "grab",
                  position: "relative",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, product)}
                onDragEnd={handleDragEnd}
                onTouchStart={() => handleTouchStart(product)}
                onClick={() => handleProductClick(index)}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "#fff",
                    borderRadius: "999px",
                    marginRight: 10,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    style={{ width: 36, height: 36, objectFit: "cover", borderRadius: "999px" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    style={{
                      color: "#000",
                      fontSize: "12px",
                      fontFamily: "Decathlon Text",
                      fontWeight: 500,
                      lineHeight: "130%",
                    }}
                  >
                    {product.title}
                  </span>
                  <span
                    style={{
                      color: "#000",
                      fontSize: "12px",
                      fontFamily: "Decathlon Text",
                      fontWeight: 500,
                      lineHeight: "130%",
                    }}
                  >
                    {product.price}
                  </span>
                </div>
                {/* Drag handle icon */}
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 4C6 4.55228 5.55228 5 5 5C4.44772 5 4 4.55228 4 4C4 3.44772 4.44772 3 5 3C5.55228 3 6 3.44772 6 4Z"
                      fill="#616161"
                    />
                    <path
                      d="M6 8C6 8.55228 5.55228 9 5 9C4.44772 9 4 8.55228 4 8C4 7.44772 4.44772 7 5 7C5.55228 7 6 7.44772 6 8Z"
                      fill="#616161"
                    />
                    <path
                      d="M6 12C6 12.5523 5.55228 13 5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11C5.55228 11 6 11.4477 6 12Z"
                      fill="#616161"
                    />
                    <path
                      d="M12 4C12 4.55228 11.5523 5 11 5C10.4477 5 10 4.55228 10 4C10 3.44772 10.4477 3 11 3C11.5523 3 12 3.44772 12 4Z"
                      fill="#616161"
                    />
                    <path
                      d="M12 8C12 8.55228 11.5523 9 11 9C10.4477 9 10 8.55228 10 8C10 7.44772 10.4477 7 11 7C11.5523 7 12 7.44772 12 8Z"
                      fill="#616161"
                    />
                    <path
                      d="M12 12C12 12.5523 11.5523 13 11 13C10.4477 13 10 12.5523 10 12C10 11.4477 10.4477 11 11 11C11.5523 11 12 11.4477 12 12Z"
                      fill="#616161"
                    />
                  </svg>
                </div>
              </div>
            ))}
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
              margin: "-36px 0 8px 0", // reduced top margin from 24px to 8px
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
                padding: 4,
                borderRadius: 8,
                boxShadow: "0px 4px 22.1px 0px rgba(0,0,0,0.05)",
                overflow: "hidden",
                minWidth: 120,
                maxWidth: 180,
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
                          maxWidth: 80,
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
                          maxWidth: 80,
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
                          maxWidth: 80,
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
              height: 508,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 4px 22.1px 0px rgba(0,0,0,0.05)",
              marginBottom: 24,
              marginTop: 12, // add more space between top bar and product part
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
              {filteredProducts[selectedProductIndex] &&
                filteredProducts[selectedProductIndex].images &&
                Array.isArray(filteredProducts[selectedProductIndex].images) &&
                filteredProducts[selectedProductIndex].images.map((_, i, arr) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 999,
                      background: i === currentImageIndex ? "#FFD14F" : "#F5F4F5",
                      marginRight: i !== arr.length - 1 ? 4 : 0,
                    }}
                  />
                ))}
            </div>
            {/* Product image only, centered */}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {filteredProducts[selectedProductIndex] && (
                <img
                  src={filteredProducts[selectedProductIndex].image || "/placeholder.svg"}
                  alt={filteredProducts[selectedProductIndex].title}
                  style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 16 }}
                />
              )}
            </div>
            {/* Overlay card at bottom left */}
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
                top: 406,
                boxShadow: "0px 4px 22.1px 0px rgba(0,0,0,0.05)",
                overflow: "hidden",
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
                    }}
                  >
                    {filteredProducts[selectedProductIndex].title}
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
