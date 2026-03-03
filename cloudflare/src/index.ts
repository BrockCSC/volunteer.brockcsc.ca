import { type KVNamespace } from '@cloudflare/workers-types';

interface DiscordField {
    name: string;
    value: string;
}

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://brockcsc.ca',
    'https://volunteer.brockcsc.ca',
];

interface FormFields {
    name: string;
    discord: string;
    email: string;
    year: string;
}

interface RequestData {
    formData: FormFields;
}

export interface Env {
    DISCORD_WEBHOOK_URL: string;
    RATE_LIMITS: KVNamespace;
}

const RATE_LIMIT = {
    MAX_REQUESTS: 5,
    WINDOW_MS: 3600000,
};

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Referer',
    'Access-Control-Max-Age': '86400',
};

const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
};

interface RateLimitData {
    requests: number[];
}

async function checkRateLimit(
    ip: string,
    env: Env,
): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${ip}`;
    const now = Date.now();

    const data = await env.RATE_LIMITS.get<RateLimitData>(key, 'json');
    const requests = data?.requests || [];

    const validRequests = requests.filter(
        (timestamp: number) => now - timestamp < RATE_LIMIT.WINDOW_MS,
    );

    validRequests.push(now);

    await env.RATE_LIMITS.put(
        key,
        JSON.stringify({
            requests: validRequests,
        }),
        { expirationTtl: RATE_LIMIT.WINDOW_MS / 1000 },
    );

    return {
        allowed: validRequests.length <= RATE_LIMIT.MAX_REQUESTS,
        remaining: Math.max(
            0,
            RATE_LIMIT.MAX_REQUESTS - validRequests.length + 1,
        ),
    };
}

function validateRequest(request: Request): boolean {
    const referer = request.headers.get('Referer');
    return ALLOWED_ORIGINS.some((origin) => referer?.startsWith(origin));
}

export default {
    async fetch(request: Request, env: Env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        // Check if recruitment is closed (after midnight September 22, 2026)
        const now = new Date();
        const cutoffDate = new Date('2026-05-22T00:00:00-04:00');

        if (now >= cutoffDate) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Recruitment period has ended',
                    closed: true,
                }),
                {
                    status: 410,
                    headers: {
                        ...SECURITY_HEADERS,
                        'Content-Type': 'application/json',
                        ...corsHeaders,
                    },
                },
            );
        }

        const clientIP = request.headers.get('CF-Connecting-IP') || '';

        const responseHeaders = {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/json',
            ...corsHeaders,
        };

        const isLocalDev =
            request.headers.get('host')?.includes('localhost') ||
            request.headers.get('host')?.includes('127.0.0.1');

        if (!isLocalDev) {
            const rateLimit = await checkRateLimit(clientIP, env);
            if (!rateLimit.allowed) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: 'Rate limit exceeded. Please try again later.',
                        rateLimit: {
                            remaining: rateLimit.remaining,
                            resetIn: RATE_LIMIT.WINDOW_MS,
                        },
                    }),
                    {
                        status: 429,
                        headers: {
                            ...responseHeaders,
                            'X-RateLimit-Remaining':
                                rateLimit.remaining.toString(),
                            'X-RateLimit-Reset': (
                                Date.now() + RATE_LIMIT.WINDOW_MS
                            ).toString(),
                        },
                    },
                );
            }
        }

        if (request.method !== 'POST') {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Method Not Allowed',
                }),
                {
                    status: 405,
                    headers: responseHeaders,
                },
            );
        }

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid content type',
                }),
                {
                    status: 400,
                    headers: responseHeaders,
                },
            );
        }

        if (!validateRequest(request)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid request origin',
                }),
                {
                    status: 403,
                    headers: responseHeaders,
                },
            );
        }

        let data: RequestData;
        try {
            data = await request.json();
        } catch {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid JSON',
                }),
                {
                    status: 400,
                    headers: responseHeaders,
                },
            );
        }

        const { formData } = data;
        if (
            !formData?.name ||
            !formData?.discord ||
            !formData?.email ||
            !formData?.year
        ) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Missing required fields',
                }),
                {
                    status: 400,
                    headers: responseHeaders,
                },
            );
        }

        if (!YEAR_OPTIONS.includes(formData.year)) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Invalid year value',
                }),
                {
                    status: 400,
                    headers: responseHeaders,
                },
            );
        }

        if (!formData.email.trim().toLowerCase().endsWith('@brocku.ca')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: 'Email must be a Brock University address',
                }),
                {
                    status: 400,
                    headers: responseHeaders,
                },
            );
        }

        const fields: DiscordField[] = [
            { name: 'Full Name', value: formData.name },
            { name: 'Discord Username', value: formData.discord },
            { name: 'Email Address', value: formData.email },
            { name: 'Year', value: formData.year },
        ];

        try {
            if (!env.DISCORD_WEBHOOK_URL) {
                throw new Error('Discord webhook URL is not configured');
            }

            const response = await fetch(env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [
                        {
                            title: 'BrockCSC Exec Recruitment Response',
                            color: 0xaa3b3b,
                            fields: fields.map((field) => ({
                                name: String(field.name),
                                value: String(field.value),
                                inline: false,
                            })),
                            timestamp: new Date().toISOString(),
                        },
                    ],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Discord API error: ${response.status} - ${errorText}`,
                );
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Recruitment response submitted successfully',
                }),
                {
                    status: 200,
                    headers: responseHeaders,
                },
            );
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(
                JSON.stringify({
                    success: false,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Failed to send to Discord',
                }),
                {
                    status: 500,
                    headers: responseHeaders,
                },
            );
        }
    },
};
