import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const AdminDashboard = ({ onLogout }) => {
  const toast = useToast();
  const { user: authUser } = useAuth();
  console.log("AUTH ROLE:", authUser?.role, "UID:", authUser?.uid);
  const { menuItems, addMenuItem, updateStock, deleteMenuItem, updatePrice } = useMenu();

  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [minPoints, setMinPoints] = useState("");
 

  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const role = String(authUser?.role || "").toLowerCase();
  const isStaff = role === "cashier" || role === "admin";

  useEffect(() => {
    if (!authUser?.uid) {
      setCustomers([]);
      setLoadingCustomers(false);
      return;
    }

    if (!isStaff) {
      setCustomers([]);
      setLoadingCustomers(false);
      return;
    }

    setLoadingCustomers(true);
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        console.log("CUSTOMERS SNAP SIZE:", snap.size);
        const list = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            name: data.name || "",
            email: data.email || "",
            points: typeof data.points === "number" ? data.points : 0,
            role: data.role || "customer",
          };
        }).filter((user) => user.role === "customer");
        setCustomers(list);
        setLoadingCustomers(false);
      },
      (err) => {
        console.error("users snapshot error:", err);
        setCustomers([]);
        setLoadingCustomers(false);
      }
    );

    return () => unsub();
  }, [authUser?.uid, isStaff]);

  const filteredCustomers = useMemo(() => {
    const term = searchUsername.trim().toLowerCase();
    let filtered = customers.filter((customer) =>
      String(customer?.name || "").toLowerCase().includes(term)
    );

    // Filter by minimum points
    const min = parseInt(minPoints);
    if (!isNaN(min) && min > 0) {
      filtered = filtered.filter((customer) => customer.points >= min);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'points') {
        aVal = a.points;
        bVal = b.points;
      } else if (sortBy === 'role') {
        aVal = String(a.role || "").toLowerCase();
        bVal = String(b.role || "").toLowerCase();
      } else {
        aVal = String(a.name || "").toLowerCase();
        bVal = String(b.name || "").toLowerCase();
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [customers, searchUsername, minPoints, sortBy, sortOrder]);

  const handleAddMenuItem = () => {
    if (!newItemName.trim()) {
      toast.error("Please enter an item name.");
      return;
    }
    const stock = parseInt(newItemStock) || 0;
    const price = parseInt(newItemPrice) || 0;
    addMenuItem(newItemName.trim(), stock, price);
    toast.success(`"${newItemName.trim()}" added to menu with ${stock} stocks at ₱${price}!`);
    setNewItemName("");
    setNewItemStock("");
    setNewItemPrice("");
  };

  const handlePriceChange = (itemId, value) => {
    const price = parseInt(value) || 0;
    updatePrice(itemId, price);
  };

  const handleStockChange = (itemId, value) => {
    const stock = parseInt(value) || 0;
    updateStock(itemId, stock);
  };

  const handleDeleteItem = (itemId, itemName) => {
    deleteMenuItem(itemId);
    toast.info(`"${itemName}" removed from menu.`);
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to delete ${customerName}? This will remove their data from the system.`)) return;
    try {
      await deleteDoc(doc(db, "users", customerId));
      toast.success(`${customerName} deleted successfully.`);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete customer.");
    }
  };

  const handleSearch = () => {
    if (searchUsername.trim() === "") {
      toast.info("Enter a username to search.");
      return;
    }
    if (filteredCustomers.length === 0) {
      toast.error("Customer not found.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 pt-20">
      <Header isLoggedIn={true} onLogout={onLogout} />

      <main className="flex-1 px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* TODAY'S MENU Section */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-orange-600 px-8 py-5">
              <h2 className="text-xl font-bold text-white tracking-wide">
                TODAY'S MENU
              </h2>
            </div>

            <div className="p-6">
              {/* Add New Item Form at Top */}
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Item Name"
                    className="flex-1 border-2 border-gray-300 rounded px-3 py-3 focus:outline-none focus:border-orange-500 text-gray-700 text-base"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddMenuItem();
                    }}
                  />
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    placeholder="Stock"
                    min="0"
                    className="w-20 border-2 border-gray-300 rounded px-2 py-3 focus:outline-none focus:border-orange-500 text-gray-700 text-base"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddMenuItem();
                    }}
                  />
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="₱ Price"
                    min="0"
                    className="w-24 border-2 border-gray-300 rounded px-2 py-3 focus:outline-none focus:border-orange-500 text-gray-700 text-base"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleAddMenuItem();
                    }}
                  />
                  <button
                    onClick={handleAddMenuItem}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded font-bold text-sm transition"
                  >
                    ADD
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between px-4 py-4 ${
                      index !== menuItems.length - 1
                        ? "border-b border-gray-300"
                        : ""
                    }`}
                  >
                    <span className="text-gray-700 font-medium text-base flex-1">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500 text-sm">₱</span>
                        <input
                          type="number"
                          value={item.price || 0}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          min="0"
                          className="w-16 border-2 border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <input
                        type="number"
                        value={item.stock}
                        onChange={(e) => handleStockChange(item.id, e.target.value)}
                        min="0"
                        className="w-16 border-2 border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:border-orange-500"
                      />
                      <span className="text-gray-500 text-xs">stock</span>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-sm transition ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {menuItems.length === 0 && (
                  <p className="text-gray-400 text-center py-16">
                    No items on menu yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CUSTOMERS Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-orange-600 px-8 py-5">
              <h2 className="text-xl font-bold text-white tracking-wide">
                CUSTOMERS
              </h2>
            </div>

            <div className="p-6">
              {/* Search Bar */}
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="Username:"
                  className="flex-1 border-2 border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-orange-500 text-gray-700 text-base"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded font-bold text-sm transition"
                >
                  Search
                </button>
              </div>

              {/* Customer Count */}
              <div className="text-sm text-gray-600 font-medium mb-6">
                {searchUsername.trim() === "" ? customers.length : filteredCustomers.length} User
                {((searchUsername.trim() === "" ? customers.length : filteredCustomers.length) || 0) !== 1 ? "s" : ""}
              </div>

              {/* Sort Bar */}
              <div className="flex gap-3 mb-6 items-center">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [by, order] = e.target.value.split('-');
                    setSortBy(by);
                    setSortOrder(order);
                  }}
                  className="border-2 border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-orange-500 text-gray-700 text-sm"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="points-asc">Points (Low to High)</option>
                  <option value="points-desc">Points (High to Low)</option>
                 
                </select>
                <input
                  type="number"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                  placeholder="Min Points"
                  min="0"
                  className="border-2 border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-orange-500 text-gray-700 text-sm w-24"
                />
              </div>

              {/* Customer List */}
              <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
                {!isStaff ? (
                  <div className="text-gray-400 text-center py-16">
                    Not authorized to view users.
                  </div>
                ) : loadingCustomers ? (
                  <div className="text-gray-500 text-center py-16">Loading users...</div>
                ) : filteredCustomers.length === 0 && searchUsername.trim() !== "" ? (
                  <p className="text-gray-400 text-center py-16">User not found</p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-gray-400 text-center py-16">No users to display</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 sticky top-0">
                      <tr>
                        <th className="text-left font-bold px-4 py-3">
                          Name
                        </th>
                        <th className="text-left font-bold px-4 py-3">Email</th>
                        <th className="text-left font-bold px-4 py-3">
                          Points
                        </th>
                        <th className="text-left font-bold px-4 py-3">Role</th>
                        
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {customer.name || "(no name)"}
                          </td>
                          <td className="px-4 py-3 text-gray-700 break-all">
                            {customer.email || ""}
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-semibold">
                            {customer.points ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                              {String(customer.role || "customer").toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteCustomer(customer.id, customer.name || "Unknown")}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded font-bold text-xs transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

    
      <Footer />
    </div>
  );
};

export default AdminDashboard;
