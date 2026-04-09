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

type JsonValue = Record<string, any> | null;

const BASE_URL = process.env.LOAD_TEST_BASE_URL || 'https://automanager-production.up.railway.app/api';
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY || 20);
const ITERATIONS_PER_USER = Number(process.env.LOAD_TEST_ITERATIONS || 8);
const REQUEST_TIMEOUT_MS = Number(process.env.LOAD_TEST_REQUEST_TIMEOUT_MS || 15000);
const ENABLE_WRITES = (process.env.LOAD_TEST_ENABLE_WRITES || 'true').toLowerCase() !== 'false';
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
let writeOperations = 0;
let writeFailures = 0;
let sequenceCounter = 0;

const nextSequence = (): number => {
  sequenceCounter += 1;
  return sequenceCounter;
};

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
};

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;

const normalizeEndpointLabel = (method: string, path: string): string => {
  const [pathname, query] = path.split('?');
  const normalizedPath = pathname.replace(UUID_PATTERN, ':id');
  return query ? `${method} ${normalizedPath}?${query}` : `${method} ${normalizedPath}`;
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

const isWriteMethod = (method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): boolean => {
  return method !== 'GET';
};

const requestJson = async (
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    cookieHeader: string;
  }
): Promise<RequestResult & { json?: JsonValue }> => {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const method = options.method || 'GET';
  const writeOperation = isWriteMethod(method);

  if (writeOperation) {
    writeOperations += 1;
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Cookie: options.cookieHeader,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const durationMs = performance.now() - started;
    clearTimeout(timeout);

    let json: JsonValue;
    try {
      json = (await response.json()) as JsonValue;
    } catch {
      json = null;
    }

    const result: RequestResult = {
      endpoint: normalizeEndpointLabel(method, path),
      status: response.status,
      durationMs,
    };

    if (writeOperation && !(response.status >= 200 && response.status < 400)) {
      writeFailures += 1;
    }

    record(result);
    return { ...result, json };
  } catch (error) {
    clearTimeout(timeout);
    const durationMs = performance.now() - started;
    transportErrors += 1;

    if (writeOperation) {
      writeFailures += 1;
    }

    const result: RequestResult = {
      endpoint: normalizeEndpointLabel(method, path),
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
      endpoint: 'POST /auth/login',
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
      endpoint: 'POST /auth/login',
      status: 0,
      durationMs,
      error: 'login transport error',
    });
    return null;
  }
};

const nextPhone = (seed: number): string => {
  const suffix = (100000000 + (seed % 900000000)).toString();
  return `0${suffix}`;
};

const nextLicensePlate = (seed: number): string => {
  const n = (1000 + (seed % 8999)).toString();
  const letters = String.fromCharCode(65 + (seed % 26)) + String.fromCharCode(65 + ((seed + 7) % 26));
  return `PB${n}${letters}`;
};

const nextMarker = (role: Role, iteration: number): string => {
  const seq = nextSequence();
  return `${role}-${iteration}-${Date.now()}-${seq}`;
};

