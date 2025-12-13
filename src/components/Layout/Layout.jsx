// src/components/Layout/Layout.jsx - BASİT VERSİYON
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: '📊 Dashboard' },
    { path: '/transactions', label: '💸 İşlemler' },
    { path: '/stock', label: '📦 Stok' },
    { path: '/accounts', label: '👥 Cariler' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '20px'
      }}>
        <h2 style={{ marginBottom: '30px' }}>📒 Çetele</h2>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '12px',
                color: location.pathname === item.path ? 'white' : '#bdc3c7',
                backgroundColor: location.pathname === item.path ? '#3498db' : 'transparent',
                textDecoration: 'none',
                borderRadius: '5px'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        <header style={{
          backgroundColor: 'white',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h1>İş Asistanım</h1>
          <p>{new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </header>
        
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;