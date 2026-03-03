/**
 * MailerLite API Proxy for Cloudflare Workers (Modern ES Module Format)
 * 
 * Instructions:
 * 1. Delete ALL code currently in your Cloudflare Worker editor.
 * 2. Paste this code into the editor.
 * 3. Save and Deploy.
 */

export default {
    async fetch(request, env) {
        const allowedOrigin = '*' // You can restrict this to 'https://www.thevibecheckproject.com'

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigin,
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Accept',
                },
            })
        }

        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 })
        }

        try {
            const body = await request.json()

            // Forward the request to MailerLite
            // env.MAILERLITE_API_KEY must be set in Worker Secrets (Settings > Variables)
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

            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': allowedOrigin,
                },
            })
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': allowedOrigin,
                },
            })
        }
    }
}
