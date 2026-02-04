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

      {mobileMenuOpen && !isLoggedIn && (
        <div className="bg-white/90 border-t border-gray-200 shadow-lg px-4 py-3 space-y-2 backdrop-blur-sm">
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
    </header>
  );
};

export default Header;
