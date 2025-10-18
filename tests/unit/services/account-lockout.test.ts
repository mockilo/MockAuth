import { AccountLockoutService } from '../../../src/services/AccountLockoutService';

describe('AccountLockoutService', () => {
  let lockoutService: AccountLockoutService;

  beforeEach(() => {
    lockoutService = new AccountLockoutService();
  });

  describe('Basic Operations', () => {
    it('should initialize with default settings', () => {
      expect(lockoutService).toBeDefined();
    });

    it('should track failed attempts', async () => {
      const result = await lockoutService.recordFailedAttempt('user1@example.com');
      expect(result.attemptsRemaining).toBe(4);
      expect(result.isLocked).toBe(false);
    });

    it('should increment failed attempts', async () => {
      await lockoutService.recordFailedAttempt('user1@example.com');
      const result = await lockoutService.recordFailedAttempt('user1@example.com');
      expect(result.attemptsRemaining).toBe(3);
      expect(result.isLocked).toBe(false);
    });

    it('should reset attempts on successful login', async () => {
      await lockoutService.recordFailedAttempt('user1@example.com');
      await lockoutService.recordFailedAttempt('user1@example.com');
      
      await lockoutService.clearFailedAttempts('user1@example.com');
      
      const result = await lockoutService.recordFailedAttempt('user1@example.com');
      expect(result.attemptsRemaining).toBe(4);
      expect(result.isLocked).toBe(false);
    });
  });

  describe('Lockout Logic', () => {
    it('should lock account after max attempts', async () => {
      // Record max attempts (default is 5)
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('user1@example.com');
      }
      
      const result = await lockoutService.recordFailedAttempt('user1@example.com');
      expect(result.isLocked).toBe(true);
      expect(result.attemptsRemaining).toBe(0);
      expect(result.lockedUntil).toBeDefined();
    });

    it('should check if account is locked', async () => {
      // Record max attempts
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('user1@example.com');
      }
      
      const status = await lockoutService.isAccountLocked('user1@example.com');
      expect(status.isLocked).toBe(true);
      expect(status.attempts).toBe(5);
    });

    it('should return lockout status', async () => {
      const status = await lockoutService.isAccountLocked('user1@example.com');
      expect(status).toHaveProperty('isLocked');
      expect(status).toHaveProperty('attempts');
      expect(status).toHaveProperty('lockedUntil');
    });
  });

  describe('Time-based Lockout', () => {
    it('should handle lockout expiration', (done) => {
      // Create a service with short lockout duration
      const shortLockoutService = new AccountLockoutService({
        maxAttempts: 3,
        lockoutDuration: 100, // 100ms
        enableLockout: true,
      });

      // Lock the account
      (async () => {
        for (let i = 0; i < 3; i++) {
          await shortLockoutService.recordFailedAttempt('user1@example.com');
        }

        const status = await shortLockoutService.isAccountLocked('user1@example.com');
        expect(status.isLocked).toBe(true);

        // Wait for lockout to expire
        setTimeout(async () => {
          const expiredStatus = await shortLockoutService.isAccountLocked('user1@example.com');
          expect(expiredStatus.isLocked).toBe(false);
          done();
        }, 150);
      })();
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', async () => {
      const customService = new AccountLockoutService({
        maxAttempts: 3,
        lockoutDuration: 300000, // 5 minutes
        enableLockout: true,
      });

      // Lock account with custom max attempts
      for (let i = 0; i < 3; i++) {
        await customService.recordFailedAttempt('user1@example.com');
      }
      
      const result = await customService.recordFailedAttempt('user1@example.com');
      expect(result.isLocked).toBe(true);
    });

    it('should disable lockout when configured', async () => {
      const disabledService = new AccountLockoutService({
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000,
        enableLockout: false,
      });

      // Try to lock account
      for (let i = 0; i < 10; i++) {
        const result = await disabledService.recordFailedAttempt('user1@example.com');
        expect(result.isLocked).toBe(false);
        expect(result.attemptsRemaining).toBe(5);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user IDs', async () => {
      const result = await lockoutService.recordFailedAttempt('');
      expect(result.attemptsRemaining).toBe(4);
    });

    it('should handle special characters in user ID', async () => {
      const result = await lockoutService.recordFailedAttempt('user+test@example.com');
      expect(result.attemptsRemaining).toBe(4);
    });

    it('should handle very long user IDs', async () => {
      const longUserId = 'a'.repeat(1000) + '@example.com';
      const result = await lockoutService.recordFailedAttempt(longUserId);
      expect(result.attemptsRemaining).toBe(4);
    });
  });

  describe('Account Unlocking', () => {
    it('should unlock account manually', async () => {
      // Lock the account
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('user1@example.com');
      }

      // Verify it's locked
      let status = await lockoutService.isAccountLocked('user1@example.com');
      expect(status.isLocked).toBe(true);

      // Unlock the account
      const unlockResult = await lockoutService.unlockAccount({
        userId: 'user1@example.com',
        reason: 'Manual unlock by admin',
      }, 'admin@example.com');

      expect(unlockResult.success).toBe(true);

      // Verify it's unlocked
      status = await lockoutService.isAccountLocked('user1@example.com');
      expect(status.isLocked).toBe(false);
    });

    it('should handle unlocking non-existent account', async () => {
      const unlockResult = await lockoutService.unlockAccount({
        userId: 'nonexistent@example.com',
        reason: 'Test unlock',
      }, 'admin@example.com');

      expect(unlockResult.success).toBe(false);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should provide lockout statistics', async () => {
      // Generate some activity
      await lockoutService.recordFailedAttempt('user1@example.com');
      await lockoutService.recordFailedAttempt('user2@example.com');
      await lockoutService.clearFailedAttempts('user1@example.com');

      const stats = lockoutService.getLockoutStats();
      expect(stats).toHaveProperty('totalLocked');
      expect(stats).toHaveProperty('totalAttempts');
      expect(stats).toHaveProperty('averageAttempts');
    });

    it('should track lockout events', async () => {
      // Lock an account
      for (let i = 0; i < 5; i++) {
        await lockoutService.recordFailedAttempt('user1@example.com');
      }

      const stats = lockoutService.getLockoutStats();
      expect(stats.totalLocked).toBeGreaterThan(0);
      expect(stats.totalAttempts).toBeGreaterThan(0);
    });
  });
});