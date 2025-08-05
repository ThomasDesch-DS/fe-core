import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PostHog
global.posthog = {
  onFeatureFlags: vi.fn(),
  getFeatureFlag: vi.fn(),
  getFeatureFlagPayload: vi.fn(),
  capture: vi.fn(),
  isFeatureEnabled: vi.fn(),
};