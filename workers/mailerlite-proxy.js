/**
 * MailerLite API Proxy for Cloudflare Workers (Final Robust Version)
 * 
 * Instructions:
 * 1. Delete ALL code currently in your Cloudflare Worker editor.
 * 2. Paste this code into the editor.
 * 3. Save and Deploy.
 */

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '*'
        const corsHeaders = {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
            'Access-Control-Max-Age': '86400',
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders })
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Please use POST' }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        try {
            // Gracefully handle empty or malformed JSON bodies
            let data = {}
            const text = await request.text()
            if (text) {
                try {
                    data = JSON.parse(text)
                } catch (e) {
                    throw new Error('MALFORMED_JSON: The request body is not valid JSON.')
                }
            } else {
                throw new Error('EMPTY_BODY: No data was sent in the request body.')
            }

            if (!env.MAILERLITE_API_KEY) {
                throw new Error('MISSING_API_KEY: MailerLite API Key not found in Worker Secrets.')
            }

            // Forward to MailerLite
            const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${env.MAILERLITE_API_KEY}`
                },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            return new Response(JSON.stringify(result), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            })

        } catch (error) {
            return new Response(JSON.stringify({
                error: error.message,
                tip: 'Make sure you are sending a JSON body with an email field.'
            }), {
                status: 400,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                },
            })
        }
    }
}
