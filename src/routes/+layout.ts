import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$env/static/public';

export const load = async () => {
    console.log("loading...")
  if (browser) {
    posthog.init(
      PUBLIC_POSTHOG_KEY,
      {
        api_host: PUBLIC_POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: false,
        capture_exceptions: true, // This enables capturing exceptions using Error Tracking
        cross_subdomain_cookie: true,
        secure_cookie: true,
        persistence: 'localStorage+cookie',
          person_profiles: 'always'
      }
    );
  }

  return;
};