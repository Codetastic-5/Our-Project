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
    { id: 1, name: 'Burger', image: '' },
    { id: 2, name: 'Fries', image: '' },
    { id: 3, name: 'Pizza', image: '' },
    { id: 4, name: 'Soda', image: '' },
    { id: 5, name: 'Salad', image: '' },
    { id: 6, name: 'Ice Cream', image: '' }
  ])

  const addMenuItem = (itemName) => {
    const newItem = {
      id: Date.now(),
      name: itemName,
      image: ''
    }
    setMenuItems([...menuItems, newItem])
  }

  const deleteMenuItem = (itemId) => {
    setMenuItems(menuItems.filter(item => item.id !== itemId))
  }

  return (
    <MenuContext.Provider value={{ menuItems, addMenuItem, deleteMenuItem }}>
      {children}
    </MenuContext.Provider>
  )
}

export default MenuContext