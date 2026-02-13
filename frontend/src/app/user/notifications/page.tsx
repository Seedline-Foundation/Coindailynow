/**
 * User Notifications Page
 * Notification preferences and history
 */

'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  Trash2, 
  TrendingUp, 
  Newspaper, 
  AlertTriangle,
  Settings
} from 'lucide-react';

// Mock notifications
const mockNotifications = [
  {
    id: '1',
    type: 'price_alert',
    title: 'BTC Price Alert',
    message: 'Bitcoin has crossed $43,000. Your target price was hit.',
    time: '10 minutes ago',
    read: false,
    icon: TrendingUp,
  },
  {
    id: '2',
    type: 'news',
    title: 'Breaking News',
    message: 'M-Pesa launches cryptocurrency integration in Kenya.',
    time: '1 hour ago',
    read: false,
    icon: Newspaper,
  },
  {
    id: '3',
    type: 'security',
    title: 'Security Alert',
    message: 'New login detected from Lagos, Nigeria.',
    time: '2 hours ago',
    read: true,
    icon: AlertTriangle,
  },
  {
    id: '4',
    type: 'news',
    title: 'Article Published',
    message: 'New article about African crypto exchanges is now live.',
    time: '5 hours ago',
    read: true,
    icon: Newspaper,
  },
];

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Notifications</h1>
          <p className="text-dark-400 mt-1">{unreadCount} unread notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all' 
              ? 'bg-primary-500/10 text-primary-500' 
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            filter === 'unread' 
              ? 'bg-primary-500/10 text-primary-500' 
              : 'text-dark-400 hover:text-white hover:bg-dark-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div
                key={notification.id}
                className={`bg-dark-900 border rounded-xl p-4 flex gap-4 transition-colors ${
                  notification.read ? 'border-dark-700' : 'border-primary-500/30 bg-primary-500/5'
                }`}
              >
                <div className={`p-3 rounded-lg ${
                  notification.type === 'price_alert' ? 'bg-green-500/10 text-green-500' :
                  notification.type === 'security' ? 'bg-yellow-500/10 text-yellow-500' :
                  'bg-primary-500/10 text-primary-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-white">{notification.title}</h3>
                      <p className="text-dark-400 text-sm mt-1">{notification.message}</p>
                      <p className="text-dark-500 text-xs mt-2">{notification.time}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-dark-900 border border-dark-700 rounded-xl p-12 text-center">
          <BellOff className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No notifications</h3>
          <p className="text-dark-400">
            {filter === 'unread' ? "You're all caught up!" : "You don't have any notifications yet."}
          </p>
        </div>
      )}
    </div>
  );
}
