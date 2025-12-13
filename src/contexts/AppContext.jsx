// src/contexts/AppContext.jsx - GÜNCELLENMİŞ VERSİYON
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// SmartParser sınıfı - DEĞİŞİKLİK: findPerson tamamen güncellendi
class SmartParser {
  constructor(products = [], suppliers = [], customers = []) {
    this.products = products;
    this.suppliers = suppliers;
    this.customers = customers;
  }

  parse(text) {
    console.log('🔍 AKILLI PARSING BAŞLIYOR:', text);
    
    const lowerText = text.toLowerCase();
    const result = {
      rawText: text,
      detected: {
        transactionType: null,
        person: null,
        product: null,
        quantity: 1,
        unit: 'adet',
        unitPrice: 0,
        totalAmount: 0,
        paymentStatus: 'pending',
        date: new Date().toISOString()
      },
      validation: {
        isValid: true,
        warnings: [],
        errors: [],
        suggestions: []
      },
      missing: {
        product: false,
        supplier: false,
        customer: false,
        price: false,
        unit: false
      },
      autoComplete: {
        product: null,
        supplier: null,
        customer: null,
        price: null
      }
    };

    // 1. İŞLEM TÜRÜNÜ BELİRLE
    result.detected.transactionType = this.detectTransactionType(lowerText);
    
    // 2. KİŞİYİ BUL - YENİ: TAM EŞLEŞME ŞART!
    const personResult = this.findPerson(text); // lowerText yerine orijinal text
    result.detected.person = personResult.person;
    
    if (personResult.type) {
      result.missing[personResult.type] = !personResult.found;
    }
    
    if (!personResult.found && personResult.guessedName) {
      // UYARI: Kişi bulunamadı, kullanıcıya sorulacak
      result.validation.warnings.push(
        `${personResult.guessedName} ${personResult.type === 'supplier' ? 'tedarikçisi' : 'müşterisi'} bulunamadı.`
      );
      result.autoComplete[personResult.type] = {
        name: personResult.guessedName,
        type: personResult.type,
        suggestedData: this.suggestPersonData(personResult.guessedName, personResult.type)
      };
    }

    // 3. ÜRÜNÜ BUL
    const productResult = this.findProduct(lowerText);
    result.detected.product = productResult.product;
    result.detected.unit = productResult.unit;
    result.missing.product = !productResult.found;
    
    if (!productResult.found && productResult.guessedName) {
      result.validation.warnings.push(
        `"${productResult.guessedName}" ürünü bulunamadı.`
      );
      result.autoComplete.product = {
        name: productResult.guessedName,
        unit: productResult.unit,
        suggestedCategory: this.suggestProductCategory(productResult.guessedName)
      };
    }

    // 4. MİKTAR VE FİYAT BUL
    const numbers = this.extractNumbers(text);
    if (numbers.length >= 1) {
      result.detected.quantity = numbers[0];
      
      if (numbers.length >= 2) {
        if (lowerText.includes('tanesi') || lowerText.includes('birisi') || lowerText.includes('metresi')) {
          result.detected.unitPrice = numbers[1];
          result.detected.totalAmount = result.detected.quantity * result.detected.unitPrice;
        } else {
          result.detected.totalAmount = numbers[1];
          result.detected.unitPrice = result.detected.quantity > 0 ? result.detected.totalAmount / result.detected.quantity : 0;
        }
      }
    }

    // 5. BİRİM BELİRLE
    result.detected.unit = this.detectUnit(lowerText) || productResult.unit || 'adet';
    
    // 6. ÖDEME DURUMU
    result.detected.paymentStatus = this.detectPaymentStatus(lowerText);

    // 7. VALİDASYON
    this.runValidations(result);

    console.log('✅ PARSING SONUCU:', result);
    return result;
  }

  detectTransactionType(text) {
    if (text.includes('tahsilat') || text.includes('ödedim') || text.includes('ödendi') || text.includes('ödeme')) {
      return 'payment';
    }
    if (text.includes('sattım') || text.includes('satıldı') || text.includes('satış')) {
      return 'sale';
    }
    if (text.includes('aldım') || text.includes('alındı') || text.includes('alış')) {
      return 'purchase';
    }
    return 'note';
  }

