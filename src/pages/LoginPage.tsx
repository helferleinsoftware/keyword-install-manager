// src/pages/LoginPage.tsx
import { signInWithEmailAndPassword } from "firebase/auth";
import { FormEvent, useState } from 'react';
import { auth } from '../firebase';

function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Verhindert Neuladen der Seite
    setError(null); // Fehler zurücksetzen
    setLoading(true); // Ladezustand starten

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Erfolgreicher Login -> App.tsx wird durch onAuthStateChanged den User-State aktualisieren
      // und automatisch zur Hauptseite weiterleiten. Kein explizites Navigate hier nötig.
    } catch (err: any) { // Typ any, da Firebase-Error komplex sein kann
      console.error("Login Fehler:", err);
      // Versuche, eine benutzerfreundliche Fehlermeldung zu extrahieren
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError("Ungültige E-Mail-Adresse oder Passwort.");
      } else if (err.code === 'auth/invalid-email') {
          setError("Ungültiges E-Mail-Format.");
      }
       else {
          setError("Ein Fehler ist beim Login aufgetreten.");
      }
    } finally {
        setLoading(false); // Ladezustand beenden
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">E-Mail:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password">Passwort:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logge ein...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;