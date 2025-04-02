// src/components/CampaignTable.tsx
import {
    ColumnDef,
    flexRender,
    getCoreRowModel, // Type for column definitions
    Row,
    useReactTable,
} from '@tanstack/react-table';
import { Timestamp } from 'firebase/firestore';
import React, { useMemo } from 'react';
import { CampaignData, CampaignType, Country } from '../types/campaign';
import EditableCell from './EditableCell'; // Import the editable cell
// ... other imports ...
import {
    calculateCost,
    calculateEffectiveness,
    calculateEndDate,
    calculateRankBoost,
    calculateTotalInstalls,
    countActiveDays
} from '../utils/campaignCalculations';

interface CampaignTableProps {
    campaigns: CampaignData[];
    isLoading: boolean;
    updateCampaignField: (campaignId: string, columnId: string, value: any) => void;
    costPerInstall: number | null; // Receive costPerInstall config
  }

const CampaignTable: React.FC<CampaignTableProps> = ({
    campaigns,
    isLoading,
    updateCampaignField,
    costPerInstall
}) => {

  // Define columns using React Table's ColumnDef type
  const columns = useMemo<ColumnDef<CampaignData>[]>(() => [
    {
      accessorKey: 'country',
      header: 'Land',
      // size: 150, // Optional: Define column size
      cell: ({ getValue, row, column }) => ( // Use cell render prop
        <EditableCell
          initialValue={getValue<Country | string>()}
          columnId={column.id}
          updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
          cellConfig={{ type: 'select', options: Object.values(Country) }}
        />
      ),
    },
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      // size: 250,
       cell: ({ getValue, row, column }) => (
        <EditableCell
          initialValue={getValue<string>()}
          columnId={column.id}
          updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
           cellConfig={{ type: 'text' }}
        />
      ),
    },
    {
        accessorKey: 'startDate',
        header: 'Startdatum',
        // size: 120,
        cell: ({ getValue, row, column }) => {
          const initialTs = getValue<Timestamp | null>();
          // Convert Timestamp to YYYY-MM-DD for the input, or empty string
          const initialValue = initialTs ? initialTs.toDate().toISOString().split('T')[0] : '';
          return (
            <EditableCell
              initialValue={initialValue}
              columnId={column.id}
              // When updating, convert the date string back to a Timestamp or null
              updateData={(colId, value) => {
                  const newTimestamp = value ? Timestamp.fromDate(new Date(value as string)) : null;
                  updateCampaignField(row.original.id, colId, newTimestamp);
              }}
              cellConfig={{ type: 'date' }}
            />
          );
        }
    },
    {
        accessorKey: 'difficulty',
        header: 'Difficulty',
        // size: 100,
        cell: ({ getValue, row, column }) => (
          <EditableCell
            initialValue={getValue<number | null>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'number', min: 0 }}
          />
        ),
    },
    {
        accessorKey: 'currentRank',
        header: 'Current Rank',
        // size: 100,
        cell: ({ getValue, row, column }) => (
          <EditableCell
            initialValue={getValue<number | null>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'number', min: 0 }}
          />
        ),
    },
    {
        accessorKey: 'endRank',
        header: 'End Rank',
        // size: 100,
        cell: ({ getValue, row, column }) => (
          <EditableCell
            initialValue={getValue<number | null>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'number', min: 0 }}
          />
        ),
    },
    {
        accessorKey: 'campaignType',
        header: 'Campaign Type',
        // size: 150,
         cell: ({ getValue, row, column }) => (
          <EditableCell
            initialValue={getValue<CampaignType | string>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'select', options: Object.values(CampaignType) }}
          />
        ),
    },
    // --- Day 1-5 Columns ---
    ...[1, 2, 3, 4, 5].map(day => ({
        accessorKey: `day${day}`,
        header: `Day ${day}`,
        // size: 80,
         cell: ({ getValue, row, column }: { getValue: any, row: Row<CampaignData>, column: any }) => (
          <EditableCell
            initialValue={getValue<number | null>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'number', min: 0 }}
          />
        ),
    })),
    // --- Note Column ---
    {
        accessorKey: 'note',
        header: 'Note',
        // size: 300,
        cell: ({ getValue, row, column }) => (
          <EditableCell
            initialValue={getValue<string | undefined>()}
            columnId={column.id}
            updateData={(colId, value) => updateCampaignField(row.original.id, colId, value)}
            cellConfig={{ type: 'text' }}
          />
        ),
    },
    // --- Calculated Columns ---
    {
        id: 'endDate', // Use id for calculated columns without direct accessorKey
        header: 'Enddatum',
        // size: 120,
        cell: ({ row }) => { // Access the full row data
          const campaign = row.original;
          const activeDays = countActiveDays(campaign);
          const endDate = calculateEndDate(campaign.startDate, activeDays);
          return endDate ? endDate.toDate().toLocaleDateString() : '-';
        }
      },
      {
        id: 'rankBoost',
        header: 'Rank Boost',
        // size: 100,
        cell: ({ row }) => {
          const boost = calculateRankBoost(row.original.currentRank, row.original.endRank);
          // Optional: Add styling based on value (positive/negative)
          const style: React.CSSProperties = {};
          if (boost !== null) {
              style.color = boost > 0 ? 'green' : boost < 0 ? 'red' : 'inherit';
          }
          return <span style={style}>{boost !== null ? boost : '-'}</span>;
        }
      },
      {
        id: 'totalInstalls',
        header: 'Total Installs',
        // size: 100,
        cell: ({ row }) => {
          const total = calculateTotalInstalls(row.original);
          return total !== null ? total : '-';
        }
      },
      {
        id: 'cost',
        header: 'Cost',
        // size: 100,
        cell: ({ row }) => {
          const totalInstalls = calculateTotalInstalls(row.original);
          const cost = calculateCost(totalInstalls, costPerInstall); // Use config value
          // Optional: Format as currency
          return cost !== null ? `€${cost.toFixed(2)}` : '-'; // Example currency format
        }
      },
      {
        id: 'effectiveness',
        header: 'Effectiveness',
        // size: 100,
         cell: ({ row }) => {
          const effectiveness = calculateEffectiveness(/* row.original */); // Pass data if needed by formula
          return effectiveness !== null ? effectiveness : '-'; // Placeholder
        }
      },
  ], [updateCampaignField, costPerInstall]); // Dependency array for useMemo

  // Setup React Table instance
  const table = useReactTable({
    data: campaigns,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // We need to pass our update function down to the cells
    // This can be done via meta property
    meta: {
        updateData: (rowIndex: number, columnId: string, value: any) => {
            // This approach requires finding the campaignId using rowIndex, less direct
            // Prefer passing updateCampaignField directly into cell render prop as done above
            // const campaignId = campaigns[rowIndex]?.id;
            // if (campaignId) {
            //    updateCampaignField(campaignId, columnId, value);
            // }
        }
    }
  });

  if (isLoading) {
    return <div>Lade Kampagnen...</div>;
  }

  // Basic table structure from React Table examples
  return (
    <div style={{ overflowX: 'auto' }}> {/* Make table horizontally scrollable if needed */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} style={{ border: '1px solid black', padding: '4px', textAlign: 'left' }}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} style={{ border: '1px solid black', padding: '0' }}> {/* Padding 0 to let cell fill */}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
       {/* Button for adding row was moved to CampaignTablePage */}
    </div>
  );
};

export default CampaignTable;