/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
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
