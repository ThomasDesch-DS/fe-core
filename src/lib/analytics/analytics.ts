import posthog from 'posthog-js';

function detectDevice(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) return 'android';
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/windows/.test(ua)) return 'windows';
    if (/mac os/.test(ua)) return 'macos';
    if (/linux/.test(ua)) return 'linux';
    return 'web';
}

function getSessionId(): string {
    let sid = sessionStorage.getItem('sessionId');
    if (!sid) {
        sid = crypto.randomUUID();
        sessionStorage.setItem('sessionId', sid);
    }
    return sid;
}

/**
 * Unified function to get userType and id from stores
 */
import { get } from 'svelte/store';
import { dSuserAuthStore } from '$lib/escort/store/dsUserAuthStore';
import { escortAuthStore } from '$lib/escort/store/escortAuthStore';

export function getCurrentUserAnalytics() {
    const dsUser = get(dSuserAuthStore);
    if (dsUser?.isAuthenticated && dsUser?.username) {
        return { userType: 'DSUser', userId: dsUser.username };
    }
    const escort = get(escortAuthStore);
    if (escort?.isAuthenticated && escort?.user?.id) {
        return { userType: 'Escort', userId: escort.user.id };
    }
    return { userType: undefined, userId: undefined };
}

export function initPosthog() {
    if (typeof window !== 'undefined' && !posthog.__initialized) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST
        });
        posthog.__initialized = true;
    }
}

function enrichProps(props: Record<string, any> = {}) {
    const { userType, userId } = getCurrentUserAnalytics();
    return {
        ...props,
        userType,
        userId,
        timestamp: new Date().toISOString(),
        device: detectDevice(),
        sessionId: getSessionId(),
        url: window.location.pathname
    };
}

export function trackPageOpen(props: Record<string, any> = {}) {
    posthog.capture('pageOpen', enrichProps(props));
}
export function trackFaceSwap(props: Record<string, any> = {}) {
    posthog.capture('faceSwap', enrichProps(props));
}
export function trackFaceSwapResult(props: Record<string, any> = {}) {
    posthog.capture('faceSwapResult', enrichProps(props));
}

// Escort page tracking functions
export function trackEscortContact(props: Record<string, any> = {}) {
    posthog.capture('escortContact', enrichProps(props));
}

export function trackEscortGallery(props: Record<string, any> = {}) {
    posthog.capture('escortGallery', enrichProps(props));
}

export function trackEscortCatlist(props: Record<string, any> = {}) {
    posthog.capture('escortCatlist', enrichProps(props));
}

export function trackEscortShare(props: Record<string, any> = {}) {
    posthog.capture('escortShare', enrichProps(props));
}

export function trackEscortAudio(props: Record<string, any> = {}) {
    posthog.capture('escortAudio', enrichProps(props));
}

// Catlist page tracking functions
export function trackCatlistAction(props: Record<string, any> = {}) {
    posthog.capture('catlistAction', enrichProps(props));
}

// Motel tracking functions
export function trackMotelPreviewsView(props: Record<string, any> = {}) {
    posthog.capture('motelPreviewsView', enrichProps(props));
}

export function trackMotelPreviewClick(props: Record<string, any> = {}) {
    posthog.capture('motelPreviewClick', enrichProps(props));
}

export function trackMotelDetailView(props: Record<string, any> = {}) {
    posthog.capture('motelDetailView', enrichProps(props));
}

export function trackMotelContact(props: Record<string, any> = {}) {
    posthog.capture('motelContact', enrichProps(props));
}

export function trackMotelMapView(props: Record<string, any> = {}) {
    posthog.capture('motelMapView', enrichProps(props));
}

export function trackMotelImageGallery(props: Record<string, any> = {}) {
    posthog.capture('motelImageGallery', enrichProps(props));
}
