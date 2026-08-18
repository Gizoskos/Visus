import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Visual Study Engine',
    short_name: 'Visual Study',
    description: 'A visual-first academic learning platform.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#101828',
  };
}
