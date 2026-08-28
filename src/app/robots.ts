import type { MetadataRoute } from 'next';

/**
 * Generates /robots.txt. Tells search engines they're welcome to crawl the
 * public marketing page, but keeps them out of the logged-in dashboard and
 * API routes — those wouldn't be useful search results anyway (they either
 * require login or are meant for a specific business's own customers via a
 * link that business shares directly, not for search engines to index).
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'https://hellomoment.in';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
