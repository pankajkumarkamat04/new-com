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
  ModuleSettings,
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
  LoginSettings,
  NotificationSettings,
  PublicSettings,
  Category,
  ProductAttribute,
  ProductVariation,
  Product,
  CartItem,
  OrderItem,
  Order,
  UserItem,
  AdminItem,
  Coupon,
  MediaItem,
  BlogPost,
  InventoryMovement,
  ShippingZone,
  ShippingMethod,
  ShippingOptionsResponse,
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
  getMe: () => api<{ admin: { id: string; name: string; email: string; phone?: string; role?: string } }>('/auth/admin/me'),
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
  getNotifications: () => api<{ data: NotificationSettings }>('/settings/notifications'),
  updateNotifications: (body: Partial<NotificationSettings>) =>
    api<{ data: NotificationSettings }>('/settings/notifications', { method: 'PUT', body: JSON.stringify(body) }),
  getLogin: () => api<{ data: LoginSettings }>('/settings/login'),
  updateLogin: (body: Partial<LoginSettings>) =>
    api<{ data: LoginSettings }>('/settings/login', { method: 'PUT', body: JSON.stringify(body) }),
  getModules: () => api<{ data: ModuleSettings }>('/settings/modules'),
  updateModules: (body: Partial<ModuleSettings>) =>
    api<{ data: ModuleSettings }>('/settings/modules', { method: 'PUT', body: JSON.stringify(body) }),
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
    stockManagement?: 'manual' | 'inventory';
    sku?: string;
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
      stockManagement: 'manual' | 'inventory';
      sku: string;
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

