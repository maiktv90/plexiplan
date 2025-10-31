import { useContext } from 'react';
import { UserContext } from '../context/userContextDef';

export const useUserFromContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserFromContext must be used within a UserProvider');
  }
  return context;
};