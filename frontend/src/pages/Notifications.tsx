import * as React from 'react';
import { motion } from 'motion/react';
import { Bell, Trash2, CheckCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { notificationApi } from '../api/notificationApi';
import { apiClient } from '../api/apiClient';
import { Notification, AuditLog } from '../types';
import toast from 'react-hot-toast';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [view, setView] = React.useState<'notifications' | 'audit_trail'>('notifications');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchLogsAndNotifs = async () => {
    setIsLoading(true);
    try {
      const allNotifs = await notificationApi.getNotifications();
      let allLogs: AuditLog[] = [];
      try {
        const logRes = await apiClient.get<AuditLog[]>('/api/audits/logs');
        allLogs = logRes.data;
      } catch {
        // Fallback or empty logs
      }
      setNotifications(allNotifs);
      setLogs(allLogs);
    } catch (e) {
      toast.error('Failed to pull notifications list.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchLogsAndNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      toast.success('Marked all as read.');
      fetchLogsAndNotifs();
    } catch {
      toast.error('Failed to mark notifications as read.');
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.delete('/api/notifications');
      toast.success('Cleared notification list.');
      fetchLogsAndNotifs();
    } catch {
      toast.error('Failed to clear notifications.');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 text-[10px] font-black text-sahara-gold uppercase tracking-widest">
        Loading feed streams...
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sahara-coffee">Notifications & Logs</h1>
          <p className="text-xs text-sahara-clay/70 font-semibold leading-relaxed">Read direct system alerts and inspect corporate operational audit trails.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'notifications' && notifications.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="cursor-pointer text-[10px] uppercase tracking-wider font-extrabold py-2 px-3 rounded-lg border-sahara-sand/25">
                <CheckCheck className="h-4 w-4 mr-1.5 text-sahara-gold" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearAll} className="cursor-pointer text-[10px] uppercase tracking-wider font-extrabold py-2 px-3 rounded-lg text-sahara-danger border-sahara-danger/25 hover:bg-sahara-danger/10">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear list
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Toggle Row */}
      <div className="flex border-b border-sahara-sand/15 gap-2">
        <button
          onClick={() => setView('notifications')}
          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2
            ${view === 'notifications' ? 'border-sahara-gold text-sahara-gold' : 'border-transparent text-sahara-clay/65 hover:text-sahara-coffee'}
          `}
        >
          <Bell className="h-4 w-4" />
          Unread Alerts ({unreadCount})
        </button>
        <button
          onClick={() => setView('audit_trail')}
          className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-2
            ${view === 'audit_trail' ? 'border-sahara-gold text-sahara-gold' : 'border-transparent text-sahara-clay/65 hover:text-sahara-coffee'}
          `}
        >
          <ShieldAlert className="h-4 w-4" />
          ERP Audit Trail ({logs.length})
        </button>
      </div>

      {/* Render panel */}
      <div className="max-w-4xl w-full">
        {view === 'notifications' ? (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card className="bg-white/50 border-dashed border-sahara-sand/30 p-12 text-center rounded-2xl">
                <CardContent className="p-0 text-xs text-sahara-clay/60 font-semibold leading-relaxed">
                  No active system alerts or notifications found.
                </CardContent>
              </Card>
            ) : (
              notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card 
                    className={`bg-white/80 backdrop-blur-md hover:border-sahara-gold/30 transition-all rounded-2xl shadow-xs
                      ${!n.isRead ? 'border-l-4 border-l-sahara-gold' : 'border-l-4 border-l-sahara-sand/20'}
                    `}
                  >
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border
                        ${n.type.includes('Overdue') ? 'bg-sahara-danger/10 text-sahara-danger border-sahara-danger/20' :
                          n.type.includes('Approved') ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' :
                          n.type.includes('Booking') ? 'bg-sahara-light text-sahara-gold border-sahara-sand/20' : 'bg-sahara-light text-sahara-gold border-sahara-sand/20'}
                      `}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <strong className="text-xs font-black text-sahara-coffee truncate leading-snug">{n.title}</strong>
                          <span className="text-[9px] text-sahara-clay/60 font-mono font-bold uppercase tracking-wider">{new Date(n.createdDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-sahara-clay/80 font-medium italic leading-relaxed">"{n.message}"</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md border border-sahara-sand/15 rounded-2xl shadow-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-sahara-sand/10 min-w-[650px]">
              <thead className="bg-sahara-light/30 font-bold text-sahara-clay uppercase tracking-widest text-[9px] border-b border-sahara-sand/15">
                <tr>
                  <th className="px-6 py-4.5">Actor</th>
                  <th className="px-6 py-4.5">Action</th>
                  <th className="px-6 py-4.5">Details</th>
                  <th className="px-6 py-4.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sahara-sand/10 text-sahara-coffee font-mono text-[11px] font-semibold">
                {logs.map((log, index) => (
                  <motion.tr 
                    key={log.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="luxury-table-row hover:bg-sahara-sand/5"
                  >
                    <td className="px-6 py-4 font-sans font-extrabold text-sahara-coffee">
                      {log.actorName}
                    </td>
                    <td className="px-6 py-4 text-sahara-gold font-extrabold uppercase text-[10px] tracking-wider">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sahara-clay truncate max-w-xs" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right text-sahara-clay/60 text-[10px]">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;