  // YENİ: findPerson fonksiyonu - KESİN EŞLEŞME!
  findPerson(text) {
    const lowerText = text.toLowerCase();
    console.log('🔍 Kişi aranıyor (TAM EŞLEŞME):', text);
    
    // ÖNCE: Tam eşleşme ara (kesinlikle doğru olan)
    for (const supplier of this.suppliers) {
      const cleanSupplierName = supplier.name.toLowerCase().replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, '');
      const cleanText = lowerText.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, ' ');
      
      // Tam isim geçiyor mu?
      if (cleanText.includes(cleanSupplierName)) {
        console.log('✅ Tedarikçi TAM EŞLEŞME:', supplier.name);
        return { found: true, person: supplier, type: 'supplier' };
      }
    }
    
    for (const customer of this.customers) {
      const cleanCustomerName = customer.name.toLowerCase().replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, '');
      const cleanText = lowerText.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, ' ');
      
      if (cleanText.includes(cleanCustomerName)) {
        console.log('✅ Müşteri TAM EŞLEŞME:', customer.name);
        return { found: true, person: customer, type: 'customer' };
      }
    }
    
    // EĞER BULUNAMADIYSA, sadece ilk kelimeye bak (tahmin için)
    const words = text.split(' ').map(w => w.replace(/[^\wğüşıöçĞÜŞİÖÇ]/g, '')).filter(w => w.length > 2);
    
    if (words.length > 0) {
      const firstName = words[0];
      console.log('❌ Tam eşleşme yok, tahmin:', firstName);
      
      // İşlem türüne göre tahmin
      if (lowerText.includes('aldım') || lowerText.includes('tedarik')) {
        return { 
          found: false, 
          guessedName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          type: 'supplier' 
        };
      } else if (lowerText.includes('sattım') || lowerText.includes('tahsilat') || lowerText.includes('ödeme aldım')) {
        return { 
          found: false, 
          guessedName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
          type: 'customer' 
        };
      }
    }
    
    console.log('❌ Kişi bulunamadı');
    return { found: false, guessedName: null, type: null };
  }

  findProduct(text) {
    for (const product of this.products) {
      if (text.includes(product.name.toLowerCase())) {
        return { 
          found: true, 
          product: product,
          unit: product.unit || 'adet'
        };
      }
    }
    
    const productKeywords = [
      'musluk', 'lavabo', 'klozet', 'batarya', 'vana', 'hortum', 
      'priz', 'duş', 'vitrifiye', 'boru', 'vida', 'somun',
      'kepenk', 'kapı', 'pencere', 'fayans', 'seramik'
    ];
    
    for (const keyword of productKeywords) {
      if (text.includes(keyword)) {
        return { 
          found: false, 
          guessedName: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          unit: this.guessUnit(text) || 'adet'
        };
      }
    }
    
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-zğüşıöç]/g, '');
      if (word.length > 2 && !this.isCommonWord(word) && 
          !['aldım', 'sattım', 'tahsilat', 'ödeme'].includes(word)) {
        
        let unit = 'adet';
        if (i + 1 < words.length) {
          const nextWord = words[i + 1].toLowerCase();
          if (['metre', 'litre', 'kg', 'adet', 'paket', 'kutu'].includes(nextWord)) {
            unit = nextWord;
          }
        }
        
        return { 
          found: false, 
          guessedName: word.charAt(0).toUpperCase() + word.slice(1),
          unit: unit
        };
      }
    }
    
    return { found: false, guessedName: null, unit: 'adet' };
  }

  extractNumbers(text) {
    const matches = text.match(/\d+/g);
    return matches ? matches.map(Number) : [];
  }

  detectUnit(text) {
    const units = {
      'metre': ['metre', 'mt', 'm '],
      'litre': ['litre', 'lt', 'l '],
      'kg': ['kg', 'kilo', 'kilogram'],
      'adet': ['adet', 'tane', 'ad.', 'ad '],
      'paket': ['paket', 'pkt'],
      'kutu': ['kutu', 'kutu']
    };
    
    for (const [unit, keywords] of Object.entries(units)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return unit;
        }
      }
    }
    
    return null;
  }

  detectPaymentStatus(text) {
    if (text.includes('ödendi') || text.includes('tahsil edildi') || text.includes('peşin')) {
      return 'paid';
    }
    if (text.includes('ödenmedi') || text.includes('veresiye') || text.includes('kredi')) {
      return 'pending';
    }
    return 'pending';
  }

  suggestPersonData(name, type) {
    return {
      name: name,
      type: type,
      phone: '',
      address: '',
      taxNumber: type === 'supplier' ? '' : '',
      email: ''
    };
  }

  suggestProductCategory(productName) {
    const categories = {
      'musluk': 'musluk',
      'lavabo': 'lavabo', 
      'klozet': 'klozet',
      'hortum': 'hortum',
      'boru': 'boru',
      'vana': 'vana',
      'priz': 'elektrik',
      'vida': 'bağlantı elemanları',
      'fayans': 'yapı malzemesi',
      'seramik': 'yapı malzemesi'
    };
    
    for (const [keyword, category] of Object.entries(categories)) {
      if (productName.toLowerCase().includes(keyword)) {
        return category;
      }
    }
    
    return 'diğer';
  }

  guessUnit(text) {
    if (text.includes('metre') || text.includes('mt')) return 'metre';
    if (text.includes('litre') || text.includes('lt')) return 'litre';
    if (text.includes('kg') || text.includes('kilo')) return 'kg';
    if (text.includes('paket') || text.includes('pkt')) return 'paket';
    if (text.includes('kutu')) return 'kutu';
    return 'adet';
  }

  isCommonWord(word) {
    const commonWords = [
      'ben', 'sen', 'o', 'biz', 'siz', 'onlar',
      'ile', 've', 'veya', 'ama', 'fakat',
      'bugün', 'dün', 'yarın', 'şimdi',
      'para', 'tl', 'lira', 'dolar', 'euro'
    ];
    return commonWords.includes(word);
  }

  runValidations(result) {
    if (!result.detected.person && result.detected.transactionType !== 'note') {
      result.validation.errors.push('İşlem için bir kişi (tedarikçi/müşteri) belirtilmelidir.');
      result.validation.isValid = false;
    }
    
    if (!result.detected.product && result.detected.transactionType === 'purchase') {
      result.validation.warnings.push('Alış işlemi için ürün belirtilmedi.');
    }
    
    if (result.detected.totalAmount === 0 && result.detected.transactionType !== 'note') {
      result.validation.warnings.push('İşlem tutarı belirtilmedi veya 0 TL.');
      result.missing.price = true;
    }
    
    if (result.missing.product && result.autoComplete.product) {
      result.validation.suggestions.push(
        `"${result.autoComplete.product.name}" için yeni ürün kartı oluşturun.`
      );
    }
    
    if (result.missing.supplier && result.autoComplete.supplier) {
      result.validation.suggestions.push(
        `"${result.autoComplete.supplier.name}" için yeni tedarikçi kartı oluşturun.`
      );
    }
    
    if (result.missing.customer && result.autoComplete.customer) {
      result.validation.suggestions.push(
        `"${result.autoComplete.customer.name}" için yeni müşteri kartı oluşturun.`
      );
    }
  }
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // LocalStorage'dan verileri yükle veya varsayılan verileri kullan
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`cetele_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
      return defaultValue;
    }
  };

  // Başlangıç verileri
  const initialSuppliers = [
    { id: 1, name: 'Kaan Yapı', type: 'supplier', balance: -1000, phone: '0555 123 4567' },
    { id: 2, name: 'Demir Ticaret', type: 'supplier', balance: -2500, phone: '0555 987 6543' }
  ];

  const initialCustomers = [
    { id: 101, name: 'Ahmet Yılmaz', type: 'customer', balance: 1500, phone: '0532 111 2233' },
    { id: 102, name: 'Ayşe Demir', type: 'customer', balance: 500, phone: '0533 444 5566' }
  ];

  const initialProducts = [
    { 
      id: 1001, 
      name: 'Musluk', 
      brand: 'Güven', 
      stock: 10, 
      purchasePrice: 100, 
      salePrice: 150, 
      category: 'musluk',
      unit: 'adet'
    },
    { 
      id: 1002, 
      name: 'Lavabo', 
      brand: 'Vitra', 
      stock: 5, 
      purchasePrice: 300, 
      salePrice: 450, 
      category: 'lavabo',
      unit: 'adet'
    },
    { 
      id: 1003, 
      name: 'Klozet', 
      brand: 'Egos', 
      stock: 8, 
      purchasePrice: 400, 
      salePrice: 600, 
      category: 'klozet',
      unit: 'adet'
    }
  ];

  // State'leri LocalStorage'dan yükle
  const [suppliers, setSuppliers] = useState(() => loadFromStorage('suppliers', initialSuppliers));
  const [customers, setCustomers] = useState(() => loadFromStorage('customers', initialCustomers));
  const [products, setProducts] = useState(() => loadFromStorage('products', initialProducts));
  const [transactions, setTransactions] = useState(() => loadFromStorage('transactions', []));

  // Her değişiklikte LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('cetele_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('cetele_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('cetele_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('cetele_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // İstatistikleri hesapla
  const stats = {
    totalDebt: suppliers.reduce((sum, s) => sum + Math.abs(Math.min(s.balance, 0)), 0),
    totalCredit: customers.reduce((sum, c) => sum + Math.max(c.balance, 0), 0),
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalStockValue: products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0),
    totalAccounts: suppliers.length + customers.length,
    activeAccounts: [...suppliers, ...customers].filter(a => a.balance !== 0).length,
    totalSuppliers: suppliers.length,
    totalCustomers: customers.length,
    totalProducts: products.length,
  };

  // ==================== ANA FONKSİYONLAR ====================

  // 1. CARİ BAKİYE GÜNCELLE - YENİ: DOĞRU HESAPLAMA
  const updatePersonBalance = (personId, amount, type = 'purchase') => {
    console.log('🔄 BAKİYE GÜNCELLENİYOR:', { personId, amount, type });
    
    let personArray, setPersonArray;
    let personType = '';
    
    // Kişiyi bul
    const supplier = suppliers.find(s => s.id === personId);
    const customer = customers.find(c => c.id === personId);
    
    if (supplier) {
      personArray = suppliers;
      setPersonArray = setSuppliers;
      personType = 'supplier';
    } else if (customer) {
      personArray = customers;
      setPersonArray = setCustomers;
      personType = 'customer';
    } else {
      console.error('❌ Kişi bulunamadı:', personId);
      return false;
    }
    
    // Bakiyeyi hesapla
    const person = personArray.find(p => p.id === personId);
    let newBalance = person.balance;
    
    console.log(`Güncellenecek kişi: ${person.name}, Mevcut bakiye: ${person.balance} TL`);
    
    // YENİ: Doğru hesaplama mantığı
    if (type === 'payment') {
      // Tahsilat/Ödeme: Müşteriden tahsilat -> borç azalır (-500 TL)
      // Tedarikçiye ödeme -> borç azalır (+1000 TL)
      newBalance = person.balance + amount;
      console.log(`Ödeme/Tahsilat: ${amount} TL eklendi. Yeni bakiye: ${newBalance} TL`);
    } else if (type === 'purchase') {
      // Alış: Tedarikçiye borçlanma (negatif artar)
      newBalance = person.balance - Math.abs(amount);
      console.log(`Alış: ${amount} TL borç eklendi. Yeni bakiye: ${newBalance} TL`);
    } else if (type === 'sale') {
      // Satış: Müşteriden alacak (pozitif artar)
      newBalance = person.balance + Math.abs(amount);
      console.log(`Satış: ${amount} TL alacak eklendi. Yeni bakiye: ${newBalance} TL`);
    }
    
    // State'i güncelle
    setPersonArray(prev => prev.map(p => 
      p.id === personId ? { ...p, balance: newBalance } : p
    ));
    
    console.log(`✅ ${person.name} bakiye güncellendi: ${person.balance} -> ${newBalance} TL`);
    return true;
  };

  // 2. SMART PARSER İLE İŞLEM İŞLEME - YENİ: KULLANICI ONAYI
  const processNaturalLanguage = (text) => {
    console.log('=== SMART PARSER İLE İŞLEME ===', text);
    
    // SmartParser örneği oluştur
    const parser = new SmartParser(products, suppliers, customers);
    const parsedResult = parser.parse(text);
    
    console.log('PARSED RESULT:', parsedResult);
    
    // Eğer validasyon hataları varsa, kullanıcıya göster
    if (parsedResult.validation.errors.length > 0) {
      alert(`❌ İşlemde hatalar var:\n\n${parsedResult.validation.errors.join('\n')}`);
      return { parsed: false, text, errors: parsedResult.validation.errors };
    }
    
    // YENİ: Eksik kişi varsa KESİNLİKLE SOR!
    if (parsedResult.missing.supplier && parsedResult.autoComplete.supplier) {
      const userConfirmed = window.confirm(
        `"${parsedResult.autoComplete.supplier.name}" isimli tedarikçi bulunamadı.\n\n` +
        `Yeni tedarikçi olarak eklemek ister misiniz?\n\n` +
        `Evet: Yeni tedarikçi oluştur ve işlemi kaydet\n` +
        `Hayır: İşlemi iptal et`
      );
      
      if (!userConfirmed) {
        alert('İşlem iptal edildi.');
        return { parsed: false, text, errors: ['İşlem iptal edildi: Tedarikçi bulunamadı'] };
      }
    }
    
    if (parsedResult.missing.customer && parsedResult.autoComplete.customer) {
      const userConfirmed = window.confirm(
        `"${parsedResult.autoComplete.customer.name}" isimli müşteri bulunamadı.\n\n` +
        `Yeni müşteri olarak eklemek ister misiniz?\n\n` +
        `Evet: Yeni müşteri oluştur ve işlemi kaydet\n` +
        `Hayır: İşlemi iptal et`
      );
      
      if (!userConfirmed) {
        alert('İşlem iptal edildi.');
        return { parsed: false, text, errors: ['İşlem iptal edildi: Müşteri bulunamadı'] };
      }
    }
    
    // İşlemi oluştur
    const { detected } = parsedResult;
    
    // Kişi ID'sini bul
    let personId = null;
    if (detected.person && detected.person.id) {
      personId = detected.person.id;
    } else if (parsedResult.autoComplete.supplier || parsedResult.autoComplete.customer) {
      // Yeni kişi oluştur
      const personData = parsedResult.autoComplete.supplier || parsedResult.autoComplete.customer;
      const isSupplier = personData.type === 'supplier';
      
      if (isSupplier) {
        const newSupplier = addSupplier(personData.suggestedData);
        personId = newSupplier.id;
      } else {
        const newCustomer = addCustomer(personData.suggestedData);
        personId = newCustomer.id;
      }
    }
    
    // Ürün ID'sini bul
    let productId = null;
    if (detected.product && detected.product.id) {
      productId = detected.product.id;
    } else if (parsedResult.autoComplete.product) {
      // Yeni ürün oluştur
      const productData = parsedResult.autoComplete.product;
      const userConfirmed = window.confirm(
        `"${productData.name}" ürünü için yeni ürün kartı oluşturulsun mu?\n\n` +
        `Birim: ${productData.unit}\n` +
        `Kategori: ${productData.suggestedCategory}\n\n` +
        `Fiyat: ${detected.unitPrice > 0 ? detected.unitPrice + ' TL' : 'Belirtilmedi'}`
      );
      
      if (userConfirmed) {
        const newProduct = {
          name: productData.name,
          unit: productData.unit,
          purchasePrice: detected.unitPrice > 0 ? detected.unitPrice : 100,
          salePrice: detected.unitPrice > 0 ? Math.round(detected.unitPrice * 1.5) : 150,
          stock: 0,
          category: productData.suggestedCategory,
          brand: 'Diğer'
        };
        
        const addedProduct = addProduct(newProduct);
        productId = addedProduct.id;
      }
    }
    
    // amountForBalance hesapla - YENİ: Doğru hesap
    let amountForBalance = 0;
    if (detected.transactionType === 'payment') {
      // Tahsilat/Ödeme: Miktar işareti önemli
      amountForBalance = detected.totalAmount;
    } else if (detected.transactionType === 'purchase') {
      // Alış: Negatif (borç artar)
      amountForBalance = -detected.totalAmount;
    } else if (detected.transactionType === 'sale') {
      // Satış: Pozitif (alacak artar)
      amountForBalance = detected.totalAmount;
    }
    
    // İşlemi oluştur
    const transaction = {
      id: Date.now(),
      text,
      date: new Date().toISOString(),
      type: detected.transactionType,
      personId,
      productId,
      quantity: detected.quantity,
      unitPrice: detected.unitPrice,
      totalAmount: detected.totalAmount,
      amountForBalance,
      parsed: true,
      details: {
        personName: detected.person ? detected.person.name : 
                  (parsedResult.autoComplete.supplier ? parsedResult.autoComplete.supplier.name :
                  parsedResult.autoComplete.customer ? parsedResult.autoComplete.customer.name : null),
        productName: detected.product ? detected.product.name : 
                    (parsedResult.autoComplete.product ? parsedResult.autoComplete.product.name : null),
        unit: detected.unit,
        warnings: parsedResult.validation.warnings,
        suggestions: parsedResult.validation.suggestions
      }
    };
    
    console.log('OLUŞTURULAN İŞLEM:', transaction);
    
    // İşlemi uygula
    applyTransaction(transaction);
    
    return transaction;
  };

  // 3. İŞLEM UYGULA
  const applyTransaction = (transaction) => {
    const { type, personId, productId, quantity, totalAmount, amountForBalance } = transaction;
    
    console.log('İŞLEM UYGULANIYOR:', transaction);
    
    // 1. İşlemi kaydet
    const updatedTransactions = [transaction, ...transactions];
    setTransactions(updatedTransactions);
    
    // 2. Stok güncelle (alış/satış ise)
    if (productId && (type === 'purchase' || type === 'sale')) {
      const quantityChange = type === 'purchase' ? quantity : -quantity;
      updateProductStock(productId, quantityChange);
      console.log(`Stok güncellendi: ${productId} -> ${quantityChange}`);
    }
    
    // 3. Cari bakiyeyi güncelle (kişi varsa)
    if (personId && totalAmount > 0 && type !== 'note') {
      updatePersonBalance(personId, amountForBalance, type);
    }
    
    return transaction;
  };

  // 4. HIZLI İŞLEM
  const addQuickTransaction = (text) => {
    return processNaturalLanguage(text);
  };

  // 5. MANUEL İŞLEM
  const addManualTransaction = (transactionData) => {
    const transaction = {
      id: Date.now(),
      ...transactionData,
      date: new Date().toISOString(),
      parsed: false,
    };
    
    return applyTransaction(transaction);
  };

  // 6. Stok işlemleri
  const addProduct = (product) => {
    const newProduct = {
      ...product,
      id: Date.now()
    };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProductStock = (productId, quantityChange) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: Math.max(0, product.stock + quantityChange) }
        : product
    ));
  };

  // 7. Cari işlemleri
  const addSupplier = (supplier) => {
    const newSupplier = {
      ...supplier,
      id: Date.now(),
      type: 'supplier',
      balance: 0
    };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const addCustomer = (customer) => {
    const newCustomer = {
      ...customer,
      id: Date.now(),
      type: 'customer',
      balance: 0
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  // 8. Verileri sıfırla
  const resetData = () => {
    if (window.confirm('Tüm verileri sıfırlamak istediğinize emin misiniz?')) {
      localStorage.clear();
      setSuppliers(initialSuppliers);
      setCustomers(initialCustomers);
      setProducts(initialProducts);
      setTransactions([]);
    }
  };

  // SmartParser'ı dışa aktar
  const createParser = () => {
    return new SmartParser(products, suppliers, customers);
  };

  // Değerler
  const value = {
    suppliers,
    customers,
    products,
    transactions,
    stats,
    addQuickTransaction,
    addManualTransaction,
    processNaturalLanguage,
    applyTransaction,
    addProduct,
    updateProductStock,
    addSupplier,
    addCustomer,
    resetData,
    updatePersonBalance,
    createParser,
    setSuppliers,
    setCustomers,
    setProducts,
    setTransactions
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};