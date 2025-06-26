// store/slices/tableSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TableRow {
  id: number;
  name: string;
  email: string;
  age: number;
  role: string;
  department?: string;
  location?: string;
  [key: string]: any;
}

export interface TableColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email';
  required?: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface TableState {
  rows: TableRow[];
  columns: TableColumn[];
  visibleColumns: string[];
  searchQuery: string;
  sortConfig: SortConfig | null;
  page: number;
  rowsPerPage: number;
  darkMode: boolean;
  isLoading: boolean;
  error: string | null;
  editingRows: number[];
}

const defaultColumns: TableColumn[] = [
  { id: 'name', label: 'Name', type: 'text', required: true },
  { id: 'email', label: 'Email', type: 'email', required: true },
  { id: 'age', label: 'Age', type: 'number', required: true },
  { id: 'role', label: 'Role', type: 'text', required: true },
  { id: 'department', label: 'Department', type: 'text' },
  { id: 'location', label: 'Location', type: 'text' },
];

const initialRows: TableRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: 100 + i,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  age: 20 + (i % 30),
  role: ['Developer', 'Designer', 'Manager', 'Analyst'][i % 4],
  department: ['Engineering', 'Design', 'QA', 'Product'][i % 4],
  location: ['New York', 'San Francisco', 'Berlin', 'Tokyo'][i % 4],
}));

const initialState: TableState = {
  rows: initialRows,
  columns: defaultColumns,
  visibleColumns: ['name', 'email', 'age', 'role'],
  searchQuery: '',
  sortConfig: null,
  page: 0,
  rowsPerPage: 10,
  darkMode: false,
  isLoading: false,
  error: null,
  editingRows: [],
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setRows: (state, action: PayloadAction<TableRow[]>) => {
      state.rows = action.payload;
    },
    addRow: (state, action: PayloadAction<Omit<TableRow, 'id'>>) => {
      const newId = Math.max(...state.rows.map(r => r.id), 0) + 1;
      state.rows.push({...action.payload, id: newId });
    },
    updateRow: (state, action: PayloadAction<{ id: number; data: Partial<TableRow> }>) => {
      const index = state.rows.findIndex(row => row.id === action.payload.id);
      if (index !== -1) {
        state.rows[index] = { ...state.rows[index], ...action.payload.data };
      }
    },
    deleteRow: (state, action: PayloadAction<number>) => {
      state.rows = state.rows.filter(row => row.id !== action.payload);
    },
    addColumn: (state, action: PayloadAction<TableColumn>) => {
      state.columns.push(action.payload);
      // Add default value to existing rows
      state.rows.forEach(row => {
        if (!(action.payload.id in row)) {
          row[action.payload.id] = action.payload.type === 'number' ? 0 : '';
        }
      });
    },
    toggleColumnVisibility: (state, action: PayloadAction<string>) => {
      const columnId = action.payload;
      if (state.visibleColumns.includes(columnId)) {
        state.visibleColumns = state.visibleColumns.filter(id => id !== columnId);
      } else {
        state.visibleColumns.push(columnId);
      }
    },
    setVisibleColumns: (state, action: PayloadAction<string[]>) => {
      state.visibleColumns = action.payload;
    },
    reorderColumns: (state, action: PayloadAction<string[]>) => {
      state.visibleColumns = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.page = 0; // Reset to first page when searching
    },
    setSortConfig: (state, action: PayloadAction<SortConfig | null>) => {
      state.sortConfig = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setRowsPerPage: (state, action: PayloadAction<number>) => {
      state.rowsPerPage = action.payload;
      state.page = 0; // Reset to first page
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    startEditing: (state, action: PayloadAction<number>) => {
      if (!state.editingRows.includes(action.payload)) {
        state.editingRows.push(action.payload);
      }
    },
    stopEditing: (state, action: PayloadAction<number>) => {
      state.editingRows = state.editingRows.filter(id => id !== action.payload);
    },
    cancelAllEditing: (state) => {
      state.editingRows = [];
    },
    importData: (state, action: PayloadAction<TableRow[]>) => {
      state.rows = action.payload;
      state.error = null;
    },
  },
});

export const {
  setRows,
  addRow,
  updateRow,
  deleteRow,
  addColumn,
  toggleColumnVisibility,
  setVisibleColumns,
  reorderColumns,
  setSearchQuery,
  setSortConfig,
  setPage,
  setRowsPerPage,
  toggleDarkMode,
  setLoading,
  setError,
  startEditing,
  stopEditing,
  cancelAllEditing,
  importData,
} = tableSlice.actions;

export default tableSlice.reducer;