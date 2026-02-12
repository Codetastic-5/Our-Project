import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";

const ReservationContext = createContext(null);

export const useReservations = () => {
  const ctx = useContext(ReservationContext);
  if (!ctx) throw new Error("useReservations must be used within ReservationProvider");
  return ctx;
};

export const ReservationProvider = ({ children }) => {
  const { user: authUser } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(true);

  const role = String(authUser?.role || "").toLowerCase();
  const isStaff = role === "cashier" || role === "admin";

  useEffect(() => {
    if (!authUser?.uid) {
      setReservations([]);
      setLoadingReservations(false);
      return;
    }

    setLoadingReservations(true);

    const q = isStaff
      ? query(collection(db, "reservations"), orderBy("createdAt", "desc"))
      : query(
          collection(db, "reservations"),
          where("customerUid", "==", authUser.uid),
          orderBy("createdAt", "desc")
        );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReservations(list);
        setLoadingReservations(false);
      },
      (err) => {
        console.error("reservations snapshot error:", err);
        setReservations([]);
        setLoadingReservations(false);
      }
    );

    return () => unsub();
  }, [authUser?.uid, isStaff]);

  const addReservation = async (reservation) => {
    if (!authUser?.uid) throw new Error("Not logged in");

    const payload = {
      ...reservation,
      customerUid: authUser.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, "reservations"), payload);
    return ref.id;
  };

  const cancelReservation = async (id) => {
    await updateDoc(doc(db, "reservations", id), { status: "cancelled" });
  };

  const completeReservation = async (id) => {
    await updateDoc(doc(db, "reservations", id), { status: "completed" });
  };

  const setReservationStatus = async (id, status) => {
    if (!id) throw new Error("Missing reservation id");
    if (!status) throw new Error("Missing status");
    await updateDoc(doc(db, "reservations", id), { status });
  };

  const value = useMemo(
    () => ({
      reservations,
      loadingReservations,
      addReservation,
      cancelReservation,
      completeReservation,
      setReservationStatus,
    }),
    [reservations, loadingReservations]
  );

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>;
};

export default ReservationContext;
