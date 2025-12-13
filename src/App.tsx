import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import { MainDashboard } from './pages/MainDashboard';
import { AnganwadiDashboard } from './pages/AnganwadiDashboard';
import { ChildAnnualDashboard } from './pages/ChildAnnualDashboard';
import { ChildEducationDashboard } from './pages/ChildEducationDashboard';
import { SchoolDashboard } from './pages/SchoolDashboard';
import { AdvancedAnalytics } from './pages/AdvancedAnalytics';
import { InsightsAndTrends } from './pages/InsightsAndTrends';
import { LoginPage } from './pages/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { Menu, Moon, Sun, LogOut, User } from 'lucide-react';
import { useState, useEffect } from 'react';

function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : false;
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b-4 border-yellow-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-gray-800">
              <Link to="/" className="flex items-center text-gray-800 hover:text-yellow-600 transition" aria-label="CRY - Home">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/a/a1/Child_Rights_and_You_%28CRY%29_Organization_logo.png"
                  alt="CRY logo"
                  className="h-16 w-auto drop-shadow-lg mr-3"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </Link>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className={`px-4 py-2 rounded-md transition ${location.pathname === '/' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Dashboard
              </Link>
              <Link to="/insights" className={`px-4 py-2 rounded-md transition ${location.pathname === '/insights' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Key Insights
              </Link>
              <Link to="/anganwadi" className={`px-4 py-2 rounded-md transition ${location.pathname === '/anganwadi' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Anganwadi
              </Link>
              <Link to="/child-annual" className={`px-4 py-2 rounded-md transition ${location.pathname === '/child-annual' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Child Report
              </Link>
              <Link to="/child-education" className={`px-4 py-2 rounded-md transition ${location.pathname === '/child-education' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Education
              </Link>
              <Link to="/school" className={`px-4 py-2 rounded-md transition ${location.pathname === '/school' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Schools
              </Link>
              <Link to="/advanced" className={`px-4 py-2 rounded-md transition ${location.pathname === '/advanced' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'}`}>
                Overall Analytics
              </Link>
              <div className="ml-2 pl-4 border-l border-gray-300 flex items-center">
                <div className="flex items-center nav-action-spacer">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md text-gray-700 hover:bg-yellow-100 transition"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                </div>
                <div className="flex items-center nav-action-spacer">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm">
                    <User size={16} className="text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{user?.username}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 rounded-md transition"
                    title="Logout"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium ml-2">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              title="Toggle menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link
                to="/"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/insights"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/insights' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Key Insights
              </Link>
              <Link
                to="/anganwadi"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/anganwadi' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Anganwadi
              </Link>
              <Link
                to="/child-annual"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/child-annual' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Annual Report
              </Link>
              <Link
                to="/child-education"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/child-education' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Education
              </Link>
              <Link
                to="/school"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/school' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Schools
              </Link>
              <Link
                to="/advanced"
                className={`block px-4 py-2 rounded transition ${location.pathname === '/advanced' ? 'text-yellow-600 font-semibold bg-yellow-50' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-600'}`}
                onClick={() => setMenuOpen(false)}
              >
                Advanced
              </Link>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded mb-2">
                  <User size={16} className="mr-2 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{user?.username}</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center px-4 py-2 text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 rounded transition w-full"
                >
                  {darkMode ? (
                    <><Sun size={20} className="mr-2" />Light Mode</>
                  ) : (
                    <><Moon size={20} className="mr-2" />Dark Mode</>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition w-full mt-2"
                >
                  <LogOut size={20} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Routes */}
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><InsightsAndTrends /></ProtectedRoute>} />
          <Route path="/anganwadi" element={<ProtectedRoute><AnganwadiDashboard /></ProtectedRoute>} />
          <Route path="/child-annual" element={<ProtectedRoute><ChildAnnualDashboard /></ProtectedRoute>} />
          <Route path="/child-education" element={<ProtectedRoute><ChildEducationDashboard /></ProtectedRoute>} />
          <Route path="/school" element={<ProtectedRoute><SchoolDashboard /></ProtectedRoute>} />
          <Route path="/advanced" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
}

export default App;
