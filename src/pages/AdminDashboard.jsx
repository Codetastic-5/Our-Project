import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useToast } from "../context/ToastContext";

const AdminDashboard = ({ onLogout }) => {
  const toast = useToast();
  const { menuItems, addMenuItem } = useMenu();

  const [newItemName, setNewItemName] = useState("");
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
    addMenuItem(newItemName.trim());
    toast.success(`"${newItemName.trim()}" added to menu!`);
    setNewItemName("");
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
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Item Name"
                  className="flex-1 border-2 border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-orange-500 text-gray-700 text-base"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAddMenuItem();
                  }}
                />
                <button
                  onClick={handleAddMenuItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded font-bold text-sm transition"
                >
                  ADD
                </button>
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
                    <span className="text-gray-700 font-medium text-base">
                      {item.name}
                    </span>
                    <button
                      onClick={() => addMenuItem(item.name)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded font-bold text-sm transition"
                    >
                      ADD
                    </button>
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
