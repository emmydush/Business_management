import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Drawer, 
  IconButton, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Fab,
  Avatar,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  QuestionAnswer as ChatIcon,
  Lightbulb as SuggestionIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

// Chatbot component with AI integration

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
      // Add welcome message if chat is empty
      if (messages.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m your AI business assistant. I can help you with inventory management, sales analysis, customer service, and more. What would you like to know?',
          timestamp: new Date().toISOString()
        }]);
      }
    }
  }, [isOpen, messages.length]);

  const loadSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/chatbot/chat/suggestions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/chatbot/chat', 
        { 
          message: message.trim(),
          history: messages.slice(-10) // Send last 10 messages for context
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to get response from chatbot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const clearChat = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/chatbot/chat/clear', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Chat history cleared! How can I help you today?',
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatMessage = (content) => {
    // Convert newlines to HTML line breaks
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="chat"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          }
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chat Drawer */}
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 400,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'white', color: theme.palette.primary.main }}>
              <BotIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Assistant
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Powered by Gemini AI
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Clear Chat">
              <IconButton 
                size="small" 
                onClick={clearChat}
                sx={{ color: 'white' }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Suggestions */}
          {suggestions.length > 0 && messages.length <= 1 && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
                <SuggestionIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                Suggested questions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    variant="outlined"
                    size="small"
                    clickable
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      fontSize: '0.75rem',
                      height: 'auto',
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'center'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Messages List */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  mb: 2,
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, maxWidth: '80%' }}>
                  {message.role === 'assistant' && (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                      <BotIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: message.role === 'user' 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.grey[100], 0.8),
                      border: message.role === 'user' 
                        ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        : `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                      {formatMessage(message.content)}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Paper>
                  {message.role === 'user' && (
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                  )}
                </Box>
              </Box>
            ))}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, maxWidth: '80%' }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main }}>
                    <BotIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: alpha(theme.palette.grey[100], 0.8),
                      border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                variant="filled"
                placeholder="Ask me anything about your business..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                multiline
                maxRows={3}
                sx={{
                  '& .MuiInputBase-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    '&:before': {
                      borderBottom: '2px solid rgba(0, 0, 0, 0.23)',
                    },
                    '&:hover:before': {
                      borderBottom: '2px solid rgba(0, 0, 0, 0.87)',
                    },
                    '&:after': {
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                    },
                  },
                  '& .MuiInputBase-input': {
                    padding: '12px 14px 8px 14px',
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isLoading}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  borderRadius: 2
                }}
              >
                {isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default Chatbot;
