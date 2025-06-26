// app/page.tsx
"use client";

import DataTable from '../components/DataTable';
import { Box, Container } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth={false} disableGutters>
      <DataTable />
    </Container>
  );
}