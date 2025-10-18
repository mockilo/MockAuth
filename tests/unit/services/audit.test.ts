import { createAuditService } from '../../../src/services/AuditService';
import { AuditLog } from '../../../src/types';

describe('AuditService', () => {
  let auditService: any;

  beforeEach(() => {
    auditService = createAuditService(true);
  });

  describe('Basic Operations', () => {
    it('should create audit service when enabled', () => {
      const service = createAuditService(true);
      expect(service).toBeDefined();
      expect(service?.log).toBeDefined();
      expect(service?.getLogs).toBeDefined();
      expect(service?.getStats).toBeDefined();
    });

    it('should return null when disabled', () => {
      const service = createAuditService(false);
      expect(service).toBeNull();
    });

    it('should log audit events', async () => {
      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user123',
        action: 'user.login',
        resource: 'auth',
        details: { email: 'test@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      };

      await auditService.log(auditLog);
      
      const logs = await auditService.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('user.login');
      expect(logs[0].userId).toBe('user123');
      expect(logs[0].success).toBe(true);
    });

    it('should generate unique IDs for audit logs', async () => {
      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user123',
        action: 'user.login',
        resource: 'auth',
        details: { email: 'test@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      };

      await auditService.log(auditLog);
      await auditService.log(auditLog);
      
      const logs = await auditService.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].id).not.toBe(logs[1].id);
    });
  });

  describe('Filtering Logs', () => {
    beforeEach(async () => {
      // Add some test logs
      await auditService.log({
        userId: 'user1',
        action: 'user.login',
        resource: 'auth',
        details: { email: 'user1@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      await auditService.log({
        userId: 'user2',
        action: 'user.register',
        resource: 'auth',
        details: { email: 'user2@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      await auditService.log({
        userId: 'user1',
        action: 'user.logout',
        resource: 'auth',
        details: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: false,
      });
    });

    it('should filter by userId', async () => {
      const logs = await auditService.getLogs({ userId: 'user1' });
      expect(logs).toHaveLength(2);
      expect(logs.every(log => log.userId === 'user1')).toBe(true);
    });

    it('should filter by action', async () => {
      const logs = await auditService.getLogs({ action: 'user.login' });
      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('user.login');
    });

    it('should filter by resource', async () => {
      const logs = await auditService.getLogs({ resource: 'auth' });
      expect(logs).toHaveLength(3);
      expect(logs.every(log => log.resource === 'auth')).toBe(true);
    });

    it('should filter by success status', async () => {
      const successLogs = await auditService.getLogs({ success: true });
      const failureLogs = await auditService.getLogs({ success: false });
      
      expect(successLogs).toHaveLength(2);
      expect(failureLogs).toHaveLength(1);
      expect(successLogs.every(log => log.success === true)).toBe(true);
      expect(failureLogs.every(log => log.success === false)).toBe(true);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const logs = await auditService.getLogs({
        startDate: oneHourAgo,
        endDate: oneHourFromNow,
      });
      
      expect(logs).toHaveLength(3);
    });

    it('should combine multiple filters', async () => {
      const logs = await auditService.getLogs({
        userId: 'user1',
        success: true,
      });
      
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user1');
      expect(logs[0].success).toBe(true);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      // Add test logs for statistics
      await auditService.log({
        userId: 'user1',
        action: 'user.login',
        resource: 'auth',
        details: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      await auditService.log({
        userId: 'user2',
        action: 'user.register',
        resource: 'auth',
        details: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      await auditService.log({
        userId: 'user1',
        action: 'user.logout',
        resource: 'auth',
        details: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: false,
      });
    });

    it('should return correct statistics', async () => {
      const stats = await auditService.getStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byAction');
      expect(stats).toHaveProperty('byResource');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('recentActivity');
      
      expect(stats.total).toBe(3);
      expect(stats.byAction['user.login']).toBe(1);
      expect(stats.byAction['user.register']).toBe(1);
      expect(stats.byAction['user.logout']).toBe(1);
      expect(stats.byResource['auth']).toBe(3);
      expect(stats.successRate).toBeCloseTo(66.67, 1); // 2 out of 3 successful
    });

    it('should handle empty logs', async () => {
      const emptyService = createAuditService(true);
      expect(emptyService).toBeDefined();
      const stats = await emptyService!.getStats();
      
      expect(stats.total).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.recentActivity).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing optional fields', async () => {
      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        action: 'system.start',
        resource: 'system',
        details: {},
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      };

      await auditService.log(auditLog);
      
      const logs = await auditService.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBeUndefined();
    });

    it('should handle special characters in details', async () => {
      const auditLog: Omit<AuditLog, 'id' | 'timestamp'> = {
        userId: 'user123',
        action: 'data.export',
        resource: 'data',
        details: { 
          filename: 'file with spaces & symbols!.csv',
          size: '1.2MB',
          specialChars: '!@#$%^&*()'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      };

      await auditService.log(auditLog);
      
      const logs = await auditService.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].details).toEqual(auditLog.details);
    });
  });
});
