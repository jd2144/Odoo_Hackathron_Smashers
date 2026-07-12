import { apiClient } from './apiClient';
import { ResourceBooking } from '../types';

export const bookingApi = {
  getBookings: async (): Promise<ResourceBooking[]> => {
    const response = await apiClient.get<ResourceBooking[]>('/api/bookings');
    return response.data;
  },

  getBookingsByAsset: async (assetId: string): Promise<ResourceBooking[]> => {
    const response = await apiClient.get<ResourceBooking[]>(`/api/assets/${assetId}/bookings`);
    return response.data;
  },

  createBooking: async (data: Omit<ResourceBooking, 'id' | 'bookedById' | 'bookedByName' | 'status'>): Promise<ResourceBooking> => {
    const response = await apiClient.post<ResourceBooking>('/api/bookings', data);
    return response.data;
  },

  updateBooking: async (id: string, data: Partial<ResourceBooking>): Promise<ResourceBooking> => {
    const response = await apiClient.patch<ResourceBooking>(`/api/bookings/${id}`, data);
    return response.data;
  },

  cancelBooking: async (id: string): Promise<void> => {
    // Both PATCH /api/bookings/{id} with status: 'Cancelled' or a direct cancel call might be used by the backend
    await apiClient.patch(`/api/bookings/${id}`, { status: 'Cancelled' });
  },
};
