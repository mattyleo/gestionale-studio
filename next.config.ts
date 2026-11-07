import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Impostazioni per la produzione
  poweredByHeader: false,
  
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
