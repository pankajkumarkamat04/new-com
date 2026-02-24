// Use HTTPS-safe default. In production, prefer a relative /api prefix so calls
// go through the same domain as the frontend and avoid mixed content.
// If your API is on a different origin, set NEXT_PUBLIC_API_URL to a full HTTPS URL.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:5000/api" : "/api");

/**
 * Resolve a media URL to a full backend URL when needed.
 *
 * Rules:
 * - Absolute URLs (http/https) are returned as-is.
 * - Relative URLs that do NOT start with `/api/` or `/uploads/` are returned as-is
 *   (so `/logo.png` and other frontend assets keep using the frontend origin).
 * - Relative URLs that begin with `/api/` or `/uploads/` are resolved against the
 *   API_BASE origin when API_BASE is absolute (different backend origin).
 */
export function getMediaUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const isBackendPath = url.startsWith("/api/") || url.startsWith("/uploads/");
  if (!isBackendPath) return url;
  if (API_BASE.startsWith("http")) {
    try {
      const origin = new URL(API_BASE).origin;
      return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
    } catch {
      return url;
    }
  }
  return url;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; errors?: { msg: string }[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      error: json.message || json.error || 'Something went wrong',
      errors: json.errors,
    };
  }
  return { data: json as T };
}

import type {
  Settings,
  HeroSlide,
  HeroSettings,
  HomeCategorySettings,
  HomePageSettings,
  HeaderNavLink,
  HeaderSettings,
  FooterLink,
  FooterColumnType,
  FooterColumn,
  FooterSettings,
  CheckoutFieldConfig,
  CheckoutCustomField,
  CheckoutSettings,
  SeoSettings,
  PaymentSettings,
  PublicSettings,
  Category,
  ProductAttribute,
  ProductVariation,
  Product,
  CartItem,
  OrderItem,
  Order,
  UserItem,
  Coupon,
  MediaItem,
  BlogPost,
} from "./types";

