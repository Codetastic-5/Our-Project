import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useMenu } from '../context/MenuContext'

const CashierDashboard = ({ onLogout }) => {
  const { menuItems, addMenuItem, deleteMenuItem } = useMenu()
  const [newItemName, setNewItemName] = useState('')
  
  const [cart, setCart] = useState([
    { id: 1, name: 'Burger', quantity: 1, price: 5 },
    { id: 2, name: 'Fries', quantity: 1, price: 5 }
  ])
  
  const [username, setUsername] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Bench',
    points: 100
  })

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.name === item.name)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.name === item.name 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { id: item.id, name: item.name, quantity: 1, price: 5 }])
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleCheckout = () => {
    alert('Checkout successful!')
    setCart([])
  }

  const handleAddNewItem = () => {
    if (newItemName.trim()) {
      addMenuItem(newItemName.trim())
      setNewItemName('')
      alert(`"${newItemName}" added to menu!`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Header isLoggedIn={true} onLogout={onLogout} />

      {/* Main Content */}
      <main className="flex-1 flex p-6 gap-6">
        {/* Left Section */}
        <aside className="w-96 space-y-6">
          {/* Today's Menu */}
          <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-md">
            <div className="bg-orange-700 text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">TODAY'S MENU</h2>
              <span className="text-2xl">▼</span>
            </div>
            
            {/* Add New Item Form */}
            <div className="px-6 py-4 bg-orange-50 border-b-2 border-gray-300">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddNewItem()}
                  placeholder="New item name..."
                  className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-600"
                />
                <button
                  onClick={handleAddNewItem}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition duration-200"
                >
                  Add Item
                </button>
              </div>
            </div>
            
            <div className="divide-y-2 divide-gray-300">
              {menuItems.map((item) => (
                <div key={item.id} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition duration-200">
                  <span className="text-xl text-gray-700">{item.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-2 rounded-full transition duration-200"
                    >
                      ADD
                    </button>
                    <button
                      onClick={() => deleteMenuItem(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-full transition duration-200"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customers Section */}
          <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-md">
            <div className="bg-orange-700 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">CUSTOMERS</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-lg font-medium whitespace-nowrap">Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-600"
                  placeholder=""
                />
              </div>
              
              {customerInfo && (
                <div className="pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">{customerInfo.name}</span>
                    <span>Points: <span className="font-bold">{customerInfo.points}</span></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Section - Cart */}
        <section className="flex-1">
          <div className="bg-white border-2 border-gray-300 rounded-xl overflow-hidden shadow-md h-full flex flex-col">
            <div className="bg-orange-700 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">CART</h2>
            </div>
            
            <div className="flex-1 flex flex-col">
              {/* Cart Items */}
              <div className="flex-1 divide-y-2 divide-gray-300">
                {cart.map((item) => (
                  <div key={item.id} className="px-6 py-5 flex items-center justify-between">
                    <span className="text-xl text-gray-700">{item.name}</span>
                    <span className="text-xl text-gray-700">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Total and Checkout */}
              <div className="border-t-2 border-gray-300 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Total</span>
                  <span className="text-2xl font-bold">${calculateTotal()}</span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCheckout}
                    className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-8 py-3 rounded-lg text-xl transition duration-200"
                  >
                    Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer showLinks={false} />
    </div>
  )
}

export default CashierDashboard