import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) setError(error.message);
    else navigate("/login");
  }

  return (
    <div style={{ maxWidth: 300, margin: "40px auto" }}>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Kayıt Ol</button>
      </form>
      <p>
        Hesabın var mı? <Link to="/login">Giriş Yap</Link>
      </p>
    </div>
  );
}
