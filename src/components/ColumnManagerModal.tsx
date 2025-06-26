// components/ColumnManagerModal.tsx
"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControlLabel, Checkbox, Typography, Box, TextField,
  MenuItem, Select, FormControl, InputLabel, Divider,
  List, ListItem, ListItemText, ListItemIcon
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import { AppDispatch } from "../store";
import {
  toggleColumnVisibility, addColumn, reorderColumns,
  TableColumn
} from "../store/slices/tableSlice";
import {
  selectColumns, selectVisibleColumns, selectDarkMode
} from "../store/selectors/tableSelectors";

interface ColumnManagerModalProps {
  open: boolean;
  onClose: () => void;
}

interface NewColumnForm {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email';
}

export default function ColumnManagerModal({ open, onClose }: ColumnManagerModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const columns = useSelector(selectColumns);
  const visibleColumns = useSelector(selectVisibleColumns);
  const darkMode = useSelector(selectDarkMode);

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<NewColumnForm>({
    defaultValues: {
      id: '',
      label: '',
      type: 'text'
    }
  });

  const handleToggleColumn = (columnId: string) => {
    dispatch(toggleColumnVisibility(columnId));
  };

  const handleAddColumn = (data: NewColumnForm) => {
    const id = data.id || data.label.toLowerCase().replace(/\s+/g, '_');
    if (columns.find(col => col.id === id)) {
      alert('Column with this ID already exists!');
      return;
    }

    const newColumn: TableColumn = {
      id,
      label: data.label,
      type: data.type,
      required: false
    };

    dispatch(addColumn(newColumn));
    reset();
    setShowAddColumn(false);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null) return;
    const reorderedColumns = [...visibleColumns];
    const draggedColumn = reorderedColumns.splice(draggedIndex, 1)[0];
    reorderedColumns.splice(dropIndex, 0, draggedColumn);
    dispatch(reorderColumns(reorderedColumns));
    setDraggedIndex(null);
  };

  const handleClose = () => {
    setShowAddColumn(false);
    reset();
    onClose();
  };

  const purple = '#581b7f';
  const darkPurple = '#470571';
  const hoverBg = darkMode ? '#311547' : '#f3e8fc';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#121212' : '#ffffff',
          color: darkMode ? '#fff' : '#333',
          borderRadius: 3,
          boxShadow: 6,
          p: 2
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
        Manage Columns
      </DialogTitle>

      <DialogContent>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Column Visibility
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          {columns.map(column => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={visibleColumns.includes(column.id)}
                  onChange={() => handleToggleColumn(column.id)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>{column.label}</Typography>
                  {column.required && <Typography variant="caption" color="error">(Required)</Typography>}
                </Box>
              }
              sx={{ flex: '0 0 48%' }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Reorder Visible Columns
        </Typography>
        <List>
          {visibleColumns.map((columnId, index) => {
            const column = columns.find(c => c.id === columnId);
            if (!column) return null;
            return (
              <ListItem
                key={columnId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(index)}
                sx={{
                  bgcolor: darkMode ? '#1e1e1e' : '#f5f5f5',
                  borderRadius: 2,
                  mb: 1,
                  boxShadow: 1,
                  cursor: 'grab',
                  px: 2
                }}
              >
                <ListItemIcon><DragIndicatorIcon /></ListItemIcon>
                <ListItemText primary={column.label} />
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight="bold">
            ➕ Add New Section
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddColumn(prev => !prev)}
            sx={{
              color: darkMode ? "#fff ": purple,
              borderColor: darkMode ? "#fff" : purple,
              '&:hover': {
                borderColor: darkPurple,
                backgroundColor: hoverBg
              }
            }}
          >
            {showAddColumn ? 'Cancel' : 'Add Section'}
          </Button>
        </Box>

        {showAddColumn && (
          <Box component="form" onSubmit={handleSubmit(handleAddColumn)}>
            <Controller
              name="label"
              control={control}
              rules={{ required: 'Column label is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Column Label"
                  fullWidth
                  margin="dense"
                  error={!!errors.label}
                  helperText={errors.label?.message}
                />
              )}
            />

            <Controller
              name="id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Column ID (optional)"
                  fullWidth
                  margin="dense"
                  helperText="Leave empty to auto-generate from label"
                />
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="dense">
                  <InputLabel>Data Type</InputLabel>
                  <Select {...field} label="Data Type">
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Box mt={2} display="flex" gap={2} justifyContent="flex-end">
              <Button 
                type="submit" 
                variant="contained"
                sx={{
                  bgcolor:darkMode ? "#fff ": purple,
                  '&:hover': {
                    bgcolor: darkMode ?  purple: "#ffffff "
                  }
                }}
              >
                Add Column
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setShowAddColumn(false)}
                sx={{
                  color: purple,
                  borderColor: purple,
                  '&:hover': {
                    borderColor: darkPurple,
                    backgroundColor: hoverBg
                  }
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose} 
          variant="contained"
          sx={{
            bgcolor: purple,
            '&:hover': {
              bgcolor: darkPurple
            }
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
