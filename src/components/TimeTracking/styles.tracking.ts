import { styled } from 'styled-components';

// Purple theme colors from V1
export const theme = {
  primary: '#493ed4',
  primaryDark: '#483ed4',
  primaryLight: '#868686',
  borderColor: '#868686',
  borderHoverColor: '#493ed4',
  borderFocusedColor: '#493ed4',
};

// Time display container with pulsing animation
export const TimeContainer = styled.div<{ $isActive: boolean }>`
  font-family: 'Inria Sans', sans-serif;
  font-size: 2rem;
  letter-spacing: 0.4rem;
  color: ${props => props.$isActive ? theme.primary : theme.primaryLight};
  animation: ${(props) =>
    props.$isActive ? `time-pulse 2s infinite` : `unset`};
  user-select: none;
  
  @keyframes time-pulse {
    0% {
      transform: scale(0.95);
    }

    70% {
      transform: scale(1.02);
    }

    100% {
      transform: scale(0.95);
    }
  }
`;

// Button wrapper for centered layout
export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
`;

// Styled card container
export const TrackingCard = styled.div`
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 1rem;
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }
`;

// Tab container with purple theme
export const TabContainer = styled.div`
  .tab-active {
    color: ${theme.primary};
    border-bottom-color: ${theme.primary};
  }
  
  .tab:hover {
    color: ${theme.primaryDark};
  }
`;

// Time entry item styling
export const TimeEntryItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  .time-input {
    border: 1px solid transparent;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-family: 'Inria Sans', monospace;
    
    &:hover {
      border-color: ${theme.borderHoverColor};
    }
    
    &:focus {
      outline: none;
      border-color: ${theme.borderFocusedColor};
      box-shadow: 0 0 0 2px rgba(73, 62, 212, 0.1);
    }
  }
  
  .delete-button {
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .delete-button {
    opacity: 1;
  }
`;

// Booking summary button styling
export const BookingButton = styled.button`
  background: linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px -1px rgba(73, 62, 212, 0.25);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(73, 62, 212, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

// Add icon button styling
export const IconButtonStyled = styled.button`
  color: ${theme.primary};
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
  background: transparent;
  border: none;
  cursor: pointer;
  
  &:hover {
    background: rgba(73, 62, 212, 0.1);
    color: ${theme.primaryDark};
  }
  
  &:active {
    transform: scale(0.95);
  }
`;