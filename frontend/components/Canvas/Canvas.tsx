"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import styles from "./Canvas.module.css"
import SearchResults from "../SearchResults/SearchResults"
import { useMobile } from "../../hooks/use-mobile"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { Typewriter } from 'react-simple-typewriter';

interface ComparisonContent {
  table: string;
  comparison: string;
  recommendation: string;
}

interface CanvasProps {
  showSearchResults?: boolean;
}

interface Product {
  id: string;
  title: string;
  image: string;
  price: string;
  category: string;
  brand: string;
  nature: string;
  url?: string;
  capacity?: string;
}

export default function Canvas({ showSearchResults = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isResultsVisible, setIsResultsVisible] = useState(showSearchResults)
  const [products, setProducts] = useState<Product[]>([])
  const [comparisonContent, setComparisonContent] = useState<ComparisonContent | null>(null)
  const isMobile = useMobile()

  // Update visibility when prop changes
  useEffect(() => {
    setIsResultsVisible(showSearchResults)
  }, [showSearchResults])

  // Listen for events from Chat component
  useEffect(() => {
    const handleSearchEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.products) {
        setProducts(customEvent.detail.products)
        setComparisonContent(null)
        setIsResultsVisible(true) // Show search results when products are loaded
      }
    }

    const handleSearchTrigger = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.query) {
        setIsResultsVisible(true)
      }
    }

    const handleComparisonEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.comparison) {
        setComparisonContent(customEvent.detail.comparison)
        setIsResultsVisible(false)
      }
    }

    const handleClearEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.intent) {
        if (customEvent.detail.intent === "compare") {
          setProducts([])
          setIsResultsVisible(false)
        } else if (customEvent.detail.intent === "find_product") {
          setComparisonContent(null)
          setIsResultsVisible(true)
        } else {
          setProducts([])
          setComparisonContent(null)
          setIsResultsVisible(false)
        }
      }
    }

    window.addEventListener("productsLoaded", handleSearchEvent as EventListener)
    window.addEventListener("searchTriggered", handleSearchTrigger as EventListener)
    window.addEventListener("comparisonMade", handleComparisonEvent as EventListener)
    window.addEventListener("clearContent", handleClearEvent as EventListener)
    
    return () => {
      window.removeEventListener("productsLoaded", handleSearchEvent as EventListener)
      window.removeEventListener("searchTriggered", handleSearchTrigger as EventListener)
      window.removeEventListener("comparisonMade", handleComparisonEvent as EventListener)
      window.removeEventListener("clearContent", handleClearEvent as EventListener)
    }
  }, [])

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
        <SearchResults products={products} />
      ) : comparisonContent ? (
        <div className={styles.comparisonContainer}>
          <div className={styles.comparisonTable}>
            <div className={styles.tableWrapper}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisonContent.table}</ReactMarkdown>
            </div>
          </div>
          {comparisonContent.comparison && (
            <div className={styles.comparisonText}>
              <h3>Comparison</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisonContent.comparison}</ReactMarkdown>
            </div>
          )}
          {comparisonContent.recommendation && (
            <div className={styles.recommendation}>
              <h3>Recommendation</h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{comparisonContent.recommendation}</ReactMarkdown>
            </div>
          )}
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
  );
}
