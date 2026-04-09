import { performance } from 'node:perf_hooks';

type Role = 'ADMIN' | 'MECHANIC' | 'CLIENT';

type TestUser = {
  email: string;
  password: string;
  role: Role;
};

type EndpointStats = {
  count: number;
  ok: number;
  failed: number;
  totalMs: number;
};

type RequestResult = {
  endpoint: string;
  status: number;
  durationMs: number;
  error?: string;
};

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'https://automanager-production.up.railway.app/api';
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 20);
const ITERATIONS_PER_USER = Number(process.env.LOAD_TEST_ITERATIONS || 8);
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_TEST_REQUEST_TIMEOUT_MS || 15000);

const DEMO_PASSWORD = process.env.LOAD_TEST_PASSWORD || 'Demo12345!';

const users: TestUser[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    email: `admin${i + 1}@automanager.bg`,
    password: DEMO_PASSWORD,
    role: 'ADMIN' as const,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    email: `mechanic${i + 1}@automanager.bg`,
    password: DEMO_PASSWORD,
    role: 'MECHANIC' as const,
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    email: `client${i + 1}@automanager.bg`,
    password: DEMO_PASSWORD,
    role: 'CLIENT' as const,
  })),
];

const endpointStats = new Map<string, EndpointStats>();
const allLatencies: number[] = [];
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let transportErrors = 0;

const randomFrom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const buildCookieHeader = (setCookieValues: string[]): string => {
  return setCookieValues
    .map((value) => value.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
};

const getSetCookies = (headers: Headers): string[] => {
  const anyHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === 'function') {
    return anyHeaders.getSetCookie();
  }

  const raw = headers.get('set-cookie');
  if (!raw) return [];

  // Fallback split for combined header.
  return raw
    .split(/,(?=\s*[A-Za-z0-9_\-]+=)/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const record = (result: RequestResult): void => {
  totalRequests += 1;
  allLatencies.push(result.durationMs);

  const endpoint = result.endpoint;
  const current = endpointStats.get(endpoint) || {
    count: 0,
    ok: 0,
    failed: 0,
    totalMs: 0,
  };

  current.count += 1;
  current.totalMs += result.durationMs;

  if (result.status >= 200 && result.status < 400) {
    successfulRequests += 1;
    current.ok += 1;
  } else {
    failedRequests += 1;
    current.failed += 1;
  }

  endpointStats.set(endpoint, current);
};

const requestJson = async (
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    cookieHeader: string;
  }
): Promise<RequestResult & { json?: any }> => {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: options.cookieHeader,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const durationMs = performance.now() - started;
    clearTimeout(timeout);

    let json: any;
    try {
      json = await response.json();
    } catch {
      json = null;
    }

    const result: RequestResult = {
      endpoint: path,
      status: response.status,
      durationMs,
    };
    record(result);

    return { ...result, json };
  } catch (error) {
    clearTimeout(timeout);
    const durationMs = performance.now() - started;
    transportErrors += 1;
    const result: RequestResult = {
      endpoint: path,
      status: 0,
      durationMs,
      error: error instanceof Error ? error.message : 'unknown error',
    };
    record(result);
    return result;
  }
};

const login = async (user: TestUser): Promise<string | null> => {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        rememberMe: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const durationMs = performance.now() - started;
    const setCookies = getSetCookies(response.headers);
    const cookieHeader = buildCookieHeader(setCookies);

    record({
      endpoint: '/auth/login',
      status: response.status,
      durationMs,
    });

    if (!response.ok || !cookieHeader.includes('accessToken=')) {
      return null;
    }

    return cookieHeader;
  } catch {
    clearTimeout(timeout);
    const durationMs = performance.now() - started;
    transportErrors += 1;
    record({
      endpoint: '/auth/login',
      status: 0,
      durationMs,
      error: 'login transport error',
    });
    return null;
  }
};

const runAdminFlow = async (cookieHeader: string): Promise<void> => {
  const orders = await requestJson('/orders?page=1&limit=20', { cookieHeader });
  if (orders.json?.orders?.[0]?.id) {
    await requestJson(`/orders/${orders.json.orders[0].id}`, { cookieHeader });
  }

  const endpoints = [
    '/dashboard/overview',
    '/clients?page=1&limit=20',
    '/workers?page=1&limit=20',
    '/finances?page=1&limit=20',
    '/pending-requests',
  ];

  for (const endpoint of endpoints) {
    await requestJson(endpoint, { cookieHeader });
  }
};

