import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MovieRecommendation from './MovieRecommendation';
import axios from 'axios';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      // Replace with your TMDB API key and endpoint
      const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(userMessage)}`
      );

      if (response.data.results.length > 0) {
        const movie = response.data.results[0];
        const recommendationsResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=${TMDB_API_KEY}`
        );

        const recommendations = recommendationsResponse.data.results.slice(0, 5);
        setMessages(prev => [
          ...prev,
          {
            text: `Based on "${movie.title}", here are some recommendations:`,
            sender: 'bot',
            recommendations: recommendations
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { text: "I couldn't find that movie. Please try another one!", sender: 'bot' }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          mb: 2,
          p: 2,
          overflow: 'auto',
          bgcolor: 'grey.100',
          borderRadius: 2
        }}
      >
        <List>
          {messages.map((message, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.sender === 'user' ? 'primary.light' : 'white',
                  color: message.sender === 'user' ? 'white' : 'inherit',
                }}
              >
                <Typography>{message.text}</Typography>
                {message.recommendations && (
                  <Box sx={{ mt: 2 }}>
                    <MovieRecommendation recommendations={message.recommendations} />
                  </Box>
                )}
              </Paper>
            </ListItem>
          ))}
          {loading && (
            <ListItem>
              <CircularProgress size={20} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Enter a movie title..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatInterface; 