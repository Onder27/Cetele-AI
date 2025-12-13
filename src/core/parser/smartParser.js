// src/core/parser/smartParser.js
class SmartParser {
  constructor(products = [], suppliers = [], customers = []) {
    this.products = products;
    this.suppliers = suppliers;
    this.customers = customers;
  }

  // Ana parsing fonksiyonu
  parse(text) {
    console.log('🔍 AKILLI PARSING BAŞLIYOR:', text);
    
    const lowerText = text.toLowerCase();
    const result = {
      // Temel veriler
      rawText: text,
      detected: {
        transactionType: null, // purchase, sale, payment
        person: null,
        product: null,
        quantity: 1,
        unit: 'adet',
        unitPrice: 0,
        totalAmount: 0,
        paymentStatus: 'pending', // pending, paid
        date: new Date().toISOString()
      },
      // Validasyon sonuçları
      validation: {
        isValid: true,
        warnings: [],
        errors: [],
        suggestions: []
      },
      // Eksik bilgiler
      missing: {
        product: false,
        supplier: false,
        customer: false,
        price: false,
        unit: false
      },
      // Otomatik tamamlama önerileri
      autoComplete: {
        product: null,
        supplier: null,
        customer: null,
        price: null
      }
    };

    // 1. İŞLEM TÜRÜNÜ BELİRLE
    result.detected.transactionType = this.detectTransactionType(lowerText);
    
    // 2. KİŞİYİ BUL (Tedarikçi/Müşteri)
    const personResult = this.findPerson(lowerText);
    result.detected.person = personResult.person;
    result.missing[personResult.type] = !personResult.found;
    
    if (!personResult.found && personResult.guessedName) {
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
          result.detected.unitPrice = result.detected.totalAmount / result.detected.quantity;
        }
      }
    }

    // 5. BİRİM BELİRLE
    result.detected.unit = this.detectUnit(lowerText) || productResult.unit || 'adet';
    
    // 6. ÖDEME DURUMU
    result.detected.paymentStatus = this.detectPaymentStatus(lowerText);

    // 7. VALİDASYON KONTROLLERİ
    this.runValidations(result);

    console.log('✅ PARSING SONUCU:', result);
    return result;
  }

  // Yardımcı fonksiyonlar
  detectTransactionType(text) {
    if (text.includes('tahsilat') || text.includes('ödedim') || text.includes('ödendi')) {
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

  findPerson(text) {
    // Önce tam eşleşme
    for (const supplier of this.suppliers) {
      if (text.includes(supplier.name.toLowerCase())) {
        return { found: true, person: supplier, type: 'supplier' };
      }
    }
    
    for (const customer of this.customers) {
      if (text.includes(customer.name.toLowerCase())) {
        return { found: true, person: customer, type: 'customer' };
      }
    }
    
    // Tahmin etmeye çalış (basit)
    const words = text.split(' ');
    for (const word of words) {
      if (word.length > 3 && !this.isCommonWord(word)) {
        // "Ahmet'ten", "Kaan'dan" gibi ifadeleri temizle
        const cleanWord = word.replace(/['den|dan|ten|tan|'den|'dan]$/, '');
        
        // İşlem türüne göre tahmin
        if (text.includes('aldım') || text.includes('tedarik')) {
          return { 
            found: false, 
            guessedName: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
            type: 'supplier' 
          };
        } else if (text.includes('sattım')) {
          return { 
            found: false, 
            guessedName: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
            type: 'customer' 
          };
        }
      }
    }
    
    return { found: false, guessedName: null, type: 'supplier' };
  }

  findProduct(text) {
    // 1. Mevcut ürünlerde ara
    for (const product of this.products) {
      if (text.includes(product.name.toLowerCase())) {
        return { 
          found: true, 
          product: product,
          unit: product.unit || 'adet'
        };
      }
    }
    
    // 2. Ürün tahmini yap
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
    
    // 3. İlk geçen anlamlı kelimeyi ürün olarak al
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase().replace(/[^a-zğüşıöç]/g, '');
      if (word.length > 2 && !this.isCommonWord(word) && 
          !['aldım', 'sattım', 'tahsilat', 'ödeme'].includes(word)) {
        
        // Sonraki kelime birim olabilir mi?
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
    return 'pending'; // Varsayılan
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
    // Zorunlu alan kontrolü
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
    
    // Öneriler
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

export default SmartParser;