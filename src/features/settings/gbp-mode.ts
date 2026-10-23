// The GBP fixture is deliberately unavailable in production builds.
export const isGBPMockEnabled = import.meta.env.DEV && import.meta.env.VITE_GBP_MOCK === 'true'
