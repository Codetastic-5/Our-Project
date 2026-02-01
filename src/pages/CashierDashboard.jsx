import { useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useReservations } from "../context/ReservationContext";
import { useToast } from "../context/ToastContext";
import { ChevronDown, ChevronRight, Check, X, Search, UserCheck, UserX } from "lucide-react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment } from "firebase/firestore";

const CashierDashboard = ({ onLogout }) => {
  const toast = useToast();

  const { menuItems } = useMenu();
  const {
    reservations,
    loadingReservations,
    setReservationStatus,
  } = useReservations();

  const [cart, setCart] = useState([]);
  const [username, setUsername] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showReservations, setShowReservations] = useState(true);

  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const getReservationDateString = (reservation) => {
    if (!reservation) return "";
    if (typeof reservation.date === "string") return reservation.date;
    if (typeof reservation.date?.toDate === "function") {
      const d = reservation.date.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return "";
  };

  const formatYmd = (ymd) => {
    if (!ymd || typeof ymd !== "string") return "";
    const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return ymd;
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) return ymd;
    return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const filteredReservations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return (reservations || []).filter((r) => {
      const status = String(r?.status || "").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;

      const dateStr = getReservationDateString(r);
      if (startDate && (!dateStr || dateStr < startDate)) return false;
      if (endDate && (!dateStr || dateStr > endDate)) return false;

      if (!normalizedSearch) return true;

      const haystack = [
        r?.customerName,
        r?.customerEmail,
        r?.customerUid,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [reservations, statusFilter, startDate, endDate, searchTerm]);

  const pendingCount = useMemo(
    () => (reservations || []).filter((r) => String(r?.status || "").toLowerCase() === "pending").length,
    [reservations]
  );

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

  // Remove item from cart (void)
  const removeFromCart = (itemId) => {
    const itemToRemove = cart.find((i) => i.id === itemId);
    if (!itemToRemove) return;
    if (!window.confirm(`Void ${itemToRemove.name} from cart? This will remove it completely.`)) return;
    setCart(cart.filter((i) => i.id !== itemId));
    toast.info(`${itemToRemove.name} voided.`);
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

  const handleUpdateReservationStatus = async (id, status) => {
    if (!id) return;
    setActionLoadingId(id);
    try {
      await setReservationStatus(id, status);
      toast.success(`Reservation ${status}.`);
    } catch (e) {
      console.error("Update reservation status error:", e);
      toast.error("Failed to update reservation.");
    } finally {
      setActionLoadingId(null);
    }
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
                RESERVATIONS ({pendingCount})
              </h2>
              <span className="text-2xl">
                {showReservations ? <ChevronDown /> : <ChevronRight />}
              </span>
            </div>

            {showReservations && (
              <div className="p-4 space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        End date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Search (name, email, uid)
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full border rounded-lg pl-10 pr-3 py-2"
                          placeholder="Search customer..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter("all");
                          setStartDate("");
                          setEndDate("");
                          setSearchTerm("");
                        }}
                        className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:border-purple-400 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                {loadingReservations ? (
                  <div className="text-center py-6 text-gray-600">Loading reservations...</div>
                ) : filteredReservations.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No reservations match your filters.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-gray-700">
                        <tr>
                          <th className="text-left font-bold px-4 py-3">Item</th>
                          <th className="text-left font-bold px-4 py-3">Customer</th>
                          <th className="text-left font-bold px-4 py-3">Date + Time</th>
                          <th className="text-left font-bold px-4 py-3">Qty</th>
                          <th className="text-left font-bold px-4 py-3">Status</th>
                          <th className="text-left font-bold px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredReservations.map((res) => {
                          const status = String(res?.status || "").toLowerCase();
                          const isFinal = status === "completed" || status === "cancelled";
                          const dateStr = getReservationDateString(res);
                          const statusClasses =
                            status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700";

                          return (
                            <tr key={res.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-semibold text-gray-800">
                                {res?.itemName || "(unknown)"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-800">{res?.customerName || "(unknown)"}</div>
                                <div className="text-xs text-gray-500 break-all">{res?.customerUid || ""}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-gray-800">{formatYmd(dateStr)}</div>
                                <div className="text-xs text-gray-500">{res?.time || ""}</div>
                              </td>
                              <td className="px-4 py-3">{res?.quantity ?? ""}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${statusClasses}`}>
                                  {String(res?.status || "").toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {actionLoadingId === res.id ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 font-bold px-3 py-2 rounded-lg">Processing...</span>
                                  </div>
                                ) : !isFinal ? (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateReservationStatus(res.id, "completed")}
                                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-2 rounded-lg transition"
                                    >
                                      <Check size={16} />
                                      Complete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateReservationStatus(res.id, "cancelled")}
                                       className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-2 rounded-lg transition"
                                      title="Cancel"
                                    >
                                      <X size={16} />
                                      Cancel
                                    </button>
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg sm:text-xl text-gray-700">
                            x{item.quantity}
                          </span>
                          <p className="text-sm font-medium text-orange-600">
                            ₱{item.price * item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                          title="Void item"
                        >
                          <X size={18} />
                        </button>
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
