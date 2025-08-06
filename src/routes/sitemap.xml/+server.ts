import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    // Fetch motels from the API
    const response = await fetch(`${process.env.VITE_API_URL}/motels`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch motels: ${response.status}`);
    }
    
    const motels = await response.json();

    // Generate URLs for each motel
    const motelUrls = motels.map((motel: any) => {
      const { country, state, city, hood, name } = motel.location;
      // URL-encode the path segments to handle special characters
      const encodedCountry = encodeURIComponent(country.toLowerCase());
      const encodedState = encodeURIComponent(state.toLowerCase().replace(/\s+/g, '-'));
      const encodedCity = encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'));
      const encodedHood = encodeURIComponent(hood.toLowerCase().replace(/\s+/g, '-'));
      const encodedName = encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));
      
      const motelUrl = hood 
        ? `https://daisyssecrets.com/motels/${encodedCountry}/${encodedState}/${encodedCity}/${encodedHood}/${encodedName}`
        : `https://daisyssecrets.com/motels/${encodedCountry}/${encodedState}/${encodedCity}/${encodedName}`;

      return `
      <url>
        <loc>${motelUrl}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      </url>`;
    }).join('\n');

    // Static pages URLs
    const staticUrls = [
      {
        loc: 'https://daisyssecrets.com/',
        priority: '1.0',
        changefreq: 'daily'
      },
      {
        loc: 'https://daisyssecrets.com/motels',
        priority: '0.9',
        changefreq: 'daily'
      },
      {
        loc: 'https://daisyssecrets.com/escort',
        priority: '0.7',
        changefreq: 'weekly'
      },
      {
        loc: 'https://daisyssecrets.com/privacy',
        priority: '0.3',
        changefreq: 'monthly'
      },
      {
        loc: 'https://daisyssecrets.com/terms',
        priority: '0.3',
        changefreq: 'monthly'
      }
    ].map(page => `
      <url>
        <loc>${page.loc}</loc>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
        <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
      </url>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${motelUrls}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap with static pages only if API fails
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://daisyssecrets.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>https://daisyssecrets.com/motels</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
</urlset>`;

    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=300, s-maxage=300' // Shorter cache on error
      }
    });
  }
};