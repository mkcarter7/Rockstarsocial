/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Redirect www subdomain to apex domain.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.1rockstarsocial.com' }],
        destination: 'https://1rockstarsocial.com/:path*',
        permanent: true,
      },
      // Redirect old /birthday/[slug] party URLs to /[slug].
      // The negative lookahead excludes /birthday/setup and /birthday/purchase,
      // which are real pages that must not be redirected.
      {
        source: '/birthday/:slug((?!setup|purchase)[^/]+)',
        destination: '/:slug',
        permanent: true,
      },
      {
        source: '/birthday/:slug((?!setup|purchase)[^/]+)/:page',
        destination: '/:slug/:page',
        permanent: true,
      },
      {
        source: '/themes',
        destination: '/shop',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
