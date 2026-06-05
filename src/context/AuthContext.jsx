import { createContext, useContext, useState, useEffect } from 'react';

import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('beyond5_user');
    const token = localStorage.getItem('beyond5_access_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      console.log("Login response:", response);
      const { access_token, user } = response;
      
      localStorage.setItem('beyond5_access_token', access_token);
      localStorage.setItem('beyond5_user', JSON.stringify(user));
      setUser(user);
      return { ...response, success: true };
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      const { access_token, user } = response;
      
      localStorage.setItem('beyond5_access_token', access_token);
      localStorage.setItem('beyond5_user', JSON.stringify(user));
      setUser(user);
      return { ...response, success: true };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('beyond5_user');
    localStorage.removeItem('beyond5_access_token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('beyond5_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
