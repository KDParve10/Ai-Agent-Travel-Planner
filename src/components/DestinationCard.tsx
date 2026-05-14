'use client'

import { Star, MapPin, Calendar, Users } from 'lucide-react'
import Image from 'next/image'

interface DestinationCardProps {
  image: string
  title: string
  location: string
  rating: number
  duration: string
  groupSize: string
  price: string
}

export default function DestinationCard({
  image,
  title,
  location,
  rating,
  duration,
  groupSize,
  price,
}: DestinationCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-64">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold">{rating}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-center space-x-2 text-gray-500 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <div className="flex items-center space-x-4 text-gray-600 text-sm mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{groupSize}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary-600">{price}</span>
            <span className="text-gray-500 text-sm">/person</span>
          </div>
          <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}
