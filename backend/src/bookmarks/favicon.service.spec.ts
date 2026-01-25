import { Test, TestingModule } from '@nestjs/testing';
import { FaviconService } from './favicon.service';

describe('FaviconService', () => {
  let service: FaviconService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FaviconService],
    }).compile();

    service = module.get<FaviconService>(FaviconService);
  });

  describe('fetchFavicon', () => {
    it('should return base64 data URL on successful fetch', async () => {
      const mockArrayBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const mockHeaders = {
        get: jest.fn().mockReturnValue('image/png'),
      };
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
        headers: mockHeaders,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.fetchFavicon('https://example.com');

      expect(result).toMatch(/^data:image\/png;base64,/);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/s2/favicons?domain=example.com&sz=32',
      );
    });

    it('should return null when fetch fails with non-ok response', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.fetchFavicon('https://example.com');

      expect(result).toBeNull();
    });

    it('should return null when fetch throws an error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.fetchFavicon('https://example.com');

      expect(result).toBeNull();
    });

    it('should return null for invalid URLs', async () => {
      const result = await service.fetchFavicon('invalid-url');

      expect(result).toBeNull();
    });

    it('should use default content type when not provided in response', async () => {
      const mockArrayBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await service.fetchFavicon('https://example.com');

      expect(result).toMatch(/^data:image\/png;base64,/);
    });

    it('should extract hostname correctly from URL with path', async () => {
      const mockArrayBuffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
      const mockResponse = {
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
        headers: {
          get: jest.fn().mockReturnValue('image/png'),
        },
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await service.fetchFavicon('https://example.com/some/path?query=value');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.google.com/s2/favicons?domain=example.com&sz=32',
      );
    });
  });
});
