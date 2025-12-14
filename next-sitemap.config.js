/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://diu-learning.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/admin/*',
    '/api/*',
    '/test-*',
    '/debug-*',
    '/minimal-test',
    '/simple-login',
    '/demo/*',
    '/section-admin/*',
    '/contributor/admin/*'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/test-*',
          '/debug-*',
          '/minimal-test',
          '/simple-login',
          '/demo/',
          '/section-admin/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/test-*', '/debug-*'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/test-*', '/debug-*'],
      },
      {
        userAgent: 'AhrefsBot',
        disallow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/',
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
      {
        userAgent: 'SemrushBot',
        disallow: '/',
      },
    ],
    additionalSitemaps: [
      'https://diu-learning.vercel.app/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom priority and changefreq based on path
    let priority = 0.7
    let changefreq = 'weekly'

    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.includes('/browse-videos')) {
      priority = 0.9
      changefreq = 'daily'
    } else if (path.includes('/browse-slides')) {
      priority = 0.9
      changefreq = 'daily'
    } else if (path.includes('/browse-study-tools')) {
      priority = 0.9
      changefreq = 'daily'
    } else if (path.includes('/notes')) {
      priority = 0.8
      changefreq = 'weekly'
    } else if (path.includes('/contributor')) {
      priority = 0.7
      changefreq = 'weekly'
    } else if (path.includes('/login')) {
      priority = 0.5
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
