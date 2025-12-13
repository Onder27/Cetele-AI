import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [movementModal, setMovementModal] = useState(false);
  const [movementType, setMovementType] = useState("purchase");
  const [movement, setMovement] = useState({
    quantity: "",
    unit_price: "",
    currency: "TRY",
  });

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProducts(data || []);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  function openMovementModal(product, type) {
    setSelectedProduct(product);
    setMovementType(type);
    setMovement({ quantity: "", unit_price: "", currency: "TRY" });
    setMovementModal(true);
  }

  function closeMovementModal() {
    setMovementModal(false);
    setSelectedProduct(null);
  }

  function handleMovementInput(e) {
    setMovement({ ...movement, [e.target.name]: e.target.value });
  }

  async function saveMovement(e) {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseFloat(movement.quantity);
    const price = parseFloat(movement.unit_price);

    if (!qty || qty <= 0 || !price || price <= 0) {
      alert("Miktar ve fiyat pozitif olmalı");
      return;
    }

    // 1️⃣ Stok hareketi kaydet
    const { data: stockData, error: stockErr } = await supabase
      .from("stock_movements")
      .insert([
        {
          product_id: selectedProduct.id,
          type: movementType,
          quantity: qty,
          unit_price: price,
          currency: movement.currency,
          performed_by: (await supabase.auth.getUser()).data.user.id,
        },
      ])
      .select()
      .single();

    if (stockErr) {
      alert("Stok hareketi kaydedilemedi!");
      console.error(stockErr);
      return;
    }

    // 2️⃣ Finans hareketi (yalnızca alış/satış için)
    if (movementType === "purchase" || movementType === "sale") {
      const totalAmount = qty * price;

      const { error: financeErr } = await supabase
        .from("financial_transactions")
        .insert([
          {
            type: movementType,
            amount: totalAmount,
            currency: movement.currency,
            stock_movement_id: stockData.id,
            performed_by: stockData.performed_by,
          },
        ]);

      if (financeErr) {
        alert("Finans hareketi kaydedilemedi!");
        console.error(financeErr);
      }
    }

    closeMovementModal();
    fetchProducts();
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Ürünler</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Ad</th>
            <th>Marka</th>
            <th>Birim</th>
            <th>Stok</th>
            <th>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.brand}</td>
              <td>{p.unit}</td>
              <td>{p.stock || 0}</td>
              <td>
                <button onClick={() => openMovementModal(p, "purchase")}>
                  Alış
                </button>
                <button onClick={() => openMovementModal(p, "sale")}>
                  Satış
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {movementModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "6px",
              minWidth: "300px",
            }}
          >
            <h3>
              {movementType === "purchase" ? "Stok Girişi" : "Stok Çıkışı"}
            </h3>

            <form onSubmit={saveMovement} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <input
                name="quantity"
                type="number"
                placeholder="Miktar"
                value={movement.quantity}
                onChange={handleMovementInput}
                required
              />

              <input
                name="unit_price"
                type="number"
                step="0.01"
                placeholder="Birim Fiyat"
                value={movement.unit_price}
                onChange={handleMovementInput}
                required
              />

              <select
                name="currency"
                value={movement.currency}
                onChange={handleMovementInput}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>

              <button type="submit">Kaydet</button>
              <button type="button" onClick={closeMovementModal}>
                İptal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
