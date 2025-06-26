// components/DataTable.tsx
"use client";

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, TablePagination, TableSortLabel, IconButton, Button,
  InputBase, AppBar, Toolbar, TextField, Dialog, DialogActions, DialogContent, 
  DialogTitle, Alert, Snackbar, Fab, Tooltip, CircularProgress, Chip,
  useMediaQuery, useTheme, Drawer, List, ListItem, ListItemText, Card,
  CardContent, CardActions, Divider, Stack, Hidden, Collapse, Grid
} from "@mui/material";
import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import Papa from "papaparse";
import { saveAs } from "file-saver";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// Redux
import { AppDispatch, RootState } from "../store";
import {
  updateRow, deleteRow, addRow, toggleColumnVisibility, setSearchQuery,
  setSortConfig, setPage, setRowsPerPage, toggleDarkMode, setLoading,
  setError, startEditing, stopEditing, cancelAllEditing, importData,
   SortConfig
} from "../store/slices/tableSlice";
import {
  selectPaginatedRows, selectFilteredRowsCount, selectVisibleColumnsData,
  selectSearchQuery, selectSortConfig, selectPage, selectRowsPerPage,
  selectDarkMode, selectIsLoading, selectError, selectEditingRows,
  selectVisibleColumns
} from "../store/selectors/tableSelectors";

// Components
import ColumnManagerModal from "./ColumnManagerModal";
import AddRowModal from "./AddRowModal";

