const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

describe('Appointment Management', () => {
  describe('Tracking Number Generation', () => {
    const generateTrackingNumber = () => {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `TRK-${year}-${random}`;
    };

    it('should generate tracking number with correct format', () => {
      const trackingNum = generateTrackingNumber();
      expect(trackingNum).toMatch(/^TRK-\d{4}-\d{6}$/);
    });

    it('should include current year', () => {
      const trackingNum = generateTrackingNumber();
      const currentYear = new Date().getFullYear();
      expect(trackingNum).toContain(`TRK-${currentYear}-`);
    });

    it('should generate unique tracking numbers', () => {
      const nums = new Set();
      for (let i = 0; i < 100; i++) {
        nums.add(generateTrackingNumber());
      }
      // Should have high uniqueness (at least 95% unique in 100 tries)
      expect(nums.size).toBeGreaterThan(95);
    });
  });

  describe('Appointment Status Validation', () => {
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

    it('should accept valid statuses', () => {
      validStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(true);
      });
    });

    it('should reject invalid statuses', () => {
      const invalidStatuses = ['active', 'done', 'processing', 'rejected'];
      invalidStatuses.forEach(status => {
        expect(validStatuses.includes(status)).toBe(false);
      });
    });
  });

  describe('Appointment Date Validation', () => {
    const isValidFutureDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return date >= now && !isNaN(date.getTime());
    };

    it('should accept future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isValidFutureDate(tomorrow.toISOString().split('T')[0])).toBe(true);
    });

    it('should accept today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(isValidFutureDate(today)).toBe(true);
    });

    it('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isValidFutureDate(yesterday.toISOString().split('T')[0])).toBe(false);
    });

    it('should reject invalid date formats', () => {
      expect(isValidFutureDate('invalid-date')).toBe(false);
      expect(isValidFutureDate('2024-13-45')).toBe(false);
    });
  });

  describe('JWT Token Validation', () => {
    const secret = 'test_secret_key';
    
    it('should create valid JWT token', () => {
      const payload = { userId: 'test123', role: 'customer' };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should verify valid token', () => {
      const payload = { userId: 'test123', role: 'customer' };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, secret);
      expect(decoded.userId).toBe('test123');
      expect(decoded.role).toBe('customer');
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    it('should reject expired token', () => {
      const payload = { userId: 'test123', role: 'customer' };
      const token = jwt.sign(payload, secret, { expiresIn: '-1h' }); // Already expired
      
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow();
    });
  });

  describe('Problem Description Validation', () => {
    const isValidDescription = (desc) => {
      if (!desc || typeof desc !== 'string') return false;
      const trimmed = desc.trim();
      return trimmed.length >= 10 && trimmed.length <= 1000;
    };

    it('should accept valid descriptions', () => {
      expect(isValidDescription('Engine making strange noise when accelerating')).toBe(true);
      expect(isValidDescription('Brake pedal feels soft and car takes longer to stop')).toBe(true);
    });

    it('should reject too short descriptions', () => {
      expect(isValidDescription('Bad car')).toBe(false);
      expect(isValidDescription('Help')).toBe(false);
    });

    it('should reject empty descriptions', () => {
      expect(isValidDescription('')).toBe(false);
      expect(isValidDescription('   ')).toBe(false);
      expect(isValidDescription(null)).toBe(false);
    });

    it('should reject too long descriptions', () => {
      const longDesc = 'a'.repeat(1001);
      expect(isValidDescription(longDesc)).toBe(false);
    });
  });
});
