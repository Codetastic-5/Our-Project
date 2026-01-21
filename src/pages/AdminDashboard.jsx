import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useToast } from "../context/ToastContext";

const AdminDashboard = ({ onLogout }) => {
  const toast = useToast();
  const { menuItems, addMenuItem, updateStock, deleteMenuItem, updatePrice } = useMenu();

  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [searchUsername, setSearchUsername] = useState("");

  // Mock customer data - replace with real data from your backend
  const [customers] = useState([]);

  const filteredCustomers = customers.filter((customer) =>
    customer.username.toLowerCase().includes(searchUsername.toLowerCase())
  );

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
                {searchUsername.trim() === ""
                  ? customers.length
                  : filteredCustomers.length}{" "}
                Customer{customers.length !== 1 ? "s" : ""}
              </div>

              {/* Customer List */}
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {filteredCustomers.length === 0 && searchUsername.trim() !== "" ? (
                  <p className="text-gray-400 text-center py-16">
                    Customer not found
                  </p>
                ) : filteredCustomers.length === 0 ? (
                  <p className="text-gray-400 text-center py-16">
                    Search for a customer
                  </p>
                ) : (
                  filteredCustomers.map((customer, index) => (
                    <div
                      key={customer.id}
                      className={`flex items-center justify-between px-4 py-4 ${
                        index !== filteredCustomers.length - 1
                          ? "border-b border-gray-200"
                          : ""
                      }`}
                    >
                      <span className="font-medium text-gray-800 text-base">
                        {customer.username}
                      </span>
                      <span className="text-gray-700 font-semibold text-base">
                        Points: {customer.points}
                      </span>
                    </div>
                  ))
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
