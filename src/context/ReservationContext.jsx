import { createContext, useState, useContext } from 'react'

const ReservationContext = createContext()

export const useReservations = () => {
  const context = useContext(ReservationContext)
  if (!context) {
    throw new Error('useReservations must be used within ReservationProvider')
  }
  return context
}

export const ReservationProvider = ({ children }) => {
  const [reservations, setReservations] = useState([])

  const addReservation = (reservation) => {
    const newReservation = {
      id: Date.now(),
      ...reservation,
      createdAt: new Date().toISOString(),
      status: 'pending' // pending, completed, cancelled
    }
    setReservations(prev => [...prev, newReservation])
    return newReservation
  }

  const cancelReservation = (id) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: "cancelled" }
          : r
      )
    );
  };

  const completeReservation = (id) => {
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'completed' } : r
    ))
  }

  const getPendingReservations = () => {
    return reservations.filter(r => r.status === 'pending')
  }

  const getCustomerReservations = (customerName) => {
    return reservations.filter(
      r => r.customerName === customerName && r.status !== "cancelled"
    );
  };

  return (
    <ReservationContext.Provider value={{ 
      reservations, 
      addReservation, 
      cancelReservation,
      completeReservation,
      getPendingReservations,
      getCustomerReservations
    }}>
      {children}
    </ReservationContext.Provider>
  )
}

export default ReservationContext