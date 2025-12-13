// src/pages/Dashboard.jsx - DEBUG EKLİ
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './Dashboard.css';

const Dashboard = () => {
  const { stats, addQuickTransaction, suppliers, customers, products } = useApp();
  const [quickInput, setQuickInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    console.log('=== İŞLEM BAŞLIYOR ===');
    console.log('Girilen metin:', quickInput);
    
    const transaction = addQuickTransaction(quickInput);
    
    console.log('Oluşan işlem:', transaction);
    console.log('=== İŞLEM BİTTİ ===');
    
    // Başarı mesajı
    if (transaction.parsed) {
      let message = `✅ İşlem başarıyla kaydedildi!\n\n`;
      
      if (transaction.details.personName) {
        message += `Kişi: ${transaction.details.personName}\n`;
      }
      
      if (transaction.details.productName) {
        message += `Ürün: ${transaction.details.productName}\n`;
        message += `Miktar: ${transaction.quantity} adet\n`;
        message += `Birim Fiyat: ${transaction.unitPrice.toLocaleString('tr-TR')} ₺\n`;
      }
      
      message += `Toplam Tutar: ${transaction.totalAmount.toLocaleString('tr-TR')} ₺\n`;
      message += `İşlem Türü: ${transaction.type === 'purchase' ? '🛒 Alış' : 
                            transaction.type === 'sale' ? '💰 Satış' : 
                            transaction.type === 'payment' ? '💵 Ödeme/Tahsilat' : '📝 Not'}\n`;
      
      if (transaction.amountForBalance !== undefined) {
        message += `Bakiye Etkisi: ${transaction.amountForBalance > 0 ? '+' : ''}${transaction.amountForBalance.toLocaleString('tr-TR')} ₺`;
      }
      
      alert(message);
    } else {
      alert('📝 İşlem kaydedildi (manuel not)');
    }
    
    setQuickInput('');
    setSuggestions([]);
  };

  // Öneri oluştur
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuickInput(value);
    
    if (value.length > 2) {
      const newSuggestions = [];
      
      // Kişi önerileri
      [...suppliers, ...customers].forEach(person => {
        if (person.name.toLowerCase().includes(value.toLowerCase())) {
          const isSupplier = suppliers.find(s => s.id === person.id);
          newSuggestions.push(`${person.name} ${isSupplier ? 'tedarikçisinden alış' : 'müşterisinden tahsilat'}`);
          newSuggestions.push(`${person.name} ${isSupplier ? 'tedarikçisine ödeme' : 'müşterisine satış'}`);
        }
      });
      
      // Ürün önerileri
      products.forEach(product => {
        if (product.name.toLowerCase().includes(value.toLowerCase()) || 
            product.brand?.toLowerCase().includes(value.toLowerCase())) {
          newSuggestions.push(`${product.name} ürünü alındı`);
          newSuggestions.push(`${product.name} ürünü satıldı`);
        }
      });
      
      setSuggestions(newSuggestions.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuickInput(suggestion);
    setSuggestions([]);
  };

  // Örnek cümleler
  const examplePhrases = [
    { text: "Kaan yapıdan 10 musluk aldım", label: "Kaan yapıdan musluk alışı" },
    { text: "Ahmet Bey'e 3 lavabo sattım", label: "Ahmet Bey'e lavabo satışı" },
    { text: "Ayşe Hanım'dan 500 TL tahsilat yaptım", label: "Ayşe Hanım'dan tahsilat" },
    { text: "Demir Ticaret'e 1000 TL ödeme yaptım", label: "Demir Ticaret'e ödeme" },
    { text: "Demir Ticaret'ten 5 klozet aldım", label: "Demir Ticaret'ten klozet alışı" },
    { text: "Kaan Yapı'ya 500 TL ödedim", label: "Kaan Yapı'ya ödeme" }
  ];

  return (
    <div className="dashboard">
      <h1>📊 Dashboard</h1>
      <p>Hoş geldiniz! İş takip sisteminiz hazırlanıyor...</p>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Toplam Borç</h3>
          <div className="value">{stats.totalDebt.toLocaleString('tr-TR')} ₺</div>
          <small>{stats.totalSuppliers} tedarikçi</small>
        </div>
        <div className="stat-card">
          <h3>Toplam Alacak</h3>
          <div className="value">{stats.totalCredit.toLocaleString('tr-TR')} ₺</div>
          <small>{stats.totalCustomers} müşteri</small>
        </div>
        <div className="stat-card">
          <h3>Stoktaki Ürünler</h3>
          <div className="value">{stats.totalStock} adet</div>
          <small>Değer: {stats.totalStockValue.toLocaleString('tr-TR')} ₺</small>
        </div>
        <div className="stat-card">
          <h3>Toplam Cari</h3>
          <div className="value">{stats.totalAccounts} kişi</div>
          <small>Aktif: {stats.activeAccounts} kişi</small>
        </div>
      </div>
      
      <div className="storage-info">
        <small>
          📊 Veriler tarayıcında kayıtlı. 
          {stats.totalStockValue > 0 && ` Stok değeri: ${stats.totalStockValue.toLocaleString('tr-TR')} ₺`}
        </small>
      </div>
      
      <form onSubmit={handleQuickSubmit} className="quick-transaction">
        <h3>🚀 Akıllı İşlem Girişi</h3>
        <p className="input-hint">
          Doğal dilde yazın: "Kaan yapıdan 10 musluk aldım" veya "Ayşe Hanım'dan 500 TL tahsilat yaptım"
        </p>
        
        <div className="input-with-suggestions">
          <input 
            type="text" 
            placeholder="Örnek: Kaan yapıdan 10 musluk aldım"
            value={quickInput}
            onChange={handleInputChange}
          />
          
          {suggestions.length > 0 && (
            <div className="suggestions-box">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="quick-examples">
          <small>Örnekler (tıklayarak deneyin):</small>
          <div className="example-chips">
            {examplePhrases.map((example, index) => (
              <span 
                key={index}
                className="chip" 
                onClick={() => setQuickInput(example.text)}
                title={example.text}
              >
                {example.label}
              </span>
            ))}
          </div>
        </div>
        
        <button type="submit" className="btn-smart">
          🤖 Akıllı Kaydet
        </button>
        
        <div className="quick-tips">
          <small>💡 Konsolda (F12) işlem detaylarını görebilirsiniz</small>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;