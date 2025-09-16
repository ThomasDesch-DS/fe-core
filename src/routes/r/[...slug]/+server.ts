import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
    const { slug } = params;
    throw redirect(302, `https://prod-be-core.fly.dev/r/${slug}`);
};
