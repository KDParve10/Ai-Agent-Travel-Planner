'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import PromptBar from '@/components/PromptBar'
import AgentCards from '@/components/AgentCards'
import LoadingExperience from '@/components/LoadingExperience'
import { generatePlan, savePlanToStorage } from '@/lib/api'
import { ApiError } from '@/types'

type Status = 'idle' | 'loading' | 'error' | 'success'

interface LastRequest {
  request: string
  demo: boolean
}

export default function Home() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<ApiError | null>(null)
  const [lastRequest, setLastRequest] = useState<LastRequest | null>(null)

  const runPlan = useCallback(
    async (request: string, demo: boolean) => {
      setStatus('loading')
      setError(null)
      setLastRequest({ request, demo })

      try {
        const plan = await generatePlan(request, demo)
        savePlanToStorage(plan.trace_id, plan)
        setStatus('success')
        router.push(`/plan/${plan.trace_id}`)
      } catch (err) {
        const apiErr = (err as ApiError) ?? {
          message: 'Failed to generate plan',
          code: 'UNKNOWN_ERROR' as const,
        }
        // eslint-disable-next-line no-console
        console.error('[plan] generation failed:', apiErr)
        setError(apiErr)
        setStatus('error')
      }
    },
    [router]
  )

  const handleSubmit = useCallback(
    (request: string, demo: boolean) => {
      void runPlan(request, demo)
    },
    [runPlan]
  )

  const handleRetry = useCallback(() => {
    if (lastRequest) void runPlan(lastRequest.request, lastRequest.demo)
  }, [lastRequest, runPlan])

  const loading = status === 'loading'

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Navbar transparent />
        <LoadingExperience />
      </div>
    )
  }

  const errorCopy = formatErrorCopy(error)

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Navbar transparent />

      <main>
        <HeroSection />
        <PromptBar onSubmit={handleSubmit} loading={loading} />

        {status === 'error' && error && (
          <div className="max-w-xl mx-auto mt-6 px-6">
            <div className="rounded-xl border border-[var(--error)]/20 bg-red-50 p-4 text-sm text-[var(--error)]">
              <p className="font-semibold mb-1">{errorCopy.title}</p>
              <p className="text-[var(--error)]/90">{errorCopy.body}</p>
              {error.traceId && (
                <p className="mt-2 text-xs text-[var(--error)]/70">
                  Trace ID: <span className="font-mono">{error.traceId}</span>
                </p>
              )}
              {lastRequest && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--error)]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--error)] hover:bg-[var(--error)]/5 transition"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <AgentCards />

        {/* Footer */}
        <footer className="relative z-10 border-t border-[var(--border)] bg-white py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">
              AI-generated intelligence for planning support. Verify local conditions and pricing before booking.
            </p>
            <span className="text-xs text-[var(--text-muted)] font-medium">
              VoyageAI — Multi-Agent Travel Intelligence
            </span>
          </div>
        </footer>
      </main>
    </div>
  )
}

function formatErrorCopy(error: ApiError | null): { title: string; body: string } {
  if (!error) return { title: 'Something went wrong', body: 'Please try again.' }
  switch (error.code) {
    case 'CONNECTION_ERROR':
      return {
        title: 'Backend unavailable',
        body:
          'Cannot reach the FastAPI server. Make sure it is running on port 8000 and try again.',
      }
    case 'TIMEOUT':
      return {
        title: 'Request timed out',
        body:
          'The AI pipeline is taking longer than expected. This can happen under load — you can retry in a moment.',
      }
    case 'PARSE_ERROR':
      return {
        title: 'Malformed response',
        body:
          'The server response did not match the expected schema. A retry usually resolves this.',
      }
    case 'HTTP_ERROR':
      return {
        title: `Server error${error.status ? ` (${error.status})` : ''}`,
        body: error.message,
      }
    default:
      return { title: 'Unexpected error', body: error.message }
  }
}