const runAdminWriteFlow = async (cookieHeader: string, iteration: number): Promise<void> => {
  const marker = nextMarker('ADMIN', iteration);
  let clientId: string | null = null;
  let vehicleId: string | null = null;
  let orderId: string | null = null;
  let orderItemId: string | null = null;
  let financeId: string | null = null;
  let scheduleId: string | null = null;

  try {
    const financeCreate = await requestJson('/finances', {
      method: 'POST',
      cookieHeader,
      body: {
        type: 'EXPENSE',
        category: 'SUPPLIES',
        amount: 25.5,
        description: `[LOADTEST] ${marker}`,
        date: new Date().toISOString(),
      },
    });
    financeId = financeCreate.json?.finance?.id || null;

    if (financeId) {
      await requestJson(`/finances/${financeId}`, {
        method: 'PUT',
        cookieHeader,
        body: {
          type: 'EXPENSE',
          category: 'SUPPLIES',
          amount: 27.75,
          description: `[LOADTEST][UPDATED] ${marker}`,
          date: new Date().toISOString(),
        },
      });
    }

    const start = new Date(Date.now() + 60 * 60 * 1000 + iteration * 2 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const scheduleCreate = await requestJson('/schedules', {
      method: 'POST',
      cookieHeader,
      body: {
        title: `Load test schedule ${marker}`,
        description: `Load test schedule description ${marker}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        priority: 'NORMAL',
        status: 'SCHEDULED',
      },
    });
    scheduleId = scheduleCreate.json?.schedule?.id || null;

    if (scheduleId) {
      await requestJson(`/schedules/${scheduleId}`, {
        method: 'PUT',
        cookieHeader,
        body: {
          notes: `Load test update ${marker}`,
          priority: 'HIGH',
        },
      });
    }

    const seq = nextSequence();
    const clientCreate = await requestJson('/clients', {
      method: 'POST',
      cookieHeader,
      body: {
        firstName: 'Ð¢ÐµÑÑ‚',
        lastName: `ÐšÐ»Ð¸ÐµÐ½Ñ‚${seq}`,
        phone: nextPhone(seq),
        email: `loadtest.client.${seq}@automanager.bg`,
        address: `Ð¢ÐµÑÑ‚ Ð°Ð´Ñ€ÐµÑ ${seq}`,
      },
    });
    clientId = clientCreate.json?.client?.id || null;

    if (!clientId) return;

    const vehicleCreate = await requestJson('/vehicles', {
      method: 'POST',
      cookieHeader,
      body: {
        clientId,
        brand: 'VW',
        model: 'Golf',
        year: 2018,
        licensePlate: nextLicensePlate(seq),
        color: 'Ð§ÐµÑ€ÐµÐ½',
        mileage: 120000,
      },
    });
    vehicleId = vehicleCreate.json?.vehicle?.id || null;

    if (!vehicleId) return;

    await requestJson(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      cookieHeader,
      body: {
        brand: 'VW',
        model: 'Golf',
        year: 2018,
        licensePlate: nextLicensePlate(seq),
        color: 'Ð§ÐµÑ€ÐµÐ½',
        mileage: 120100,
      },
    });

    const orderCreate = await requestJson('/orders', {
      method: 'POST',
      cookieHeader,
      body: {
        vehicleId,
        clientId,
        description: `Load test order ${marker} detailed description`,
      },
    });
    orderId = orderCreate.json?.order?.id || null;

    if (!orderId) return;

    const orderItemCreate = await requestJson(`/order-items/${orderId}`, {
      method: 'POST',
      cookieHeader,
      body: {
        type: 'LABOR',
        name: `Load test labor ${seq}`,
        quantity: 1,
        unitPrice: 50,
        description: `Load test labor description ${marker}`,
      },
    });
    orderItemId = orderItemCreate.json?.orderItem?.id || null;

    if (orderItemId) {
      await requestJson(`/order-items/${orderItemId}`, {
        method: 'PUT',
        cookieHeader,
        body: {
          type: 'LABOR',
          name: `Load test labor updated ${seq}`,
          quantity: 2,
          unitPrice: 55,
          description: `Load test labor updated ${marker}`,
        },
      });
    }

    await requestJson(`/orders/${orderId}/status`, {
      method: 'PUT',
      cookieHeader,
      body: {
        status: 'IN_PROGRESS',
      },
    });
  } finally {
    if (orderItemId) {
      const result = await requestJson(`/order-items/${orderItemId}`, {
        method: 'DELETE',
        cookieHeader,
      });
      if (result.status >= 200 && result.status < 400) {
        orderItemId = null;
      }
    }

    if (orderId) {
      const result = await requestJson(`/orders/${orderId}`, {
        method: 'DELETE',
        cookieHeader,
      });
      if (result.status >= 200 && result.status < 400) {
        orderId = null;
      }
    }

    if (vehicleId) {
      const result = await requestJson(`/vehicles/${vehicleId}`, {
        method: 'DELETE',
        cookieHeader,
      });
      if (result.status >= 200 && result.status < 400) {
        vehicleId = null;
      }
    }

    if (clientId) {
      await requestJson(`/clients/${clientId}`, {
        method: 'DELETE',
        cookieHeader,
      });
    }

    if (scheduleId) {
      await requestJson(`/schedules/${scheduleId}`, {
        method: 'DELETE',
        cookieHeader,
      });
    }

    if (financeId) {
      await requestJson(`/finances/${financeId}`, {
        method: 'DELETE',
        cookieHeader,
      });
    }
  }
};

const runMechanicWriteFlow = async (cookieHeader: string): Promise<void> => {
  const profile = await requestJson('/workers/profile', { cookieHeader });
  const worker = profile.json?.worker;

  if (worker) {
    await requestJson('/workers/profile', {
      method: 'PUT',
      cookieHeader,
      body: {
        firstName: worker.firstName,
        lastName: worker.lastName,
        phone: worker.phone,
        specialization: worker.specialization || '',
        skills: worker.skills || '',
      },
    });
  }

  const ordersResponse = await requestJson('/orders?page=1&limit=20', { cookieHeader });
  const firstOrder = ordersResponse.json?.orders?.[0];

  if (!firstOrder?.id) return;

  const currentStatus: string = firstOrder.status || 'WAITING';
  const nextStatus =
    currentStatus === 'WAITING' || currentStatus === 'READY' || currentStatus === 'COMPLETED'
      ? 'IN_PROGRESS'
      : 'WAITING';

  await requestJson(`/orders/${firstOrder.id}/status`, {
    method: 'PUT',
    cookieHeader,
    body: { status: nextStatus },
  });
};

const runClientWriteFlow = async (cookieHeader: string): Promise<void> => {
  const profile = await requestJson('/client/profile', { cookieHeader });
  const profileData = profile.json?.profile;

  if (profileData) {
    await requestJson('/client/profile', {
      method: 'PUT',
      cookieHeader,
      body: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        address: profileData.address || '',
      },
    });
  }

  const notificationsResponse = await requestJson('/client/notifications?page=1&limit=20', {
    cookieHeader,
  });

  const unread = (notificationsResponse.json?.notifications || []).find(
    (n: any) => n && n.id && n.isRead === false
  );

  if (unread?.id) {
    await requestJson(`/client/notifications/${unread.id}/read`, {
      method: 'PUT',
      cookieHeader,
    });
  }
};

const runAdminFlow = async (cookieHeader: string, iteration: number): Promise<void> => {
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

  if (ENABLE_WRITES) {
    await runAdminWriteFlow(cookieHeader, iteration);
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

  if (ENABLE_WRITES) {
    await runMechanicWriteFlow(cookieHeader);
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

  if (ENABLE_WRITES) {
    await runClientWriteFlow(cookieHeader);
  }
};

const runUserScenario = async (user: TestUser): Promise<void> => {
  const cookieHeader = await login(user);
  if (!cookieHeader) {
    return;
  }

  for (let i = 0; i < ITERATIONS_PER_USER; i += 1) {
    if (user.role === 'ADMIN') {
      await runAdminFlow(cookieHeader, i + 1);
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
  const writeErrorRate = writeOperations > 0 ? (writeFailures / writeOperations) * 100 : 0;

  console.log('\n===== LOAD TEST SUMMARY =====');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Users: ${users.length}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Iterations per user: ${ITERATIONS_PER_USER}`);
  console.log(`Write mode: ${ENABLE_WRITES ? 'enabled' : 'disabled'}`);
  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful (2xx/3xx): ${successfulRequests}`);
  console.log(`Failed (4xx/5xx/0): ${failedRequests}`);
  console.log(`Transport errors: ${transportErrors}`);
  console.log(`Error rate: ${errorRate.toFixed(2)}%`);
  console.log(`Write operations: ${writeOperations}`);
  console.log(`Write failures: ${writeFailures}`);
  console.log(`Write error rate: ${writeErrorRate.toFixed(2)}%`);
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
  console.log('Starting load test...');
  console.log(`Target: ${BASE_URL}`);

  const queue = [...users];
  const workers = Array.from({ length: Math.min(CONCURRENCY, users.length) }, () => worker(queue));

  const started = performance.now();
  await Promise.all(workers);
  const totalMs = performance.now() - started;

  printSummary();
  console.log(`Total duration: ${(totalMs / 1000).toFixed(2)}s`);
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exitCode = 1;
});