// User Auth
export const userApi = {
  getMe: () => api<{ user: { id: string; name: string; email?: string; phone?: string } }>('/auth/user/me'),
  updateProfile: (body: { name?: string; email?: string; phone?: string }) =>
    api<{ user: { id: string; name: string; email?: string; phone?: string } }>('/auth/user/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  signup: (body: { name: string; email?: string; phone?: string; password?: string }) =>
    api('/auth/user/signup', { method: 'POST', body: JSON.stringify(body) }),
  loginPassword: (body: { email?: string; phone?: string; password: string }) =>
    api('/auth/user/login/password', { method: 'POST', body: JSON.stringify(body) }),
  requestOtp: (body: { email?: string; phone?: string }) =>
    api('/auth/user/login/otp/request', { method: 'POST', body: JSON.stringify(body) }),
  loginOtp: (body: { email?: string; phone?: string; otp: string }) =>
    api('/auth/user/login/otp', { method: 'POST', body: JSON.stringify(body) }),
};

// Admin Auth
export const adminApi = {
  getMe: () => api<{ admin: { id: string; name: string; email: string; phone?: string } }>('/auth/admin/me'),
  signup: (body: { name: string; email: string; phone?: string; password?: string }) =>
    api<{ success: boolean; message: string; token: string; admin: { id: string; name: string; email: string; phone?: string } }>(
      '/auth/admin/signup',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  loginPassword: (body: { email?: string; phone?: string; password: string }) =>
    api<{ success: boolean; token: string; admin: { id: string; name: string; email: string; phone?: string } }>(
      '/auth/admin/login/password',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  requestOtp: (body: { email?: string; phone?: string }) =>
    api<{ success: boolean; message: string }>(
      '/auth/admin/login/otp/request',
      { method: 'POST', body: JSON.stringify(body) }
    ),
  loginOtp: (body: { email?: string; phone?: string; otp: string }) =>
    api<{ success: boolean; token: string; admin: { id: string; name: string; email: string; phone?: string } }>(
      '/auth/admin/login/otp',
      { method: 'POST', body: JSON.stringify(body) }
    ),
};

export const settingsApi = {
  get: () => api<{ data: Settings }>('/settings'),
  update: (body: Partial<Settings>) =>
    api<{ data: Settings }>('/settings', { method: 'PUT', body: JSON.stringify(body) }),
  getHomePage: () => api<{ data: HomePageSettings }>('/settings/homepage'),
  getHomeCategories: () => api<{ data: HomeCategorySettings }>('/settings/home-categories'),
  updateHomeCategories: (body: HomeCategorySettings) =>
    api<{ data: HomeCategorySettings }>('/settings/home-categories', { method: 'PUT', body: JSON.stringify(body) }),
  getHero: () => api<{ data: HeroSettings }>('/settings/hero'),
  updateHero: (body: Partial<HeroSettings>) =>
    api<{ data: HeroSettings }>('/settings/hero', { method: 'PUT', body: JSON.stringify(body) }),
  getSeo: () => api<{ data: SeoSettings }>('/settings/seo'),
  updateSeo: (body: Partial<SeoSettings>) =>
    api<{ data: SeoSettings }>('/settings/seo', { method: 'PUT', body: JSON.stringify(body) }),
  getHeader: () => api<{ data: HeaderSettings }>('/settings/header'),
  updateHeader: (body: Partial<HeaderSettings>) =>
    api<{ data: HeaderSettings }>('/settings/header', { method: 'PUT', body: JSON.stringify(body) }),
  getFooter: () => api<{ data: FooterSettings }>('/settings/footer'),
  updateFooter: (body: Partial<FooterSettings>) =>
    api<{ data: FooterSettings }>('/settings/footer', { method: 'PUT', body: JSON.stringify(body) }),
  getCheckout: () => api<{ data: CheckoutSettings }>('/settings/checkout'),
  updateCheckout: (body: Partial<CheckoutSettings>) =>
    api<{ data: CheckoutSettings }>('/settings/checkout', { method: 'PUT', body: JSON.stringify(body) }),
  getPayment: () => api<{ data: PaymentSettings }>('/settings/payment'),
  updatePayment: (body: Partial<PaymentSettings>) =>
    api<{ data: PaymentSettings }>('/settings/payment', { method: 'PUT', body: JSON.stringify(body) }),
  getPublic: () => api<{ data: PublicSettings }>('/settings/public'),
};

export const categoryApi = {
  list: (params?: { isActive?: boolean; parent?: string | null }) => {
    const searchParams = new URLSearchParams();
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params?.parent !== undefined) searchParams.set('parent', params.parent === null || params.parent === '' ? 'null' : params.parent);
    const query = searchParams.toString();
    return api<{ data: Category[] }>(`/categories${query ? `?${query}` : ''}`);
  },
  get: (id: string) => api<{ data: Category }>(`/categories/${id}`),
  create: (body: { name: string; description?: string; image?: string; isActive?: boolean; showOnHomepage?: boolean; parent?: string | null }) =>
    api<{ data: Category }>('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; description: string; image: string; isActive: boolean; showOnHomepage: boolean; parent?: string | null }>) =>
    api<{ data: Category }>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/categories/${id}`, { method: 'DELETE' }),
};

export const productApi = {
  list: (params?: { category?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: Product[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/products${query ? `?${query}` : ''}`
    );
  },
  get: (id: string) => api<{ data: Product }>(`/products/${id}`),
  create: (body: {
    name: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    category?: string;
    stock?: number;
    image?: string;
    images?: string[];
    attributes?: ProductAttribute[];
    variations?: ProductVariation[];
    isActive?: boolean;
  }) =>
    api<{ data: Product }>('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      price: number;
      discountedPrice: number;
      category: string;
      stock: number;
      image: string;
      images: string[];
      attributes: ProductAttribute[];
      variations: ProductVariation[];
      isActive: boolean;
    }>
  ) =>
    api<{ data: Product }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/products/${id}`, { method: 'DELETE' }),
};

export const cartApi = {
  get: () => api<{ data: { items: CartItem[] } }>('/cart'),
  add: (productId: string, quantity?: number) =>
    api<{ data: { items: CartItem[] } }>('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: quantity || 1 }),
    }),
  update: (productId: string, quantity: number) =>
    api<{ data: { items: CartItem[] } }>('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    }),
  remove: (productId: string) =>
    api<{ data: { items: CartItem[] } }>(`/cart/items/${productId}`, { method: 'DELETE' }),
  merge: (items: { productId: string; quantity: number }[]) =>
    api<{ data: { items: CartItem[] } }>('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  clear: () => api<{ data: { items: CartItem[] } }>('/cart', { method: 'DELETE' }),
};

export const ordersApi = {
  placeOrder: (params: {
    shippingAddress: {
      name: string;
      address: string;
      city: string;
      state?: string;
      zip: string;
      phone: string;
      customFields?: { key: string; label: string; value: string }[];
    };
    paymentMethod?: string;
    couponCode?: string;
  }) =>
    api<{ data: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddress: params.shippingAddress,
        paymentMethod: params.paymentMethod || 'cod',
        ...(params.couponCode && { couponCode: params.couponCode }),
      }),
    }),
  getMyOrders: () => api<{ data: Order[] }>('/orders'),
  getOrder: (id: string) => api<{ data: Order }>(`/orders/${id}`),
};

// Admin orders (under /orders/admin)
export const adminOrdersApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: Order[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/orders/admin${query ? `?${query}` : ''}`
    );
  },
  get: (id: string) => api<{ data: Order }>(`/orders/admin/${id}`),
  updateStatus: (id: string, status: string) =>
    api<{ data: Order }>(`/orders/admin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const usersApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: UserItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/users${query ? `?${query}` : ''}`
    );
  },
  get: (id: string) => api<{ data: UserItem }>(`/users/${id}`),
  update: (id: string, body: { name?: string; email?: string; phone?: string }) =>
    api<{ data: UserItem }>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/users/${id}`, { method: 'DELETE' }),
};

export const couponApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: Coupon[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/coupons${query ? `?${query}` : ''}`
    );
  },
  get: (id: string) => api<{ data: Coupon }>(`/coupons/${id}`),
  create: (body: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }) => api<{ data: Coupon }>('/coupons', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount: number;
    maxDiscount: number;
    usageLimit: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>) => api<{ data: Coupon }>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/coupons/${id}`, { method: 'DELETE' }),
  validate: (code: string, orderTotal: number) =>
    api<{ data: { code: string; discountType: string; discountValue: number; discount: number } }>(
      '/coupons/validate',
      { method: 'POST', body: JSON.stringify({ code, orderTotal }) }
    ),
};

export const blogApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: BlogPost[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/blog${query ? `?${query}` : ''}`
    );
  },
  getBySlug: (slug: string) => api<{ data: BlogPost }>(`/blog/${encodeURIComponent(slug)}`),
  adminList: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: BlogPost[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/blog/admin${query ? `?${query}` : ''}`
    );
  },
  adminGet: (id: string) => api<{ data: BlogPost }>(`/blog/admin/${id}`),
  adminCreate: (body: {
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    image?: string;
    tags?: string[];
    isPublished?: boolean;
    publishedAt?: string;
  }) => api<{ data: BlogPost }>('/blog/admin', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdate: (id: string, body: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    tags: string[];
    isPublished: boolean;
    publishedAt: string;
  }>) => api<{ data: BlogPost }>(`/blog/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDelete: (id: string) => api(`/blog/admin/${id}`, { method: 'DELETE' }),
};

export const mediaApi = {
  list: (params?: { page?: number; limit?: number; type?: 'image' | 'video' | 'document' }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.type) searchParams.set('type', params.type);
    const query = searchParams.toString();
    return api<{ data: MediaItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/media${query ? `?${query}` : ''}`
    );
  },
  upload: async (file: File) => {
    // Use same HTTPS-safe default as global API_BASE
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: json.message || json.error || 'Upload failed', data: undefined };
    }
    return { data: json.data as MediaItem, error: undefined };
  },
  delete: (id: string) => api(`/media/${id}`, { method: 'DELETE' }),
};
