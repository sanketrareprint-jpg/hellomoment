import type { MetadataRoute } from 'next';

/** Generates /sitemap.xml — just the public marketing pages search engines should actually list. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_BASE_URL?.replace(/\/$/, '') || 'https://raregreet.com';
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];
}
