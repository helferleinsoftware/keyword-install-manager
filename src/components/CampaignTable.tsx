import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    Row,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef } from 'react';
import { CampaignData, CampaignType, Country } from '../types/campaign';
import EditableCell from './EditableCell';
import {
    calculateCost,
    calculateEffectiveness,
    calculateEndDate,
    calculateRankBoost,
    calculateTotalInstalls,
    countActiveDays
} from '../utils/campaignCalculations';
import { filterRange } from '../utils/filter';

const SINGLE_CLICK_DELAY_MS = 200;

interface CampaignTableProps {
    campaigns: CampaignData[];
    isLoading: boolean;
    updateCampaignField: (campaignId: string, columnId: string, value: any) => void;
    costPerInstall: number | null;
    // Filter and Sorting Props
    columnFilters: ColumnFiltersState;
    setColumnFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>;
    handleCellClickForFilter: (columnId: string, value: any) => void;
    sorting: SortingState;
    setSorting: React.Dispatch<React.SetStateAction<SortingState>>;
}

const CampaignTable: React.FC<CampaignTableProps> = ({
    campaigns,
    isLoading,
    updateCampaignField,
    costPerInstall,
    columnFilters,
    setColumnFilters, // Not needed if fully managed by parent
    handleCellClickForFilter,
    sorting,
    setSorting
}) => {

    // Define columns using React Table's ColumnDef type
    const columns = useMemo<ColumnDef<CampaignData>[]>(() => [
        {
            accessorKey: 'country',
            header: 'Land',
            enableColumnFilter: true, // Enable filtering for this column
            filterFn: 'equals', // Use built-in equals filter (case-sensitive) or 'exact'
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
            enableColumnFilter: true, // Enable filtering for this column
            filterFn: 'equals', // Use built-in equals filter (case-sensitive) or 'exact'
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
            enableColumnFilter: false,
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
            enableColumnFilter: true,
            filterFn: filterRange,
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
            enableColumnFilter: true,
            filterFn: filterRange,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
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
            enableColumnFilter: false,
            cell: ({ row }) => {
                const total = calculateTotalInstalls(row.original);
                return total !== null ? total : '-';
            }
        },
        {
            id: 'cost',
            header: 'Cost',
            enableColumnFilter: false,
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
            enableColumnFilter: false,
            cell: ({ row }) => {
                const effectiveness = calculateEffectiveness(/* row.original */); // Pass data if needed by formula
                return effectiveness !== null ? effectiveness : '-'; // Placeholder
            }
        },
    ], [updateCampaignField, costPerInstall]); // Dependency array for useMemo

    const activeFilterIds = useMemo(() => new Set(columnFilters.map(f => f.id)), [columnFilters]);
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref to hold the timeout ID

    
    // Setup React Table instance
    const table = useReactTable({
        data: campaigns,
        columns,
        state: { // Control table state from parent
            columnFilters,
            sorting,
        },
        // Pipeline
        onColumnFiltersChange: setColumnFilters, // Hook up state setter if managed internally
        // Not strictly needed if parent manages it via handleCellClick
        onSortingChange: setSorting, // Hook up sorting state setter
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), // Enable filtering model
        getSortedRowModel: getSortedRowModel(),     // Enable sorting model
        // Define custom filter functions globally for the table instance
        filterFns: {
            filterRange: filterRange, // Make custom function available
            // fuzzy: fuzzyFilter, // Make fuzzy available if used
        },
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

    useEffect(() => {
        // Clear any running timeout when the component unmounts
        return () => {
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
          }
        };
      }, []);
      
    if (isLoading) {
        return <div>Lade Kampagnen...</div>;
    }

    return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}
                        style={{
                            border: '1px solid black', padding: '4px', textAlign: 'left',
                            // Indicate sortable columns
                            cursor: header.column.getCanSort() ? 'pointer' : 'default',
                            // Indicate filtered columns (bold column header)
                            fontWeight: activeFilterIds.has(header.column.id) ? 'bold' : 'normal',
                        }}
                        onClick={header.column.getToggleSortingHandler()} // Enable sorting on header click
                    >
                      {flexRender( header.column.columnDef.header, header.getContext())}
                      {/* Add Sort Icons */}
                      {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}
                        style={{
                            border: '1px solid black', padding: '0',
                            cursor: cell.column.getCanFilter() ? 'pointer' : 'default', // Indicate clickable filter cells
                            // Apply bold style to whole column if filter active (alternative to header bold)
                            // fontWeight: activeFilterIds.has(cell.column.id) ? 'bold' : 'normal',
                        }}
                        onClick={() => {
                            // Clear any previous pending click timeout
                            if (clickTimeoutRef.current) {
                                clearTimeout(clickTimeoutRef.current);
                                clickTimeoutRef.current = null;
                            }
      
                            // Start a new timeout for the single click action (filtering)
                            clickTimeoutRef.current = setTimeout(() => {
                                // Execute filter action only if the timeout completes
                                if (cell.column.getCanFilter()) {
                                    handleCellClickForFilter(cell.column.id, cell.getContext().getValue());
                                }
                                clickTimeoutRef.current = null; // Clear ref after execution
                            }, SINGLE_CLICK_DELAY_MS);
                          }}
                          onDoubleClick={() => {
                              // If double click happens, clear the pending single click timeout
                              if (clickTimeoutRef.current) {
                                  clearTimeout(clickTimeoutRef.current);
                                  clickTimeoutRef.current = null;
                              }
                              // The EditableCell's onDoubleClick will handle the editing start
                              // We don't need to do anything else here for the double click itself
                          }}
                      >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };
    
    export default CampaignTable;