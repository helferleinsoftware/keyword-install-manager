import { onAuthStateChanged, User } from "firebase/auth"; // Importiere nötige Auth-Funktionen und Typen
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { auth } from './firebase'; // Importiere die Auth-Instanz
import CampaignTablePage from './pages/CampaignTablePage';
import LoginPage from './pages/LoginPage';

function App() {
  // State für den eingeloggten User (Firebase User Objekt oder null)
  const [user, setUser] = useState<User | null>(null);
  // State, um anzuzeigen, ob der Auth-Status noch geprüft wird
  const [loading, setLoading] = useState<boolean>(true);

  // Effekt, der auf Änderungen des Auth-Status hört
  useEffect(() => {
    // onAuthStateChanged gibt eine unsubscribe Funktion zurück
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Setze den User-State (kann null sein)
      setLoading(false); // Ladezustand beenden, wenn Status bekannt ist
    });

    // Cleanup-Funktion: Beim Unmounten der Komponente wird der Listener entfernt
    return () => unsubscribe();
  }, []); // Leeres Abhängigkeitsarray: Effekt läuft nur einmal beim Mounten

  // Zeige Ladeindikator, während der Auth-Status geprüft wird
  if (loading) {
    return <div>Authentifizierung wird geprüft...</div>;
  }

  // Routing-Logik basierend auf dem User-State
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <CampaignTablePage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;