'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ItineraryData } from '@/types'
import { getPlanFromStorage } from '@/lib/api'
import Header from '@/components/Header'
import LoadingExperience from '@/components/LoadingExperience'
import DayCard from '@/components/DayCard'
import BudgetSidebar from '@/components/BudgetSidebar'
import LogisticsCard from '@/components/LogisticsCard'
import ReviewPanel from '@/components/ReviewPanel'

const DEFAULT_DISCLAIMER =
  'AI-generated itinerary. Verify local conditions, pricing, visa requirements, and booking availability before committing to any reservation.'

export default function ItineraryPage() {
  const params = useParams()
  const itineraryId = Array.isArray(params?.id) ? params.id[0] : params?.id
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!itineraryId) {
      setError('Missing itinerary identifier.')
      setLoading(false)
      return
    }

    // Prefer keyed localStorage lookup; fall back to legacy sessionStorage
    let data: ItineraryData | null = null
    try {
      data = getPlanFromStorage(itineraryId)
      if (!data) {
        const stored = sessionStorage.getItem('itinerary')
        if (stored) {
          const parsed = JSON.parse(stored) as ItineraryData
          if (parsed?.trace_id === itineraryId) data = parsed
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[plan] storage read failed:', err)
    }

    if (data) {
      setItinerary(data)
    } else {
      setError('No itinerary found for this trace ID. Please generate a new plan.')
    }
    setLoading(false)
  }, [itineraryId])

  if (loading) {
    return <LoadingExperience />
  }

  if (error || !itinerary) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error ?? 'Failed to load itinerary'}</p>
            <a
              href="/"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    )
  }

  // ---- Safe accessors ----
  const destination = itinerary.destination ?? 'Your Trip'
  const cities = itinerary.cities ?? []
  const durationDays = itinerary.duration_days ?? itinerary.days?.length ?? 0
  const travelers = itinerary.travelers ?? 1
  const days = itinerary.days ?? []
  const budget = itinerary.budget ?? {
    accommodation: 0,
    activities: 0,
    transport: 0,
    meals: 0,
    misc: 0,
    total: 0,
    currency: '$',
  }
  const logistics = itinerary.logistics ?? {
    flights: [],
    ground_transport: [],
    visas: [],
  }
  const review = itinerary.review ?? {
    score: 0,
    max_score: 10,
    feedback: [],
    warnings: [],
    suggestions: [],
    passed: false,
  }
  const summary = itinerary.summary
  const disclaimer = itinerary.disclaimer ?? DEFAULT_DISCLAIMER
  const budgetTotal = Number(budget.total ?? budget.grand_total ?? 0)

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{destination}</h1>
              <p className="text-primary-100">
                {durationDays} days • {travelers} traveler{travelers === 1 ? '' : 's'}
                {cities.length > 0 && <> • {cities.join(', ')}</>}
              </p>
              {summary && (
                <p className="mt-3 max-w-2xl text-sm text-primary-100/90">{summary}</p>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-primary-100">Total Budget</p>
              <p className="text-2xl font-bold">
                {budget.currency ?? '$'}
                {budgetTotal.toLocaleString()}
              </p>
              {budget.within_budget === false && (
                <p className="mt-1 text-xs text-yellow-200">Over target budget</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Itinerary */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
            {days.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-gray-600">
                No daily plan was returned. Try regenerating the itinerary.
              </div>
            ) : (
              days.map((day, idx) => (
                <DayCard key={day?.day ?? day?.day_number ?? idx} day={day} />
              ))
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <BudgetSidebar budget={budget} />
            <LogisticsCard logistics={logistics} />
            <ReviewPanel review={review} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-700 mb-1">Disclaimer</p>
          <p>{disclaimer}</p>
          {itinerary.trace_id && (
            <p className="mt-2 font-mono text-[10px] text-gray-400">
              trace_id: {itinerary.trace_id}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
