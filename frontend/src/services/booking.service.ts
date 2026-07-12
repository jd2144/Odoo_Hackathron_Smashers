import { ResourceBooking } from '../types';
import { bookingApi } from '../api/bookingApi';

export const bookingService = {
  getBookings: async (): Promise<ResourceBooking[]> => {
    return await bookingApi.getBookings();
  },

  getBookingsByAsset: async (assetId: string): Promise<ResourceBooking[]> => {
    return await bookingApi.getBookingsByAsset(assetId);
  },

  createBooking: async (bookingData: Omit<ResourceBooking, 'id' | 'bookedById' | 'bookedByName' | 'status'>): Promise<ResourceBooking> => {
    return await bookingApi.createBooking(bookingData);
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await bookingApi.cancelBooking(bookingId);
  }
};
