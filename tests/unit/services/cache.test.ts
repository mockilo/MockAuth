import { CacheService, createCacheService } from '../../../src/services/CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = createCacheService();
    cacheService.clear();
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cacheService.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.has('key1')).toBe(true);
      expect(cacheService.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.has('key1')).toBe(true);
      
      const deleted = cacheService.delete('key1');
      expect(deleted).toBe(true);
      expect(cacheService.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cacheService.delete('nonexistent');
      expect(deleted).toBe(false);
    });

    it('should clear all keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);
      
      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire items after TTL', (done) => {
      cacheService.set('key1', 'value1', 100); // 100ms TTL
      
      expect(cacheService.get('key1')).toBe('value1');
      
      setTimeout(() => {
        expect(cacheService.get('key1')).toBeNull();
        expect(cacheService.has('key1')).toBe(false);
        done();
      }, 150);
    });

    it('should use default TTL when not specified', () => {
      cacheService.set('key1', 'value1');
      expect(cacheService.get('key1')).toBe('value1');
    });

    it('should handle zero TTL (falls back to default)', () => {
      cacheService.set('key1', 'value1', 0);
      // Zero TTL falls back to default TTL in the implementation
      expect(cacheService.get('key1')).toBe('value1');
    });
  });

  describe('Type Safety', () => {
    it('should handle different data types', () => {
      cacheService.set('string', 'hello');
      cacheService.set('number', 42);
      cacheService.set('boolean', true);
      cacheService.set('object', { foo: 'bar' });
      cacheService.set('array', [1, 2, 3]);

      expect(cacheService.get('string')).toBe('hello');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('boolean')).toBe(true);
      expect(cacheService.get('object')).toEqual({ foo: 'bar' });
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('Size and Keys', () => {
    it('should return correct size', () => {
      expect(cacheService.size()).toBe(0);
      
      cacheService.set('key1', 'value1');
      expect(cacheService.size()).toBe(1);
      
      cacheService.set('key2', 'value2');
      expect(cacheService.size()).toBe(2);
    });

    it('should return all keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      const keys = cacheService.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toHaveLength(2);
    });

    it('should not include expired keys in size or keys', (done) => {
      cacheService.set('key1', 'value1', 100);
      cacheService.set('key2', 'value2', 200);
      
      expect(cacheService.size()).toBe(2);
      
      setTimeout(() => {
        expect(cacheService.size()).toBe(1); // key1 expired
        expect(cacheService.keys()).toContain('key2');
        expect(cacheService.keys()).not.toContain('key1');
        done();
      }, 150);
    });
  });

  describe('Statistics', () => {
    it('should return cache statistics', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      
      const stats = cacheService.getStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('totalMisses');
      expect(stats.size).toBe(2);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should share state between instances', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      
      instance1.set('shared', 'value');
      expect(instance2.get('shared')).toBe('value');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string keys', () => {
      cacheService.set('', 'empty key');
      expect(cacheService.get('')).toBe('empty key');
    });

    it('should handle special characters in keys', () => {
      const specialKey = 'key with spaces and symbols!@#$%';
      cacheService.set(specialKey, 'value');
      expect(cacheService.get(specialKey)).toBe('value');
    });

    it('should handle null and undefined values', () => {
      cacheService.set('null', null);
      cacheService.set('undefined', undefined);
      
      expect(cacheService.get('null')).toBeNull();
      expect(cacheService.get('undefined')).toBeUndefined();
    });
  });
});
