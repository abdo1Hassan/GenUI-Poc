"use client"

import { useState } from "react"
import AppLayout from "../components/Layout/AppLayout"
import LandingPage from "../components/LandingPage/LandingPage"

export default function Home() {
  const [showApp, setShowApp] = useState(false)

  if (!showApp) {
    return <LandingPage onStart={() => setShowApp(true)} />
  }

  return (
    <div className="min-h-screen">
      <AppLayout />
    </div>
  )
}
