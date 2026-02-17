import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">PrimeTrade</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main</span>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-link-icon">⊞</span>
            Dashboard
          </NavLink>

          <span className="nav-section-label" style={{ marginTop: '8px' }}>Account</span>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-link-icon">◉</span>
            Profile
          </NavLink>

          <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
            <button className="nav-link" onClick={handleLogout} style={{ color: 'var(--danger)', width: '100%' }}>
              <span className="nav-link-icon">↩</span>
              Logout
            </button>
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-card">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
