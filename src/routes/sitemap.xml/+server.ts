import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/sitemap`);

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const sitemapXml = await response.text();

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);

    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new Response(fallbackXml, {
      status: 500,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
};