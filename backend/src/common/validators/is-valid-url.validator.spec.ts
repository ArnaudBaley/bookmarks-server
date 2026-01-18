import { IsValidUrlConstraint } from './is-valid-url.validator';

describe('IsValidUrlConstraint', () => {
  let validator: IsValidUrlConstraint;

  beforeEach(() => {
    validator = new IsValidUrlConstraint();
  });

  describe('validate', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(validator.validate('http://example.com')).toBe(true);
      expect(validator.validate('http://www.example.com')).toBe(true);
      expect(validator.validate('http://example.com/path')).toBe(true);
      expect(validator.validate('http://example.com:8080/path')).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      expect(validator.validate('https://example.com')).toBe(true);
      expect(validator.validate('https://www.example.com')).toBe(true);
      expect(validator.validate('https://example.com/path')).toBe(true);
      expect(validator.validate('https://example.com:8080/path')).toBe(true);
    });

    it('should return true for valid URLs with query parameters', () => {
      expect(validator.validate('https://example.com?param=value')).toBe(true);
      expect(validator.validate('https://example.com?param1=value1&param2=value2')).toBe(true);
    });

    it('should return true for valid URLs with fragments', () => {
      expect(validator.validate('https://example.com#section')).toBe(true);
      expect(validator.validate('https://example.com/path#section')).toBe(true);
    });

    it('should return true for valid URLs with authentication', () => {
      expect(validator.validate('https://user:pass@example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(validator.validate('not-a-url')).toBe(false);
      expect(validator.validate('example.com')).toBe(false);
      expect(validator.validate('www.example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validator.validate('')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(validator.validate(null as unknown as string)).toBe(false);
      expect(validator.validate(undefined as unknown as string)).toBe(false);
      expect(validator.validate(123 as unknown as string)).toBe(false);
      expect(validator.validate({} as unknown as string)).toBe(false);
      expect(validator.validate([] as unknown as string)).toBe(false);
    });

    it('should return false for URLs with invalid characters', () => {
      expect(validator.validate('https://example.com with spaces')).toBe(false);
    });
  });

  describe('defaultMessage', () => {
    it('should return appropriate error message', () => {
      const args = {
        property: 'url',
        value: 'invalid-url',
        constraints: [],
        targetName: 'CreateBookmarkDto',
        object: {},
      };
      const message = validator.defaultMessage(args);
      expect(message).toBe('url must be a valid URL address');
    });
  });
});
