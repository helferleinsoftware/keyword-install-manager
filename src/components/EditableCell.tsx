import { Timestamp } from 'firebase/firestore';
import React, { useState, useEffect, ChangeEvent, FocusEvent } from 'react';

interface EditableCellProps {
  initialValue: string | number | null | undefined;
  // Pass the whole row object for context if needed for update function
  // row: any; // Use specific Row type from TanStack Table later if needed
  columnId: string;
  updateData: (columnId: string, value: string | number | null) => void; // Function to call on save
  cellConfig?: { // Optional configuration per cell type
    type?: 'text' | 'number' | 'date' | 'select';
    options?: readonly string[]; // For select type
    min?: number;
    step?: number;
  };
}

const EditableCell: React.FC<EditableCellProps> = ({
  initialValue,
  columnId,
  updateData,
  cellConfig = { type: 'text' }, // Default to text input
}) => {
  const [value, setValue] = useState<string | number>(initialValue ?? '');
  const [isEditing, setIsEditing] = useState(false);

  // Update local state if initialValue changes (e.g., after successful save)
  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValue(e.target.value);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setIsEditing(false);
    let finalValue: string | number | null = value;

    // --- Input Type Handling & Validation ---
    if (cellConfig.type === 'number') {
      // Allow empty string to represent null for number inputs
      if (value === '') {
        finalValue = null;
      } else {
        const numValue = Number(value);
        // Basic validation: check if it's a valid number
        finalValue = isNaN(numValue) ? initialValue ?? null : numValue; // Revert if not a number
        // Add min/max validation if needed based on cellConfig
        if (cellConfig.min !== undefined && finalValue !== null && finalValue < cellConfig.min) {
            finalValue = cellConfig.min; // Or revert/show error
        }
      }
    } else if (cellConfig.type === 'date') {
        // Basic validation for date string format if needed
        // For now, just pass the string value
        finalValue = value === '' ? null : String(value);
    }
    else { // text or select
       finalValue = value === '' ? null : String(value);
    }
    // --- End Input Type Handling ---


    // Only call updateData if the value has actually changed
    // Use loose comparison (==) to handle type differences like 5 == '5' if needed,
    // or strict comparison (===) if types must match.
    // Check specifically for null/empty string equivalence for numbers
    const originalValue = initialValue ?? (cellConfig.type === 'number' ? null : '');
    const currentValue = finalValue ?? (cellConfig.type === 'number' ? null : '');

    if (originalValue !== currentValue) {
        // console.log(`Updating ${columnId}: ${originalValue} -> ${currentValue}`);
        updateData(columnId, finalValue);
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur(); // Trigger blur to save
    } else if (e.key === 'Escape') {
      setValue(initialValue ?? ''); // Revert changes
      setIsEditing(false);
    }
  };

  // Render input based on type
  const renderInput = () => {
    switch (cellConfig.type) {
      case 'number':
        return <input
                  type="number"
                  value={value}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  min={cellConfig.min}
                  step={cellConfig.step ?? 1}
                  autoFocus // Focus when editing starts
                  style={{ width: '100%', boxSizing: 'border-box' }}
               />;
      case 'date':
        // Use text input for ISO date string, or use a date picker library
        return <input
                  type="date" // Renders a basic date picker in supporting browsers
                  value={String(value).split('T')[0]} // Format for input type="date" (YYYY-MM-DD)
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box' }}
               />;
      case 'select':
        return <select
                  value={value}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box' }}
               >
                 {/* Add an empty option if the value can be null/cleared */}
                 <option value="">-- Select --</option>
                 {cellConfig.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>;
      case 'text':
      default:
        return <input
                  type="text"
                  value={value}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{ width: '100%', boxSizing: 'border-box' }}
               />;
    }
  };

  return (
    <div onDoubleClick={handleDoubleClick} style={{ minHeight: '20px', width: '100%' }}> {/* Ensure div takes space */}
      {isEditing ? (
        renderInput()
      ) : (
        // Display formatted value when not editing
        // Handle potential Timestamp for startDate display
         value instanceof Timestamp ? value.toDate().toLocaleDateString() :
         value ?? '-' // Display '-' for null/undefined
      )}
    </div>
  );
};

export default EditableCell;