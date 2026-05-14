'use client'

import DestinationCard from './DestinationCard'

const destinations = [
  {
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
    title: 'Paris City Break',
    location: 'France',
    rating: 4.9,
    duration: '5 Days',
    groupSize: '2-4',
    price: '$1,299',
  },
  {
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop',
    title: 'Tokyo Adventure',
    location: 'Japan',
    rating: 4.8,
    duration: '7 Days',
    groupSize: '2-6',
    price: '$1,899',
  },
  {
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
    title: 'Bali Paradise',
    location: 'Indonesia',
    rating: 4.9,
    duration: '6 Days',
    groupSize: '2-8',
    price: '$1,499',
  },
  {
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
    title: 'New York Explorer',
    location: 'USA',
    rating: 4.7,
    duration: '4 Days',
    groupSize: '2-4',
    price: '$1,099',
  },
]

export default function Destinations() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our most loved travel destinations, curated by AI based on traveler preferences
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((destination, index) => (
            <DestinationCard key={index} {...destination} />
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="bg-white border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition font-semibold">
            View All Destinations
          </button>
        </div>
      </div>
    </section>
  )
}
