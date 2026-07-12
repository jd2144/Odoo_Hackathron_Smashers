import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarRange, Clock, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { bookingService } from '../services/booking.service';
import { assetService } from '../services/asset.service';
import { ResourceBooking, Asset } from '../types';
import toast from 'react-hot-toast';

export const ResourceBookingPage: React.FC = () => {
  const [bookings, setBookings] = React.useState<ResourceBooking[]>([]);
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
      
      setSelectedAssetId('');
      setBookingDate('');
      setStartTime('');
      setEndTime('');
      setNotes('');
      setShowForm(false);
      loadBookingPool();
    } catch (error: any) {
      toast.error(error.message || 'Overlap verification failed.');
    }
  };

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
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Syncing scheduling calendars...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Resource Booking Scheduler</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Book shared corporate physical resources by specific timeslots with strict real-time overlap check locking.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="cursor-pointer rounded-xl text-xs uppercase tracking-wider font-bold">
          <CalendarRange className="h-4 w-4 mr-1.5" />
          {showForm ? 'Cancel Scheduler' : 'Book Shared Resource'}
        </Button>
      </div>

      {/* Scheduler Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          className="overflow-hidden"
        >
          <Card className="border-sahara-sand/35 bg-sahara-light/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-[10px]">Schedule Timeslot Reservation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleCreateBooking} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-sahara-clay/90 uppercase tracking-widest pl-0.5">Select Resource *</label>
                  <select
                    className="w-full px-4 py-2.5 text-sm bg-white/60 border border-sahara-sand/35 rounded-xl outline-none focus:border-sahara-gold focus:ring-4 focus:ring-sahara-gold/10 text-sahara-coffee font-semibold cursor-pointer transition-all"
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
                  className="bg-white/60"
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />

                <Input
                  type="time"
                  label="Start Time *"
                  value={startTime}
                  className="bg-white/60"
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />

                <Input
                  type="time"
                  label="End Time *"
                  value={endTime}
                  className="bg-white/60"
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />

                <div className="sm:col-span-2 md:col-span-3">
                  <Input
                    label="Purpose / Reservation Notes"
                    placeholder="e.g. Q3 Design Iteration Sync with external executives."
                    value={notes}
                    className="bg-white/60"
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="submit" className="w-full cursor-pointer text-xs font-extrabold uppercase tracking-wider rounded-xl py-3 shadow-md">Reserve Timeslot</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Grid split: Active bookings, Scheduler calendar list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Reservation Schedule Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Schedules Queue ({bookings.filter(b => b.status !== 'Cancelled').length})</span>
          
          <div className="space-y-4">
            {bookings.filter(b => b.status !== 'Cancelled').length === 0 ? (
              <Card className="bg-white/50 border-dashed border-sahara-sand/30 p-12 text-center flex flex-col items-center gap-3 shadow-xs rounded-2xl">
                <p className="text-xs text-sahara-clay/60 font-semibold leading-relaxed">No upcoming active resource bookings.</p>
              </Card>
            ) : (
              bookings.filter(b => b.status !== 'Cancelled').map((b, index) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="silk-card bg-white/80 hover:border-sahara-gold/30 shadow-sm border-l-4 border-l-sahara-gold">
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-sahara-light border border-sahara-sand/20 flex flex-col items-center justify-center text-sahara-gold flex-shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-extrabold text-sm text-sahara-coffee truncate">{getResourceName(b.assetId)}</span>
                          <p className="text-xs text-sahara-clay/80 truncate font-semibold italic mt-0.5">"{b.notes}"</p>
                          <span className="text-[9px] text-sahara-clay/65 font-bold uppercase tracking-wider mt-1.5 font-mono">Booked by: {b.bookedByName}</span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-sahara-coffee">
                          <span>{formatSlotDate(b.startTime)}</span>
                          <span className="text-sahara-sand">|</span>
                          <span>{formatSlotTime(b.startTime)} - {formatSlotTime(b.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Badge variant={b.status === 'Upcoming' ? 'status-reserved' : 'status-allocated'} className="font-extrabold">
                            {b.status}
                          </Badge>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            title="Cancel Booking"
                            className="text-sahara-danger hover:bg-sahara-danger/10 p-1.5 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-sahara-danger/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Calendar Side Panel / Conflict Rules Info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <span className="text-[10px] font-black text-sahara-clay/60 uppercase tracking-widest pl-0.5">Overlap Control Rules</span>
          <Card className="bg-white/80 shadow-md">
            <CardContent className="p-6 flex flex-col gap-4 text-xs text-sahara-clay/80">
              <div className="flex items-center gap-2 font-black text-sahara-coffee border-b border-sahara-sand/10 pb-3 uppercase tracking-widest text-[10px]">
                <CheckCircle className="h-4 w-4 text-sahara-gold" />
                <span>Strict Timeslot Policies</span>
              </div>
              <p className="leading-relaxed font-semibold">
                Our booking coordinator utilizes atomic transaction concurrency checks. Schedules overlapping even by 1 second are completely blocked to guarantee clear resource ownership.
              </p>
              <div className="bg-sahara-light/40 border border-sahara-sand/30 rounded-xl p-4 flex gap-3 text-[11px] text-[#7F5539] leading-relaxed font-semibold shadow-xs">
                <AlertTriangle className="h-5 w-5 text-sahara-gold flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-sahara-coffee">Timeslot Boundary Rule:</strong> A booking from 09:00 - 10:00 is fine if the next starts at exactly 10:00. Overlapping durations are restricted with zero grace period.
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
