import { createContext, useState, useContext } from 'react'

const MenuContext = createContext()

export const useMenu = () => {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider')
  }
  return context
}

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([
    { id: 1, name: 'Burger', image: '', stock: 10, price: 85 },
    { id: 2, name: 'Fries', image: '', stock: 15, price: 45 },
    { id: 3, name: 'Pizza', image: '', stock: 8, price: 150 },
    { id: 4, name: 'Soda', image: '', stock: 20, price: 25 },
    { id: 5, name: 'Salad', image: '', stock: 5, price: 65 },
    { id: 6, name: 'Ice Cream', image: '', stock: 12, price: 35 }
  ])

  const addMenuItem = (itemName, stock = 0, price = 0) => {
    const newItem = {
      id: Date.now(),
      name: itemName,
      image: '',
      stock: stock,
      price: price
    }
    setMenuItems([...menuItems, newItem])
  }

  const deleteMenuItem = (itemId) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId))
  }

  const updateStock = (itemId, newStock) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, stock: newStock } : item
    ))
  }

  const decrementStock = (itemId, quantity = 1) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, stock: Math.max(0, item.stock - quantity) } : item
    ))
  }

  const updatePrice = (itemId, newPrice) => {
    setMenuItems(menuItems.map(item => 
      item.id === itemId ? { ...item, price: newPrice } : item
    ))
  }

  return (
    <MenuContext.Provider value={{ menuItems, addMenuItem, deleteMenuItem, updateStock, decrementStock, updatePrice }}>
      {children}
    </MenuContext.Provider>
  )
}

export default MenuContext