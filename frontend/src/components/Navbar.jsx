import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-indigo-600">Split</span>Geo
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Grupos</Link>
          <Link to="/map" className="text-sm text-gray-600 hover:text-gray-900">Mapa global</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Superusuario</Link>
          )}
          {user && (
            <span className="text-sm text-gray-500">{user.name}</span>
          )}
          <button
            onClick={handleLogout}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
