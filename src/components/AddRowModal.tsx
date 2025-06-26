// components/AddRowModal.tsx
"use client";

import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Box, Typography
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { AppDispatch } from "../store";
import { addRow, TableRow } from "../store/slices/tableSlice";
import { selectColumns, selectDarkMode } from "../store/selectors/tableSelectors";

interface AddRowModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddRowModal({ open, onClose }: AddRowModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const columns = useSelector(selectColumns);
  const darkMode = useSelector(selectDarkMode);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: columns.reduce((acc, col) => {
      acc[col.id] = col.type === 'number' ? 0 : '';
      return acc;
    }, {} as any)
  });

  const handleAddRow = (data: any) => {
    const newRow: Omit<TableRow, 'id'> = {
      name: data.name || '',
      email: data.email || '',
      age: parseInt(data.age) || 0,
      role: data.role || '',
      department: data.department || '',
      location: data.location || '',
      ...data
    };

    dispatch(addRow(newRow));
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const getValidationRules = (column: any) => {
    const rules: any = {};
    
    if (column.required) {
      rules.required = `${column.label} is required`;
    }
    
    if (column.type === 'email') {
      rules.pattern = {
        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        message: 'Invalid email address'
      };
    }
    
    if (column.type === 'number') {
      rules.valueAsNumber = true;
      rules.min = {
        value: 0,
        message: 'Value must be positive'
      };
    }
    
    return rules;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: darkMode ? '#1e1e1e' : 'white',
          color: darkMode ? '#fff' : 'inherit'
        }
      }}
    >
      <DialogTitle sx={{ color: darkMode ? '#fff' : 'inherit' }}>
        ➕ Add New User
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: darkMode ? '#ccc' : 'text.secondary' }}>
          Fill in the information for the new row. Required fields are marked with *.
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit(handleAddRow)}>
          {columns.map(column => (
            <Controller
              key={column.id}
              name={column.id}
              control={control}
              rules={getValidationRules(column)}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${column.label}${column.required ? ' *' : ''}`}
                  type={column.type === 'number' ? 'number' : column.type === 'email' ? 'email' : 'text'}
                  fullWidth
                  margin="normal"
                  error={!!errors[column.id]}
                  // helperText={errors[column.id]?.message}
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: darkMode ? '#fff' : 'inherit'
                    },
                    '& .MuiOutlinedInput-root': {
                      color: darkMode ? '#fff' : 'inherit',
                      '& fieldset': {
                        borderColor: darkMode ? '#666' : 'rgba(0,0,0,0.23)'
                      },
                      '&:hover fieldset': {
                        borderColor: darkMode ? '#581b7f' : 'primary.main'
                      }
                    }
                  }}
                />
              )}
            />
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit(handleAddRow)}
          variant="contained"
          color="primary"
        >
          Add Row
        </Button>
      </DialogActions>
    </Dialog>
  );
}