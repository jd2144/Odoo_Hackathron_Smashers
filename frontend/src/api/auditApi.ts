import { apiClient } from './apiClient';
import { AuditCycle, AuditItem } from '../types';

export const auditApi = {
  getAudits: async (): Promise<AuditCycle[]> => {
    const response = await apiClient.get<AuditCycle[]>('/api/audits');
    return response.data;
  },

  getAuditItems: async (): Promise<AuditItem[]> => {
    // In some backends, it can be /api/audits/items or query on /api/audits
    const response = await apiClient.get<AuditItem[]>('/api/audits/items');
    return response.data;
  },

  createAudit: async (name: string): Promise<AuditCycle> => {
    const response = await apiClient.post<AuditCycle>('/api/audits', { name });
    return response.data;
  },

  scanAuditItem: async (auditId: string, itemId: string, status: 'Verified' | 'Missing' | 'Damaged'): Promise<AuditItem> => {
    const response = await apiClient.post<AuditItem>(`/api/audits/${auditId}/scan`, {
      itemId,
      status,
    });
    return response.data;
  },

  reviewAudit: async (auditId: string): Promise<any> => {
    const response = await apiClient.post<any>(`/api/audits/${auditId}/review`);
    return response.data;
  },

  closeAudit: async (auditId: string): Promise<AuditCycle> => {
    const response = await apiClient.post<AuditCycle>(`/api/audits/${auditId}/close`);
    return response.data;
  },
};