export default function DataTable() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Redux selectors
  const paginatedRows = useSelector(selectPaginatedRows);
  const filteredRowsCount = useSelector(selectFilteredRowsCount);
  const visibleColumnsData = useSelector(selectVisibleColumnsData);
  const visibleColumns = useSelector(selectVisibleColumns);
  const searchQuery = useSelector(selectSearchQuery);
  const sortConfig = useSelector(selectSortConfig);
  const page = useSelector(selectPage);
  const rowsPerPage = useSelector(selectRowsPerPage);
  const darkMode = useSelector(selectDarkMode);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const editingRows = useSelector(selectEditingRows);

  // Local state
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const [addRowModalOpen, setAddRowModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [editingValues, setEditingValues] = useState<{ [key: string]: any }>({});
  const [csvError, setCsvError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{ [key: number]: boolean }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form for inline editing
  const { control, handleSubmit, setValue, reset } = useForm();

  const handleSort = (field: string) => {
    const newDirection = 
      sortConfig?.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    dispatch(setSortConfig({ field, direction: newDirection }));
  };

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setRowsPerPage(parseInt(event.target.value, 10)));
  };

  const handleStartEdit = (rowId: number) => {
    dispatch(startEditing(rowId));
    // Initialize editing values
    const row = paginatedRows.find(r => r.id === rowId);
    if (row) {
      const newEditingValues = { ...editingValues };
      visibleColumns.forEach(colId => {
        newEditingValues[`${rowId}-${colId}`] = row[colId];
      });
      setEditingValues(newEditingValues);
    }
  };

  const handleSaveEdit = (rowId: number) => {
    const updates: Partial<TableRow> = {};
    visibleColumns.forEach(colId => {
      const key = `${rowId}-${colId}`;
      if (key in editingValues) {
        updates[colId] = editingValues[key];
      }
    });
    
    dispatch(updateRow({ id: rowId, data: updates }));
    dispatch(stopEditing(rowId));
    
    // Clear editing values for this row
    const newEditingValues = { ...editingValues };
    visibleColumns.forEach(colId => {
      delete newEditingValues[`${rowId}-${colId}`];
    });
    setEditingValues(newEditingValues);
  };

  const handleCancelEdit = (rowId: number) => {
    dispatch(stopEditing(rowId));
    // Clear editing values for this row
    const newEditingValues = { ...editingValues };
    visibleColumns.forEach(colId => {
      delete newEditingValues[`${rowId}-${colId}`];
    });
    setEditingValues(newEditingValues);
  };

  const handleSaveAll = () => {
    editingRows.forEach(rowId => {
      handleSaveEdit(rowId);
    });
  };

  const handleCancelAll = () => {
    dispatch(cancelAllEditing());
    setEditingValues({});
  };

  const handleDelete = () => {
    if (deleteConfirm.id !== null) {
      dispatch(deleteRow(deleteConfirm.id));
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const handleExportCSV = () => {
    const dataToExport = paginatedRows.map(row => {
      const newRow: any = {};
      visibleColumns.forEach(col => (newRow[col] = row[col]));
      return newRow;
    });
    const csv = Papa.unparse(dataToExport);
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "data-table.csv");
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    dispatch(setLoading(true));
    setCsvError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          }

          const importedData = results.data.map((row: any, index: number) => ({
            id: Date.now() + index,
            name: row.name || row.Name || '',
            email: row.email || row.Email || '',
            age: parseInt(row.age || row.Age) || 0,
            role: row.role || row.Role || '',
            department: row.department || row.Department || '',
            location: row.location || row.Location || '',
            ...row
          }));

          dispatch(importData(importedData));
          dispatch(setLoading(false));
        } catch (error) {
          setCsvError(error instanceof Error ? error.message : 'Failed to import CSV');
          dispatch(setLoading(false));
        }
      },
      error: (error) => {
        setCsvError(`Failed to read CSV file: ${error.message}`);
        dispatch(setLoading(false));
      }
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditingValueChange = (rowId: number, colId: string, value: any) => {
    setEditingValues(prev => ({
      ...prev,
      [`${rowId}-${colId}`]: value
    }));
  };

  const isRowEditing = (rowId: number) => editingRows.includes(rowId);

  const toggleCardExpansion = (rowId: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  // Mobile Card View Component
  const MobileCardView = () => (
    <Box sx={{ p: 2 }}>
      {paginatedRows.map((row, idx) => (
        <Card 
          key={row.id} 
          sx={{ 
            mb: 2, 
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            border: isRowEditing(row.id) ? `2px solid ${darkMode ? '#581b7f' : '#470571'}` : 'none'
          }}
        >
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ color: darkMode ? '#fff' : 'inherit', fontSize: '1.1rem' }}>
                Row #{row.id}
              </Typography>
              <IconButton 
                size="small"
                onClick={() => toggleCardExpansion(row.id)}
                sx={{ color: darkMode ? '#fff' : 'inherit' }}
              >
                {expandedCards[row.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            {/* Always show first 2-3 fields */}
            <Stack spacing={1}>
              {visibleColumnsData.slice(0, isSmallScreen ? 2 : 3).map(col => {
                const isEditing = isRowEditing(row.id);
                const editingKey = `${row.id}-${col.id}`;
                
                return (
                  <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: darkMode ? '#ccc' : '#666', minWidth: '80px' }}>
                      {col.label}:
                    </Typography>
                    {isEditing ? (
                      <TextField
                        size="small"
                        type={col?.type === 'number' ? 'number' : 'text'}
                        value={editingValues[editingKey] ?? row[col.id]}
                        onChange={(e) => handleEditingValueChange(row.id, col.id, e.target.value)}
                        sx={{ flexGrow: 1, ml: 1, maxWidth: '200px' }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: darkMode ? '#fff' : 'inherit',
                          flexGrow: 1,
                          textAlign: 'right',
                          cursor: 'pointer',
                          p: 0.5,
                          borderRadius: 1,
                          '&:hover': { bgcolor: darkMode ? '#333' : '#f0f0f0' }
                        }}
                        onDoubleClick={() => handleStartEdit(row.id)}
                      >
                        {row[col.id]}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>

            {/* Collapsible section for remaining fields */}
            {visibleColumnsData.length > (isSmallScreen ? 2 : 3) && (
              <Collapse in={expandedCards[row.id]}>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={1}>
                  {visibleColumnsData.slice(isSmallScreen ? 2 : 3).map(col => {
                    const isEditing = isRowEditing(row.id);
                    const editingKey = `${row.id}-${col.id}`;
                    
                    return (
                      <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: darkMode ? '#ccc' : '#666', minWidth: '80px' }}>
                          {col.label}:
                        </Typography>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type={col?.type === 'number' ? 'number' : 'text'}
                            value={editingValues[editingKey] ?? row[col.id]}
                            onChange={(e) => handleEditingValueChange(row.id, col.id, e.target.value)}
                            sx={{ flexGrow: 1, ml: 1, maxWidth: '200px' }}
                          />
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkMode ? '#fff' : 'inherit',
                              flexGrow: 1,
                              textAlign: 'right',
                              cursor: 'pointer',
                              p: 0.5,
                              borderRadius: 1,
                              '&:hover': { bgcolor: darkMode ? '#333' : '#f0f0f0' }
                            }}
                            onDoubleClick={() => handleStartEdit(row.id)}
                          >
                            {row[col.id]}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Collapse>
            )}
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
            {isRowEditing(row.id) ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveEdit(row.id)}
                  color="success"
                >
                  Save
                </Button>
                <Button 
                  size="small"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => handleCancelEdit(row.id)}
                  color="error"
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleStartEdit(row.id)}
                  sx={{ 
                    borderColor: darkMode ? '#581b7f' : '#470571', 
                    color: darkMode ? '#581b7f' : '#470571' 
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="small"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm({ open: true, id: row.id })}
                  color="error"
                >
                  Delete
                </Button>
              </Box>
            )}
          </CardActions>
        </Card>
      ))}
    </Box>
  );

  // Mobile Action Menu
  const MobileActionMenu = () => (
    <Drawer
      anchor="bottom"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      sx={{
        '& .MuiDrawer-paper': {
          bgcolor: darkMode ? '#1e1e1e' : 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, color: darkMode ? '#fff' : 'inherit' }}>
          Actions
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: darkMode ? '#581b7f' : '#470571', color: '#fff' }}
              startIcon={<FileUploadIcon />}
              onClick={() => {
                fileInputRef.current?.click();
                setMobileMenuOpen(false);
              }}
              disabled={isLoading}
            >
              Import CSV
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ borderColor: darkMode ? '#fff' : '#470571', color: darkMode ? '#fff' : '#470571' }}
              startIcon={<FileDownloadIcon />}
              onClick={() => {
                handleExportCSV();
                setMobileMenuOpen(false);
              }}
            >
              Export CSV
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setAddRowModalOpen(true);
                setMobileMenuOpen(false);
              }}
              color="success"
            >
              Add User
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              sx={{ borderColor: darkMode ? '#fff' : '#470571', color: darkMode ? '#fff' : '#470571' }}
              startIcon={<ViewColumnIcon />}
              onClick={() => {
                setColumnModalOpen(true);
                setMobileMenuOpen(false);
              }}
            >
              Manage Columns
            </Button>
          </Grid>
          {editingRows.length > 0 && (
            <>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => {
                    handleSaveAll();
                    setMobileMenuOpen(false);
                  }}
                  color="success"
                >
                  Save All ({editingRows.length})
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => {
                    handleCancelAll();
                    setMobileMenuOpen(false);
                  }}
                  color="error"
                >
                  Cancel All
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Drawer>
  );

  return (
    <Box
      sx={{
        bgcolor: darkMode ? '#121212' : '#fafafa',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden', // Prevents accidental horizontal overflow
      }}
    >
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: darkMode ?   '#000' :'#581b7f'}}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant={isSmallScreen ? "subtitle1" : "h6"}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              fontWeight: 'bold',
              color: 'white',
            }}
          >
            <img
              src="https://cdn-icons-png.freepik.com/256/7952/7952755.png?semt=ais_hybrid"
              alt="Logo"
              width={isSmallScreen ? 32 : 40}
              height={isSmallScreen ? 32 : 40}
              style={{ marginRight: isSmallScreen ? 4 : 8 }}
            />
            {!isSmallScreen && 'TableCraft'}
            {isSmallScreen && 'TC'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Only show Import/Export on desktop/tablet */}
            {!isMobile && (
              <>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                />
                <Button
                  variant="contained"
                  sx={{ bgcolor: darkMode ? '#581b7f' : '#fff', color: darkMode ? '#fff' : '#470571', minWidth: 36, px: 1 }}
                  startIcon={<FileUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  size="small"
                >
                  {isSmallScreen ? "" : "Import"}
                </Button>
                <Button
                  variant="outlined"
                  sx={{ borderColor: darkMode ? '#fff' : '#fff', color: darkMode ? '#fff' : '#fff', minWidth: 36, px: 1, ml: 1 }}
                  startIcon={<FileDownloadIcon />}
                  onClick={handleExportCSV}
                  size="small"
                >
                  {isSmallScreen ? "" : "Export"}
                </Button>
               
          <Button
            variant="outlined"
            sx={{ borderColor: darkMode ? '#fff' : '#fff', color: darkMode ? '#fff' : '#fff',  }}
            startIcon={<ViewColumnIcon />}
            onClick={() => setColumnModalOpen(true)}
            size={isTablet ? "small" : "medium"}
          >
            {isTablet ? "Columns" : "Manage Columns"}
          </Button>
            <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddRowModalOpen(true)}
            color="success"
            size={isTablet ? "small" : "medium"}
          >
            {isTablet ? "Add" : "Add Users"}
          </Button>
              </>
            )}
            <IconButton onClick={() => dispatch(toggleDarkMode())} sx={{ color: 'white' }}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            {isMobile && (
              <IconButton onClick={() => setMobileMenuOpen(true)} sx={{ color: 'white' }}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Responsive Search + Actions Bar Below Navbar */}
      <Box
        sx={{
          width: '100%',
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          ml: { xs: 0, md: 2 },
          bgcolor: "#fff",
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 2,
          justifyContent: 'space-between',
        }}
      >
         {/* Center: Search Bar */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'flex-start', md: 'left' },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              width: { xs: '100%', sm: 400, md: 400 },
              bgcolor: darkMode ? "#000" : "#fff",
              borderRadius: 1,
              px: 1,
              boxShadow: 1,
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder={isSmallScreen ? "Search..." : "Search all fields..."}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ width: '100%' }}
            />
          </Box>
        </Box>

        {/* Stats */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label={`${filteredRowsCount} total Users`}
            sx={{ color: darkMode ? '#000' : '#581b7f' }}
            variant="outlined"
            size={isSmallScreen ? "small" : "medium"}
          />
          {editingRows.length > 0 && (
            <Chip 
              label={`${editingRows.length} rows being edited`}
              color="warning"
              variant="outlined"
              size={isSmallScreen ? "small" : "medium"}
            />
          )}
        </Box>
      </Box>
       
       
      
      </Box>

      {/* Loading Indicator */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      )}

      

      {/* Table/Cards Content */}
      {isMobile ? (
        <MobileCardView />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            mx: { xs: 2, sm: 3, md: 6 }, // Increased margin for all breakpoints
            my: 2,
            borderRadius: 2,
            boxShadow: darkMode ? 4 : 2,
            bgcolor: darkMode ? '#1e1e1e' : 'white',
            overflowX: 'auto',
            width: { xs: 'auto', md: '95%' }, // Prevents full width on small screens
            minWidth: 0,
            maxWidth: '100vw', // Prevents overflow on very wide screens
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <Table size={isTablet ? "small" : "medium"}>
            <TableHead sx={{ bgcolor: darkMode ? '#2d2d2d' : '#f5f5f5' }}>
              <TableRow>
                {visibleColumnsData.map(col => (
                  <TableCell key={col.id} align="center" sx={{ minWidth: isTablet ? 80 : 120 }}>
                    <TableSortLabel
                      active={sortConfig?.field === col.id}
                      direction={sortConfig?.field === col.id ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort(col.id)}
                      sx={{ 
                        fontWeight: 'bold',
                        color: darkMode ? '#fff' : 'inherit',
                        fontSize: isTablet ? '0.8rem' : '0.875rem',
                        '&.Mui-active': {
                          color: darkMode ? '#581b7f' : '#470571'
                        }
                      }}
                    >
                      {isTablet && col.label.length > 8 ? col.label.substring(0, 8) + '...' : col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center" sx={{ 
                  fontWeight: 'bold', 
                  color: darkMode ? '#fff' : 'inherit',
                  minWidth: isTablet ? 100 : 120
                }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, idx) => (
                <TableRow 
                  key={row.id} 
                  sx={{ 
                    bgcolor: darkMode 
                      ? (idx % 2 === 0 ? '#1a1a1a' : '#242424')
                      : (idx % 2 === 0 ? '#fafafa' : 'white'),
                    '&:hover': {
                      bgcolor: darkMode ? '#333' : '#f0f0f0'
                    }
                  }}
                >
                  {visibleColumns.map(colId => {
                    const column = visibleColumnsData.find(c => c.id === colId);
                    const isEditing = isRowEditing(row.id);
                    const editingKey = `${row.id}-${colId}`;
                    
                    return (
                      <TableCell key={colId} align="center" sx={{
                        p: isTablet ? 1 : 2,
                        maxWidth: 180,
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type={column?.type === 'number' ? 'number' : 'text'}
                            value={editingValues[editingKey] ?? row[colId]}
                            onChange={(e) => handleEditingValueChange(row.id, colId, e.target.value)}
                            sx={{ 
                              minWidth: isTablet ? 80 : 120,
                              '& .MuiInputBase-input': {
                                textAlign: 'center',
                                fontSize: isTablet ? '0.8rem' : '0.875rem'
                              }
                            }}
                          />
                        ) : (
                          <Typography 
                            sx={{ 
                              color: darkMode ? '#fff' : 'inherit',
                              cursor: 'pointer',
                              fontSize: isTablet ? '0.8rem' : '0.875rem',
                              '&:hover': { bgcolor: darkMode ? '#333' : '#f0f0f0' }
                            }}
                            onDoubleClick={() => handleStartEdit(row.id)}
                          >
                            {String(row[colId]).length > (isTablet ? 10 : 20) 
                              ? String(row[colId]).substring(0, isTablet ? 10 : 20) + '...' 
                              : row[colId]}
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center" sx={{ p: isTablet ? 1 : 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {isRowEditing(row.id) ? (
                        <>
                          <Tooltip title="Save">
                            <IconButton 
                              size="small"
                              onClick={() => handleSaveEdit(row.id)}
                              sx={{ bgcolor: '#c8e6c9', color: '#2e7d32' }}
                            >
                              <SaveIcon fontSize={isTablet ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small"
                              onClick={() => handleCancelEdit(row.id)}
                              sx={{ bgcolor: '#ffcdd2', color: '#d32f2f' }}
                            >
                              <CancelIcon fontSize={isTablet ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small"
                              onClick={() => handleStartEdit(row.id)}
                              sx={{ bgcolor: '#f3efef', color: '#470571' }}
                            >
                              <EditIcon fontSize={isTablet ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              onClick={() => setDeleteConfirm({ open: true, id: row.id })}
                              sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}
                            >
                              <DeleteIcon fontSize={isTablet ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: { xs: 1, md: 3 }, pt: 1 }}>
            <TablePagination
              component="div"
              count={filteredRowsCount}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
              sx={{ 
                color: darkMode ? '#fff' : 'purple',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: darkMode ? '#fff' : 'purple',
                  fontSize: isTablet ? '0.8rem' : '0.875rem'
                },
                '& .MuiTablePagination-select': {
                  fontSize: isTablet ? '0.8rem' : '0.875rem'
                }
              }}
            />
          </Box> 
        </TableContainer>
      )}

      {/* Mobile Pagination */}
      {isMobile && (
        <Box sx={{ px: 2, pb: 2 }}>
          <TablePagination
            component="div"
            count={filteredRowsCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ 
              color: darkMode ? '#fff' : 'purple',
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: darkMode ? '#fff' : 'purple',
                fontSize: '0.8rem'
              },
              '& .MuiTablePagination-select': {
                fontSize: '0.8rem'
              }
            }}
          />
        </Box>
      )}

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          mt: 4,
          py: 2,
          textAlign: 'center',
          bgcolor: darkMode ? '#1a1a1a' : '#f0f0f0',
          color: darkMode ? '#fff' : '#470571',
          fontSize: { xs: '0.8rem', md: '0.9rem' },
        }}
      >
        © {new Date().getFullYear()} Dynamic Data Table Manager. All rights reserved.
      </Box>

      {/* Mobile Action Menu */}
      <MobileActionMenu />

      

      {/* Modals */}
      <ColumnManagerModal 
        open={columnModalOpen}
        onClose={() => setColumnModalOpen(false)}
      />
      
      <AddRowModal 
        open={addRowModalOpen}
        onClose={() => setAddRowModalOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirm.open} 
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteConfirm({ open: false, id: null })}
            size={isSmallScreen ? "small" : "medium"}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            size={isSmallScreen ? "small" : "medium"}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar 
        open={!!csvError} 
        autoHideDuration={6000} 
        onClose={() => setCsvError(null)}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <Alert 
          severity="error" 
          onClose={() => setCsvError(null)}
          sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
        >
          {csvError}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => dispatch(setError(null))}
        anchorOrigin={{ 
          vertical: isMobile ? 'top' : 'bottom', 
          horizontal: 'center' 
        }}
      >
        <Alert 
          severity="error" 
          onClose={() => dispatch(setError(null))}
          sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}