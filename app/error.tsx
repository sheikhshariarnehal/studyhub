'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)',
      }}
    >
      <div
        style={{
          maxWidth: '28rem',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#111827',
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong!
          </h1>

          <p
            style={{
              color: '#4b5563',
              marginBottom: '2rem',
            }}
          >
            We encountered an unexpected error. Please try refreshing the page or go back to the home page.
          </p>

          <details
            style={{
              textAlign: 'left',
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
              Error Details
            </summary>
            <pre
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#dc2626',
                overflow: 'auto',
                maxHeight: '10rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </pre>
            {error.digest && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Error ID: {error.digest}
              </p>
            )}
          </details>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Try Again
          </button>

          <a
            href="/"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'white',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Go Home
          </a>
        </div>

        <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>If this problem persists, please contact support</p>
        </div>
      </div>
    </div>
  )
}
