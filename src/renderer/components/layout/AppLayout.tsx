import React from 'react';
import { Box } from '@mui/material';
import { AppBar, AppPage } from './AppBar';

interface AppLayoutProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPage, onPageChange, children }: AppLayoutProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#F5F5F5',
      }}
    >
      {/* App Bar */}
      <AppBar currentPage={currentPage} onPageChange={onPageChange} />

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#FFFFFF',
          padding: 2,
          margin: '0 16px 16px 16px',
          borderRadius: '0 4px 4px 4px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}