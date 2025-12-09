/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React Strict Mode for better development experience
    reactStrictMode: true,

    // Optimize images
    images: {
        domains: ['rbmvbnxmzbbzfofokezv.supabase.co'],
        unoptimized: false
    },

    // Environment variables that can be used on the client side
    // These are set in Vercel dashboard, not here
    env: {
        // These will be replaced by Vercel environment variables
    },

    // Experimental features
    experimental: {
        // Enable server actions if needed
        serverActions: {
            bodySizeLimit: '2mb'
        }
    },

    // Headers for security and cache control
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin'
                    }
                ]
            },
            {
                // Prevent caching on authenticated pages
                source: '/(dashboard|admin|results|os)(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate'
                    },
                    {
                        key: 'Pragma',
                        value: 'no-cache'
                    },
                    {
                        key: 'Expires',
                        value: '0'
                    }
                ]
            }
        ];
    }
};

module.exports = nextConfig;
