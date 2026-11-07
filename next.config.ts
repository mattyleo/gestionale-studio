import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Impostazioni per la produzione
  poweredByHeader: false,
  outputFileTracingRoot: path.join(__dirname),
  
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
