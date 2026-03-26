import { createContext, useState, useContext, useEffect } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'

const MenuContext = createContext()

export const useMenu = () => {
  const context = useContext(MenuContext)
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider')
  }
  return context
}

export const MenuProvider = ({ children }) => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load menu items from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'menuItems'),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setMenuItems(items)
        setLoading(false)
      },
      (error) => {
        console.error('Error loading menu items:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addMenuItem = async (itemName, stock = 0, price = 0) => {
    try {
      await addDoc(collection(db, 'menuItems'), {
        name: itemName,
        image: '',
        stock: stock,
        price: price
      })
    } catch (error) {
      console.error('Error adding menu item:', error)
    }
  }

  const deleteMenuItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'menuItems', itemId))
    } catch (error) {
      console.error('Error deleting menu item:', error)
    }
  }

  const updateStock = async (itemId, newStock) => {
    try {
      await updateDoc(doc(db, 'menuItems', itemId), {
        stock: newStock
      })
    } catch (error) {
      console.error('Error updating stock:', error)
    }
  }

  const decrementStock = async (itemId, quantity = 1) => {
    try {
      const item = menuItems.find(item => item.id === itemId)
      if (item) {
        await updateDoc(doc(db, 'menuItems', itemId), {
          stock: Math.max(0, item.stock - quantity)
        })
      }
    } catch (error) {
      console.error('Error decrementing stock:', error)
    }
  }

  const updatePrice = async (itemId, newPrice) => {
    try {
      await updateDoc(doc(db, 'menuItems', itemId), {
        price: newPrice
      })
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  return (
    <MenuContext.Provider value={{ menuItems, addMenuItem, deleteMenuItem, updateStock, decrementStock, updatePrice, loading }}>
      {children}
    </MenuContext.Provider>
  )
}

export default MenuContext