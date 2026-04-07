import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    reader: 'Reader',
    staff: 'Staff',
    admin: 'Admin',
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <span className="navbar-logo" onClick={() => navigate('/dashboard')} role="button" tabIndex={0}>
            BookNest
          </span>
        </div>
        <div className="navbar-right">
          <span className="navbar-user-name">{user?.name}</span>
          <span className="navbar-role-badge">{roleLabel[user?.role]}</span>
          <button onClick={handleLogout} className="btn btn-ghost" id="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
