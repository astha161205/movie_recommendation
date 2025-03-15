import React, { useState } from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import ChatInterface from './components/ChatInterface';
import './App.css';

function App() {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Movie Recommendation Chatbot
        </Typography>
        <Paper elevation={3} sx={{ p: 2 }}>
          <ChatInterface />
        </Paper>
      </Box>
    </Container>
  );
}

export default App; 