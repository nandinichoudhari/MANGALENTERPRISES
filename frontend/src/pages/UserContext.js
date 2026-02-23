import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiUrl } from '../api';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [ordersCount, setOrdersCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch user orders on login
  const fetchUserOrders = async () => {
    if (!localStorage.getItem('loggedIn') === 'true') return;

    setLoading(true);
    try {
      const phone = localStorage.getItem('phone') || "8866440011";
      const response = await fetch(apiUrl(`/api/orders`), {
        credentials: 'include' // For auth cookies if needed
      });
      const result = await response.json();

      if (result.success) {
        setUser({
          phone: result.user?.phone || phone,
          name: result.user?.name || 'Customer',
          ordersCount: result.orders?.length || 0
        });
        setOrdersCount(result.orders?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const logout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('phone');
    setUser(null);
    setOrdersCount(0);
  };

  return (
    <UserContext.Provider value={{
      user,
      ordersCount,
      loading,
      fetchUserOrders,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};
