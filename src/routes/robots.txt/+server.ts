import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const robotsTxt = `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /dashboard/
Disallow: /users/
Disallow: /payments/
Disallow: /test/

# Sitemap
Sitemap: https://daisyssecrets.com/sitemap.xml

# Crawl-delay for politeness
Crawl-delay: 1`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'max-age=86400, s-maxage=86400' // Cache for 24 hours
    }
  });
};