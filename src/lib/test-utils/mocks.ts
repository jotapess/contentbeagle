import { vi } from "vitest";

/**
 * Mock Supabase client
 */
export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  };
}

/**
 * Mock user data
 */
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    full_name: "Test User",
    avatar_url: null,
  },
  created_at: new Date().toISOString(),
};

/**
 * Mock team data
 */
export const mockTeam = {
  id: "test-team-id",
  name: "Test Team",
  slug: "test-team",
  created_at: new Date().toISOString(),
  owner_id: mockUser.id,
};

/**
 * Mock brand data
 */
export const mockBrand = {
  id: "test-brand-id",
  team_id: mockTeam.id,
  name: "Test Brand",
  domain: "https://example.com",
  description: "Test brand description",
  target_audience: "Tech professionals",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Mock article data
 */
export const mockArticle = {
  id: "test-article-id",
  brand_id: mockBrand.id,
  title: "Test Article",
  content: "# Test Article\n\nThis is test content.",
  status: "draft" as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: mockUser.id,
  brand: mockBrand,
};

/**
 * Mock API key data
 */
export const mockApiKey = {
  id: "test-api-key-id",
  user_id: mockUser.id,
  provider_id: "openai",
  key_identifier: "key_openai_123",
  is_valid: true,
  created_at: new Date().toISOString(),
};

/**
 * Create mock fetch response
 */
export function createMockResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Mock fetch globally
 */
export function mockFetch(response: Response | (() => Response)) {
  const mockFn = vi.fn(() =>
    Promise.resolve(typeof response === "function" ? response() : response)
  );
  global.fetch = mockFn;
  return mockFn;
}

/**
 * Reset fetch mock
 */
export function resetFetchMock() {
  vi.restoreAllMocks();
}
