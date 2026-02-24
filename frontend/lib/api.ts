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

// Settings
export type Settings = {
  _id: string;
  siteName: string;
  siteUrl: string;
  siteTagline: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  couponEnabled?: boolean;
};

export type HeroSlide = {
  image?: string;
  title?: string;
  subtitle?: string;
  textColor?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonTextColor?: string;
  buttonBgColor?: string;
  showText?: boolean;
};

export type HeroSettings = {
  layout: 'carousel' | 'single' | 'color' | 'no-image'; // no-image legacy, treated as color
  colorType?: 'single' | 'gradient';
  color1?: string;
  color2?: string;
  slides: HeroSlide[];
};

export type HomeCategorySettings = {
  title?: string;
  description?: string;
  columns?: number;
  limit?: number;
  showImage?: boolean;
};

export type HomePageSettings = {
  hero: HeroSettings;
  homeCategorySettings?: HomeCategorySettings;
};

export type HeaderNavLink = {
  label: string;
  href: string;
};

export type HeaderSettings = {
  logoImageUrl?: string;
  navLinks: HeaderNavLink[];
  showBrowseButton?: boolean;
  showCartIcon?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumnType = 'links' | 'about' | 'social' | 'contact';

export type FooterColumn = {
  type?: FooterColumnType;
  title: string;
  content?: string;
  links: FooterLink[];
};

export type FooterSettings = {
  columns: FooterColumn[];
  copyrightText: string;
  showSocial: boolean;
  variant: 'light' | 'dark';
  backgroundColor?: string;
};

export type CheckoutFieldConfig = {
  enabled?: boolean;
  required?: boolean;
  label?: string;
};

export type CheckoutCustomField = {
  key: string;
  label: string;
  enabled?: boolean;
  required?: boolean;
};

export type CheckoutSettings = {
  name: CheckoutFieldConfig;
  address: CheckoutFieldConfig;
  city: CheckoutFieldConfig;
  state: CheckoutFieldConfig;
  zip: CheckoutFieldConfig;
  phone: CheckoutFieldConfig;
  customFields?: CheckoutCustomField[];
};

export type SeoSettings = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
};

export type PaymentSettings = {
  currency: string;
  cod: { enabled: boolean };
  razorpay: { enabled: boolean };
  cashfree: { enabled: boolean };
};

export type PublicSettings = {
  general: Settings;
  seo: SeoSettings;
  header: HeaderSettings;
  footer?: FooterSettings;
  checkout?: CheckoutSettings;
  payment?: PaymentSettings;
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

// Categories
export type Category = {
  _id: string;
  parent?: string | { _id: string; name: string; slug: string } | null;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  showOnHomepage?: boolean;
  createdAt: string;
  updatedAt: string;
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

// Products
export type ProductAttribute = {
  name: string;
  terms: string[];
};

export type ProductVariation = {
  _id?: string;
  name: string;
  price: number;
  discountedPrice?: number;
  stock?: number;
  image?: string;
  images?: string[];
  attributes?: { name: string; value: string }[];
  isActive?: boolean;
};

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  category?: string;
  stock: number;
  image?: string;
  images?: string[];
  attributes?: ProductAttribute[];
  variations?: ProductVariation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

// Cart (user auth required for API)
export type CartItem = {
  productId: string;
  product?: { _id: string; name: string; price: number; image?: string; isActive: boolean; stock: number };
  quantity: number;
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

// Orders
export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  _id: string;
  userId: string | { _id: string; name: string; email?: string; phone?: string };
  items: OrderItem[];
  total: number;
  couponCode?: string;
  discountAmount?: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state?: string;
    zip: string;
    phone: string;
    customFields?: { key: string; label: string; value: string }[];
  };
  status: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
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

// Users (admin only)
export type UserItem = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
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

// Coupons
export type Coupon = {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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

// Media
export type MediaItem = {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  createdAt: string;
  updatedAt: string;
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
