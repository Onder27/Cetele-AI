// src/components/NavigationBar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function NavigationBar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
    window.location.reload();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Çetele</div>
      <div style={styles.menu}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/products" style={styles.link}>Ürünler</Link>  {/* <<< EKLENDİ */}
        <Link to="/raporlar" style={styles.link}>Raporlar</Link>
        <button onClick={handleLogout} style={styles.logoutBtn}>Çıkış</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    borderBottom: "1px solid #ddd",
    background: "#fff",
  },
  logo: { fontWeight: 700, fontSize: 20 },
  menu: { display: "flex", gap: 16, alignItems: "center" },
  link: { textDecoration: "none", color: "#111", fontWeight: 600 },
  logoutBtn: {
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },
};
