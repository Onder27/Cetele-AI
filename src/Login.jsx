import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Giriş linki mailine gönderildi.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", width: 300, margin: "50px auto" }}>
      <h2>Çetele Giriş</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding: 10, marginBottom: 10 }}
      />
      <button onClick={handleLogin} style={{ padding: 10 }}>Giriş Yap</button>
    </div>
  );
}
