'use client'

import Link from 'next/link'
import { MapPin, Compass, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Compass className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">TravelAI</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/destinations" className="text-gray-600 hover:text-gray-900 transition">
                Destinations
              </Link>
              <Link href="/planner" className="text-gray-600 hover:text-gray-900 transition">
                Planner
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition">
                About
              </Link>
            </div>
          </div>
          <button className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
            <User className="h-4 w-4" />
            <span>Login</span>
          </button>
        </div>
      </nav>
    </header>
  )
}
