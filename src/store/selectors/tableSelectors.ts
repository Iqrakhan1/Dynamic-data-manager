// store/selectors/tableSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

const selectTableState = (state: RootState) => state.table;

export const selectRows = (state: RootState) => state.table.rows;
export const selectColumns = (state: RootState) => state.table.columns;
export const selectVisibleColumns = (state: RootState) => state.table.visibleColumns;
export const selectSearchQuery = (state: RootState) => state.table.searchQuery;
export const selectSortConfig = (state: RootState) => state.table.sortConfig;
export const selectPage = (state: RootState) => state.table.page;
export const selectRowsPerPage = (state: RootState) => state.table.rowsPerPage;
export const selectDarkMode = (state: RootState) => state.table.darkMode;
export const selectIsLoading = (state: RootState) => state.table.isLoading;
export const selectError = (state: RootState) => state.table.error;
export const selectEditingRows = (state: RootState) => state.table.editingRows;

// Get visible columns data
export const selectVisibleColumnsData = createSelector(
  [selectColumns, selectVisibleColumns],
  (columns, visibleColumns) => 
    columns.filter(col => visibleColumns.includes(col.id))
);

// Filter and sort rows
export const selectFilteredAndSortedRows = createSelector(
  [selectRows, selectVisibleColumns, selectSearchQuery, selectSortConfig],
  (rows, visibleColumns, searchQuery, sortConfig) => {
    // Filter rows based on search query
    let filteredRows = rows;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredRows = rows.filter(row =>
        visibleColumns.some(colId => {
          const value = row[colId];
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Sort rows
    if (sortConfig) {
      filteredRows = [...filteredRows].sort((a, b) => {
        const aVal = a[sortConfig.field];
        const bVal = b[sortConfig.field];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filteredRows;
  }
);

// Get paginated rows
export const selectPaginatedRows = createSelector(
  [selectFilteredAndSortedRows, selectPage, selectRowsPerPage],
  (filteredRows, page, rowsPerPage) => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredRows.slice(startIndex, endIndex);
  }
);

// Get total filtered count
export const selectFilteredRowsCount = createSelector(
  [selectFilteredAndSortedRows],
  (filteredRows) => filteredRows.length
);