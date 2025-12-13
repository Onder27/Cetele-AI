// src/pages/Accounts.jsx - TAM VERSİYON
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './Accounts.css';

const Accounts = () => {
  const { suppliers, customers, addSupplier, addCustomer } = useApp();
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers' veya 'customers'
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', address: '' });
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const handleAddSupplier = (e) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) {
      alert('Tedarikçi adı gerekli!');
      return;
    }
    
    addSupplier(newSupplier);
    setNewSupplier({ name: '', phone: '', address: '' });
    alert('Tedarikçi eklendi!');
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) {
      alert('Müşteri adı gerekli!');
      return;
    }
    
    addCustomer(newCustomer);
    setNewCustomer({ name: '', phone: '', address: '' });
    alert('Müşteri eklendi!');
  };

  // Toplam borç/alacak
  const totalDebt = suppliers.reduce((sum, s) => sum + Math.abs(Math.min(s.balance, 0)), 0);
  const totalCredit = customers.reduce((sum, c) => sum + Math.max(c.balance, 0), 0);

  return (
    <div className="accounts-page">
      <h1>👥 Cari Hesaplar</h1>
      
      {/* Özet Kartlar */}
      <div className="accounts-summary">
        <div className="summary-card debt">
          <h3>Toplam Borç</h3>
          <div className="summary-value">{totalDebt.toLocaleString('tr-TR')} ₺</div>
          <div className="summary-count">{suppliers.length} tedarikçi</div>
        </div>
        <div className="summary-card credit">
          <h3>Toplam Alacak</h3>
          <div className="summary-value">{totalCredit.toLocaleString('tr-TR')} ₺</div>
          <div className="summary-count">{customers.length} müşteri</div>
        </div>
        <div className="summary-card total">
          <h3>Net Durum</h3>
          <div className="summary-value" style={{ color: totalCredit > totalDebt ? '#2ecc71' : '#e74c3c' }}>
            {(totalCredit - totalDebt).toLocaleString('tr-TR')} ₺
          </div>
          <div className="summary-count">
            {totalCredit > totalDebt ? 'Alacaklı' : 'Borçlu'}
          </div>
        </div>
      </div>

      {/* Tab Seçimi */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          🏭 Tedarikçiler ({suppliers.length})
        </button>
        <button 
          className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👤 Müşteriler ({customers.length})
        </button>
      </div>

      {/* Tedarikçiler */}
      {activeTab === 'suppliers' && (
        <div className="suppliers-section">
          <div className="add-form">
            <h3>➕ Yeni Tedarikçi Ekle</h3>
            <form onSubmit={handleAddSupplier}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tedarikçi Adı *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                    placeholder="Örn: Kaan Yapı, Demir Ticaret..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                    placeholder="0555 123 4567"
                  />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    placeholder="İstanbul, Ankara..."
                  />
                </div>
              </div>
              <button type="submit" className="btn-add-supplier">Tedarikçi Ekle</button>
            </form>
          </div>

          <div className="accounts-list">
            <h3>🏭 Tedarikçi Listesi ({suppliers.length})</h3>
            
            {suppliers.length === 0 ? (
              <div className="empty-state">
                <p>Henüz tedarikçi eklenmemiş.</p>
              </div>
            ) : (
              <div className="accounts-table">
                <div className="table-header">
                  <div className="col-3">Tedarikçi Adı</div>
                  <div className="col-2">Telefon</div>
                  <div className="col-3">Adres</div>
                  <div className="col-2">Bakiye</div>
                  <div className="col-2">Durum</div>
                </div>
                
                {suppliers.map(supplier => (
                  <div key={supplier.id} className="table-row">
                    <div className="col-3">
                      <strong>{supplier.name}</strong>
                    </div>
                    <div className="col-2">{supplier.phone || '-'}</div>
                    <div className="col-3">{supplier.address || '-'}</div>
                    <div className="col-2">
                      <span className={`balance ${supplier.balance < 0 ? 'negative' : 'positive'}`}>
                        {supplier.balance.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="col-2">
                      <span className={`status ${supplier.balance < 0 ? 'debt' : 'clear'}`}>
                        {supplier.balance < 0 ? 'Borçlu' : 'Temiz'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Müşteriler */}
      {activeTab === 'customers' && (
        <div className="customers-section">
          <div className="add-form">
            <h3>➕ Yeni Müşteri Ekle</h3>
            <form onSubmit={handleAddCustomer}>
              <div className="form-row">
                <div className="form-group">
                  <label>Müşteri Adı *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Örn: Ahmet Yılmaz, Ayşe Demir..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Telefon</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="0532 111 2233"
                  />
                </div>
                <div className="form-group">
                  <label>Adres</label>
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="İzmir, Bursa..."
                  />
                </div>
              </div>
              <button type="submit" className="btn-add-customer">Müşteri Ekle</button>
            </form>
          </div>

          <div className="accounts-list">
            <h3>👤 Müşteri Listesi ({customers.length})</h3>
            
            {customers.length === 0 ? (
              <div className="empty-state">
                <p>Henüz müşteri eklenmemiş.</p>
              </div>
            ) : (
              <div className="accounts-table">
                <div className="table-header">
                  <div className="col-3">Müşteri Adı</div>
                  <div className="col-2">Telefon</div>
                  <div className="col-3">Adres</div>
                  <div className="col-2">Bakiye</div>
                  <div className="col-2">Durum</div>
                </div>
                
                {customers.map(customer => (
                  <div key={customer.id} className="table-row">
                    <div className="col-3">
                      <strong>{customer.name}</strong>
                    </div>
                    <div className="col-2">{customer.phone || '-'}</div>
                    <div className="col-3">{customer.address || '-'}</div>
                    <div className="col-2">
                      <span className={`balance ${customer.balance > 0 ? 'positive' : 'negative'}`}>
                        {customer.balance.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="col-2">
                      <span className={`status ${customer.balance > 0 ? 'credit' : 'clear'}`}>
                        {customer.balance > 0 ? 'Alacaklı' : 'Temiz'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;