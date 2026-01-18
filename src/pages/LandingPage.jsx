import Header from "../components/Header";

const LandingPage = ({ onOpenLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">SMART LOYALTY</div>
        <div className="text-sm text-gray-500 mt-2">
          Reserve items and earn loyalty points.
        </div>

        <button
          type="button"
          onClick={onOpenLogin}
          className="mt-6 bg-orange-700 hover:bg-orange-800 text-white font-semibold px-5 py-2 rounded-lg transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
