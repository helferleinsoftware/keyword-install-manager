// src/pages/CampaignTablePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { signOut } from "firebase/auth";
// Import Firestore update functions
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
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
  const currentUser = auth.currentUser;

  const fetchCampaigns = useCallback(async () => {
    // ... (fetch logic remains the same)
    if (!currentUser) { /* ... */ return; }
    setIsLoading(true); setError(null);
    try {
      const campaignsRef = collection(db, "campaigns");
      const q = query(campaignsRef, where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedCampaigns: CampaignData[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<CampaignData, 'id'>)
      }));
      // Optional: Sort campaigns, e.g., by startDate descending
      // fetchedCampaigns.sort((a, b) => (b.startDate?.toMillis() ?? 0) - (a.startDate?.toMillis() ?? 0));
      setCampaigns(fetchedCampaigns);
    } catch (err) { /* ... */ }
    finally { setIsLoading(false); }
  }, [currentUser]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleLogout = async () => { /* ... */ };

  const handleAddCampaign = async (newCampaignData: NewCampaignInput) => {
    if (!currentUser) { throw new Error("User not authenticated."); }
    const campaignToAdd = {
      ...newCampaignData,
      userId: currentUser.uid,
      startDate: null, endRank: null, campaignType: '',
      day1: null, day2: null, day3: null, day4: null, day5: null,
      note: '',
    };
    try {
        const campaignsRef = collection(db, "campaigns");
        await addDoc(campaignsRef, campaignToAdd);
        // Optimistic UI update + refetch in background? Or just refetch.
        await fetchCampaigns();
    } catch (error) { /* ... */ throw error; }
  };

  // --- NEW: Function to update a specific field of a campaign ---
  const handleUpdateCampaignField = async (
      campaignId: string,
      fieldKey: string, // Corresponds to accessorKey in columns
      value: any
    ) => {
      if (!currentUser) {
        setError("Cannot update: User not authenticated.");
        return;
      }

      // Find the campaign in the local state for optimistic update
      const campaignIndex = campaigns.findIndex(c => c.id === campaignId);
      if (campaignIndex === -1) {
          console.error("Campaign not found in local state for update:", campaignId);
          setError("Fehler: Lokale Kampagne nicht gefunden.");
          return; // Should not happen ideally
      }

      const originalCampaigns = [...campaigns]; // Backup for potential revert
      const updatedCampaign = { ...campaigns[campaignIndex], [fieldKey]: value };

      // --- Optimistic UI Update ---
      const updatedCampaigns = [...campaigns];
      updatedCampaigns[campaignIndex] = updatedCampaign;
      setCampaigns(updatedCampaigns);
      // --- End Optimistic UI Update ---

      try {
        const campaignDocRef = doc(db, "campaigns", campaignId);

        // Prepare the update payload
        const updatePayload = { [fieldKey]: value };

        // Ensure the user is updating their own document (redundant with rules, but good practice)
        // You could fetch the doc first, but rules handle this. Just proceed.

        await updateDoc(campaignDocRef, updatePayload);
        // Update successful, optimistic update is now confirmed.
        // Optionally: Recalculate derived fields here if needed immediately,
        // or let the table recalculate on next render.

      } catch (err) {
        console.error("Fehler beim Aktualisieren des Feldes:", err);
        setError(`Fehler beim Speichern von Feld "${fieldKey}". Änderungen wurden zurückgesetzt.`);
        // Revert optimistic update on error
        setCampaigns(originalCampaigns);
      }
  };

  return (
    <div>
      <h1>Keyword Campaign Manager</h1>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={handleLogout}>Logout</button>
        <button onClick={() => setIsModalOpen(true)} style={{ marginLeft: '10px' }}>
          + Kampagne hinzufügen
        </button>
        {/* Config Button comes here later */}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <CampaignTable
          campaigns={campaigns}
          isLoading={isLoading}
          updateCampaignField={handleUpdateCampaignField} // Pass the update function
      />

      <AddCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCampaign={handleAddCampaign}
      />
    </div>
  );
}

export default CampaignTablePage;