export const inventoryApi = {
  list: (params?: { productId?: string; type?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.productId) searchParams.set('productId', params.productId);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: InventoryMovement[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/inventory${query ? `?${query}` : ''}`
    );
  },
  getByProduct: (productId: string) =>
    api<{ data: { product: { _id: string; name: string; stock: number }; movements: InventoryMovement[] } }>(
      `/inventory/product/${productId}`
    ),
  addStock: (body: { productId: string; quantity: number; reason?: string; notes?: string; sku?: string }) =>
    api<{ data: Product; message: string }>('/inventory/add', { method: 'POST', body: JSON.stringify(body) }),
  adjustStock: (body: { productId: string; quantity: number; reason?: string; notes?: string }) =>
    api<{ data: Product; message: string }>('/inventory/adjust', { method: 'POST', body: JSON.stringify(body) }),
};

export type CartAddPayload = {
  productId: string;
  quantity: number;
  variationName?: string;
  variationAttributes?: { name: string; value: string }[];
  price?: number;
};

export const cartApi = {
  get: () => api<{ data: { items: CartItem[] } }>('/cart'),
  add: (payload: CartAddPayload) =>
    api<{ data: { items: CartItem[] } }>('/cart', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  update: (productId: string, quantity: number, variationName?: string) =>
    api<{ data: { items: CartItem[] } }>('/cart', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity, ...(variationName && { variationName }) }),
    }),
  remove: (productId: string, variationName?: string) => {
    const q = variationName ? `?variationName=${encodeURIComponent(variationName)}` : '';
    return api<{ data: { items: CartItem[] } }>(`/cart/items/${productId}${q}`, { method: 'DELETE' });
  },
  merge: (items: { productId: string; quantity: number; variationName?: string; variationAttributes?: { name: string; value: string }[]; price?: number }[]) =>
    api<{ data: { items: CartItem[] } }>('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  clear: () => api<{ data: { items: CartItem[] } }>('/cart', { method: 'DELETE' }),
};

export const paymentApi = {
  createRazorpayOrder: (params: { amount: number; currency?: string; receipt?: string }) =>
    api<{ data: { orderId: string; keyId: string; amountInPaise: number } }>('/payment/create-razorpay-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'INR',
        ...(params.receipt && { receipt: params.receipt }),
      }),
    }),
  createCashfreeSession: (params: {
    orderId: string;
    amount: number;
    currency?: string;
    customerDetails?: { customer_id?: string; customer_name?: string; customer_email?: string; customer_phone?: string };
    returnUrl?: string;
  }) =>
    api<{ data: { orderId: string; paymentSessionId: string } }>('/payment/create-cashfree-session', {
      method: 'POST',
      body: JSON.stringify({
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency || 'INR',
        ...(params.customerDetails && { customerDetails: params.customerDetails }),
        ...(params.returnUrl && { returnUrl: params.returnUrl }),
      }),
    }),
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
      country?: string;
      customFields?: { key: string; label: string; value: string }[];
    };
    paymentMethod?: string;
    couponCode?: string;
    shippingMethodId?: string;
    shippingAmount?: number;
    razorpayPayment?: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
    cashfreePayment?: { order_id: string };
  }) =>
    api<{ data: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        shippingAddress: params.shippingAddress,
        paymentMethod: params.paymentMethod || 'cod',
        ...(params.couponCode && { couponCode: params.couponCode }),
        ...(params.shippingMethodId && { shippingMethodId: params.shippingMethodId }),
        ...(params.shippingAmount !== undefined && params.shippingAmount !== null && { shippingAmount: params.shippingAmount }),
        ...(params.razorpayPayment && { razorpayPayment: params.razorpayPayment }),
        ...(params.cashfreePayment && { cashfreePayment: params.cashfreePayment }),
      }),
    }),
  getMyOrders: () => api<{ data: Order[] }>('/orders'),
  getOrder: (id: string) => api<{ data: Order }>(`/orders/${id}`),
};

// Reports (admin)
export type SalesReportResponse = {
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
  rows: { periodKey: string; periodLabel: string; orders: number; revenue: number }[];
  orders: Order[];
};

export const reportsApi = {
  getSalesReport: (params?: { dateFrom?: string; dateTo?: string; status?: string; groupBy?: "day" | "week" | "month" }) => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.set("dateFrom", params.dateFrom);
    if (params?.dateTo) searchParams.set("dateTo", params.dateTo);
    if (params?.status && params.status !== "all") searchParams.set("status", params.status);
    if (params?.groupBy) searchParams.set("groupBy", params.groupBy);
    const query = searchParams.toString();
    return api<{ data: SalesReportResponse }>(`/reports/sales${query ? `?${query}` : ""}`);
  },
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

export const adminsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return api<{ data: AdminItem[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
      `/admins${query ? `?${query}` : ''}`
    );
  },
  create: (body: { name: string; email: string; phone?: string; password?: string; role?: "admin" | "superadmin" }) =>
    api<{ data: AdminItem }>('/admins', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; email?: string; phone?: string; password?: string; role?: "admin" | "superadmin"; isActive?: boolean }) =>
    api<{ data: AdminItem }>(`/admins/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => api(`/admins/${id}`, { method: 'DELETE' }),
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

// Public: get shipping options for address (query: country, state, zip, subtotal, itemCount)
export const addressApi = {
  list: () => api<{ data: import("./types").Address[] }>("/addresses"),
  create: (body: {
    label?: string;
    name: string;
    address: string;
    city: string;
    state?: string;
    zip: string;
    phone: string;
    country?: string;
    customFields?: { key: string; label: string; value: string }[];
    isDefault?: boolean;
  }) => api<{ data: import("./types").Address }>("/addresses", { method: "POST", body: JSON.stringify(body) }),
  update: (
    id: string,
    body: Partial<{
      label: string;
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      phone: string;
      country: string;
      customFields: { key: string; label: string; value: string }[];
      isDefault: boolean;
    }>
  ) => api<{ data: import("./types").Address }>(`/addresses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) => api(`/addresses/${id}`, { method: "DELETE" }),
  setDefault: (id: string) => api<{ data: import("./types").Address }>(`/addresses/${id}/default`, { method: "PATCH" }),
};

export const shippingApi = {
  getOptions: (params: { country?: string; state?: string; zip?: string; city?: string; subtotal?: number; itemCount?: number }) => {
    const searchParams = new URLSearchParams();
    if (params.country) searchParams.set("country", params.country);
    if (params.state) searchParams.set("state", params.state);
    if (params.zip) searchParams.set("zip", params.zip);
    if (params.city) searchParams.set("city", params.city);
    if (params.subtotal !== undefined) searchParams.set("subtotal", String(params.subtotal));
    if (params.itemCount !== undefined) searchParams.set("itemCount", String(params.itemCount));
    const query = searchParams.toString();
    return api<{ data: ShippingOptionsResponse }>(`/shipping/options${query ? `?${query}` : ""}`);
  },
};

// Admin shipping (zones + methods)
export const adminShippingApi = {
  listZones: () => api<{ data: ShippingZone[] }>("/shipping/admin/zones"),
  createZone: (body: {
    name: string;
    description?: string;
    countryCodes?: string[];
    stateCodes?: string[];
    zipPrefixes?: string[];
    sortOrder?: number;
    isActive?: boolean;
  }) => api<{ data: ShippingZone }>("/shipping/admin/zones", { method: "POST", body: JSON.stringify(body) }),
  updateZone: (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      countryCodes: string[];
      stateCodes: string[];
      zipPrefixes: string[];
      sortOrder: number;
      isActive: boolean;
    }>
  ) => api<{ data: ShippingZone }>(`/shipping/admin/zones/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteZone: (id: string) => api(`/shipping/admin/zones/${id}`, { method: "DELETE" }),
  listMethods: (zoneId: string) => api<{ data: ShippingMethod[] }>(`/shipping/admin/zones/${zoneId}/methods`),
  createMethod: (
    zoneId: string,
    body: {
      name: string;
      description?: string;
      rateType?: "flat" | "per_item" | "per_order";
      rateValue: number;
      minOrderForFree?: number;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      sortOrder?: number;
      isActive?: boolean;
    }
  ) =>
    api<{ data: ShippingMethod }>(`/shipping/admin/zones/${zoneId}/methods`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMethod: (
    id: string,
    body: Partial<{
      name: string;
      description: string;
      rateType: "flat" | "per_item" | "per_order";
      rateValue: number;
      minOrderForFree: number;
      estimatedDaysMin: number;
      estimatedDaysMax: number;
      sortOrder: number;
      isActive: boolean;
    }>
  ) => api<{ data: ShippingMethod }>(`/shipping/admin/methods/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteMethod: (id: string) => api(`/shipping/admin/methods/${id}`, { method: "DELETE" }),
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

export type BackupRestoreResult = {
  success: boolean;
  message?: string;
  results?: { inserted: Record<string, number>; errors: { collection: string; message: string }[] };
};

export const backupApi = {
  /** Download backup as JSON file (superadmin only). Optional collections query: e.g. "users,products,categories". */
  downloadBackup: async (collections?: string): Promise<{ error?: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const url = `${API_BASE}/backup${collections ? `?collections=${encodeURIComponent(collections)}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { error: json.message || json.error || 'Backup failed' };
    }
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    return {};
  },
  /** Restore from a backup JSON file (superadmin only). Option clearBeforeRestore defaults to true. */
  restoreBackup: async (
    file: File,
    options?: { clearBeforeRestore?: boolean }
  ): Promise<{ data?: BackupRestoreResult; error?: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const query = options?.clearBeforeRestore === false ? '?clearBeforeRestore=false' : '';
    const res = await fetch(`${API_BASE}/backup/restore${query}`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.message || json.error || 'Restore failed' };
    return { data: json as BackupRestoreResult };
  },
};
