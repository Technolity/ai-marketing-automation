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
                    // Prevent clickjacking
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    // Prevent MIME type sniffing
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    // Control referrer information
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    // Enable XSS protection
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    // Enforce HTTPS
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload'
                    },
                    // Control permissions
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
                    },
                    // Cross-Origin policies
                    // Note: Relaxed for Clerk compatibility. COOP/COEP can break auth popups.
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin-allow-popups'  // Allow Clerk auth popups
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'cross-origin'  // Allow resources from Clerk
                    },
                    // Content Security Policy
                    // Note: CSP configured for agent.tedos.ai production domain
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            // Allow scripts from self, Clerk (both custom domain and hosted), and blob workers
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.agent.tedos.ai https://*.clerk.accounts.dev https://challenges.cloudflare.com",
                            // Allow workers from blob (required for Clerk)
                            "worker-src 'self' blob:",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com data:",
                            "img-src 'self' data: https: blob:",
                            "media-src 'self' https://res.cloudinary.com blob:",
                            // Connect sources - include agent.tedos.ai and all subdomains
                            "connect-src 'self' http://localhost:* https://agent.tedos.ai https://*.agent.tedos.ai https://*.supabase.co https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://rest.gohighlevel.com https://services.leadconnectorhq.com https://api.cloudinary.com https://*.clerk.accounts.dev wss://*.clerk.accounts.dev",
                            "frame-src 'self' https://*.agent.tedos.ai https://*.clerk.accounts.dev",
                            "object-src 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                            "frame-ancestors 'none'"
                        ].join('; ')
                    }
                ]
            },
            {
                // API routes - allow CORS for same origin only
                source: '/api/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true'
                    },
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NEXT_PUBLIC_APP_URL || 'https://tedos.ai'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, PUT, DELETE, OPTIONS'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
                    },
                    {
                        key: 'Access-Control-Max-Age',
                        value: '86400'
                    }
                ]
            },
            {
                // Prevent caching on authenticated pages
                source: '/(dashboard|admin|results|os|vault)(.*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, no-cache, must-revalidate, private'
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
