import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // login | signup

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert('Giriş hatası: ' + error.message);
    } else {
      alert('Giriş başarılı!');
    }
  }

  async function handleSignup() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      alert('Kayıt hatası: ' + error.message);
    } else {
      alert('Kayıt başarılı! Mailinizi kontrol edin.');
    }
  }

  return (
    <div style={{ width: '300px', margin: '40px auto' }}>
      <h2>{mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>

      <input
        type="email"
        placeholder="Email"
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Şifre"
        style={{ width: '100%', padding: 8, marginBottom: 10 }}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === 'login' ? (
        <button style={{ width: '100%', padding: 8 }} onClick={handleLogin} disabled={loading}>
          Giriş Yap
        </button>
      ) : (
        <button style={{ width: '100%', padding: 8 }} onClick={handleSignup} disabled={loading}>
          Kayıt Ol
        </button>
      )}

      <p
        style={{ color: 'blue', marginTop: 15, cursor: 'pointer' }}
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        {mode === 'login'
          ? 'Hesabın yok mu? Kayıt ol'
          : 'Zaten hesabın var mı? Giriş yap'}
      </p>
    </div>
  );
}
