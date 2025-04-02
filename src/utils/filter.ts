import { FilterFn } from "@tanstack/react-table";
import { CampaignData } from "../types/campaign";

export const filterRange: FilterFn<CampaignData> = (row, columnId, filterValue) => {
    const rowValue = row.getValue<number | null>(columnId);
    if (typeof rowValue !== 'number' || !Array.isArray(filterValue) || filterValue.length !== 2) return true;
    const [clickedValue, range] = filterValue;
     if (typeof clickedValue !== 'number' || typeof range !== 'number') return true;
    const lowerBound = clickedValue - range;
    const upperBound = clickedValue + range;
    return rowValue >= lowerBound && rowValue <= upperBound;
};

// Fuzzy Filter (Example if needed later)
/*
const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)
  // Store the ranking info
  addMeta(itemRank)
  // Return if the item should be filtered in/out
  return itemRank.passed
}
*/