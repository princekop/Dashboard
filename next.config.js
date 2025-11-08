/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://api.modrinth.com https://generativelanguage.googleapis.com https://api.papermc.io https://api.purpurmc.org https://meta.fabricmc.net https://launchermeta.mojang.com wss: ws:",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
