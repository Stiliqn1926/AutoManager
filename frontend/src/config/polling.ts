export const POLLING_INTERVALS = {
  dashboard: 15000,
  lists: 20000,
  details: 10000,
  activeServiceCheck: 30000,
  keepAlive: 5 * 60 * 1000,
} as const;
