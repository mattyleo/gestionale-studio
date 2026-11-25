import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Impostazioni per la produzione
  poweredByHeader: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
  
  // Immagini esterne permesse (logo emittente, ecc.)
  images: {
    remotePatterns: [],
  },
  
  // Logging delle richieste in sviluppo
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};

export default nextConfig;
