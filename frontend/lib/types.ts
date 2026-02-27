// Shared frontend TypeScript types for settings, catalog, orders, users, media, etc.

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
  logoImageUrl?: string;
  faviconUrl?: string;
  couponEnabled?: boolean;
  blogEnabled?: boolean;
  abandonedCartEnabled?: boolean;
  googleAnalyticsEnabled?: boolean;
  googleAnalyticsId?: string;
  facebookPixelEnabled?: boolean;
  facebookPixelId?: string;
  companyGstin?: string;
  taxEnabled?: boolean;
  defaultTaxPercentage?: number;
  shippingEnabled?: boolean;
  whatsappChat?: {
    enabled?: boolean;
    position?: "left" | "right";
    phoneNumber?: string;
  };
};

export type WhatsappChatSettings = {
  enabled: boolean;
  position: "left" | "right";
  phoneNumber: string;
};

export type ProductTax = {
  taxType: "percentage" | "flat";
  value: number;
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
  layout: "carousel" | "single" | "color" | "no-image";
  colorType?: "single" | "gradient";
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
  logoSource?: "general" | "custom";
  logoImageUrl?: string;
  customLogoImageUrl?: string;
  navLinks: HeaderNavLink[];
  showBrowseButton?: boolean;
  showCartIcon?: boolean;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumnType = "links" | "about" | "social" | "contact";

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
  variant: "light" | "dark";
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

export type LoginSettings = {
  loginIdentifier: "email" | "phone";
  loginMethod: "password" | "otp";
};

export type ShippingZone = {
  _id: string;
  name: string;
  description?: string;
  countryCodes: string[];
  stateCodes?: string[];
  zipPrefixes?: string[];
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingMethod = {
  _id: string;
  zoneId: string;
  name: string;
  description?: string;
  rateType: "flat" | "per_item" | "per_order";
  rateValue: number;
  minOrderForFree?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingOption = {
  _id: string;
  name: string;
  description?: string;
  rateType: string;
  rateValue: number;
  minOrderForFree?: number;
  estimatedDaysMin?: number;
  estimatedDaysMax?: number;
  amount: number;
};

export type ShippingOptionsResponse = {
  enabled: boolean;
  zoneMatched?: boolean;
  zoneId?: string;
  zoneName?: string;
  methods: ShippingOption[];
  message?: string;
  useZeroShipping?: boolean;
};

export type ModuleSettings = {
  couponEnabled: boolean;
  shippingEnabled: boolean;
  blogEnabled: boolean;
  abandonedCartEnabled: boolean;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsId: string;
  facebookPixelEnabled: boolean;
  facebookPixelId: string;
  taxEnabled: boolean;
  defaultTaxPercentage: number;
  whatsappChat: {
    enabled: boolean;
    position: "left" | "right";
    phoneNumber: string;
  };
};


export type NotificationEmailSettings = {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
};

export type NotificationSmsSettings = {
  enabled: boolean;
  provider: string;
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
};

export type NotificationWhatsappSettings = {
  enabled: boolean;
  provider: string;
  apiKey: string;
  apiSecret: string;
  phoneNumberId: string;
  fromNumber: string;
};

export type NotificationSettings = {
  email: NotificationEmailSettings;
  sms: NotificationSmsSettings;
  whatsapp: NotificationWhatsappSettings;
};

export type PublicSettings = {
  general: Settings;
  seo: SeoSettings;
  header: HeaderSettings;
  footer?: FooterSettings;
  checkout?: CheckoutSettings;
  payment?: PaymentSettings;
  login?: LoginSettings;
  homepage?: HomePageSettings;
};

// Catalog
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

export type ProductAttribute = {
  name: string;
  terms: string[];
};

export type ProductVariation = {
  _id?: string;
  name: string;
  price: number;
  discountedPrice?: number;
  stockManagement?: 'manual' | 'inventory';
  sku?: string;
  stock?: number;
  image?: string;
  images?: string[];
  attributes?: { name: string; value: string }[];
  isActive?: boolean;
};

export type InventoryMovement = {
  _id: string;
  productId: string | { _id: string; name: string };
  quantity: number;
  type: 'in' | 'out' | 'adjustment';
  reason?: string;
  referenceOrderId?: string;
  previousStock: number;
  newStock: number;
  notes?: string;
  sku?: string;
  createdAt: string;
};

export type Product = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  category?: string;
  stockManagement?: 'manual' | 'inventory';
  sku?: string;
  stock: number;
  image?: string;
  images?: string[];
  attributes?: ProductAttribute[];
  defaultVariationIndex?: number;
  variations?: ProductVariation[];
  tax?: ProductTax;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// Cart & Orders
export type CartItem = {
  productId: string;
  product?: { _id: string; name: string; price: number; image?: string; isActive: boolean; stock: number; tax?: ProductTax };
  quantity: number;
  variationName?: string;
  variationAttributes?: { name: string; value: string }[];
  price?: number;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variationName?: string;
  variationAttributes?: { name: string; value: string }[];
};

export type Order = {
  _id: string;
  userId: string | { _id: string; name: string; email?: string; phone?: string };
  items: OrderItem[];
  subtotal?: number;
  taxAmount?: number;
  total: number;
  couponCode?: string;
  discountAmount?: number;
  shippingMethodId?: string;
  shippingMethodName?: string;
  shippingAmount?: number;
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
  status: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
};

// Admins (for admin management - superadmin only)
export type AdminItem = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "superadmin";
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

// Users
export type UserItem = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

// Coupons
export type Coupon = {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
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

// Blog
export type BlogPost = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  image?: string;
  tags?: string[];
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

