"use client"

import type React from "react"
import styles from "./SearchingIndicator.module.css"

interface SearchingIndicatorProps {
  query: string
  visible?: boolean
}

const SearchingIndicator: React.FC<SearchingIndicatorProps> = ({ query, visible = true }) => {
  // If not visible, don't render anything
  if (!visible) return null

  // Create search terms from the query
  const searchTerms = query
    .toLowerCase()
    .split(" ")
    .filter((term) => term.length > 3)
    .slice(0, 3)
    .map((term) => term.charAt(0).toUpperCase() + term.slice(1))

  // If we don't have enough terms, add some defaults
  while (searchTerms.length < 3) {
    searchTerms.push(
      searchTerms.length === 0 ? "Water activities" : searchTerms.length === 1 ? "Beach ideas" : "Summer fun",
    )
  }

  const searchQueryDisplay = searchTerms.join(", ")

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </div>
        <div className={styles.text}>Searching for {searchQueryDisplay} ...</div>
      </div>
    </div>
  )
}

export default SearchingIndicator
