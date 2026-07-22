const bcrypt = require('bcryptjs');

describe('Authentication Service', () => {
  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Password Validation', () => {
    const validatePassword = (password) => {
      // At least 8 characters, 1 number, 1 letter
      const minLength = password.length >= 8;
      const hasNumber = /\d/.test(password);
      const hasLetter = /[a-zA-Z]/.test(password);
      return minLength && hasNumber && hasLetter;
    };

    it('should accept valid passwords', () => {
      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('MySecure99')).toBe(true);
      expect(validatePassword('test1234')).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Pass1')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePassword('Password')).toBe(false);
    });

    it('should reject passwords without letters', () => {
      expect(validatePassword('12345678')).toBe(false);
    });
  });
});
