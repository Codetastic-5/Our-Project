import React from 'react'

const Footer = ({ onSelectRole, onGoHome, showLinks = true }) => {
  const handleClick = (e, role) => {
    e.preventDefault()
    if (role === 'customer' && onGoHome) {
      onGoHome()
    } else if (onSelectRole) {
      onSelectRole(role)
    }
  }

  return (
    <footer className="bg-orange-600 text-white text-center py-3">
      <p className="text-sm">
        © StockTastic
        {showLinks && (
          <>
            &nbsp;|&nbsp; 
            <button 
              onClick={(e) => handleClick(e, 'customer')} 
              className="underline hover:text-orange-200 transition duration-200"
            >
              Customer
            </button>
            <span className="mx-2">|</span>
            <button 
              onClick={(e) => handleClick(e, 'cashier')} 
              className="underline hover:text-orange-200 transition duration-200"
            >
              Cashier
            </button>
            <span className="mx-2">|</span>
            <button 
              onClick={(e) => handleClick(e, 'admin')} 
              className="underline hover:text-orange-200 transition duration-200"
            >
              Admin
            </button>
          </>
        )}
      </p>
    </footer>
  )
}

export default Footer