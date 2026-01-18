import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useMenu } from "../context/MenuContext";
import { useReservations } from "../context/ReservationContext";
import { useToast } from "../context/ToastContext";
import { Calendar, Clock, Package, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, updateDoc, increment } from "firebase/firestore";

const CustomerDashboard = ({ onLogout }) => {
  const toast = useToast();
  const { user: authUser, loading } = useAuth();
  console.log("AUTH USER:", authUser);
  const { menuItems } = useMenu();
  const { addReservation, cancelReservation, getCustomerReservations } =
    useReservations();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const loyaltyPoints = authUser?.points ?? 0;

  const customerName = authUser?.name || "Customer";

  const [reservation, setReservation] = useState({
    item: "",
    date: "",
    quantity: 1,
    time: "",
  });

  const myReservations = getCustomerReservations(customerName);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      slots.push(`${hour}:00`);
      if (hour < 20) slots.push(`${hour}:30`);
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

const handleReservationChange = (field, value) => {setReservation((prev) => ({...prev,[field]: value,}));};

const handleReserve = async () => {
  if (!reservation.item || !reservation.date || !reservation.time) {
    toast.error("Please fill in all fields.");
    return;
  }

  const itemName = menuItems.find(
    (item) => item.id === parseInt(reservation.item)
  )?.name;

  // add reservation locally
  addReservation({
    ...reservation,
    itemName,
    customerName,
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

  cancelReservation(res.id);
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


  const timeSlots = generateTimeSlots();
  const dates = generateDates();

  const card =
    "bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-lg transition";
  const cardPad = "p-5 sm:p-6";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pt-20">
      <Header isLoggedIn={true} onLogout={onLogout} />

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
                    {item.name}
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

            {myReservations.length === 0 ? (
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
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {myReservations.map((res) => {
                  return (
                    <div
                      key={res.id}
                      className="bg-orange-50 p-3 rounded-xl border border-orange-200"
                    >
                      <div className="flex justify-between items-start mb-2 gap-3">
                        <div className="font-bold text-base sm:text-lg">
                          {res.itemName}
                        </div>

                        <button
                          onClick={() => handleCancelReservation(res)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ✕
                        </button>
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
                            {res.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex items-center gap-4 shadow-md hover:shadow-lg hover:border-orange-400 transition cursor-pointer"
                onClick={() => handleReservationChange("item", item.id.toString())}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-400 rounded-xl shrink-0"></div>
                <span className="text-lg sm:text-xl font-bold">{item.name}</span>
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
