'use client'

import { Search, MapPin, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateItinerary } from '@/lib/api'
import { ApiError } from '@/types'

interface HeroProps {
  onLoading?: (loading: boolean) => void;
}

export default function Hero({ onLoading }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    onLoading?.(true)

    try {
      const itinerary = await generateItinerary({ request: searchQuery })
      
      // Store itinerary in sessionStorage for the next page
      sessionStorage.setItem('itinerary', JSON.stringify(itinerary))
      
      // Navigate to itinerary page with ID
      router.push(`/plan/${itinerary.trace_id}`)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to generate itinerary. Please try again.')
      setIsLoading(false)
      onLoading?.(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handlePopularClick = (destination: string) => {
    setSearchQuery(`Plan a trip to ${destination}`)
  }

  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-primary-100 py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Sparkles className="h-6 w-6 text-primary-600" />
          <span className="text-primary-600 font-semibold">AI-Powered Travel Planning</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Plan Your Perfect Trip
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Let AI create personalized travel itineraries based on your preferences, budget, and interests
        </p>
        
        <div className="bg-white rounded-2xl shadow-xl p-2 max-w-2xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Where do you want to go? (e.g., 'Plan a 5-day trip to Japan with $3000 budget')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-0 focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50"
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="bg-primary-600 text-white px-8 py-4 rounded-xl hover:bg-primary-700 transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span>{isLoading ? 'Generating...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 max-w-2xl mx-auto">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <span>Popular:</span>
          <button 
            onClick={() => handlePopularClick('Paris')}
            className="hover:text-primary-600 transition"
            disabled={isLoading}
          >
            Paris
          </button>
          <button 
            onClick={() => handlePopularClick('Tokyo')}
            className="hover:text-primary-600 transition"
            disabled={isLoading}
          >
            Tokyo
          </button>
          <button 
            onClick={() => handlePopularClick('Bali')}
            className="hover:text-primary-600 transition"
            disabled={isLoading}
          >
            Bali
          </button>
          <button 
            onClick={() => handlePopularClick('New York')}
            className="hover:text-primary-600 transition"
            disabled={isLoading}
          >
            New York
          </button>
        </div>
      </div>
    </section>
  )
}
