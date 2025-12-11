/**
 * DataForSEO API Client
 *
 * Wrapper for DataForSEO API with authentication and error handling.
 * Uses Basic HTTP Authentication with login/password from environment.
 *
 * API Documentation: https://docs.dataforseo.com/v3/
 */

const BASE_URL = "https://api.dataforseo.com/v3";

export interface DataForSEOConfig {
  login: string;
  password: string;
}

export interface DataForSEOError {
  code: number;
  message: string;
}

export interface DataForSEOResponse<T> {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: T[];
}

export interface TaskResult<T> {
  id: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  result_count: number;
  path: string[];
  data: Record<string, unknown>;
  result: T[] | null;
}

/**
 * Get DataForSEO credentials from environment
 */
export function getDataForSEOConfig(): DataForSEOConfig | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return null;
  }

  return { login, password };
}

/**
 * Check if DataForSEO is configured
 */
export function isDataForSEOConfigured(): boolean {
  return getDataForSEOConfig() !== null;
}

/**
 * Create Basic Auth header
 */
function createAuthHeader(config: DataForSEOConfig): string {
  const credentials = Buffer.from(`${config.login}:${config.password}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Make a request to DataForSEO API
 */
export async function makeRequest<T>(
  endpoint: string,
  body: unknown[],
  config?: DataForSEOConfig
): Promise<DataForSEOResponse<TaskResult<T>>> {
  const credentials = config || getDataForSEOConfig();

  if (!credentials) {
    throw new Error(
      "DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables."
    );
  }

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: createAuthHeader(credentials),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = (await response.json()) as DataForSEOResponse<TaskResult<T>>;

  // Check for API-level errors
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${data.status_code} - ${data.status_message}`);
  }

  // Check for task-level errors
  if (data.tasks_error > 0) {
    const errorTask = data.tasks.find((task) => task.status_code !== 20000);
    if (errorTask) {
      throw new Error(`DataForSEO task error: ${errorTask.status_code} - ${errorTask.status_message}`);
    }
  }

  return data;
}

/**
 * DataForSEO pricing estimates (approximate, per request)
 * Based on typical usage patterns
 */
export const PRICING_ESTIMATES = {
  // Keywords Data API
  search_volume: 0.05, // per request (up to 1000 keywords)
  keywords_for_keywords: 0.05, // per request (up to 20 keywords)
  // SERP API (more expensive)
  serp_google_organic: 0.002, // per task/keyword
} as const;

/**
 * Calculate estimated cost for an operation
 */
export function estimateCost(
  operation: keyof typeof PRICING_ESTIMATES,
  requestCount: number = 1
): number {
  return PRICING_ESTIMATES[operation] * requestCount;
}