const runMechanicFlow = async (cookieHeader: string): Promise<void> => {
  const orders = await requestJson('/orders?page=1&limit=20', { cookieHeader });
  if (orders.json?.orders?.[0]?.id) {
    await requestJson(`/orders/${orders.json.orders[0].id}`, { cookieHeader });
  }

  const endpoints = [
    '/dashboard/mechanic',
    '/clients/mechanic?page=1&limit=20',
    '/vehicles/mechanic?page=1&limit=20',
    '/workers/service-companies',
    '/workers/service-companies/active',
  ];

  for (const endpoint of endpoints) {
    await requestJson(endpoint, { cookieHeader });
  }
};

const runClientFlow = async (cookieHeader: string): Promise<void> => {
  const orders = await requestJson('/client/orders?page=1&limit=20', { cookieHeader });
  if (orders.json?.orders?.[0]?.id) {
    await requestJson(`/client/orders/${orders.json.orders[0].id}`, { cookieHeader });
  }

  const endpoints = [
    '/client/dashboard',
    '/client/service-companies',
    '/client/vehicles?page=1&limit=20',
    '/client/notifications?page=1&limit=20',
    '/client/invoices?page=1&limit=20',
  ];

  for (const endpoint of endpoints) {
    await requestJson(endpoint, { cookieHeader });
  }
};

const runUserScenario = async (user: TestUser): Promise<void> => {
  const cookieHeader = await login(user);
  if (!cookieHeader) {
    return;
  }

  for (let i = 0; i < ITERATIONS_PER_USER; i += 1) {
    if (user.role === 'ADMIN') {
      await runAdminFlow(cookieHeader);
    } else if (user.role === 'MECHANIC') {
      await runMechanicFlow(cookieHeader);
    } else {
      await runClientFlow(cookieHeader);
    }
  }
};

const worker = async (queue: TestUser[]): Promise<void> => {
  while (true) {
    const user = queue.shift();
    if (!user) break;
    await runUserScenario(user);
  }
};

const printSummary = (): void => {
  const avgLatency =
    allLatencies.length > 0
      ? allLatencies.reduce((sum, ms) => sum + ms, 0) / allLatencies.length
      : 0;

  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

  console.log('\n===== LOAD TEST SUMMARY =====');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Users: ${users.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Iterations per user: ${ITERATIONS_PER_USER}`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful (2xx/3xx): ${successfulRequests}`);
  console.log(`Failed (4xx/5xx/0): ${failedRequests}`);
  console.log(`Transport errors: ${transportErrors}`);
  console.log(`Error rate: ${errorRate.toFixed(2)}%`);
  console.log(`Avg latency: ${avgLatency.toFixed(2)} ms`);
  console.log(`p50: ${percentile(allLatencies, 50).toFixed(2)} ms`);
  console.log(`p95: ${percentile(allLatencies, 95).toFixed(2)} ms`);
  console.log(`p99: ${percentile(allLatencies, 99).toFixed(2)} ms`);

  console.log('\n===== ENDPOINT BREAKDOWN =====');
  const sorted = [...endpointStats.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [endpoint, stats] of sorted) {
    const avg = stats.count > 0 ? stats.totalMs / stats.count : 0;
    const endpointErrorRate = stats.count > 0 ? (stats.failed / stats.count) * 100 : 0;
    console.log(
      `${endpoint} -> count=${stats.count}, ok=${stats.ok}, failed=${stats.failed}, avg=${avg.toFixed(
        2
      )}ms, errorRate=${endpointErrorRate.toFixed(2)}%`
    );
  }
  console.log('==============================\n');
};

async function main() {
  console.log('Ð¡Ñ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ð¼ load test...');
  console.log(`Target: ${BASE_URL}`);

  const queue = [...users];
  const workers = Array.from({ length: Math.min(CONCURRENCY, users.length) }, () => worker(queue));

  const started = performance.now();
  await Promise.all(workers);
  const totalMs = performance.now() - started;

  printSummary();
  console.log(`ÐžÐ±Ñ‰Ð¾ Ð²Ñ€ÐµÐ¼Ðµ: ${(totalMs / 1000).toFixed(2)}s`);
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exitCode = 1;
});
