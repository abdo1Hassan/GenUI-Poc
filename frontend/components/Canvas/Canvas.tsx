"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import styles from "./Canvas.module.css"
import SearchResults from "../SearchResults/SearchResults"
import { useMobile } from "../../hooks/use-mobile"

interface CanvasProps {
  showSearchResults?: boolean
}

interface Product {
  id: string
  title: string
  brand: string
  price: string
  image: string
  nature?: string // Add nature property for categorization
}

export default function Canvas({ showSearchResults = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isResultsVisible, setIsResultsVisible] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const isMobile = useMobile()

  // Listen for search events from Chat component
  useEffect(() => {
    const handleSearchEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.products) {
        setProducts(customEvent.detail.products)
      }
    }

    window.addEventListener("productsLoaded", handleSearchEvent as EventListener)
    return () => {
      window.removeEventListener("productsLoaded", handleSearchEvent as EventListener)
    }
  }, [])

  useEffect(() => {
    // Set isResultsVisible based on showSearchResults prop
    setIsResultsVisible(showSearchResults)
  }, [showSearchResults])

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const context = canvas.getContext("2d")
      if (context) {
        context.strokeStyle = "#000000"
        context.lineWidth = 2
        context.lineCap = "round"
        context.lineJoin = "round"
        setCtx(context)
      }

      // Set canvas dimensions to match its container
      const resizeCanvas = () => {
        const container = canvas.parentElement
        if (container) {
          canvas.width = container.clientWidth
          canvas.height = container.clientHeight
        }
      }

      resizeCanvas()
      window.addEventListener("resize", resizeCanvas)

      return () => {
        window.removeEventListener("resize", resizeCanvas)
      }
    }
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!ctx) return
    setDrawing(true)
    const pos = getEventPosition(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawing || !ctx) return
    const pos = getEventPosition(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDrawing = () => {
    if (!ctx) return
    setDrawing(false)
    ctx.closePath()
  }

  const getEventPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  return (
    <div className={styles.container}>
      {isResultsVisible ? (
        <div className={`${styles.searchResultsContainer} ${styles.slideIn}`}>
          <SearchResults products={products} />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      )}
    </div>
  )
}
