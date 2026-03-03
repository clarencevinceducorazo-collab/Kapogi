
import type {NextConfig} from 'next';

// Security headers applied to every page/route response
const securityHeaders = [
  { key: 'X-Content-Type-Options',      value: 'nosniff' },
  { key: 'X-Frame-Options',             value: 'DENY' },
  { key: 'X-XSS-Protection',            value: '1; mode=block' },
  { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security',   value: 'max-age=31536000; includeSubDomains' },
  { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
];

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
        hostname: 'dweb.link',
        port: '',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud', // Wildcard for all your Pinata gateways
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn3d.iconscout.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
        port: '',
        pathname: '/**',
      },
       {
        protocol: 'https',
        hostname: 'api.dicebear.com',
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
  
  // Security headers on every page and API response
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  
  // Compression for better performance
  compress: true,
  
  // React strict mode for better development
  reactStrictMode: true,
  
  // SWC minification (faster builds)
  swcMinify: true,

  // Environment variables for NextAuth
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://kapogian.xyz',
    AUTH_TRUST_HOST: 'true',
  },
};

export default nextConfig;
