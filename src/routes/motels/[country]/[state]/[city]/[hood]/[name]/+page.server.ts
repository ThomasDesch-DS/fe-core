import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';
import type { MotelDetailDto, MotelReview } from '$lib/types/motel';

export const prerender = false;
export const ssr = true;

function normalizeMotel(m: any): MotelDetailDto {
	// map backend fields to the FE names expected by the template
	m.motelStaySlots = m.motelStaySlots ?? m.generalStaySlots ?? [];
	m.overnightInfo = m.overnightInfo ?? m.generalOvernightInfos ?? [];

	// normalize a telephone we can use in JSON-LD + clickable UI
	const rawTel = m.contactMethods?.find((val: string) =>
		typeof val === 'string' && (val.startsWith('tel:') || /^\+?\d[\d\s\-().]+$/.test(val))
	);
	const tel = rawTel
		? (rawTel.startsWith('tel:') ? rawTel : `tel:${rawTel.replace(/[^\d+]/g, '')}`)
		: undefined;

	m.__telephone = tel; // stash for JSON-LD and UI
	return m as MotelDetailDto;
}

export async function load({ params, fetch, url }) {
	try {
		const { country, state, city, hood, name } = params;
		const apiUrl = PUBLIC_API_URL || 'http://localhost:8080';
		const motelUrl = `${apiUrl}/motels/${country}/${state}/${city}/${hood}/${name}`;

		const response = await fetch(motelUrl);
		if (!response.ok) {
			throw error(response.status, `Motel not found: ${response.statusText}`);
		}

		const data = await response.json();
		const motel = normalizeMotel(data);

		// Fetch reviews for schema.org data
		let reviews: MotelReview[] = [];
		let reviewCount = 0;
		try {
			const reviewsResponse = await fetch(`${apiUrl}/reviews/${motel.id}`);
			if (reviewsResponse.ok) {
				reviews = await reviewsResponse.json();
				const topLevelReviews = reviews.filter(r => !r.parentId);
				reviewCount = topLevelReviews.length;
			}
		} catch (reviewErr) {
			console.warn('Failed to fetch reviews for schema:', reviewErr);
			// carry on without reviews
		}

		return {
			motel,
			reviews,
			reviewCount,
			pageUrl: url.href
		};
	} catch (err) {
		console.error('Failed to fetch motel data:', err);
		throw error(500, 'Failed to load motel data');
	}
}