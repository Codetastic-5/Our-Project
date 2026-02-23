import React, { useEffect, useState } from "react";
import { Menu as MenuIcon } from "lucide-react";

const Header = ({
  isLoggedIn,
  onLogout,
  role = "customer",
  onPointsClick,
  onLoginClick,
  onCreateClick,
  hideMenu = false,
}) => {
  const [activeTab, setActiveTab] = useState("menu");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // MOVED INSIDE THE COMPONENT
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    setActiveTab(id);
    setMobileMenuOpen(false);

    el.scrollIntoView({ behavior: "smooth", block: "start" });

    window.history.replaceState(null, "", `#${id}`);
  };

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "menu" || hash === "reservation") {
      setActiveTab(hash);
    }
  }, []);

  const tabClass = (id) =>
    `px-3 py-1.5 rounded-lg text-sm sm:text-base transition ${
      activeTab === id
        ? "bg-orange-600 text-white"
        : "text-gray-700 hover:bg-orange-100"
    }`;

  const mobileTabClass = (id) =>
    `block w-full text-left px-4 py-3 rounded-lg transition ${
      activeTab === id
        ? "bg-orange-600 text-white"
        : "text-gray-700 hover:bg-orange-100"
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="w-full flex items-center px-4 h-16">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="StockTastic Logo"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            StockTastic
          </h1>
        </div>

        <div className="ml-auto">
          {isLoggedIn ? (
            <>
              <nav className="hidden sm:flex items-center gap-2 sm:gap-4">
                {role === "customer" && (
                  <>
                    <button type="button" onClick={() => goTo("menu")} className={tabClass("menu")}>
                      Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo("reservation")}
                      className={tabClass("reservation")}
                    >
                      Reservation
                    </button>
                  </>
                )}
                <button
                  onClick={onLogout}
                  className="ml-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg font-semibold text-sm sm:text-base transition"
                >
                  Logout
                </button>
              </nav>

              {!hideMenu && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    type="button"
                  >
                    <MenuIcon size={24} />
                  </button>
                </div>
              )}
            </>
          ) : (
            !hideMenu && (
              <button
                className="text-gray-700 hover:text-orange-600 transition"
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* MOBILE MENU LOGGED IN */}
      {mobileMenuOpen && isLoggedIn && (
        <div className="bg-white/90 border-t border-gray-200 shadow-lg px-4 py-3 space-y-2 backdrop-blur-sm">
          {role === "customer" && (
            <>
              <button type="button" onClick={() => goTo("menu")} className={mobileTabClass("menu")}>
                Menu
              </button>
              <button type="button" onClick={() => goTo("reservation")} className={mobileTabClass("reservation")}>
                Reservation
              </button>
            </>
          )}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onLogout();
            }}
            className="block w-full text-left px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      )}

      {/* MOBILE MENU NOT LOGGED IN */}
      {mobileMenuOpen && !isLoggedIn && (
        <div className="bg-white/90 border-t border-gray-200 shadow-lg px-4 py-3 space-y-2 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false); 
              setIsAboutModalOpen(true); 
            }}
            className="block w-full text-left px-4 py-3 rounded-lg transition text-gray-700 hover:bg-orange-100"
          >
            About Us
          </button>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onCreateClick?.();
            }}
            className="block w-full text-left px-4 py-3 rounded-lg transition text-gray-700 hover:bg-orange-100"
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onLoginClick?.();
            }}
            className="block w-full text-left px-4 py-3 rounded-lg transition text-gray-700 hover:bg-orange-100"
          >
            Login
          </button>
        </div>
      )}

     {/* ABOUT US MODAL */}
{isAboutModalOpen && (
  <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: '20px' }}>
    <div style={{ 
      backgroundColor: 'white', 
      padding: '40px', 
      borderRadius: '20px', 
      maxWidth: '900px', 
      width: '95%', 
      maxHeight: '85vh', 
      overflowY: 'auto', 
      color: '#333',
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif'
    }}>
      
      <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '25px', color: '#ea580c', textAlign: 'center' }}>
        About Us
      </h2>
      
      <div style={{ lineHeight: '1.8', fontSize: '15px', textAlign: 'justify' }}>
        {/* Project Description */}
        <p style={{ marginBottom: '20px' }}>
          <strong>Stocktastic</strong> is a web-based inventory and reservation management system designed to streamline item reservations, customer engagement, and order processing. Built using <strong>React, Tailwind CSS, and Firebase</strong>, the platform delivers a fast, responsive, and user-friendly experience for both customers and staff.
        </p>

        <p style={{ marginBottom: '20px' }}>
          The system allows customers to conveniently reserve items, earn loyalty points, and manage their reservations, while cashiers and staff can efficiently manage menus, view reservations, and process orders in real time. Stocktastic aims to demonstrate how modern web technologies can be applied to improve business operations and customer satisfaction.
        </p>

        {/* Course Info */}
        <p style={{ marginBottom: '20px', backgroundColor: '#fff7ed', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #ea580c' }}>
          This website was developed as a project requirement for the <strong>Information Management course</strong>, under the guidance of <strong>Professor Marizkays P. Jamison</strong>. The project showcases practical applications of information systems, database management, and web development concepts learned throughout the course.
        </p>

        {/* Team Section */}
        <p style={{ marginBottom: '15px' }}>
          Stocktastic was created by a team of Computer Science students from <strong>National University Manila</strong>, committed to building functional, scalable, and user-centered systems:
        </p>

        <ul style={{ marginBottom: '25px', paddingLeft: '0', listStyleType: 'none', fontWeight: 'bold', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <li>• Bench Matthew C. Culubong</li>
          <li>• Jhon Roy B. Gamboa</li>
          <li>• Alecks Rejina D. Santos</li>
        </ul>

        {/* Final Vision */}
        <p style={{ fontStyle: 'italic', color: '#666', borderTop: '1px solid #eee', paddingTop: '20px', marginBottom: '25px' }}>
          Through this project, the team aims to apply academic knowledge to real-world scenarios while developing technical skills in full-stack web development, system design, and collaborative software engineering.
        </p>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => setIsAboutModalOpen(false)}
        style={{ 
          width: '100%', 
          padding: '14px', 
          backgroundColor: '#ea580c', 
          color: 'white', 
          border: 'none', 
          borderRadius: '10px', 
          cursor: 'pointer', 
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        Close Window
      </button>
    </div>
  </div>
)}
    </header>
  );
};

export default Header;
