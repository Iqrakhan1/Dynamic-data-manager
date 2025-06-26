// app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { store, persistor } from '../store';
import { useSelector } from 'react-redux';
import { selectDarkMode } from '../store/selectors/tableSelectors';
import { CircularProgress, Box } from '@mui/material';

const inter = Inter({ subsets: ['latin'] });

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const darkMode = useSelector(selectDarkMode);
  
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#fafafa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: inter.style.fontFamily,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Dynamic Data Table Manager</title>
        <meta name="description" content="A powerful data table manager built with Next.js, Redux, and Material-UI" />
      </head>
      <body className={inter.className}>
        <Provider store={store}>
          <PersistGate 
            loading={
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="100vh"
              >
                <CircularProgress />
              </Box>
            } 
            persistor={persistor}
          >
            <ThemeWrapper>
              {children}
            </ThemeWrapper>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}