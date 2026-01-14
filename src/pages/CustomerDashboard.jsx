import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useMenu } from '../context/MenuContext'

const CustomerDashboard = ({ onLogout }) => {
  const { menuItems } = useMenu()
  const [customerName] = useState('Bench')
  const [loyaltyPoints] = useState(100)

  return (
    <div className="min-h-screen flex flex-col bg-orange-100">
      {/* Reusable Header */}
      <Header isLoggedIn={true} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-96 bg-orange-200 p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-orange-600 text-4xl">🛍️</span>
            <h2 className="text-2xl font-bold">Welcome, {customerName}!</h2>
          </div>

          {/* Loyalty Points Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-orange-600 text-3xl">⭐</span>
                <span className="text-xl font-bold">Your Loyalty Points:</span>
              </div>
              <div className="bg-orange-600 text-white px-6 py-3 rounded-full text-2xl font-bold">
                {loyaltyPoints}
              </div>
            </div>
          </div>

          {/* Reservation Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-orange-600 text-3xl">📅</span>
              <h3 className="text-2xl font-bold">Reservation</h3>
            </div>

            <div className="space-y-3">
              {/* Item Dropdown */}
              <select className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-lg appearance-none cursor-pointer">
                <option>Item</option>
              </select>

              {/* Date Dropdown */}
              <select className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-lg appearance-none cursor-pointer">
                <option>Date</option>
              </select>

              {/* Quantity Dropdown */}
              <select className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-lg appearance-none cursor-pointer">
                <option>Quantity</option>
              </select>

              {/* Time Dropdown */}
              <select className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-lg appearance-none cursor-pointer">
                <option>Time</option>
              </select>

              {/* Reserve Button */}
              <button className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-lg font-bold text-xl transition duration-200 mt-4">
                RESERVE
              </button>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 p-8">
          {/* Today's Menu Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-orange-600 text-4xl">✨</span>
            <h2 className="text-3xl font-bold">Today's Menu/stock?</h2>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-2 gap-6">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-white border-2 border-gray-300 rounded-2xl p-6 flex items-center gap-4 shadow-md hover:shadow-lg transition duration-200">
                <div className="w-20 h-20 bg-yellow-400 rounded-xl shrink-0"></div>
                <span className="text-xl font-bold">{item.name}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer - Reusable Component (without role links) */}
      <Footer showLinks={false} />
    </div>
  )
}

export default CustomerDashboard