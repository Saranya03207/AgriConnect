import { createContext, useContext, useState, useCallback } from 'react';











const NotificationContext = createContext(undefined);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
    prev.map((n) => n.notificationId === id ? { ...n, isRead: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const addNotification = useCallback((n) => {
    setNotifications((prev) => [n, ...prev]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, setNotifications, markRead, markAllRead, addNotification }}>
      
      {children}
    </NotificationContext.Provider>);

}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}