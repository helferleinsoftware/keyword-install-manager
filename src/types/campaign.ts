export enum Country {
    DE = "Germany",
    US = "USA",
    CH = "Switzerland",
    AT = "Austria",
  }
  
  export enum CampaignType {
    KICK = "Kick",
    LINEAR = "Linear",
    EXPONENTIAL = "Exponential",
    PARABOLIC = "Parabolic",
  }
  
  export interface CampaignData {
    id: string; // Firestore document ID
    userId: string; // Firebase Auth User ID of the owner
  
    country: Country | string; // Allow string for flexibility or define all in Enum
    keyword: string;
    startDate: string | null; // Store as ISO string or Firestore Timestamp, handle conversion
    difficulty: number | null;
    currentRank: number | null;
    endRank: number | null;
    campaignType: CampaignType | string;
    day1?: number | null;
    day2?: number | null;
    day3?: number | null;
    day4?: number | null;
    day5?: number | null;
    note?: string;
  
    // Fields calculated primarily on the frontend, might not be stored
    // endDate?: string;
    // rankBoost?: number;
    // totalInstalls?: number;
    // cost?: number;
    // effectiveness?: string; // Formula TBD
  }
  
  // Type for the data needed when creating a new campaign initially
  export type NewCampaignInput = Pick<CampaignData, 'country' | 'keyword' | 'difficulty' | 'currentRank'>;