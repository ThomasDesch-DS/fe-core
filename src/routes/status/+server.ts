// +server.ts
import { json } from '@sveltejs/kit';

export function GET() {
    return json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: Date.now()
    });
}
