import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FaviconService {
  private readonly logger = new Logger(FaviconService.name);

  /**
   * Fetches a favicon from Google's favicon service and returns it as a base64 data URL.
   * @param url The URL of the website to fetch the favicon for
   * @returns Base64 data URL string or null if fetch fails
   */
  async fetchFavicon(url: string): Promise<string | null> {
    try {
      const urlObj = new URL(url);
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;

      const response = await fetch(faviconUrl);

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch favicon for ${url}: HTTP ${response.status}`,
        );
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      // Get content type from response or default to image/png
      const contentType = response.headers.get('content-type') || 'image/png';

      return `data:${contentType};base64,${base64}`;
    } catch (error) {
      this.logger.warn(
        `Error fetching favicon for ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }
}
