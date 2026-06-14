import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cruxai.az';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/stats', '/synthesis'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.6,
  }));
}
