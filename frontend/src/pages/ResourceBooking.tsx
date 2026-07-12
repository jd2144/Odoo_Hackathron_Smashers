import * as React from 'react';
import { CalendarRange, Clock, AlertTriangle, User, ShieldAlert, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { bookingService } from '../services/booking.service';
import { assetService } from '../services/asset.service';
import { ResourceBooking, Asset } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Resource Booking Scheduler
//
// API Endpoints Required:
// 1. GET /api/bookings
//    - Authentication: JWT Required
//    - Response: ResourceBooking[]
// 
// 2. GET /api/assets?sharedBookable=true
//    - Authentication: JWT Required
//    - Response: Asset[] (All shared bookable resources)
// 
// 3. POST /api/bookings
//    - Authentication: JWT Required
//    - Request Body: { assetId: string, startTime: string, endTime: string, notes: string }
//    - Response: ResourceBooking
// 
// 4. DELETE /api/bookings/:id
//    - Authentication: JWT Required
//    - Response: { success: true }
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 409: Conflict (If timeslots overlap/intersect)
// - Standard 400: Bad Request (Validation errors)
// ==============================

export const ResourceBookingPage: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/bookings
  const [bookings, setBookings] = React.useState<ResourceBooking[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/assets?sharedBookable=true
  const [resources, setResources] = React.useState<Asset[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  // Booking states
  const [showForm, setShowForm] = React.useState(false);
  const [selectedAssetId, setSelectedAssetId] = React.useState('');
  const [bookingDate, setBookingDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [notes, setNotes] = React.useState('');

  const loadBookingPool = async () => {
    setIsLoading(true);
    try {
      const [allBookings, allAssets] = await Promise.all([
        bookingService.getBookings(),
        assetService.getAssets({ sharedBookable: true })
      ]);
      setBookings(allBookings);
      setResources(allAssets);
    } catch (e) {
      toast.error('Failed to load scheduling logs.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadBookingPool();
  }, []);

  // BACKEND API
  // Method: POST
  // Endpoint: /api/bookings
  // Authentication: JWT Required
  // Request DTO: { assetId: string, startTime: string, endTime: string, notes: string }
  // Response DTO: ResourceBooking
  // Expected Status Codes: 201 Created, 400 Bad Request, 401 Unauthorized, 409 Conflict
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !bookingDate || !startTime || !endTime) {
      toast.error('Please specify the resource, date, and complete timeslot.');
      return;
    }

    const startIso = `${bookingDate}T${startTime}:00Z`;
    const endIso = `${bookingDate}T${endTime}:00Z`;

    try {
      await bookingService.createBooking({
        assetId: selectedAssetId,
        startTime: startIso,
        endTime: endIso,
        notes: notes || 'Corporate group reservation.'
      });
      toast.success('Reservation successfully logged!');
      
      // Reset forms
      setSelectedAssetId('');
      setBookingDate('');
      setStartTime('');
      setEndTime('');
      setNotes('');
      setShowForm(false);
      loadBookingPool();
    } catch (error: any) {
      // Overlap validation message is returned in error.message!
      toast.error(error.message || 'Overlap verification failed.');
    }
  };

  // BACKEND API
  // Method: DELETE
  // Endpoint: /api/bookings/:id
  // Authentication: JWT Required
  // Expected Status Codes: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found
  const handleCancelBooking = async (id: string) => {
    try {
      await bookingService.cancelBooking(id);
      toast.success('Reservation cancelled.');
      loadBookingPool();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel reservation.');
    }
  };

  const getResourceName = (assetId: string) => {
    const res = resources.find(r => r.id === assetId);
    return res ? res.name : 'Shared Resource';
  };

  const formatSlotTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatSlotDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Syncing scheduling calendars...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Resource Booking Scheduler</h1>
          <p className="text-xs text-brand-muted">Book shared corporate physical resources by specific timeslots with strict real-time overlap checking.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="cursor-pointer">
          <CalendarRange className="h-4 w-4 mr-1.5" />
          {showForm ? 'Cancel Scheduler' : 'Book Shared Resource'}
        </Button>
      </div>

      {/* Scheduler Form */}
      {showForm && (
        <Card className="border-brand-primary/20 bg-brand-primary/5 animate-slide-down">
          <CardHeader>
            <CardTitle className="text-xs">Schedule Time slot reservation</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {/* TODO(BACKEND): Form Submission handler for Timeslot bookings */}
            <form onSubmit={handleCreateBooking} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-brand-text/80 uppercase tracking-wider">Select Resource *</label>
                <select
                  className="w-full px-3.5 py-2 text-sm bg-white border border-brand-border rounded-lg outline-none focus:border-brand-primary"
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                >
                  <option value="">Select Resource...</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} (Placement: {r.location})</option>
                  ))}
                </select>
              </div>

              <Input
                type="date"
                label="Reservation Date *"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />

              <Input
                type="time"
                label="Start Time *"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />

              <Input
                type="time"
                label="End Time *"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />

              <div className="sm:col-span-2 md:col-span-3">
                <Input
                  label="Purpose / Reservation Notes"
                  placeholder="e.g. Q3 Design Iteration Sync with external executives."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="submit" className="w-full cursor-pointer font-bold">Reserve Time slot</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid split: Active bookings, Scheduler calendar list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reservation Schedule Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Schedules Queue ({bookings.filter(b => b.status !== 'Cancelled').length})</span>
          
          {/* ==============================
              BACKEND INTEGRATION
              List Render: Booking Scheduler list
              Endpoint: GET /api/bookings
              Returns: ResourceBooking[]
              ============================== */}
          <div className="space-y-3">
            {bookings.filter(b => b.status !== 'Cancelled').length === 0 ? (
              <div className="p-12 text-center text-xs text-brand-muted border border-dashed border-brand-border rounded-xl bg-white">
                No upcoming active resource bookings.
              </div>
            ) : (
              bookings.filter(b => b.status !== 'Cancelled').map(b => (
                <Card key={b.id} className="hover-lift bg-white">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex flex-col items-center justify-center text-indigo-600 flex-shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-brand-text truncate">{getResourceName(b.assetId)}</span>
                        <p className="text-xs text-brand-muted truncate font-medium italic">"{b.notes}"</p>
                        <span className="text-[10px] text-brand-muted font-mono mt-1">Booked by: {b.bookedByName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5 flex-shrink-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-text">
                        <span>{formatSlotDate(b.startTime)}</span>
                        <span className="text-brand-muted">|</span>
                        <span>{formatSlotTime(b.startTime)} - {formatSlotTime(b.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={b.status === 'Upcoming' ? 'status-reserved' : 'status-allocated'}>
                          {b.status}
                        </Badge>
                        {/* TODO(BACKEND): Cancel Booking trigger */}
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          title="Cancel Booking"
                          className="text-brand-danger hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Calendar Side Panel / Conflict Rules Info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Overlap Control Rules</span>
          <Card className="bg-white">
            <CardContent className="p-5 flex flex-col gap-3.5 text-xs text-brand-text">
              <div className="flex items-center gap-2 font-bold text-brand-primary border-b border-brand-border pb-2">
                <CheckCircle className="h-4 w-4" />
                <span>Strict Timeslot Policies</span>
              </div>
              <p className="leading-relaxed text-brand-muted">
                Our scheduler features real-time transactional conflict locking. Overlaps are blocked strictly.
              </p>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2 text-[11px] text-amber-800 leading-relaxed">
                <AlertTriangle className="h-4.5 w-4.5 text-brand-warning flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Timeslot Boundary Rule:</strong> A booking from 09:00 - 10:00 is fine if the next starts at exactly 10:00. However, requests intersecting by even 1 minute (e.g. 09:30 - 10:30) are blocked instantly.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default ResourceBookingPage;
