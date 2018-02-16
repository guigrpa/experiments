module.exports = {
  assetPrefix: process.env.BASE_URL ? `${process.env.BASE_URL}/` : '',
  exportPathMap: () => ({
    '/': { page: '/' },
    '/about': { page: '/about' },
    '/es/about': { page: '/about', query: { lang: 'es' } },
  }),
};
