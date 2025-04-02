import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import CampaignTable from '../components/CampaignTable';
import AddCampaignModal from '../components/AddCampaignModal';
import { CampaignData, NewCampaignInput } from '../types/campaign';

function CampaignTablePage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const currentUser = auth.currentUser; // Get current user

  // Function to fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!currentUser) {
      setError("Benutzer nicht authentifiziert.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const campaignsRef = collection(db, "campaigns");
      // Create a query against the collection.
      const q = query(campaignsRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedCampaigns: CampaignData[] = [];
      querySnapshot.forEach((doc) => {
        // Combine doc.id and doc.data() into a single object
        fetchedCampaigns.push({ id: doc.id, ...(doc.data() as Omit<CampaignData, 'id'>) });
      });
      setCampaigns(fetchedCampaigns);
    } catch (err) {
      console.error("Fehler beim Laden der Kampagnen:", err);
      setError("Kampagnen konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]); // Dependency: currentUser

  // Fetch campaigns on component mount and when user changes
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]); // Use the memoized fetchCampaigns

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Explicit navigation after state update might be needed
    } catch (error) {
      console.error("Logout Fehler:", error);
      setError("Fehler beim Logout.");
    }
  };

  // Function to add a new campaign
  const handleAddCampaign = async (newCampaignData: NewCampaignInput) => {
    if (!currentUser) {
      throw new Error("Benutzer nicht authentifiziert."); // Throw error to be caught in modal
    }

    const campaignToAdd = {
      ...newCampaignData,
      userId: currentUser.uid, // Ensure userId is set
      startDate: null, // Initialize other fields as needed
      endRank: null,
      campaignType: '', // Or a default type
      day1: null,
      day2: null,
      day3: null,
      day4: null,
      day5: null,
      note: '',
      // Convert startDate to Timestamp if using that type in Firestore
      // startDate: newCampaignData.startDate ? Timestamp.fromDate(new Date(newCampaignData.startDate)) : null,
    };

    try {
        const campaignsRef = collection(db, "campaigns");
        // Add a new document with a generated id.
        await addDoc(campaignsRef, campaignToAdd);
        // Refetch campaigns to show the new one
        // Alternatively, update state locally for better UX
        await fetchCampaigns(); // Simple refetch for now
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error; // Re-throw to be caught by the modal's submit handler
    }
  };

  return (
    <div>
      <h1>Keyword Campaign Manager</h1>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => setIsModalOpen(true)} style={{ marginLeft: '10px' }}>
        + Kampagne hinzufügen
      </button>
      {/* Config Button kommt hier später */}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <CampaignTable campaigns={campaigns} isLoading={isLoading} />

      <AddCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCampaign={handleAddCampaign}
      />
    </div>
  );
}

export default CampaignTablePage;