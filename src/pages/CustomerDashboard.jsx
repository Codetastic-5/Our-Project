import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useReservations } from "../context/ReservationContext";
import { useToast } from "../context/ToastContext";
import { Calendar, Clock, Package, X, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

const ReservationCard = ({ res, onCancel }) => {
  return (
    <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
      <div className="flex justify-between items-start mb-2 gap-3">
        <div className="font-bold text-base sm:text-lg">{res.itemName}</div>

        {onCancel && res.status === "pending" ? (
          <button
            onClick={() => onCancel(res)}
            className="text-red-600 hover:text-red-800 font-bold"
            type="button"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="text-sm text-gray-700 space-y-1">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>
            {new Date(res.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{res.time}</span>
        </div>

        <div className="flex items-center gap-2">
          <Package size={16} />
          <span>Quantity: {res.quantity}</span>
        </div>

        <div className="mt-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-bold ${
              res.status === "pending"
                ? "bg-yellow-200 text-yellow-800"
                : res.status === "completed"
                ? "bg-green-200 text-green-800"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {String(res.status || "").toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard = ({ onLogout }) => {
  const toast = useToast();
  const { user: authUser, loading, updateUserPassword, updateUserName } = useAuth();
  console.log("AUTH USER:", authUser);
  const { menuItems } = useMenu();
  const {
    reservations: myReservations,
    loadingReservations,
    addReservation: addReservations,
    cancelReservation: cancelReservations,
  } = useReservations();

  // State
  const [showSettings, setShowSettings] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [quickFilter, setQuickFilter] = useState("all");
  const [settingsForm, setSettingsForm] = useState({
    newName: "",
    newPassword: "",
    confirmPassword: "",
    currentPasswordForPassword: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [reservation, setReservation] = useState({
    item: "",
    date: "",
    quantity: 1,
    time: "",
  });

  const pendingReservations = myReservations.filter(
    (r) => r.status === "pending"
  );

  const completedReservations = myReservations.filter(
    (r) => r.status === "completed"
  );

  const cancelledReservations = myReservations.filter(
    (r) => r.status === "cancelled"
  );

  const toLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getReservationDateString = (reservation) => {
    if (!reservation) return "";
    if (typeof reservation.date === "string") return reservation.date;
    if (typeof reservation.date?.toDate === "function") {
      const d = reservation.date.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) {
        // Note: toISOString is UTC-based; local quick filters use local dates,
        // but manual date picker values are YYYY-MM-DD and compare directly.
        return d.toISOString().slice(0, 10);
      }
    }
    return "";
  };

  const filterByQuickFilter = (list) => {
    if (quickFilter === "all") return list;

    const today = new Date();
    const startStr = toLocalDateString(today);
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
    const endStr = toLocalDateString(end);

    return list.filter((r) => {
      const dateStr = getReservationDateString(r);
      if (!dateStr) return false;

      if (quickFilter === "today") {
        return dateStr === startStr;
      }

      // quickFilter === "week": [today, today+6]
      return dateStr >= startStr && dateStr <= endStr;
    });
  };

  const filterByManualDate = (list) => {
    if (quickFilter !== "all") return list;
    if (!filterDate) return list;

    return list.filter((r) => {
      const reservationDate = getReservationDateString(r);
      return reservationDate === filterDate;
    });
  };

  const getCreatedAtMs = (createdAt) => {
    if (!createdAt) return null;

    if (typeof createdAt.toMillis === "function") {
      const ms = createdAt.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }

    if (typeof createdAt.toDate === "function") {
      const d = createdAt.toDate();
      const ms = d?.getTime?.();
      return Number.isFinite(ms) ? ms : null;
    }

    if (typeof createdAt === "number") {
      return Number.isFinite(createdAt) ? createdAt : null;
    }

    if (typeof createdAt === "string") {
      const ms = Date.parse(createdAt);
      return Number.isNaN(ms) ? null : ms;
    }

    if (typeof createdAt?.seconds === "number") {
      const seconds = createdAt.seconds;
      const nanoseconds = typeof createdAt?.nanoseconds === "number" ? createdAt.nanoseconds : 0;
      return seconds * 1000 + Math.floor(nanoseconds / 1e6);
    }

    return null;
  };

  const sortReservations = (list) => {
    const direction = sortOrder === "oldest" ? 1 : -1;
    return [...list].sort((a, b) => {
      const aMs = getCreatedAtMs(a?.createdAt);
      const bMs = getCreatedAtMs(b?.createdAt);

      // Missing timestamps should not crash and should consistently sort last.
      if (aMs == null && bMs == null) return 0;
      if (aMs == null) return 1;
      if (bMs == null) return -1;

      return (aMs - bMs) * direction;
    });
  };

  const pendingFiltered = filterByManualDate(filterByQuickFilter(pendingReservations));
  const completedFiltered = filterByManualDate(filterByQuickFilter(completedReservations));
  const cancelledFiltered = filterByManualDate(filterByQuickFilter(cancelledReservations));

  const pendingSorted = sortReservations(pendingFiltered);
  const completedSorted = sortReservations(completedFiltered);
  const cancelledSorted = sortReservations(cancelledFiltered);

console.log("MY RESERVATIONS:", myReservations);

  // Handlers
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateName = async () => {
    if (!settingsForm.newName.trim()) {
      toast.error("Please enter a new username.");
      return;
    }
    setSettingsLoading(true);
    try {
      await updateUserName(settingsForm.newName.trim());
      toast.success("Username updated successfully!");
      setSettingsForm((prev) => ({ ...prev, newName: "" }));
      setShowSettings(false);
    } catch (err) {
      console.error("Update name error:", err);
      toast.error("Failed to update username.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!settingsForm.newPassword || !settingsForm.confirmPassword || !settingsForm.currentPasswordForPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (settingsForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSettingsLoading(true);
    try {
      await updateUserPassword(settingsForm.newPassword, settingsForm.currentPasswordForPassword);
      toast.success("Password updated successfully!");
      setSettingsForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "", currentPasswordForPassword: "" }));
      setShowSettings(false);
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential")) {
        toast.error("Current password is incorrect.");
      } else {
        toast.error("Failed to update password.");
      }
    } finally {
      setSettingsLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour;
      slots.push(`${displayHour}:00 ${period}`);
      if (hour < 20) slots.push(`${displayHour}:30 ${period}`);
    }
    return slots;
  };

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }
    return dates;
  };

  const handleReservationChange = (field, value) => {
    setReservation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReserve = async () => {
    if (!reservation.item || !reservation.date || !reservation.time) {
      toast.error("Please fill in all fields.");
      return;
    }

    const customerName = authUser?.name || "Customer";
    const itemName = menuItems.find(
      (item) => item.id === parseInt(reservation.item)
    )?.name;

    // add reservation locally
    await addReservations({
      customerUid: authUser.uid,
      customerName, // optional but nice for cashier UI
      itemId: parseInt(reservation.item),
      itemName,
      date: reservation.date,
      time: reservation.time,
      quantity: reservation.quantity,
      pointsAwarded: true,
    });

    // ✅ add +10 points in Firestore (live UI updates because of onSnapshot)
    try {
      await updateDoc(doc(db, "users", authUser.uid), {
        points: increment(10),
      });
      toast.success("Reservation confirmed! +10 loyalty points");
    } catch (e) {
      toast.error("Failed to update points. Please try again.");
      console.error(e);
    }

    setReservation({
      item: "",
      date: "",
      quantity: 1,
      time: "",
    });
  };

  const handleCancelReservation = async (res) => {
    // only allow cancel if still pending
    if (res.status !== "pending") {
      toast.info("This reservation can’t be cancelled.");
      return;
    }

    await cancelReservations(res.id);
    toast.info("Reservation cancelled.");

    if (res.pointsAwarded) {
      try {
        await updateDoc(doc(db, "users", authUser.uid), {
          points: increment(-10),
        });
        toast.info("-10 loyalty points");
      } catch (e) {
        toast.error("Failed to update points.");
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const loyaltyPoints = authUser?.points ?? 0;
  const customerName = authUser?.name || "Customer";

  const timeSlots = generateTimeSlots();
  const dates = generateDates();

  const card =
    "bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition";
  const cardPad = "p-5 sm:p-6";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-20">
      <Header isLoggedIn={true} onLogout={onLogout} />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed bottom-20 right-6 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg z-40 transition"
        type="button"
        title="Settings"
      >
        <Settings size={24} />
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-orange-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-xl font-bold">Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="hover:bg-orange-700 p-1 rounded transition"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Current Account</p>
                <p className="font-semibold">{authUser?.name || "N/A"}</p>
                <p className="text-gray-600">{authUser?.email || "N/A"}</p>
              </div>

              {/* Update Username */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700">Change Username</h3>
                <input
                  type="text"
                  name="newName"
                  placeholder="New username"
                  value={settingsForm.newName}
                  onChange={handleSettingsChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={settingsLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-60"
                  type="button"
                >
                  Update Username
                </button>
              </div>

              <hr className="border-gray-200" />

              {/* Update Password */}
              <div className="space-y-3">
                <h3 className="font-bold text-gray-700">Change Password</h3>
                <input
                  type="password"
                  name="currentPasswordForPassword"
                  placeholder="Current password"
                  value={settingsForm.currentPasswordForPassword}
                  onChange={handleSettingsChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                />
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New password (min 6 characters)"
                  value={settingsForm.newPassword}
                  onChange={handleSettingsChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={settingsForm.confirmPassword}
                  onChange={handleSettingsChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
                />
                <button
                  onClick={handleUpdatePassword}
                  disabled={settingsLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-60"
                  type="button"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row">
        <aside className="w-full lg:w-96 bg-orange-300 p-4 sm:p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="/Welcome.png"
              alt="Welcome Logo"
              className="w-20 sm:w-24 h-12 sm:h-14 object-contain"
            />
            <h2 className="text-xl sm:text-2xl font-bold">
            Welcome, {customerName}!
            </h2>
          </div>

          <div id="points" className={`${card} ${cardPad} scroll-mt-24`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <img
                  src="/Loyalty.png"
                  alt="Loyalty Logo"
                  className="w-14 sm:w-20 h-10 sm:h-12 object-contain"
                />
                <span className="text-base sm:text-xl font-bold">
                  Your Loyalty Points:
                </span>
              </div>
              <div className="bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xl sm:text-2xl font-bold">
                {loyaltyPoints}
              </div>
            </div>
          </div>

          <div id="reservation" className={`${card} ${cardPad} scroll-mt-24`}>
            <div className="flex items-center mb-4 gap-2">
              <img
                src="/Reservation.png"
                alt="Reservation Logo"
                className="w-14 sm:w-20 h-10 sm:h-12 object-contain"
              />
              <h3 className="text-xl sm:text-2xl font-bold">Reservation</h3>
            </div>

            <div className="space-y-3">
              <select
                value={reservation.item}
                onChange={(e) => handleReservationChange("item", e.target.value)}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-base sm:text-lg appearance-none cursor-pointer hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition"
              >
                <option value="">Select Item</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} - ₱{item.price || 0}
                  </option>
                ))}
              </select>

              <select
                value={reservation.date}
                onChange={(e) => handleReservationChange("date", e.target.value)}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-base sm:text-lg appearance-none cursor-pointer hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition"
              >
                <option value="">Select Date</option>
                {dates.map((date) => (
                  <option key={date.value} value={date.value}>
                    {date.label}
                  </option>
                ))}
              </select>

              <select
                value={reservation.quantity}
                onChange={(e) =>
                  handleReservationChange("quantity", parseInt(e.target.value))
                }
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-base sm:text-lg appearance-none cursor-pointer hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition"
              >
                <option value="">Select Quantity</option>
                {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "item" : "items"}
                  </option>
                ))}
              </select>

              <select
                value={reservation.time}
                onChange={(e) => handleReservationChange("time", e.target.value)}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold text-base sm:text-lg appearance-none cursor-pointer hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition"
              >
                <option value="">Select Time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <button
                onClick={handleReserve}
                disabled={!reservation.item || !reservation.date || !reservation.time}
                className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 rounded-lg font-bold text-lg sm:text-xl transition mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                RESERVE
              </button>
            </div>
          </div>

          <div className={`${card} ${cardPad}`}>
            <h3 className="text-lg sm:text-xl font-bold mb-4">My Reservations</h3>

            <div className="flex flex-col gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Filter by date
                </label>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setQuickFilter("all")}
                    className={`w-full px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition whitespace-nowrap ${
                      quickFilter === "all"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFilter("today");
                      setFilterDate("");
                    }}
                    className={`w-full px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition whitespace-nowrap ${
                      quickFilter === "today"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFilter("week");
                      setFilterDate("");
                    }}
                    className={`w-full col-span-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition whitespace-nowrap ${
                      quickFilter === "week"
                        ? "bg-orange-600 text-white border-orange-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                    }`}
                  >
                    This Week
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                    }}
                    disabled={quickFilter !== "all"}
                    className="flex-1 min-w-[160px] border rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setFilterDate("");
                      setQuickFilter("all");
                    }}
                    className="shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:border-orange-400 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            {loadingReservations ? (
              <div className="text-center py-6 text-gray-600">Loading reservations...</div>
            ) : pendingFiltered.length === 0 &&
              completedFiltered.length === 0 &&
              cancelledFiltered.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-600 font-medium">No reservations yet</div>
                <div className="text-sm text-gray-500 mt-1">
                  Reserve your favorite item and earn loyalty points.
                </div>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("reservation")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="mt-4 bg-orange-700 hover:bg-orange-800 text-white font-semibold px-5 py-2 rounded-lg transition"
                >
                  Reserve now
                </button>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {/* PENDING */}
                {pendingFiltered.length > 0 && (
                  <>
                    <h4 className="font-bold mt-3 mb-2">Pending</h4>
                    <div className="space-y-3">
                      {pendingSorted.map((res) => (
                        <ReservationCard
                          key={res.id}
                          res={res}
                          onCancel={handleCancelReservation}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* COMPLETED */}
                {completedFiltered.length > 0 && (
                  <>
                    <h4 className="font-bold mt-4 mb-2">Completed</h4>
                    <div className="space-y-3">
                      {completedSorted.map((res) => (
                        <ReservationCard key={res.id} res={res} />
                      ))}
                    </div>
                  </>
                )}

                {/* CANCELLED */}
                {cancelledFiltered.length > 0 && (
                  <>
                    <h4 className="font-bold mt-4 mb-2">Cancelled</h4>
                    <div className="space-y-3">
                      {cancelledSorted.map((res) => (
                        <ReservationCard key={res.id} res={res} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

        </aside>

        <section id="menu" className="flex-1 p-4 sm:p-8 scroll-mt-24">
          <div className="flex items-center gap-2 mb-4">
            <img src="/Menu.png" alt="Menu Logo" className="w-24 sm:w-32 h-auto" />
            <h2 className="text-2xl sm:text-3xl font-bold m-0">Today's Menu</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex items-center gap-4 shadow-md hover:shadow-lg transition ${
                  item.stock > 0 
                    ? 'hover:border-orange-400 cursor-pointer' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (item.stock > 0) {
                    handleReservationChange("item", item.id.toString());
                  }
                }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 rounded-xl shrink-0"></div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-bold">{item.name}</span>
                  <span className="text-base font-bold text-orange-600">₱{item.price || 0}</span>
                  <span className={`text-sm font-medium ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.stock > 0 ? 'On Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer showLinks={false} />
    </div>
  );
};

export default CustomerDashboard;
