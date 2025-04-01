import { Navigate, Route, Routes } from 'react-router-dom';
import CampaignTablePage from './pages/CampaignTablePage';
import LoginPage from './pages/LoginPage';
// import { auth } from './firebase'; // Wird später für Auth-Status benötigt
// import { onAuthStateChanged } from "firebase/auth"; // Wird später benötigt

function App() {
  // const [user, setUser] = useState(null); // Zustand für eingeloggten User kommt später
  // const [loading, setLoading] = useState(true); // Ladezustand kommt später

  // Effekt zum Prüfen des Auth-Status kommt später
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  //     setUser(currentUser);
  //     setLoading(false);
  //   });
  //   return () => unsubscribe(); // Cleanup on unmount
  // }, []);

  // if (loading) {
  //   return <div>Laden...</div>; // Ladeanzeige kommt später
  // }

  // Platzhalter-Logik: Wir gehen erstmal davon aus, dass man eingeloggt ist
  // Später wird dies durch die user-Variable gesteuert
  const isLoggedIn = true; // TODO: Später durch echten Auth-Status ersetzen

  return (
    <Routes>
      <Route path="/login" element={!isLoggedIn ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/" element={isLoggedIn ? <CampaignTablePage /> : <Navigate to="/login" />} />
      {/* Catch-all oder 404-Seite könnte hier hinzugefügt werden */}
      <Route path="*" element={<Navigate to={isLoggedIn ? "/" : "/login"} />} />
    </Routes>
  );
}

export default App;