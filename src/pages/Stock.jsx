// src/pages/Stock.jsx - TAM VERSİYON
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import './Stock.css';

const Stock = () => {
  const { products, updateProductStock, addProduct } = useApp();
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    stock: 0,
    purchasePrice: 0,
    salePrice: 0,
    category: 'musluk'
  });

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!newProduct.name.trim()) {
      alert('Ürün adı gerekli!');
      return;
    }
    
    addProduct(newProduct);
    setNewProduct({
      name: '',
      brand: '',
      stock: 0,
      purchasePrice: 0,
      salePrice: 0,
      category: 'musluk'
    });
    alert('Ürün eklendi!');
  };

  const categories = ['musluk', 'lavabo', 'klozet', 'batarya', 'vanaf', 'diğer'];

  // Toplam stok değeri
  const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);

  return (
    <div className="stock-page">
      <h1>📦 Stok Yönetimi</h1>
      
      {/* Stok Özeti */}
      <div className="stock-summary">
        <div className="summary-card">
          <h3>Toplam Ürün Çeşidi</h3>
          <div className="summary-value">{products.length}</div>
        </div>
        <div className="summary-card">
          <h3>Toplam Stok Miktarı</h3>
          <div className="summary-value">
            {products.reduce((sum, p) => sum + p.stock, 0)} adet
          </div>
        </div>
        <div className="summary-card">
          <h3>Toplam Stok Değeri</h3>
          <div className="summary-value">{totalStockValue.toLocaleString('tr-TR')} ₺</div>
        </div>
      </div>

      {/* Yeni Ürün Ekleme Formu */}
      <div className="add-product-form">
        <h3>➕ Yeni Ürün Ekle</h3>
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <div className="form-group">
              <label>Ürün Adı *</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                placeholder="Örn: Musluk, Klozet..."
                required
              />
            </div>
            <div className="form-group">
              <label>Marka</label>
              <input
                type="text"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                placeholder="Örn: Güven, Vitra..."
              />
            </div>
            <div className="form-group">
              <label>Kategori</label>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Başlangıç Stok</label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Alış Fiyatı (₺)</label>
              <input
                type="number"
                value={newProduct.purchasePrice}
                onChange={(e) => setNewProduct({...newProduct, purchasePrice: parseInt(e.target.value) || 0})}
                min="0"
                step="10"
              />
            </div>
            <div className="form-group">
              <label>Satış Fiyatı (₺)</label>
              <input
                type="number"
                value={newProduct.salePrice}
                onChange={(e) => setNewProduct({...newProduct, salePrice: parseInt(e.target.value) || 0})}
                min="0"
                step="10"
              />
            </div>
          </div>
          
          <button type="submit" className="btn-add">Ürünü Ekle</button>
        </form>
      </div>

      {/* Ürün Listesi */}
      <div className="products-list">
        <h3>📋 Ürün Listesi ({products.length} ürün)</h3>
        
        {products.length === 0 ? (
          <div className="empty-state">
            <p>Henüz ürün eklenmemiş.</p>
          </div>
        ) : (
          <div className="products-table">
            <div className="table-header">
              <div className="col-3">Ürün Adı</div>
              <div className="col-2">Marka</div>
              <div className="col-1">Kategori</div>
              <div className="col-1">Stok</div>
              <div className="col-2">Alış Fiyatı</div>
              <div className="col-2">Satış Fiyatı</div>
              <div className="col-1">İşlem</div>
            </div>
            
            {products.map(product => (
              <div key={product.id} className="table-row">
                <div className="col-3">{product.name}</div>
                <div className="col-2">{product.brand || '-'}</div>
                <div className="col-1">
                  <span className={`category-badge ${product.category}`}>
                    {product.category}
                  </span>
                </div>
                <div className="col-1">
                  <div className="stock-controls">
                    <span className="stock-count">{product.stock}</span>
                    <div className="stock-buttons">
                      <button 
                        className="btn-stock-increase"
                        onClick={() => updateProductStock(product.id, 1)}
                        title="Stok Ekle"
                      >
                        +
                      </button>
                      <button 
                        className="btn-stock-decrease"
                        onClick={() => updateProductStock(product.id, -1)}
                        title="Stok Çıkar"
                        disabled={product.stock <= 0}
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-2">{product.purchasePrice.toLocaleString('tr-TR')} ₺</div>
                <div className="col-2">{product.salePrice.toLocaleString('tr-TR')} ₺</div>
                <div className="col-1">
                  <button 
                    className="btn-delete"
                    onClick={() => {
                      if (window.confirm(`${product.name} ürününü silmek istediğinize emin misiniz?`)) {
                        // Silme fonksiyonu Context'te yok, şimdilik alert
                        alert('Silme özelliği yakında eklenecek!');
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stock;