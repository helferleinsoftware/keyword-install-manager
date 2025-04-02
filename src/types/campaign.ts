import { Timestamp } from 'firebase/firestore'; // Import Timestamp type


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
    id: string;
    userId: string;
  
    country: Country | string;
    keyword: string;
    startDate: Timestamp | null;
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
  
    // Calculated fields (derived in frontend for now)
    // endDate?: Timestamp | null; // Would also be a Timestamp if calculated from startDate
    // rankBoost?: number;
    // totalInstalls?: number;
    // cost?: number;
    // effectiveness?: string;
  }
  
  // Type for the data needed when creating a new campaign initially
  export type NewCampaignInput = Pick<CampaignData, 'country' | 'keyword' | 'difficulty' | 'currentRank'>;