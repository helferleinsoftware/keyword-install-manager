// src/pages/CampaignTablePage.tsx
import { useCallback, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
// Import Firestore update functions
import { ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';
import AddCampaignModal from '../components/AddCampaignModal';
import CampaignTable from '../components/CampaignTable';
import ConfigModal from '../components/ConfigModal';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CampaignData, NewCampaignInput } from '../types/campaign';
import { COST_PER_INSTALL_KEY, DEFAULT_FILTER_RANGE_DIFFICULTY, DEFAULT_FILTER_RANGE_RANK, FILTER_RANGE_DIFFICULTY_KEY, FILTER_RANGE_RANK_KEY } from '../types/config';



function CampaignTablePage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [costPerInstall] = useLocalStorage<number | null>(COST_PER_INSTALL_KEY, null); // Default to null
  const [filterRangeDifficulty] = useLocalStorage<number | null>(FILTER_RANGE_DIFFICULTY_KEY, DEFAULT_FILTER_RANGE_DIFFICULTY);
  const [filterRangeRank] = useLocalStorage<number | null>(FILTER_RANGE_RANK_KEY, DEFAULT_FILTER_RANGE_RANK);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]); // Add state for sorting

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

  const handleCellClickForFilter = (columnId: string, value: any) => {
    console.log(`Filter click: Col=${columnId}, Val=`, value);

    // Define which columns are filterable by click
    const rangeFilterColumns = ['difficulty', 'currentRank'];
    const exactFilterColumns = ['country', 'keyword']; // Add other exact match columns here if needed

    if (![...rangeFilterColumns, ...exactFilterColumns].includes(columnId)) {
      console.log("Column not configured for click-filtering.");
      return; // Ignore clicks on non-filterable columns
    }

    // Get the appropriate range from config
    let range: number | null = null;
    if (columnId === 'difficulty') range = filterRangeDifficulty;
    if (columnId === 'currentRank') range = filterRangeRank;

    // Check if a filter for this column already exists
    const currentFilter = columnFilters.find(f => f.id === columnId);

    let newFilters: ColumnFiltersState;

    if (currentFilter) {
      // Filter exists, remove it (toggle off)
      console.log(`Removing filter for ${columnId}`);
      newFilters = columnFilters.filter(f => f.id !== columnId);
    } else {
      // Filter does not exist, add it (toggle on)
      let filterValue: any;
      if (rangeFilterColumns.includes(columnId)) {
        if (typeof value !== 'number' || range === null) {
          console.log("Cannot apply range filter: Invalid value or range not set.");
          return; // Don't add invalid filter
        }
        // For range filters, store [clickedValue, range]
        filterValue = [value, range];
        console.log(`Adding range filter for ${columnId}:`, filterValue);
      } else { // Exact match filter
        filterValue = value;
        console.log(`Adding exact filter for ${columnId}:`, filterValue);
      }
      // Add the new filter to the existing filters (AND logic)
      newFilters = [...columnFilters, { id: columnId, value: filterValue }];
    }
    setColumnFilters(newFilters);
  };

  return (
    <div>
      <h1>Keyword Campaign Manager</h1>
      <div style={{ marginBottom: '15px' }}>
        <button onClick={handleLogout}>Logout</button>
        <button onClick={() => setIsModalOpen(true)} style={{ marginLeft: '10px' }}>
          + Kampagne hinzufügen
        </button>
        {/* Config Button */}
        <button onClick={() => setIsConfigModalOpen(true)} style={{ marginLeft: '10px' }}>
          Konfiguration
        </button>
      </div>

      {columnFilters.length > 0 && (
        <div style={{ margin: '10px 0', padding: '5px', background: '#eee' }}>
          Aktive Filter: {columnFilters.map(f => `${f.id}=${JSON.stringify(f.value)}`).join(', ')}
          <button onClick={() => setColumnFilters([])} style={{ marginLeft: '10px' }}>Reset</button>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <CampaignTable
        campaigns={campaigns}
        isLoading={isLoading}
        updateCampaignField={handleUpdateCampaignField}
        costPerInstall={costPerInstall} // Pass the read value
        // Pass filter state and handlers down
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters} // Needed if table manages filtering internally
        handleCellClickForFilter={handleCellClickForFilter} // Pass click handler
        sorting={sorting} // Pass sorting state
        setSorting={setSorting} // Pass sorting setter 
      />

      <AddCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddCampaign={handleAddCampaign}
      />

      {/* Render Config Modal */}
      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
export default CampaignTablePage;