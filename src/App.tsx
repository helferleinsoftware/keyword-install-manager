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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No user'); // Log Erfolg
      setUser(currentUser);
      setLoading(false);
    }, (error) => { // Add error callback
        console.error("Error in onAuthStateChanged:", error); // Log Fehler
        console.log("Error in onAuthStateChanged:", error);
        setLoading(false); // Beende Ladezustand auch bei Fehler
    });
  
    return () => unsubscribe();
  }, []);

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