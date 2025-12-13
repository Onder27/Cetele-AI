// src/App.js - DOĞRU VERSİYON
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Stock from './pages/Stock';
import Accounts from './pages/Accounts';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;