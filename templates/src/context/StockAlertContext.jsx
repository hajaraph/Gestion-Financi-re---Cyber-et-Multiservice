import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { stockAPI } from '../services/api';
import { useAuth } from './AuthContext';

const StockAlertContext = createContext(null);

export const useStockAlert = () => useContext(StockAlertContext);

export const StockAlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState({ ruptures: [], seuils_bas: [] });
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    const result = await stockAPI.getStockAlerts();
    if (result.success) {
      setAlerts(result.data);
    }
    setLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // Rafraîchir toutes les 5 minutes
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const value = {
    alerts,
    loading,
    refreshAlerts: fetchAlerts,
    totalAlerts: (alerts.ruptures?.length || 0) + (alerts.seuils_bas?.length || 0),
  };

  return (
    <StockAlertContext.Provider value={value}>
      {children}
    </StockAlertContext.Provider>
  );
};
