import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useReservations } from "../context/ReservationContext";
import { useToast } from "../context/ToastContext";
import { ChevronDown, ChevronRight, Check, X, Calendar, Clock, Package } from "lucide-react";

const CashierDashboard = ({ onLogout }) => {
  const toast = useToast();

  const { menuItems, addMenuItem, deleteMenuItem } = useMenu();
  const { getPendingReservations, completeReservation, cancelReservation } =
    useReservations();

  const [newItemName, setNewItemName] = useState("");
  const [cart, setCart] = useState([]);
  const [username, setUsername] = useState("");
  const [customerInfo] = useState({
    name: "Bench",
    points: 120,
  });
  const [showReservations, setShowReservations] = useState(true);

  const pendingReservations = getPendingReservations();

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
      setCart([...cart, { id: item.id, name: item.name, quantity: 1, price: 5 }]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty.");
      return;
    }
    toast.success("Checkout successful!");
    setCart([]);
  };

  const handleAddNewItem = () => {
    if (!newItemName.trim()) {
      toast.error("Please type an item name.");
      return;
    }
    addMenuItem(newItemName.trim());
    toast.success(`"${newItemName.trim()}" added to menu!`);
    setNewItemName("");
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
      <Header isLoggedIn={true} onLogout={onLogout} />

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

            <div className="px-4 sm:px-6 py-4 bg-orange-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewItem()}
                  placeholder="New item name..."
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
                <button
                  onClick={handleAddNewItem}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-lg transition"
                  type="button"
                >
                  Add Item
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 sm:px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition gap-3"
                >
                  <span className="text-lg sm:text-xl text-gray-700">
                    {item.name}
                  </span>

                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={() => {
                        addToCart(item);
                        toast.info(`Added ${item.name} to cart.`);
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 sm:px-8 py-2 rounded-full transition"
                      type="button"
                    >
                      ADD
                    </button>
                    <button
                      onClick={() => {
                        deleteMenuItem(item.id);
                        toast.info("Item removed.");
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-full transition flex items-center justify-center"
                      type="button"
                    >
                      <X size={16} />
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-lg font-medium whitespace-nowrap">
                  Username:
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full sm:flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder=""
                />
              </div>

              {customerInfo && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">{customerInfo.name}</span>
                    <span>
                      Points: <span className="font-bold">{customerInfo.points}</span>
                    </span>
                  </div>
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
                      <span className="text-lg sm:text-xl text-gray-700">
                        {item.name}
                      </span>
                      <span className="text-lg sm:text-xl text-gray-700">
                        x{item.quantity}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-bold">Total</span>
                  <span className="text-xl sm:text-2xl font-bold">
                    ${calculateTotal()}
                  </span>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleCheckout}
                    className="bg-orange-700 hover:bg-orange-800 text-white font-bold px-8 py-3 rounded-lg text-lg sm:text-xl transition"
                    type="button"
                  >
                    Checkout
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
