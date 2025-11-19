import { Hono } from 'hono'

type Bindings = {
    ASSETS: { fetch: (request: Request) => Promise<Response> };
    INKCRE_CORE_URL?: string;
    INKCRE_EXT_MF_URL?: string;
}

const app = new Hono<{ Bindings: Bindings }>()

// API endpoint for frontend to get env vars
app.get('/api/cf-env-vars', (c) => {
    return c.json({
        API_BASE_URL: c.env.INKCRE_CORE_URL,
        MF_URL: c.env.INKCRE_EXT_MF_URL
    })
})

// Serve static assets (Vue app)
app.get('/*', async (c) => {
    return await c.env.ASSETS.fetch(c.req.raw)
})

export default app
