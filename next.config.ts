import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Output configuration for different hosts
  output: 'standalone', // Good for Docker, self-hosting, and some platforms
  
  images: {
    unoptimized: true,  // Required for: Cloudflare, Netlify, static exports, and IPFS images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'crimson-near-lark-649.mypinata.cloud',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud', // Wildcard for all your Pinata gateways
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Webpack configuration for compatibility (especially for Web3/Sui SDK)
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Compression for better performance
  compress: true,
  
  // React strict mode for better development
  reactStrictMode: true,
  
  // SWC minification (faster builds)
  swcMinify: true,
};

export default nextConfig;