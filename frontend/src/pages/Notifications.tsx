import * as React from 'react';
import { Bell, Clock, Trash2, CheckCheck, Sliders, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MockDatabase } from '../services/mockDb';
import { Notification, AuditLog } from '../types';
import toast from 'react-hot-toast';

// ==============================
// BACKEND INTEGRATION
// Page: Notifications & ERP Audit Logs Page
//
// API Endpoints Required:
// 1. GET /api/notifications
//    - Authentication: JWT Required
//    - Response: Notification[]
// 
// 2. GET /api/audit-logs
//    - Authentication: JWT Required
//    - Response: AuditLog[]
// 
// 3. POST /api/notifications/read-all
//    - Authentication: JWT Required
//    - Response: { success: true }
// 
// 4. DELETE /api/notifications
//    - Authentication: JWT Required (Clears all notifications for current user)
//    - Response: { success: true }
//
// Error Handling:
// - Standard 401: Unauthorized (Redirect to login)
// - Standard 500: Display toast message "Failed to pull notifications list."
// ==============================

export const NotificationsPage: React.FC = () => {
  // TODO(BACKEND):
  // Replace with API response from GET /api/notifications
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  // TODO(BACKEND):
  // Replace with API response from GET /api/audit-logs
  const [logs, setLogs] = React.useState<AuditLog[]>([]);

  const [view, setView] = React.useState<'notifications' | 'audit_trail'>('notifications');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchLogsAndNotifs = () => {
    setIsLoading(true);
    try {
      const allNotifs = MockDatabase.getNotifications();
      const allLogs = MockDatabase.getAuditLogs();
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

  // BACKEND API
  // Method: POST
  // Endpoint: /api/notifications/read-all
  // Authentication: JWT Required
  // Expected Response: { success: true }
  const handleMarkAllRead = () => {
    const list = MockDatabase.getNotifications();
    const updated = list.map(n => ({ ...n, isRead: true }));
    MockDatabase.saveNotifications(updated);
    toast.success('Marked all as read.');
    fetchLogsAndNotifs();
  };

  // BACKEND API
  // Method: DELETE
  // Endpoint: /api/notifications
  // Authentication: JWT Required
  // Expected Response: { success: true }
  const handleClearAll = () => {
    MockDatabase.saveNotifications([]);
    toast.success('Cleared notification list.');
    fetchLogsAndNotifs();
  };

  if (isLoading) {
    return <div className="text-center py-20 text-xs font-bold text-brand-muted uppercase tracking-wider">Loading feed streams...</div>;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">Notifications & Logs</h1>
          <p className="text-xs text-brand-muted">Read direct system messages and inspect corporate operational audit trails.</p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'notifications' && notifications.length > 0 && (
            <>
              {/* TODO(BACKEND): Mark All as Read Action */}
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="cursor-pointer text-xs font-semibold">
                <CheckCheck className="h-4 w-4 mr-1.5" />
                Mark all read
              </Button>
              {/* TODO(BACKEND): Clear Notifications Action */}
              <Button variant="outline" size="sm" onClick={handleClearAll} className="cursor-pointer text-xs font-semibold text-brand-danger border-red-200 hover:bg-rose-50">
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear list
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Toggle Row */}
      <div className="flex border-b border-brand-border gap-2">
        <button
          onClick={() => setView('notifications')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5
            ${view === 'notifications' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted hover:text-brand-text'}
          `}
        >
          <Bell className="h-4 w-4" />
          Unread Alerts ({unreadCount})
        </button>
        <button
          onClick={() => setView('audit_trail')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5
            ${view === 'audit_trail' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-muted hover:text-brand-text'}
          `}
        >
          <ShieldAlert className="h-4 w-4" />
          ERP Audit Trail ({logs.length})
        </button>
      </div>

      {/* Render panel */}
      <div className="max-w-4xl w-full">
        {view === 'notifications' ? (
          <div className="space-y-3">
            {/* ==============================
                BACKEND INTEGRATION
                List Render: Alerts & Notifications Feed
                Endpoint: GET /api/notifications
                Returns: Notification[]
                ============================== */}
            {notifications.length === 0 ? (
              <Card className="bg-white border-dashed border-brand-border">
                <CardContent className="p-12 text-center text-xs text-brand-muted">
                  No active system alerts or notifications found.
                </CardContent>
              </Card>
            ) : (
              notifications.map(n => (
                <Card 
                  key={n.id} 
                  className={`bg-white hover:border-brand-primary/40 transition-colors
                    ${!n.isRead ? 'border-l-4 border-l-brand-primary' : ''}
                  `}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                      ${n.type.includes('Overdue') ? 'bg-rose-50 text-brand-danger border border-rose-100' :
                        n.type.includes('Approved') ? 'bg-emerald-50 text-brand-success border border-emerald-100' :
                        n.type.includes('Booking') ? 'bg-indigo-50 text-brand-primary border border-indigo-100' : 'bg-amber-50 text-brand-warning border border-amber-100'}
                    `}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <strong className="text-xs font-bold text-brand-text truncate leading-snug">{n.title}</strong>
                        <span className="text-[10px] text-brand-muted font-mono">{new Date(n.createdDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-brand-muted italic leading-relaxed font-medium">"{n.message}"</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* ==============================
              BACKEND INTEGRATION
              Table Render: Corporate Operational Audit Trail
              Endpoint: GET /api/audit-logs
              Returns: AuditLog[]
              ============================== */
          <div className="bg-white border border-brand-border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-brand-border">
              <thead className="bg-gray-50 font-bold text-brand-muted uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Details</th>
                  <th className="px-6 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-brand-text font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 font-sans font-semibold text-brand-text">
                      {log.actorName}
                    </td>
                    <td className="px-6 py-3.5 text-brand-primary font-bold">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5 text-brand-muted truncate max-w-xs" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-3.5 text-right text-brand-muted">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </td>
                  </tr>
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
