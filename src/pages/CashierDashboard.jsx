import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useReservations } from "../context/ReservationContext";
import { useToast } from "../context/ToastContext";
import { ChevronDown, ChevronRight, Check, X, Calendar, Clock, Package, Search, UserCheck, UserX } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";

const CashierDashboard = ({ onLogout }) => {
  const toast = useToast();

  const { menuItems } = useMenu();
  const { getPendingReservations, completeReservation, cancelReservation } =
    useReservations();

  const [cart, setCart] = useState([]);
  const [username, setUsername] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showReservations, setShowReservations] = useState(true);

  const pendingReservations = getPendingReservations();

  // Search for customer by name
  const handleSearchCustomer = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username to search.");
      return;
    }
    
    setSearchLoading(true);
    setCustomerInfo(null);
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("name", "==", username.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.info("Customer not found.");
        setCustomerInfo(null);
      } else {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setCustomerInfo({
          id: userDoc.id,
          name: userData.name || "Unknown",
          email: userData.email || "",
          points: userData.points || 0,
          role: userData.role || "customer",
        });
        toast.success(`Found customer: ${userData.name}`);
      }
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Failed to search customer.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Select customer for current transaction
  const handleSelectCustomer = () => {
    if (customerInfo) {
      setSelectedCustomer(customerInfo);
      toast.success(`${customerInfo.name} linked to this transaction`);
    }
  };

  // Clear selected customer
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    toast.info("Customer unlinked from transaction");
  };

  const addToCart = (item) => {
    const existingItem = cart.find((cartItem) => cartItem.name === item.name);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.name === item.name
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { id: item.id, name: item.name, quantity: 1, price: item.price || 0 }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  // Calculate points earned (10 points per 10 pesos spent)
  const calculatePointsEarned = () => {
    return Math.floor(calculateTotal() / 10) * 20;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setCheckoutLoading(true);

    try {
      // If a customer is selected, add points to their account
      if (selectedCustomer) {
        const pointsToAdd = calculatePointsEarned();
        const customerRef = doc(db, "users", selectedCustomer.id);
        
        await updateDoc(customerRef, {
          points: increment(pointsToAdd)
        });

        toast.success(`Checkout successful! ${selectedCustomer.name} earned ${pointsToAdd} points.`);
        
        // Update local state to reflect new points
        setSelectedCustomer(prev => ({
          ...prev,
          points: prev.points + pointsToAdd
        }));
        
        // Also update customerInfo if it's the same customer
        if (customerInfo && customerInfo.id === selectedCustomer.id) {
          setCustomerInfo(prev => ({
            ...prev,
            points: prev.points + pointsToAdd
          }));
        }
      } else {
        toast.success("Checkout successful! (No customer linked - no points awarded)");
      }

      setCart([]);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCompleteReservation = (id) => {
    completeReservation(id);
    toast.success("Reservation completed.");
  };

  const card =
    "bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition overflow-hidden";
  const headerBase = "text-white px-6 py-4 flex items-center justify-between";
  const sectionTitle = "text-xl sm:text-2xl font-bold";

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 pt-20">
      <Header isLoggedIn={true} onLogout={onLogout} role="cashier" />

      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-6 gap-6">
        <aside className="w-full lg:w-96 space-y-6">
          {/* Reservations */}
          <div className={card}>
            <div
              className={`${headerBase} bg-purple-700 hover:bg-purple-800 cursor-pointer transition`}
              onClick={() => setShowReservations(!showReservations)}
            >
              <h2 className={sectionTitle}>
                RESERVATIONS ({pendingReservations.length})
              </h2>
              <span className="text-2xl">
                {showReservations ? <ChevronDown /> : <ChevronRight />}
              </span>
            </div>

            {showReservations && (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {pendingReservations.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No pending reservations
                  </p>
                ) : (
                  pendingReservations.map((res) => {
                    const formattedDate = new Date(res.date).toLocaleDateString(
                      "en-US",
                      { weekday: "short", month: "short", day: "numeric" }
                    );

                    return (
                      <div
                        key={res.id}
                        className="bg-purple-50 border border-purple-200 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <div>
                            <div className="font-bold text-lg">{res.itemName}</div>
                            <div className="text-sm text-gray-600">
                              by {res.customerName}
                            </div>
                          </div>
                          <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                            PENDING
                          </span>
                        </div>

                        <div className="text-sm space-y-1 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formattedDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{res.time}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Package size={16} />
                            <span>Qty: {res.quantity}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCompleteReservation(res.id)}
                            className="flex-1 min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                            type="button"
                          >
                            <Check size={18} />
                            Complete
                          </button>

                          <button
                            onClick={() => {
                              cancelReservation(res.id);
                              toast.info("Reservation cancelled.");
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg transition flex items-center justify-center"
                            type="button"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Today's Menu */}
          <div className={card}>
            <div className={`${headerBase} bg-orange-700`}>
              <h2 className={sectionTitle}>TODAY'S MENU</h2>
              <ChevronDown size={20} />
            </div>

            <div className="divide-y divide-gray-200">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 sm:px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition gap-3"
                >
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-xl text-gray-700">
                      {item.name}
                    </span>
                    <span className="text-base font-bold text-orange-600">
                      ₱{item.price || 0}
                    </span>
                    <span className={`text-sm font-medium ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => {
                        if (item.stock <= 0) {
                          toast.error(`${item.name} is out of stock.`);
                          return;
                        }
                        addToCart(item);
                        toast.info(`Added ${item.name} to cart.`);
                      }}
                      disabled={item.stock <= 0}
                      className={`font-bold px-6 sm:px-8 py-2 rounded-full transition ${
                        item.stock > 0 
                          ? 'bg-yellow-400 hover:bg-yellow-500 text-black' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      type="button"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customers */}
          <div className={card}>
            <div className={`${headerBase} bg-orange-700`}>
              <h2 className={sectionTitle}>CUSTOMERS</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchCustomer()}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Enter customer name..."
                />
                <button
                  onClick={handleSearchCustomer}
                  disabled={searchLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                  type="button"
                >
                  <Search size={18} />
                  {searchLoading ? "Searching..." : "Search"}
                </button>
              </div>

              {customerInfo ? (
                <div className="pt-2 bg-orange-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-lg">
                    <div>
                      <span className="font-bold text-xl">{customerInfo.name}</span>
                      <p className="text-sm text-gray-600">{customerInfo.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Points</span>
                      <p className="font-bold text-2xl text-orange-600">{customerInfo.points}</p>
                    </div>
                  </div>
                  
                  {/* Select Customer Button */}
                  {selectedCustomer?.id === customerInfo.id ? (
                    <div className="flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg">
                      <UserCheck size={18} />
                      <span className="font-medium">Selected for Transaction</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSelectCustomer}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                      type="button"
                    >
                      <UserCheck size={18} />
                      Select for Transaction
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-2 text-center text-gray-400">
                  Search for a customer to view their info
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Cart */}
        <section className="flex-1">
          <div className={`${card} h-full flex flex-col`}>
            <div className={`${headerBase} bg-orange-700`}>
              <h2 className={sectionTitle}>CART</h2>
            </div>

            {/* Selected Customer Banner */}
            {selectedCustomer && (
              <div className="bg-green-50 border-b border-green-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="text-green-600" size={20} />
                  <div>
                    <span className="font-bold text-green-800">{selectedCustomer.name}</span>
                    <span className="text-sm text-green-600 ml-2">({selectedCustomer.points} points)</span>
                  </div>
                </div>
                <button
                  onClick={handleClearCustomer}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition"
                  type="button"
                  title="Remove customer"
                >
                  <UserX size={20} />
                </button>
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <div className="flex-1 divide-y divide-gray-200">
                {cart.length === 0 ? (
                  <div className="h-full flex items-center justify-center p-10">
                    <div className="text-center">
                      <div className="text-gray-500 font-medium">
                        No items in cart yet
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Add menu items on the left to start a checkout.
                      </div>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="px-6 py-5 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-lg sm:text-xl text-gray-700">
                          {item.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ₱{item.price} each
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg sm:text-xl text-gray-700">
                          x{item.quantity}
                        </span>
                        <p className="text-sm font-medium text-orange-600">
                          ₱{item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-bold">Total</span>
                  <span className="text-xl sm:text-2xl font-bold">
                    ₱{calculateTotal()}
                  </span>
                </div>
                
                {/* Points to be earned */}
                {selectedCustomer && cart.length > 0 && (
                  <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2">
                    <span className="text-green-700 font-medium">Points to earn:</span>
                    <span className="text-green-700 font-bold text-lg">+{calculatePointsEarned()} pts</span>
                  </div>
                )}
                
                {!selectedCustomer && cart.length > 0 && (
                  <div className="text-sm text-gray-500 text-center">
                    💡 Link a customer to award loyalty points
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-8 py-3 rounded-lg text-lg sm:text-xl transition disabled:opacity-60"
                    type="button"
                  >
                    {checkoutLoading ? "Processing..." : "Checkout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer showLinks={false} />
    </div>
  );
};

export default CashierDashboard;
