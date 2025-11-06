const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize mineflayer and related packages for server-side only
      config.externals = config.externals || []
      config.externals.push('mineflayer', 'minecraft-data', 'minecraft-protocol', 'prismarine-physics', 'prismarine-entity')
    }
    return config
  }
};

export default nextConfig;
