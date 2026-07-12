import { apiClient } from './apiClient';
import { Notification } from '../types';

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/api/notifications');
    return response.data;
  },

  markNotificationAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/api/notifications/${id}`, {
      isRead: true,
    });
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    const response = await apiClient.patch<{ success: boolean }>('/api/notifications', {
      isRead: true,
    });
    return response.data;
  },
};
