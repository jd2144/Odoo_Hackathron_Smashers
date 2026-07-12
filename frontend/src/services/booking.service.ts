import { MockDatabase } from './mockDb';
import { ResourceBooking } from '../types';

const DELAY = 500;

export const bookingService = {
  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/bookings
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: ResourceBooking[]
  // }
  //
  // API endpoint name: Get Bookings
  // Method: GET
  // Request DTO: None
  // Response DTO: ResourceBooking[]
  // Expected Status Codes: 200 OK, 401 Unauthorized
  getBookings: (): Promise<ResourceBooking[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookings = MockDatabase.getBookings();
        // Sort by start date ascending
        const sorted = [...bookings].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        resolve(sorted);
      }, 300);
    });
  },

  // BACKEND API
  //
  // Method: GET
  //
  // Endpoint: /api/assets/:assetId/bookings
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: ResourceBooking[]
  // }
  //
  // API endpoint name: Get Bookings By Asset ID
  // Method: GET
  // Request DTO: { assetId: string }
  // Response DTO: ResourceBooking[]
  // Expected Status Codes: 200 OK, 401 Unauthorized, 404 Not Found
  getBookingsByAsset: (assetId: string): Promise<ResourceBooking[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookings = MockDatabase.getBookings();
        const filtered = bookings.filter(b => b.assetId === assetId && b.status !== 'Cancelled');
        resolve(filtered);
      }, 300);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/bookings
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: ResourceBooking
  // }
  //
  // API endpoint name: Create Booking
  // Method: POST
  // Request DTO: Omit<ResourceBooking, 'id' | 'bookedById' | 'bookedByName' | 'status'>
  // Response DTO: ResourceBooking
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 409 Conflict (Overlap)
  createBooking: (bookingData: Omit<ResourceBooking, 'id' | 'bookedById' | 'bookedByName' | 'status'>): Promise<ResourceBooking> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required to book resources.'));
          return;
        }

        const assets = MockDatabase.getAssets();
        const asset = assets.find(a => a.id === bookingData.assetId);
        if (!asset) {
          reject(new Error('Shared resource not found.'));
          return;
        }

        if (!asset.sharedBookable) {
          reject(new Error('This asset is not marked as a shared, bookable resource.'));
          return;
        }

        const newStart = new Date(bookingData.startTime).getTime();
        const newEnd = new Date(bookingData.endTime).getTime();

        if (isNaN(newStart) || isNaN(newEnd)) {
          reject(new Error('Invalid booking times provided.'));
          return;
        }

        if (newStart >= newEnd) {
          reject(new Error('The start time must occur before the end time.'));
          return;
        }

        // Overlap Validation: Check all existing active bookings for this asset
        const existingBookings = MockDatabase.getBookings().filter(
          b => b.assetId === bookingData.assetId && b.status !== 'Cancelled'
        );

        const overlap = existingBookings.find(b => {
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          // Overlap check formula: (StartA < EndB) and (EndA > StartB)
          return newStart < bEnd && newEnd > bStart;
        });

        if (overlap) {
          const formatter = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const oStart = formatter.format(new Date(overlap.startTime));
          const oEnd = formatter.format(new Date(overlap.endTime));

          reject(new Error(
            `OVERLAP CONFLICT: "${asset.name}" is already booked by ${overlap.bookedByName} from ${oStart} to ${oEnd}. Please select another time slot.`
          ));
          return;
        }

        // Create booking
        const newBooking: ResourceBooking = {
          ...bookingData,
          id: MockDatabase.generateId('b'),
          bookedById: currentUser.id,
          bookedByName: currentUser.name,
          status: 'Upcoming'
        };

        const bookings = MockDatabase.getBookings();
        MockDatabase.saveBookings([...bookings, newBooking]);

        // Audit Trail
        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Book Resource', 
          `Booked shared resource: ${asset.name} for ${bookingData.startTime} - ${bookingData.endTime}`
        );

        MockDatabase.addNotification(
          'Booking Confirmed',
          `Your reservation for "${asset.name}" has been confirmed for ${new Date(bookingData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`,
          'Booking Confirmed'
        );

        resolve(newBooking);
      }, DELAY);
    });
  },

  // BACKEND API
  //
  // Method: POST
  //
  // Endpoint: /api/bookings/:id/cancel
  //
  // Authentication: JWT Required
  //
  // Expected Response:
  //
  // {
  //    success: true,
  //    data: null
  // }
  //
  // API endpoint name: Cancel Booking
  // Method: POST
  // Request DTO: { id: string }
  // Response DTO: None (void)
  // Expected Status Codes: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
  cancelBooking: (bookingId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const bookings = MockDatabase.getBookings();
        const bIndex = bookings.findIndex(b => b.id === bookingId);
        if (bIndex === -1) {
          reject(new Error('Booking record not found.'));
          return;
        }

        const booking = bookings[bIndex];
        const currentUser = MockDatabase.getCurrentUser();
        if (!currentUser) {
          reject(new Error('Authentication required.'));
          return;
        }

        // Allow cancellation if user is admin, manager, or the person who booked it
        if (currentUser.role !== 'Admin' && currentUser.role !== 'Asset Manager' && currentUser.id !== booking.bookedById) {
          reject(new Error('Permission denied. You can only cancel your own bookings.'));
          return;
        }

        bookings[bIndex] = {
          ...booking,
          status: 'Cancelled'
        };
        MockDatabase.saveBookings(bookings);

        const assets = MockDatabase.getAssets();
        const asset = assets.find(a => a.id === booking.assetId);
        const assetName = asset ? asset.name : 'Shared Resource';

        MockDatabase.logAction(
          currentUser.id, 
          currentUser.name, 
          'Cancel Booking', 
          `Cancelled booking ID ${bookingId} for ${assetName}`
        );

        MockDatabase.addNotification(
          'Booking Cancelled',
          `Booking for "${assetName}" starting on ${new Date(booking.startTime).toLocaleDateString()} has been cancelled.`,
          'Booking Cancelled'
        );

        resolve();
      }, DELAY);
    });
  }
};
