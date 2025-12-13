// src/pages/Transactions.jsx - GÜNCELLENMİŞ
import React from 'react';
import { useApp } from '../contexts/AppContext';

const Transactions = () => {
  const { transactions } = useApp();

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
      <h1>💸 İşlemler</h1>
      
      {transactions.length === 0 ? (
        <p>Henüz işlem bulunmuyor.</p>
      ) : (
        <div>
          {transactions.map(trans => (
            <div key={trans.id} style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              marginBottom: '10px'
            }}>
              <p>{trans.text}</p>
              <small>{new Date(trans.date).toLocaleDateString('tr-TR')}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Transactions;