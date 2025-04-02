// src/utils/campaignCalculations.ts
import { CampaignData } from '../types/campaign';
import { Timestamp } from 'firebase/firestore';

export function calculateEndDate(startDate: Timestamp | null, daysUsed: number): Timestamp | null {
    if (!startDate || daysUsed <= 0) {
        return null;
    }
    const date = startDate.toDate();
    // Add days (consider day 1 is the start date itself, so add daysUsed - 1)
    date.setDate(date.getDate() + daysUsed -1);
    return Timestamp.fromDate(date);
}

export function calculateRankBoost(currentRank: number | null, endRank: number | null): number | null {
    if (typeof currentRank === 'number' && typeof endRank === 'number' && currentRank > 0 && endRank > 0) {
         // Higher rank is better (lower number), so boost is positive if current > end
        return currentRank - endRank;
    }
    return null;
}

export function calculateTotalInstalls(campaign: CampaignData): number | null {
    const installs = [campaign.day1, campaign.day2, campaign.day3, campaign.day4, campaign.day5]
        .reduce((sum, installs) => sum + (typeof installs === 'number' ? installs : 0), 0);
    // Return null if no installs recorded, or 0 if explicitly 0 installs
    return installs > 0 || campaign.day1 !== null || campaign.day2 !== null || campaign.day3 !== null || campaign.day4 !== null || campaign.day5 !== null
           ? installs
           : null; 
}

 export function countActiveDays(campaign: CampaignData): number {
    return [campaign.day1, campaign.day2, campaign.day3, campaign.day4, campaign.day5]
        .filter(installs => typeof installs === 'number' && installs >= 0) // Count days with entered install counts (even 0)
        .length;
}

// Cost calculation needs configuration (costPerInstall) - get from props or context later
export function calculateCost(totalInstalls: number | null, costPerInstall: number | null): number | null {
     if (typeof totalInstalls === 'number' && typeof costPerInstall === 'number') {
        return totalInstalls * costPerInstall;
     }
     return null;
}

// Placeholder for Effectiveness - depends on your formula
export function calculateEffectiveness(/* campaign: CampaignData */): string | null {
    // Your formula here, e.g., based on rankBoost and cost/installs
    return null; // Placeholder
}