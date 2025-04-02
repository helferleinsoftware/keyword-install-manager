// src/components/CampaignTable.tsx
import React, { useMemo } from 'react';
import { CampaignData, Country, CampaignType } from '../types/campaign';
import { Timestamp } from 'firebase/firestore';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef, // Type for column definitions
  Row, // Type for row object
} from '@tanstack/react-table';
import EditableCell from './EditableCell'; // Import the editable cell

interface CampaignTableProps {
  campaigns: CampaignData[];
  isLoading: boolean;
  // Function to update a specific cell in a campaign
  updateCampaignField: (campaignId: string, columnId: string, value: any) => void;
  // Later: add functions for delete, etc.
}

const CampaignTable: React.FC<CampaignTableProps> = ({
    campaigns,
    isLoading,
    updateCampaignField
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
    // TODO: Add columns for calculated fields later (endDate, rankBoost, totalInstalls, cost, effectiveness)
    // These won't use EditableCell initially, just display calculated values.

  ], [updateCampaignField]); // Dependency array for useMemo

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