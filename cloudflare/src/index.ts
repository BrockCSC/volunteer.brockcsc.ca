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
    email: string;
    year: string;
    portfolio?: string;
    designtools?: string;
    designproject?: string;
    wcssupport?: string;
    wdexperience?: string;
    ecorganize?: string;
    skills: string;
}

interface RequestData {
    formData: FormFields;
    roleTitle: string;
}

export interface Env {
    DISCORD_WEBHOOK_URL: string;
    RATE_LIMITS: KVNamespace;
}

// Security configuration
const RATE_LIMIT = {
    MAX_REQUESTS: 5, // 5 submissions
    WINDOW_MS: 3600000, // per hour (1 hour)
};

// CORS headers for all responses
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

// Helper function to check rate limits
async function checkRateLimit(
    ip: string,
    env: Env,
): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate_limit:${ip}`;
    const now = Date.now();

    const data = await env.RATE_LIMITS.get<RateLimitData>(key, 'json');
    const requests = data?.requests || [];

    // Filter requests within window
    const validRequests = requests.filter(
        (timestamp: number) => now - timestamp < RATE_LIMIT.WINDOW_MS,
    );

    // Add current request
    validRequests.push(now);

    // Save updated requests
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

// Request validation
function validateRequest(request: Request): boolean {
    const referer = request.headers.get('Referer');
    return ALLOWED_ORIGINS.some((origin) => referer?.startsWith(origin));
}

export default {
    async fetch(request: Request, env: Env) {
        // Handle OPTIONS request for CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        // Get client IP
        const clientIP = request.headers.get('CF-Connecting-IP') || '';

        // Add security headers to all responses
        const responseHeaders = {
            ...SECURITY_HEADERS,
            'Content-Type': 'application/json',
            ...corsHeaders,
        };

        // Check if request is from localhost (development environment)
        const isLocalDev =
            request.headers.get('host')?.includes('localhost') ||
            request.headers.get('host')?.includes('127.0.0.1');

        // Only check rate limit if not in development
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

        // Validate request
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

        // Validate origin
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

        // Validate required fields
        const { formData, roleTitle } = data;
        if (
            !formData?.name ||
            !formData?.email ||
            !formData?.year ||
            !formData?.skills ||
            !roleTitle
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

        // Function to split long text into chunks
        function splitIntoChunks(
            text: string,
            maxLength: number = 1000,
        ): string[] {
            const chunks: string[] = [];
            let currentChunk = '';

            // Split by sentences to keep context
            const sentences = text.split(/(?<=[.!?])\s+/);

            for (const sentence of sentences) {
                if ((currentChunk + sentence).length <= maxLength) {
                    currentChunk += (currentChunk ? ' ' : '') + sentence;
                } else {
                    if (currentChunk) chunks.push(currentChunk);
                    currentChunk = sentence;
                }
            }

            if (currentChunk) chunks.push(currentChunk);
            return chunks.slice(0, 6); // Limit to 6 chunks
        }

        // Function to process fields that might need chunking
        function processField(text: string | undefined, maxChunks: number = 2): string[] {
            if (!text) return [];
            return text.length > 1000 ? splitIntoChunks(text, 1000).slice(0, maxChunks) : [text];
        };

        // Process all fields that need chunking
        const roleSpecificFields: DiscordField[] = [];        // Common fields first
        roleSpecificFields.push(
            { name: 'Full Name', value: formData.name },
            { name: 'Email Address', value: formData.email },
            { name: 'Anticipated Graduation Date', value: formData.year }
        );

        // Portfolio for specific roles
        if (formData.portfolio && (roleTitle === 'Graphic Designer' || roleTitle === 'Web Developer')) {
            roleSpecificFields.push({ name: 'Portfolio/Resume', value: formData.portfolio });
        }
        
        // Role-specific fields
        if (roleTitle === 'Graphic Designer') {
            if (formData.designtools) {
                roleSpecificFields.push({ 
                    name: 'Design Tools', 
                    value: formData.designtools 
                });
            }
            if (formData.designproject) {
                const chunks = processField(formData.designproject);
                roleSpecificFields.push(...chunks.map((chunk: string, index: number) => ({
                    name: chunks.length > 1 
                        ? `Design Project Experience (Part ${index + 1}/${chunks.length})`
                        : 'Design Project Experience',
                    value: chunk
                })));
            }
        }
        
        if (roleTitle === 'Women in Computer Science Representative' && formData.wcssupport) {
            const chunks = processField(formData.wcssupport);
            roleSpecificFields.push(...chunks.map((chunk, index) => ({
                name: chunks.length > 1 
                    ? `Initiatives for Underrepresented Groups (Part ${index + 1}/${chunks.length})`
                    : 'Initiatives for Underrepresented Groups',
                value: chunk
            })));
        }
        
        if (roleTitle === 'Web Developer' && formData.wdexperience) {
            const chunks = processField(formData.wdexperience);
            roleSpecificFields.push(...chunks.map((chunk, index) => ({
                name: chunks.length > 1 
                    ? `Development Experience (Part ${index + 1}/${chunks.length})`
                    : 'Development Experience',
                value: chunk
            })));
        }
        
        if (roleTitle === 'Event Coordinator' && formData.ecorganize) {
            const chunks = processField(formData.ecorganize);
            roleSpecificFields.push(...chunks.map((chunk, index) => ({
                name: chunks.length > 1 
                    ? `Event Planning Organization (Part ${index + 1}/${chunks.length})`
                    : 'Event Planning Organization',
                value: chunk
            })));
        }

        // Common long answer field (up to 6 chunks)
        const skillsChunks = formData.skills.length > 1000 
            ? splitIntoChunks(formData.skills, 1000)  // This already limits to 6 chunks
            : [formData.skills];

        roleSpecificFields.push(...skillsChunks.map((chunk, index) => ({
            name: skillsChunks.length > 1
                ? `Why do you want to be part of the Computer Science Club executive team? (Part ${index + 1}/${skillsChunks.length})`
                : 'Why do you want to be part of the Computer Science Club executive team?',
            value: chunk,
        })));

        // Filter out any empty fields
        const fields = roleSpecificFields.filter((f) => f.value && f.value.trim().length > 0);

        try {
            if (!env.DISCORD_WEBHOOK_URL) {
                throw new Error('Discord webhook URL is not configured');
            }

            // Validate fields before sending
            const validFields = fields.map((field) => ({
                name: String(field.name), // Discord's limit
                value: String(field.value), // Discord's limit
                inline: false,
            }));

            const response = await fetch(env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    embeds: [
                        {
                            title: String(roleTitle),
                            color: getColor(roleTitle),
                            fields: validFields,
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
                    message: 'Application submitted successfully',
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

function getColor(title: string): number {
    switch (title) {
        case 'Graphic Designer':
            return 0xff6b35;
        case 'Women in Computer Science Representative':
            return 0x9b59b6;
        case 'Web Developer':
            return 0x2ecc71;
        case 'Event Coordinator':
            return 0xf39c12;
        default:
            return 0x00ff00;
    }
}
