import React from 'react';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const TypingBubble = styled(Box)(({ theme }) => ({
  backgroundColor: '#f0f2f5',
  padding: theme.spacing(1.5, 2),
  borderRadius: '16px 16px 16px 4px',
  display: 'inline-flex',
  alignItems: 'center',
  maxWidth: 'fit-content',
  alignSelf: 'flex-start',
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  marginBottom: theme.spacing(1)
}));

const Dot = styled('div')(({ theme }) => ({
  width: 8,
  height: 8,
  margin: '0 3px',
  backgroundColor: theme.palette.text.secondary,
  borderRadius: '50%',
  animation: 'bounce 1.3s linear infinite',
  '&:nth-of-type(2)': { animationDelay: '-1.1s' },
  '&:nth-of-type(3)': { animationDelay: '-0.9s' },
  '@keyframes bounce': {
    '0%, 60%, 100%': { transform: 'translateY(0)' },
    '30%': { transform: 'translateY(-4px)' }
  }
}));

const TypingIndicator = () => {
  return (
    <TypingBubble>
      <Dot />
      <Dot />
      <Dot />
    </TypingBubble>
  );
};

export default TypingIndicator;
