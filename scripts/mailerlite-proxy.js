/**
 * MailerLite API Proxy for Cloudflare Workers (Robust CORS Version)
 * 
 * Instructions:
 * 1. Delete ALL code currently in your Cloudflare Worker editor.
 * 2. Paste this code into the editor.
 * 3. Save and Deploy.
 */

export default {
    async fetch(request, env) {
        // 1. Setup CORS Headers - Allow any origin for testing to solve the issue
        const origin = request.headers.get('Origin') || '*'
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
            'Access-Control-Max-Age': '86400',
        }

        // 2. Handle CORS preflight (OPTIONS)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders })
        }

        // 3. Only allow POST
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
        }

        try {
            const body = await request.json()

            // Validation check for the API key in the environmental variables
            if (!env.MAILERLITE_API_KEY) {
                throw new Error('MISSING_API_KEY: MailerLite API Key not configured in Worker secrets.')
            }

            // 4. Forward the request to MailerLite
            const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${env.MAILERLITE_API_KEY}`
                },
                body: JSON.stringify(body)
            })

            const data = await response.json()

            // 5. Return the MailerLite response with CORS headers
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            })

        } catch (error) {
            console.error('Proxy Error:', error.message)
            return new Response(JSON.stringify({
                error: error.message,
                tip: 'Check your Worker Secrets for MAILERLITE_API_KEY'
            }), {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            })
        }
    }
}
