import React from 'react';
import { CampaignData } from '../types/campaign';

interface CampaignTableProps {
  campaigns: CampaignData[];
  isLoading: boolean;
  // Functions for add, edit, delete will be passed later
}

const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, isLoading }) => {

  if (isLoading) {
    return <div>Lade Kampagnen...</div>;
  }

  if (!campaigns.length) {
      return <div>Keine Kampagnen gefunden. Füge eine neue hinzu!</div>;
  }

  // Basic table structure - React Table integration follows
  return (
    <table>
      <thead>
        <tr>
          <th>Land</th>
          <th>Keyword</th>
          <th>Startdatum</th>
          {/* Add all other headers later */}
        </tr>
      </thead>
      <tbody>
        {campaigns.map((campaign) => (
          <tr key={campaign.id}>
            <td>{campaign.country}</td>
            <td>{campaign.keyword}</td>
            <td>{campaign.startDate || '-'}</td>
            {/* Add all other data cells later */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CampaignTable;