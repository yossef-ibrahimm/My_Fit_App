import React, { useState } from 'react';
import { Menu, X, User, Calculator, Database, Calendar, Dumbbell, TrendingUp } from 'lucide-react';

export default function NavBar({ currentPage, setCurrentPage }) {
  const [open, setOpen] = useState(false);

  const links = [
    { id: 'home', label: 'Dashboard', icon: User },
    { id: 'my-day', label: 'Nutrition', icon: Calendar },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'foods', label: 'Database', icon: Database },
  ];

  return (
    <div className="nav-wrap">
      <button
        className="nav-toggle"
        aria-label="Toggle navigation"
        onClick={() => setOpen(v => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav className="navbar-desktop">
        {links.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`nav-button ${currentPage === id ? 'nav-button-active' : 'nav-button-inactive'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true">
          {links.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setCurrentPage(id); setOpen(false); }}
              className={`mobile-link ${currentPage === id ? 'mobile-link-active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
