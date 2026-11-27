import { doc, setDoc, deleteDoc, getDocs, onSnapshot, collection, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, CartItem, User, Order, ContactMessage, DeliveryMethod, PaymentMethod, OrderStatus, BurgerTier } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { calculateExtraFlavorsCost } from '../data/pizzaFlavors';
import { hashPassword, verifyPassword } from '../utils/password';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function sanitizeForFirestore<T>(data: T): T {
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

const INITIAL_PRODUCT_IDS = new Set(INITIAL_PRODUCTS.map((p) => p.id));
const INITIAL_PRODUCT_MAP = new Map<string, Product>(INITIAL_PRODUCTS.map((p) => [p.id, p]));
const DEFAULT_PRODUCT_IMAGE = '/assets/images/pizza_muzzarella_oz_1792935617970.jpg';

function cleanAssetUrl(url: unknown, fallback: string): string {
  if (typeof url !== 'string' || !url.trim()) return fallback;
  return url.startsWith('/src/assets/images/')
    ? url.replace('/src/assets/images/', '/assets/images/')
    : url;
}

function normalizeProduct(raw: any, base?: Product): Product {
  const safeObj = raw && typeof raw === 'object' ? raw : {};
  const id = typeof safeObj.id === 'string' && safeObj.id.trim() ? safeObj.id : base?.id || `prod-${Date.now().toString(36)}`;
  const rawPrice = Number(safeObj.price);
  const price = Number.isFinite(rawPrice) ? rawPrice : base?.price ?? 0;
  const rawOrig = Number(safeObj.originalPrice);
  const originalPrice = Number.isFinite(rawOrig) && rawOrig > 0 ? rawOrig : base?.originalPrice;
  const rawStock = Number(safeObj.stock);
  const stock = Number.isFinite(rawStock) ? rawStock : base?.stock ?? 99;

  return {
    ...(base || {}),
    ...safeObj,
    id,
    name: typeof safeObj.name === 'string' && safeObj.name.trim() ? safeObj.name : base?.name || 'Producto OZ',
    tagline: typeof safeObj.tagline === 'string' ? safeObj.tagline : base?.tagline || '',
    description: typeof safeObj.description === 'string' ? safeObj.description : base?.description || '',
    price,
    originalPrice,
    discountBadge: typeof safeObj.discountBadge === 'string' ? safeObj.discountBadge : base?.discountBadge,
    category: (typeof safeObj.category === 'string' && safeObj.category.trim() ? safeObj.category : base?.category || 'pizzetas') as Product['category'],
    image: cleanAssetUrl(safeObj.image, base?.image || DEFAULT_PRODUCT_IMAGE),
    unit: typeof safeObj.unit === 'string' && safeObj.unit.trim() ? safeObj.unit : base?.unit || 'unidad',
    origin: typeof safeObj.origin === 'string' ? safeObj.origin : base?.origin,
    stock,
    featured: typeof safeObj.featured === 'boolean' ? safeObj.featured : base?.featured,
    notes: typeof safeObj.notes === 'string' ? safeObj.notes : base?.notes,
    supportsCustomFlavors:
      typeof safeObj.supportsCustomFlavors === 'boolean'
        ? safeObj.supportsCustomFlavors
        : base?.supportsCustomFlavors,
    subCategory: typeof safeObj.subCategory === 'string' ? safeObj.subCategory : base?.subCategory,
    burgerTiers:
      safeObj.burgerTiers && typeof safeObj.burgerTiers === 'object'
        ? safeObj.burgerTiers
        : base?.burgerTiers,
    available: safeObj.available === false ? false : true,
    deleted: safeObj.deleted === true,
    deletedAt: typeof safeObj.deletedAt === 'string' ? safeObj.deletedAt : undefined,
    updatedAt: typeof safeObj.updatedAt === 'string' ? safeObj.updatedAt : base?.updatedAt,
  };
}

function normalizeUser(raw: any): User {
  const safeObj = raw && typeof raw === 'object' ? raw : {};
  const cedula = typeof safeObj.cedula === 'string' ? safeObj.cedula : String(safeObj.cedula ?? '');
  const cleanCedula = cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
  const defaultCardNumber = `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`;
  const rawLoyalty = safeObj.loyalty && typeof safeObj.loyalty === 'object' ? safeObj.loyalty : {};
  const stampsCount = Number.isFinite(Number(rawLoyalty.stampsCount)) ? Number(rawLoyalty.stampsCount) : 1;
  const totalStampsEarned = Number.isFinite(Number(rawLoyalty.totalStampsEarned)) ? Number(rawLoyalty.totalStampsEarned) : stampsCount;
  const completedCards = Number.isFinite(Number(rawLoyalty.completedCards)) ? Number(rawLoyalty.completedCards) : 0;
  const unclaimedRewards = Number.isFinite(Number(rawLoyalty.unclaimedRewards)) ? Number(rawLoyalty.unclaimedRewards) : 0;

  return {
    id: typeof safeObj.id === 'string' && safeObj.id.trim() ? safeObj.id : `usr-${Date.now().toString(36)}`,
    name: typeof safeObj.name === 'string' && safeObj.name.trim() ? safeObj.name : 'Cliente OZ',
    cedula,
    password: typeof safeObj.password === 'string' && safeObj.password ? safeObj.password : undefined,
    passwordHash: typeof safeObj.passwordHash === 'string' && safeObj.passwordHash.includes(':') ? safeObj.passwordHash : undefined,
    email: typeof safeObj.email === 'string' ? safeObj.email : undefined,
    phone: typeof safeObj.phone === 'string' ? safeObj.phone : '',
    address: typeof safeObj.address === 'string' ? safeObj.address : '',
    city:
      typeof safeObj.city === 'string' &&
      safeObj.city.trim() &&
      safeObj.city.trim().toLowerCase() !== 'buenos aires'
        ? safeObj.city
        : 'Melo',
    apartment: typeof safeObj.apartment === 'string' ? safeObj.apartment : undefined,
    registeredAt: typeof safeObj.registeredAt === 'string' && safeObj.registeredAt ? safeObj.registeredAt : new Date().toISOString().split('T')[0],
    loyalty: {
      stampsCount,
      totalStampsEarned,
      completedCards,
      unclaimedRewards,
      tier:
        rawLoyalty.tier === 'maestro_vip' || rawLoyalty.tier === 'explorador' || rawLoyalty.tier === 'amigo'
          ? rawLoyalty.tier
          : totalStampsEarned >= 16
          ? 'maestro_vip'
          : totalStampsEarned >= 8
          ? 'explorador'
          : 'amigo',
      cardNumber: typeof rawLoyalty.cardNumber === 'string' && rawLoyalty.cardNumber ? rawLoyalty.cardNumber : defaultCardNumber,
    },
  };
}

function normalizeOrder(raw: any): Order | null {
  if (!raw || typeof raw !== 'object' || !raw.id) return null;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems
    .filter((it: any) => it && typeof it === 'object')
    .map((it: any) => {
      const quantity = Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0 ? Number(it.quantity) : 1;
      const unitPrice = Number.isFinite(Number(it.unitPrice)) ? Number(it.unitPrice) : 0;
      const subtotal = Number.isFinite(Number(it.subtotal)) ? Number(it.subtotal) : unitPrice * quantity;
      return {
        productId: typeof it.productId === 'string' ? it.productId : 'item',
        productName: typeof it.productName === 'string' && it.productName ? it.productName : 'Producto OZ',
        quantity,
        unitPrice,
        subtotal,
        image: typeof it.image === 'string' ? it.image : undefined,
        selectedFlavors: Array.isArray(it.selectedFlavors) ? it.selectedFlavors.filter((f: any) => typeof f === 'string') : undefined,
        extraFlavorsCost: Number.isFinite(Number(it.extraFlavorsCost)) ? Number(it.extraFlavorsCost) : undefined,
        observations: typeof it.observations === 'string' ? it.observations : undefined,
        selectedBurgerTier: typeof it.selectedBurgerTier === 'string' ? it.selectedBurgerTier : undefined,
      };
    });

  const parsedDate = raw.createdAt ? new Date(String(raw.createdAt)) : null;
  const createdAt = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
  const validStatuses: OrderStatus[] = ['recibido', 'preparando', 'en_camino', 'listo_retiro', 'entregado'];
  const status: OrderStatus = validStatuses.includes(raw.status) ? raw.status : 'recibido';

  return {
    id: String(raw.id),
    userId: typeof raw.userId === 'string' ? raw.userId : null,
    customerName: typeof raw.customerName === 'string' ? raw.customerName : 'Cliente OZ',
    customerCedula: typeof raw.customerCedula === 'string' ? raw.customerCedula : String(raw.customerCedula ?? ''),
    customerPhone: typeof raw.customerPhone === 'string' ? raw.customerPhone : '',
    customerEmail: typeof raw.customerEmail === 'string' ? raw.customerEmail : undefined,
    deliveryMethod: raw.deliveryMethod === 'pickup' ? 'pickup' : 'delivery',
    deliveryAddress: typeof raw.deliveryAddress === 'string' ? raw.deliveryAddress : undefined,
    apartment: typeof raw.apartment === 'string' ? raw.apartment : undefined,
    deliveryCity: typeof raw.deliveryCity === 'string' ? raw.deliveryCity : undefined,
    paymentMethod: raw.paymentMethod === 'card' ? 'card' : 'cash',
    cashAmountToPayWith: Number.isFinite(Number(raw.cashAmountToPayWith)) ? Number(raw.cashAmountToPayWith) : undefined,
    cardLast4: typeof raw.cardLast4 === 'string' ? raw.cardLast4 : undefined,
    cardHolder: typeof raw.cardHolder === 'string' ? raw.cardHolder : undefined,
    items,
    subtotal: Number.isFinite(Number(raw.subtotal)) ? Number(raw.subtotal) : 0,
    shippingFee: Number.isFinite(Number(raw.shippingFee)) ? Number(raw.shippingFee) : 0,
    total: Number.isFinite(Number(raw.total)) ? Number(raw.total) : 0,
    customerNotes: typeof raw.customerNotes === 'string' ? raw.customerNotes : undefined,
    status,
    createdAt,
    whatsappMessage: typeof raw.whatsappMessage === 'string' ? raw.whatsappMessage : '',
  };
}

function normalizeCart(raw: any): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object' && item.product && typeof item.product === 'object')
    .map((item) => ({
      product: normalizeProduct(item.product, INITIAL_PRODUCT_MAP.get(item.product.id)),
      quantity: Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      selectedFlavors: Array.isArray(item.selectedFlavors) ? item.selectedFlavors.filter((f: any) => typeof f === 'string') : undefined,
      extraFlavorsCost: Number.isFinite(Number(item.extraFlavorsCost)) ? Number(item.extraFlavorsCost) : 0,
      observations: typeof item.observations === 'string' ? item.observations : undefined,
      selectedBurgerTier: typeof item.selectedBurgerTier === 'string' ? item.selectedBurgerTier : undefined,
      unitPrice: Number.isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : undefined,
    }));
}

const SCHEDULE_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const SCHEDULE_DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

export function formatScheduleHoursText(
  openTime: string,
  closeTime: string,
  openDays: number[] = [0, 2, 3, 4, 5, 6]
): string {
  const validDays = SCHEDULE_DAY_ORDER.filter((d) => openDays.includes(d));
  let daysLabel = 'Martes a Domingo';
  if (validDays.length === 7) {
    daysLabel = 'Todos los días';
  } else if (validDays.length >= 2) {
    const indices = validDays.map((d) => SCHEDULE_DAY_ORDER.indexOf(d));
    const isContiguous = indices.every((idx, i) => i === 0 || idx === indices[i - 1] + 1);
    if (isContiguous) {
      daysLabel = `${SCHEDULE_DAY_NAMES[validDays[0]]} a ${SCHEDULE_DAY_NAMES[validDays[validDays.length - 1]]}`;
    } else {
      daysLabel = validDays.map((d) => SCHEDULE_DAY_NAMES[d]).join(', ');
    }
  } else if (validDays.length === 1) {
    daysLabel = SCHEDULE_DAY_NAMES[validDays[0]];
  }
  return `${daysLabel} de ${openTime} a ${closeTime} hs`;
}

export function extractTimeRangeFromText(text: string): { openTime: string; closeTime: string } | null {
  const match = /\b(\d{1,2})[:.](\d{2})\s*(?:a|-|hasta)\s*(\d{1,2})[:.](\d{2})\b/i.exec(text || '');
  if (!match) return null;
  const h1 = Number(match[1]);
  const m1 = Number(match[2]);
  const h2 = Number(match[3]);
  const m2 = Number(match[4]);
  if (h1 < 0 || h1 > 23 || m1 < 0 || m1 > 59 || h2 < 0 || h2 > 23 || m2 < 0 || m2 > 59) {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    openTime: `${pad(h1)}:${pad(m1)}`,
    closeTime: `${pad(h2)}:${pad(m2)}`,
  };
}

function normalizeSettings(raw: any, fallback: StoreSettings): StoreSettings {
  const safeObj = raw && typeof raw === 'object' ? raw : {};
  const rawShipping = Number(safeObj.shippingFee);
  const rawThreshold = Number(safeObj.freeShippingThreshold);
  const validModes: StoreStatusMode[] = ['auto', 'manual_open', 'manual_closed'];
  const statusMode: StoreStatusMode = validModes.includes(safeObj.statusMode)
    ? safeObj.statusMode
    : safeObj.isStoreOpen === false
    ? 'manual_closed'
    : fallback.statusMode;

  const parsedDays = Array.isArray(safeObj.autoOpenDays)
    ? safeObj.autoOpenDays
        .map((d: any) => Number(d))
        .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
    : fallback.autoOpenDays;
  const resolvedDays = parsedDays.length > 0 ? parsedDays : fallback.autoOpenDays;

  let resolvedOpenTime =
    typeof safeObj.autoOpenTime === 'string' && /^\d{1,2}:\d{2}$/.test(safeObj.autoOpenTime.trim())
      ? safeObj.autoOpenTime.trim()
      : fallback.autoOpenTime;
  let resolvedCloseTime =
    typeof safeObj.autoCloseTime === 'string' && /^\d{1,2}:\d{2}$/.test(safeObj.autoCloseTime.trim())
      ? safeObj.autoCloseTime.trim()
      : fallback.autoCloseTime;

  const rawStoreHours =
    typeof safeObj.storeHours === 'string' && safeObj.storeHours.trim()
      ? safeObj.storeHours.trim()
      : fallback.storeHours;
  const legacyDefaultHours = 'Martes a Domingo de 19:30 a 00:30 hs';

  // If the owner updated storeHours text (e.g. "20:00 a 00:30") while autoOpenTime/autoCloseTime remained on 19:30-00:30 default, sync times from storeHours
  if (rawStoreHours !== legacyDefaultHours && resolvedOpenTime === '19:30' && resolvedCloseTime === '00:30') {
    const parsedRange = extractTimeRangeFromText(rawStoreHours);
    if (parsedRange && (parsedRange.openTime !== '19:30' || parsedRange.closeTime !== '00:30')) {
      resolvedOpenTime = parsedRange.openTime;
      resolvedCloseTime = parsedRange.closeTime;
    }
  }

  const generatedHours = formatScheduleHoursText(resolvedOpenTime, resolvedCloseTime, resolvedDays);
  const resolvedStoreHours =
    rawStoreHours === legacyDefaultHours && generatedHours !== legacyDefaultHours
      ? generatedHours
      : rawStoreHours;

  return {
    storeName: typeof safeObj.storeName === 'string' && safeObj.storeName.trim() ? safeObj.storeName : fallback.storeName,
    whatsappNumber: typeof safeObj.whatsappNumber === 'string' && safeObj.whatsappNumber.trim() ? safeObj.whatsappNumber : fallback.whatsappNumber,
    storeAddress: typeof safeObj.storeAddress === 'string' && safeObj.storeAddress.trim() ? safeObj.storeAddress : fallback.storeAddress,
    storeHours: resolvedStoreHours,
    shippingFee: Number.isFinite(rawShipping) ? rawShipping : fallback.shippingFee,
    freeShippingThreshold: Number.isFinite(rawThreshold) ? rawThreshold : fallback.freeShippingThreshold,
    logoUrl: cleanAssetUrl(safeObj.logoUrl, fallback.logoUrl),
    heroImageUrl: cleanAssetUrl(safeObj.heroImageUrl, fallback.heroImageUrl || '/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg'),
    topBannerAnnouncement: typeof safeObj.topBannerAnnouncement === 'string' ? safeObj.topBannerAnnouncement : fallback.topBannerAnnouncement,
    heroHeadline: typeof safeObj.heroHeadline === 'string' && safeObj.heroHeadline.trim() ? safeObj.heroHeadline : fallback.heroHeadline,
    heroSubtitle: typeof safeObj.heroSubtitle === 'string' && safeObj.heroSubtitle.trim() ? safeObj.heroSubtitle : fallback.heroSubtitle,
    isStoreOpen: typeof safeObj.isStoreOpen === 'boolean' ? safeObj.isStoreOpen : fallback.isStoreOpen,
    closedMessage: typeof safeObj.closedMessage === 'string' && safeObj.closedMessage.trim() ? safeObj.closedMessage : fallback.closedMessage,
    statusMode,
    autoOpenTime: resolvedOpenTime,
    autoCloseTime: resolvedCloseTime,
    autoOpenDays: resolvedDays,
  };
}

function mergeCatalogWithFirestore(remoteDocs: Product[]): Product[] {
  const remoteMap = new Map<string, Product>();
  for (const item of remoteDocs) {
    if (item && item.id) {
      remoteMap.set(item.id, item);
    }
  }

  const baseMerged: Product[] = [];
  for (const baseProd of INITIAL_PRODUCTS) {
    const remote = remoteMap.get(baseProd.id);
    if (remote) {
      if (remote.deleted === true) {
        continue;
      }
      baseMerged.push(normalizeProduct(remote, baseProd));
    } else {
      baseMerged.push(baseProd);
    }
  }

  const customProducts = remoteDocs
    .filter((item) => item && item.id && !INITIAL_PRODUCT_IDS.has(item.id) && item.deleted !== true && item.name !== '__deleted__')
    .map((item) => normalizeProduct(item))
    .sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() || 0 : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() || 0 : 0;
      return timeB - timeA;
    });

  return [...customProducts, ...baseMerged];
}

function isProductModifiedFromDefault(current: Product, base: Product): boolean {
  return (
    current.name !== base.name ||
    current.tagline !== base.tagline ||
    current.description !== base.description ||
    current.price !== base.price ||
    current.category !== base.category ||
    current.image !== base.image ||
    current.unit !== base.unit ||
    Boolean(current.supportsCustomFlavors) !== Boolean(base.supportsCustomFlavors) ||
    (current.subCategory || '') !== (base.subCategory || '') ||
    (current.available !== false) !== (base.available !== false)
  );
}

export type StoreStatusMode = 'auto' | 'manual_open' | 'manual_closed';
export type StoreStatusReason = 'manual_open' | 'manual_closed' | 'schedule_open' | 'schedule_closed';

export interface StoreSettings {
  storeName: string;
  whatsappNumber: string; // E.g. "5491123456789" (sin signos + ni guiones para wa.me)
  storeAddress: string;
  storeHours: string;
  shippingFee: number;
  freeShippingThreshold: number;
  logoUrl: string;
  heroImageUrl?: string;
  topBannerAnnouncement: string;
  heroHeadline: string;
  heroSubtitle: string;
  isStoreOpen: boolean;
  closedMessage: string;
  statusMode: StoreStatusMode;
  autoOpenTime: string;
  autoCloseTime: string;
  autoOpenDays: number[];
}

export function evaluateStoreOpen(
  settings: StoreSettings,
  now: Date = new Date()
): { isOpen: boolean; reason: StoreStatusReason } {
  if (settings.statusMode === 'manual_open') {
    return { isOpen: true, reason: 'manual_open' };
  }
  if (settings.statusMode === 'manual_closed') {
    return { isOpen: false, reason: 'manual_closed' };
  }

  const parseMinutes = (hhmm: string, fallback: number): number => {
    const match = /^(\d{1,2}):(\d{2})$/.exec((hhmm || '').trim());
    if (!match) return fallback;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
    return h * 60 + m;
  };

  const openMin = parseMinutes(settings.autoOpenTime, 19 * 60 + 30);
  const closeMin = parseMinutes(settings.autoCloseTime, 0 * 60 + 30);
  const days =
    Array.isArray(settings.autoOpenDays) && settings.autoOpenDays.length > 0
      ? settings.autoOpenDays
      : [0, 2, 3, 4, 5, 6];

  const today = now.getDay(); // 0=Dom..6=Sab
  const yesterday = (today + 6) % 7;
  const currentMin = now.getHours() * 60 + now.getMinutes();

  let openNow = false;
  if (openMin === closeMin) {
    openNow = days.includes(today);
  } else if (closeMin > openMin) {
    openNow = days.includes(today) && currentMin >= openMin && currentMin < closeMin;
  } else {
    // Horario nocturno que cruza medianoche (ej: 19:30 a 00:30)
    const inEvening = days.includes(today) && currentMin >= openMin;
    const inAfterMidnight = days.includes(yesterday) && currentMin < closeMin;
    openNow = inEvening || inAfterMidnight;
  }

  return {
    isOpen: openNow,
    reason: openNow ? 'schedule_open' : 'schedule_closed',
  };
}

interface CreateOrderInput {
  customerName: string;
  customerCedula: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryMethod: DeliveryMethod;
  deliveryAddress?: string;
  apartment?: string;
  deliveryCity?: string;
  paymentMethod: PaymentMethod;
  cashAmountToPayWith?: number;
  cardLast4?: string;
  cardHolder?: string;
  customerNotes?: string;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  user?: User;
  needsPasswordSetup?: boolean;
  hasRegisteredPhone?: boolean;
}

interface StoreContextType {
  products: Product[];
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  resetProductsToDefault: () => void;
  isSyncingCloud: boolean;
  syncLocalCatalogToCloud: (silent?: boolean) => Promise<void>;

  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedFlavors?: string[], observations?: string, selectedBurgerTier?: BurgerTier, customUnitPrice?: number) => void;
  updateItemObservations: (cartIndex: number, observations: string) => void;
  removeFromCart: (cartIndex: number) => void;
  updateQuantity: (cartIndex: number, quantity: number) => void;
  clearCart: () => void;
  totalCartItems: number;
  cartSubtotal: number;
  
  user: User | null;
  login: (cedula: string, password?: string) => Promise<LoginResult>;
  activateLegacyUserPassword: (cedula: string, phoneLast4: string, newPassword: string) => Promise<LoginResult>;
  register: (data: Omit<User, 'id' | 'registeredAt'>) => Promise<{ user: User | null; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  changeUserPassword: (currentPassword: string, newPassword: string) => { ok: boolean; error?: string };
  adminResetUserPassword: (userId: string, newPassword: string) => { ok: boolean; error?: string };
  deleteUser: (userId: string) => { ok: boolean; error?: string };
  loginAsDemo: () => void;

  orders: Order[];
  userOrders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  reorderFromOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  isStoreCurrentlyOpen: boolean;
  storeStatusReason: StoreStatusReason;
  
  formatWhatsAppMessage: (order: Order) => string;
  getWhatsAppUrl: (order: Order) => string;
  
  contactMessages: ContactMessage[];
  sendContactMessage: (msg: Omit<ContactMessage, 'id' | 'date'>) => void;

  // Loyalty Program (Club OZ - Las 8 Porciones)
  isRewardRedeemActive: boolean;
  setIsRewardRedeemActive: (active: boolean) => void;
  allRegisteredUsers: User[];
  addStampToUser: (userId: string, count?: number) => void;
  adjustUserLoyalty: (userId: string, stamps: number, unclaimedRewards: number) => void;

  // UI state modals
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isUserDashboardOpen: boolean;
  setIsUserDashboardOpen: (open: boolean) => void;
  dashboardInitialTab: 'pedidos' | 'fidelizacion' | 'perfil';
  setDashboardInitialTab: (tab: 'pedidos' | 'fidelizacion' | 'perfil') => void;
  isCheckoutModalOpen: boolean;
  setIsCheckoutModalOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (o: Order | null) => void;
  isOrderSuccessOpen: boolean;
  setIsOrderSuccessOpen: (open: boolean) => void;
  
  // Admin CMS Panel
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isAdminAuthenticated: boolean;
  superadminUsername: string;
  loginAdmin: (user: string, pass: string) => boolean;
  logoutAdmin: () => void;
  updateSuperadminCredentials: (newUser: string, newPass: string) => boolean;

  // Big Logo Modal
  isLogoModalOpen: boolean;
  setIsLogoModalOpen: (open: boolean) => void;
  // Welcome landing screen
  showWelcomeScreen: boolean;
  setShowWelcomeScreen: (show: boolean) => void;
  // Auth modal mode
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openAuthModal: (mode?: 'login' | 'register') => void;

  // Category navigation state
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Notification toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Pizzería OZ',
  whatsappNumber: '5491158492011',
  storeAddress: 'Av. Corrientes 1450, Ciudad de Buenos Aires',
  storeHours: 'Martes a Domingo de 19:30 a 00:30 hs',
  shippingFee: 45,
  freeShippingThreshold: 250, // "los envios son gratis a partir de 250 pesos"
  logoUrl: '/assets/aistudio/logo2_a9100ce6.png',
  heroImageUrl: '/assets/aistudio/468615878_10162129815109555_8430383621970597375_n_6aa62de3.jpg',
  topBannerAnnouncement: '🛵 ¡Envíos gratis a domicilio a partir de $250 pesos! · Pago en efectivo o con tarjeta',
  heroHeadline: 'No somos una pizzería tradicional. Somos un Laboratorio.',
  heroSubtitle: 'Aquí no seguimos reglas, seguimos el instinto. Nuestra cocina es un laboratorio de experimentación donde la pasión por los nuevos sabores manda. Nacimos en 2020 con una receta de masa obsesiva para llevar alegría a tu mesa.',
  isStoreOpen: true,
  closedMessage: 'En este momento nuestra cocina está cerrada o con pedidos pausados. Consultá por WhatsApp o volvé en nuestro horario habitual.',
  statusMode: 'auto',
  autoOpenTime: '19:30',
  autoCloseTime: '00:30',
  autoOpenDays: [0, 2, 3, 4, 5, 6], // Martes a Domingo
};

const DEMO_USER: User = {
  id: 'usr-demo-pizzeria',
  name: 'Gonzalo Fernández',
  cedula: '4.812.394-5',
  email: 'gonzalo@ejemplo.com',
  phone: '+54 9 11 4920-1123',
  address: 'Calle Lavalle 1280',
  city: 'Melo',
  apartment: 'Piso 7, Dpto A',
  registeredAt: '2026-10-20',
  loyalty: {
    stampsCount: 5,
    totalStampsEarned: 13,
    completedCards: 1,
    unclaimedRewards: 1,
    tier: 'explorador',
    cardNumber: 'OZ-4812-3945',
  },
};

const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'OZ-2026-1042',
    userId: 'usr-demo-pizzeria',
    customerName: 'Gonzalo Fernández',
    customerCedula: '4.812.394-5',
    customerPhone: '+54 9 11 4920-1123',
    customerEmail: 'gonzalo@ejemplo.com',
    deliveryMethod: 'delivery',
    deliveryAddress: 'Calle Lavalle 1280',
    apartment: 'Piso 7, Dpto A',
    deliveryCity: 'Melo',
    paymentMethod: 'cash',
    cashAmountToPayWith: 500,
    items: [
      {
        productId: 'pzt-muzzarella',
        productName: 'Pizzeta Muzzarella 32 cm',
        quantity: 1,
        unitPrice: 270,
        subtotal: 270,
        selectedFlavors: ['Muzzarella', 'Jamón'],
        extraFlavorsCost: 0,
      },
      {
        productId: 'faina-comun',
        productName: 'Fainá Tradicional 32 cm',
        quantity: 1,
        unitPrice: 300,
        subtotal: 300,
      }
    ],
    subtotal: 570,
    shippingFee: 0,
    total: 570,
    customerNotes: 'Bien cocida por favor. Enviar servilletas.',
    status: 'en_camino',
    createdAt: '2026-10-24T21:15:00.000Z',
    whatsappMessage: ''
  }
];

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Products State (persisted with version check to guarantee latest categories and accurate imagery)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedV5 = localStorage.getItem('pizzeria_oz_products_v8');
      if (savedV5) {
        const parsed = JSON.parse(savedV5);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((p) => p && typeof p === 'object')
            .map((p) => normalizeProduct(p, INITIAL_PRODUCT_MAP.get(p.id)));
          const metroCount = cleaned.filter((p) => (p.category === 'pizza_metro' || p.id.startsWith('pzm-')) && p.subCategory).length;
          const hasFurnitureImg = cleaned.some((p) => p.image && p.image.includes('hero_store_showcase'));
          if (metroCount >= 20 && !hasFurnitureImg) {
            return cleaned;
          }
        }
      }
      // Migrate and purge legacy storage keys
      localStorage.removeItem('pizzeria_oz_products');
      localStorage.removeItem('pizzeria_oz_products_v4');
      localStorage.removeItem('pizzeria_oz_products_v5');
      localStorage.removeItem('pizzeria_oz_products_v6');
      localStorage.setItem('pizzeria_oz_products_v8', JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const hasReceivedRemoteProductsRef = useRef(false);
  const hasReceivedRemoteUsersRef = useRef(false);
  const localInitialBackupRef = useRef<Product[]>(products);
  const productsRef = useRef<Product[]>(products);
  productsRef.current = products;

  // Admin CMS Panel State
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  // Superusuario credentials ("diosu" / "43564586x")
  const [superadminUsername, setSuperadminUsername] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_superadmin_user');
      return saved ? saved : 'diosu';
    } catch {
      return 'diosu';
    }
  });

  const [superadminPassword, setSuperadminPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_superadmin_pass');
      return saved ? saved : '43564586x';
    } catch {
      return '43564586x';
    }
  });

  // Always require credentials upon entering panel
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  const updateSuperadminCredentials = (newUser: string, newPass: string): boolean => {
    const cleanUser = newUser.trim();
    const cleanPass = newPass.trim();
    if (!cleanUser || cleanUser.length < 3) {
      showToast('El usuario debe tener al menos 3 caracteres.');
      return false;
    }
    if (!cleanPass || cleanPass.length < 4) {
      showToast('La contraseña debe tener al menos 4 caracteres.');
      return false;
    }
    setSuperadminUsername(cleanUser);
    setSuperadminPassword(cleanPass);
    try {
      localStorage.setItem('pizzeria_oz_superadmin_user', cleanUser);
      localStorage.setItem('pizzeria_oz_superadmin_pass', cleanPass);
    } catch {}
    showToast('✓ Credenciales de superusuario actualizadas con éxito.');
    return true;
  };

  // Big Logo Modal State
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_cart');
      return saved ? normalizeCart(JSON.parse(saved)) : [];
    } catch {
      return [];
    }
  });

  // User State: start as null so first visit shows page without products until user registers/logs in with cédula!
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? normalizeUser(parsed) : null;
    } catch {
      return null;
    }
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_orders');
      if (!saved) return INITIAL_DEMO_ORDERS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_DEMO_ORDERS;
      return parsed.map(normalizeOrder).filter((o): o is Order => o !== null);
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  });

  // Store Settings (with auto-migration to prevent legacy localStorage regressions)
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const isLegacyHeadline = !parsed.heroHeadline || String(parsed.heroHeadline).includes('horno a la leña') || String(parsed.heroHeadline).includes('crujientes');
          const isLegacyLogo = !parsed.logoUrl || String(parsed.logoUrl).includes('logo_d58d58db');
          const isLegacyHeroImg = !parsed.heroImageUrl || String(parsed.heroImageUrl).includes('1792935618107');

          return normalizeSettings(
            {
              ...parsed,
              logoUrl: isLegacyLogo ? '/assets/aistudio/logo2_a9100ce6.png' : parsed.logoUrl,
              heroImageUrl: isLegacyHeroImg ? DEFAULT_SETTINGS.heroImageUrl : parsed.heroImageUrl,
              heroHeadline: isLegacyHeadline ? DEFAULT_SETTINGS.heroHeadline : parsed.heroHeadline,
              heroSubtitle: isLegacyHeadline ? DEFAULT_SETTINGS.heroSubtitle : parsed.heroSubtitle,
            },
            DEFAULT_SETTINGS
          );
        }
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });


  const storeSettingsRef = useRef<StoreSettings>(storeSettings);
  storeSettingsRef.current = storeSettings;

  // Periodic clock tick so automatic open/closed transitions happen in real time without reload
  const [scheduleNow, setScheduleNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setScheduleNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const { isOpen: isStoreCurrentlyOpen, reason: storeStatusReason } = evaluateStoreOpen(storeSettings, scheduleNow);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleFirestoreError = (
    error: unknown,
    operationType: OperationType,
    path: string | null,
    notifyUser: boolean = false
  ) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: undefined,
        email: undefined,
        emailVerified: undefined,
        isAnonymous: undefined,
        tenantId: undefined,
        providerInfo: [],
      },
      operationType,
      path,
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    if (notifyUser) {
      showToast('⚠️ Error al sincronizar con la nube. Verificá tu conexión a internet.');
    }
  };

  // Synchronize in real time with Cloud Firestore
  useEffect(() => {
    // 1. Validate connection with getDocFromServer
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    };
    testConnection();

    // 2. Real-time products sync from Firestore (merges custom/edited/deleted docs onto INITIAL_PRODUCTS)
    let unsubProducts = () => {};
    try {
      unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          hasReceivedRemoteProductsRef.current = true;
          const remoteProducts: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            if (data && (data.id || docSnap.id)) {
              remoteProducts.push({ ...data, id: data.id || docSnap.id });
            }
          });
          setProducts(mergeCatalogWithFirestore(remoteProducts));
        } else if (hasReceivedRemoteProductsRef.current) {
          setProducts(INITIAL_PRODUCTS);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products', false);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'products', false);
    }

    // 3. Real-time settings sync from Firestore
    let unsubSettings = () => {};
    try {
      unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          const remoteSettings = docSnap.data() as Partial<StoreSettings>;
          setStoreSettings((prev) => normalizeSettings(remoteSettings, prev));
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/global', false);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'settings/global', false);
    }

    // 4. Real-time orders sync from Firestore
    let unsubOrders = () => {};
    try {
      unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        if (!snapshot.empty) {
          const remoteOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            const normalized = normalizeOrder({ ...docSnap.data(), id: docSnap.data()?.id || docSnap.id });
            if (normalized) {
              remoteOrders.push(normalized);
            }
          });
          if (remoteOrders.length > 0) {
            remoteOrders.sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
            setOrders(remoteOrders);
          }
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders', false);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders', false);
    }

    // 5. Real-time registered users & loyalty sync from Firestore
    let unsubUsers = () => {};
    try {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        if (!snapshot.empty || hasReceivedRemoteUsersRef.current) {
          hasReceivedRemoteUsersRef.current = true;
          const remoteUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && (data.id || docSnap.id)) {
              remoteUsers.push(normalizeUser({ ...data, id: data.id || docSnap.id }));
            }
          });
          const hasDemoInRemote = remoteUsers.some((u) => u.id === DEMO_USER.id);
          const authoritativeUsers = hasDemoInRemote ? remoteUsers : [DEMO_USER, ...remoteUsers];

          setAllRegisteredUsers(authoritativeUsers);
          try {
            localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(authoritativeUsers));
          } catch {}

          setUser((currentUser) => {
            if (!currentUser) return null;
            const cleanCurrent = String(currentUser.cedula || '').replace(/[^0-9]/g, '');
            const match = remoteUsers.find(
              (ru) =>
                ru.id === currentUser.id ||
                (cleanCurrent && String(ru.cedula || '').replace(/[^0-9]/g, '') === cleanCurrent)
            );
            return match ? normalizeUser({ ...currentUser, ...match }) : currentUser;
          });
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users', false);
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users', false);
    }

    return () => {
      unsubProducts();
      unsubSettings();
      unsubOrders();
      unsubUsers();
    };
  }, []);

  // Contact Messages
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_contact_msgs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Modal controls
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'pedidos' | 'perfil' | 'fidelizacion'>('pedidos');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isOrderSuccessOpen, setIsOrderSuccessOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Loyalty Program State (Tarjeta 8 Porciones)
  const [isRewardRedeemActive, setIsRewardRedeemActive] = useState<boolean>(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('pizzeria_oz_registered_users');
      const parsed = stored ? JSON.parse(stored) : [DEMO_USER];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.map(normalizeUser) : [DEMO_USER];
    } catch {
      return [DEMO_USER];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pizzeria_oz_products_v8', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('pizzeria_oz_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('pizzeria_oz_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('pizzeria_oz_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('pizzeria_oz_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('pizzeria_oz_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.error(e);
    }
  }, [storeSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('pizzeria_oz_contact_msgs', JSON.stringify(contactMessages));
    } catch (e) {
      console.error(e);
    }
  }, [contactMessages]);

  // Cart operations with flavor and observations support
  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedFlavors?: string[],
    observations?: string,
    selectedBurgerTier?: BurgerTier,
    customUnitPrice?: number
  ) => {
    // REGLA FUNDAMENTAL: Nadie puede pedir sin estar registrado
    if (!user) {
      openAuthModal('register');
      showToast('⚠️ Nadie puede pedir sin estar registrado. Creá tu cuenta con Cédula.');
      return;
    }

    if (product.available === false) {
      showToast(`⚠️ "${product.name}" está agotado por hoy.`);
      return;
    }

    const flavors = selectedFlavors && selectedFlavors.length > 0 ? selectedFlavors : undefined;
    const isArmaTu = Boolean(product.id.includes('arma-tu'));
    const extraFlavorsCost = flavors ? calculateExtraFlavorsCost(flavors.length, isArmaTu) : 0;
    const cleanObs = observations?.trim() ? observations.trim() : undefined;

    setCart((prev) => {
      // Check if item with same product, exact same tier, exact same flavors, and exact same observations already in cart
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedBurgerTier === selectedBurgerTier &&
          JSON.stringify(item.selectedFlavors || []) === JSON.stringify(flavors || []) &&
          (item.observations || '') === (cleanObs || '')
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedFlavors: flavors,
          extraFlavorsCost,
          observations: cleanObs,
          selectedBurgerTier,
          unitPrice: customUnitPrice,
        },
      ];
    });

    const tierLabel = selectedBurgerTier
      ? ` (${selectedBurgerTier === 'sencilla' ? 'Sencilla' : selectedBurgerTier === 'doble' ? 'Doble carne' : selectedBurgerTier === 'triple' ? 'Triple carne' : 'Cuádruple carne'})`
      : '';
    const flavorsNote = flavors && flavors.length > 0 ? ` (${flavors.join(', ')})` : '';
    const obsNote = cleanObs ? ` [${cleanObs}]` : '';
    showToast(`✓ Agregado: ${product.name}${tierLabel}${flavorsNote}${obsNote}`);
  };

  const updateItemObservations = (cartIndex: number, observations: string) => {
    const cleanObs = observations.trim() ? observations.trim() : undefined;
    setCart((prev) =>
      prev.map((item, idx) =>
        idx === cartIndex
          ? { ...item, observations: cleanObs }
          : item
      )
    );
  };

  const removeFromCart = (cartIndex: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== cartIndex));
  };

  const updateQuantity = (cartIndex: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartIndex);
      return;
    }
    setCart((prev) =>
      prev.map((item, idx) => (idx === cartIndex ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalCartItems = cart.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

  // Each item total = (unit price + extra flavor price) * quantity
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = Number(item?.unitPrice ?? item?.product?.price) || 0;
    const itemUnitPrice = basePrice + (Number(item?.extraFlavorsCost) || 0);
    return sum + itemUnitPrice * (Number(item?.quantity) || 0);
  }, 0);

  // Helper to load registered users (Firestore authoritative when online, local fallback offline)
  const loadMergedRegisteredUsers = async (fetchRemote: boolean): Promise<User[]> => {
    if (fetchRemote) {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const remoteUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && (data.id || docSnap.id)) {
            remoteUsers.push(normalizeUser({ ...data, id: data.id || docSnap.id }));
          }
        });
        if (!snapshot.empty || hasReceivedRemoteUsersRef.current) {
          hasReceivedRemoteUsersRef.current = true;
          const hasDemoInRemote = remoteUsers.some((u) => u.id === DEMO_USER.id);
          const authoritative = hasDemoInRemote ? remoteUsers : [DEMO_USER, ...remoteUsers];
          setAllRegisteredUsers(authoritative);
          try {
            localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(authoritative));
          } catch {}
          return authoritative;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users', false);
      }
    }

    const mergedMap = new Map<string, User>();
    for (const u of allRegisteredUsers) {
      mergedMap.set(u.id, normalizeUser(u));
    }
    try {
      const stored = localStorage.getItem('pizzeria_oz_registered_users');
      if (stored) {
        const localParsed = JSON.parse(stored);
        if (Array.isArray(localParsed)) {
          for (const lu of localParsed) {
            const norm = normalizeUser(lu);
            if (!mergedMap.has(norm.id)) {
              mergedMap.set(norm.id, norm);
            }
          }
        }
      }
    } catch {}

    return Array.from(mergedMap.values());
  };

  const findRealUserByCedula = (usersList: User[], digitsOnly: string): User | undefined => {
    if (!digitsOnly) return undefined;
    const matches = usersList.filter(
      (u) =>
        u.id !== DEMO_USER.id &&
        String(u?.cedula || '').replace(/[^0-9]/g, '') === digitsOnly
    );
    if (matches.length === 0) return undefined;
    return matches.find((u) => Boolean(u.passwordHash || u.password)) || matches[0];
  };

  // Auth operations using Cédula + Password verification
  const login = async (cedula: string, password?: string): Promise<LoginResult> => {
    const cleanCedula = cedula.trim();
    const digitsOnly = cleanCedula.replace(/[^0-9]/g, '');
    const enteredPassword = typeof password === 'string' ? password : '';

    if (!digitsOnly) {
      const msg = 'Ingresá un número de Cédula válido.';
      showToast(msg);
      return { ok: false, error: msg };
    }
    if (!enteredPassword) {
      const msg = 'Ingresá tu contraseña para iniciar sesión.';
      showToast(msg);
      return { ok: false, error: msg };
    }

    // Always merge remote Firestore users so password resets/changes from any device are honored immediately
    const savedUsers = await loadMergedRegisteredUsers(true);
    const matchingUsers = savedUsers.filter(
      (u) =>
        u.id !== DEMO_USER.id &&
        String(u?.cedula || '').replace(/[^0-9]/g, '') === digitsOnly
    );

    if (matchingUsers.length === 0) {
      if (digitsOnly === '48123945') {
        const msg = 'Para la cuenta de prueba usá el botón "Acceso rápido con Cédula Demo".';
        showToast(msg);
        return { ok: false, error: msg };
      }
      const msg = 'Cédula no registrada o contraseña incorrecta. Si es tu primera vez, creá tu cuenta.';
      showToast(msg);
      return { ok: false, error: msg };
    }

    const withCredentials = matchingUsers.filter((u) => Boolean(u.passwordHash || u.password));

    if (withCredentials.length === 0) {
      const legacyUser = matchingUsers[0];
      const phoneDigits = String(legacyUser.phone || '').replace(/[^0-9]/g, '');
      const hasRealPhone = phoneDigits.length >= 4 && !String(legacyUser.phone || '').includes('5555-0000');
      const msg = hasRealPhone
        ? 'Tu cuenta fue creada antes de pedir contraseña. Confirmá los últimos 4 dígitos de tu celular para activar esta contraseña.'
        : 'Esta cuenta no tiene contraseña configurada. Tocá "Crear Cuenta" con tu Cédula para asignarle una.';
      showToast(msg);
      return {
        ok: false,
        needsPasswordSetup: hasRealPhone,
        hasRegisteredPhone: hasRealPhone,
        error: msg,
      };
    }

    const matchedUser = withCredentials.find((u) =>
      verifyPassword(enteredPassword, u.passwordHash, u.password)
    );

    if (!matchedUser) {
      const msg =
        'Contraseña incorrecta. Revisá mayúsculas o espacios, o pedile al dueño que la restablezca desde Panel Dueño → Club 8 Porciones → Clave.';
      showToast(msg);
      return { ok: false, error: msg };
    }

    let authenticatedUser = normalizeUser(matchedUser);

    // Upgrade legacy plaintext password to salted SHA-256 hash on successful login
    if (!authenticatedUser.passwordHash && authenticatedUser.password) {
      const upgraded: User = {
        ...authenticatedUser,
        passwordHash: hashPassword(enteredPassword),
      };
      delete upgraded.password;
      authenticatedUser = upgraded;

      setAllRegisteredUsers((prev) => {
        const next = [...prev.filter((u) => u.id !== upgraded.id), upgraded];
        try {
          localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
        } catch {}
        return next;
      });
      setDoc(doc(db, 'users', upgraded.id), sanitizeForFirestore(upgraded)).catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `users/${upgraded.id}`, false);
      });
    }

    setUser(authenticatedUser);
    const displayName =
      authenticatedUser.name && authenticatedUser.name !== 'Cliente OZ'
        ? authenticatedUser.name
        : `CI ${authenticatedUser.cedula}`;
    showToast(`¡Bienvenido de nuevo, ${displayName}!`);
    return { ok: true, user: authenticatedUser };
  };

  const activateLegacyUserPassword = async (
    cedula: string,
    phoneLast4: string,
    newPassword: string
  ): Promise<LoginResult> => {
    const digitsOnly = cedula.trim().replace(/[^0-9]/g, '');
    const cleanLast4 = phoneLast4.replace(/[^0-9]/g, '').slice(-4);
    if (!digitsOnly || cleanLast4.length < 4) {
      return { ok: false, error: 'Ingresá los últimos 4 dígitos de tu teléfono registrado.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const savedUsers = await loadMergedRegisteredUsers(true);
    const found = findRealUserByCedula(savedUsers, digitsOnly);
    if (!found) {
      return { ok: false, error: 'No encontramos esa Cédula.' };
    }
    if (found.passwordHash || found.password) {
      return { ok: false, error: 'Esta cuenta ya tiene una contraseña activa.' };
    }

    const storedPhoneDigits = String(found.phone || '').replace(/[^0-9]/g, '');
    if (storedPhoneDigits.length < 4 || !storedPhoneDigits.endsWith(cleanLast4)) {
      return { ok: false, error: 'Los dígitos del teléfono no coinciden con los registrados en la cuenta.' };
    }

    const updated: User = {
      ...normalizeUser(found),
      passwordHash: hashPassword(newPassword),
    };
    delete updated.password;

    setUser(updated);
    setAllRegisteredUsers((prev) => {
      const next = [...prev.filter((u) => u.id !== updated.id), updated];
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    setDoc(doc(db, 'users', updated.id), sanitizeForFirestore(updated)).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${updated.id}`, true);
    });

    showToast(`✓ Contraseña activada. ¡Bienvenido, ${updated.name}!`);
    return { ok: true, user: updated };
  };

  const register = async (data: Omit<User, 'id' | 'registeredAt'>): Promise<{ user: User | null; error?: string }> => {
    const digitsOnly = data.cedula.replace(/[^0-9]/g, '');
    const rawPassword = typeof data.password === 'string' ? data.password : '';

    if (!digitsOnly) {
      const msg = 'Ingresá un número de Cédula válido.';
      showToast(msg);
      return { user: null, error: msg };
    }
    if (rawPassword.length < 4) {
      const msg = 'La contraseña debe tener al menos 4 caracteres.';
      showToast(msg);
      return { user: null, error: msg };
    }

    const savedUsers = await loadMergedRegisteredUsers(true);
    const existing = findRealUserByCedula(savedUsers, digitsOnly);

    if (existing && (existing.passwordHash || existing.password)) {
      const msg = 'Ya existe una cuenta registrada con esta Cédula. Iniciá sesión con tu contraseña.';
      showToast(msg);
      return { user: null, error: msg };
    }

    const paddedCedula = digitsOnly.slice(-8).padStart(8, '0');
    const formattedCardNum = `OZ-${paddedCedula.slice(0, 4)}-${paddedCedula.slice(4)}`;
    const { password: _ignoredPlaintext, ...safeProfileData } = data;
    const hashed = hashPassword(rawPassword);

    const newUser: User = {
      ...safeProfileData,
      id: existing ? existing.id : `usr-${Date.now().toString(36)}`,
      passwordHash: hashed,
      registeredAt: existing?.registeredAt || new Date().toISOString().split('T')[0],
      loyalty: existing?.loyalty || {
        stampsCount: 1, // 1 Porción de bienvenida de regalo
        totalStampsEarned: 1,
        completedCards: 0,
        unclaimedRewards: 0,
        tier: 'amigo',
        cardNumber: formattedCardNum,
      },
    };
    setUser(newUser);

    setAllRegisteredUsers((prev) => {
      const updatedList = [...prev.filter((u) => u.id !== newUser.id), newUser];
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });

    setDoc(doc(db, 'users', newUser.id), sanitizeForFirestore(newUser)).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.id}`, false);
    });

    showToast(`¡Cuenta creada con éxito! Bienvenido a Pizzería OZ, ${newUser.name}.`);
    return { user: newUser };
  };

  const logout = () => {
    setUser(null);
    setShowWelcomeScreen(true);
    setIsUserDashboardOpen(false);
    setIsCartOpen(false);
    setIsCheckoutModalOpen(false);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
    showToast('Has cerrado sesión. Volviendo a la portada de bienvenida.');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    setAllRegisteredUsers((prev) => {
      const next = prev.map((u) => (u.id === updated.id ? updated : u));
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    setDoc(doc(db, 'users', updated.id), sanitizeForFirestore(updated), { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${updated.id}`, false);
    });
    showToast('Tus datos han sido actualizados.');
  };

  const changeUserPassword = (currentPassword: string, newPassword: string): { ok: boolean; error?: string } => {
    if (!user) {
      return { ok: false, error: 'Iniciá sesión para cambiar tu contraseña.' };
    }
    if (user.id === DEMO_USER.id) {
      return { ok: false, error: 'La cuenta Demo no utiliza contraseña personalizada.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    if (user.passwordHash || user.password) {
      if (!currentPassword) {
        return { ok: false, error: 'Ingresá tu contraseña actual.' };
      }
      if (!verifyPassword(currentPassword, user.passwordHash, user.password)) {
        return { ok: false, error: 'La contraseña actual no es correcta.' };
      }
    }

    const updated: User = {
      ...user,
      passwordHash: hashPassword(newPassword),
    };
    delete updated.password;

    setUser(updated);
    setAllRegisteredUsers((prev) => {
      const next = [...prev.filter((u) => u.id !== updated.id), updated];
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    setDoc(doc(db, 'users', updated.id), sanitizeForFirestore(updated)).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${updated.id}`, true);
    });
    showToast('✓ Tu contraseña se actualizó correctamente.');
    return { ok: true };
  };

  const adminResetUserPassword = (userId: string, newPassword: string): { ok: boolean; error?: string } => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Acceso de superusuario requerido.' };
    }
    if (!newPassword || !newPassword.trim() || newPassword.length < 4) {
      return { ok: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }
    const target = allRegisteredUsers.find((u) => u.id === userId);
    if (!target) {
      return { ok: false, error: 'Cliente no encontrado.' };
    }
    if (target.id === DEMO_USER.id) {
      return { ok: false, error: 'La cuenta Demo no requiere contraseña.' };
    }

    const updated: User = {
      ...target,
      passwordHash: hashPassword(newPassword),
    };
    delete updated.password;

    setAllRegisteredUsers((prev) => {
      const next = prev.map((u) => (u.id === updated.id ? updated : u));
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (user && user.id === updated.id) {
      setUser(updated);
    }
    setDoc(doc(db, 'users', updated.id), sanitizeForFirestore(updated)).catch((err) => {
      handleFirestoreError(err, OperationType.UPDATE, `users/${updated.id}`, true);
    });
    showToast(`✓ Contraseña restablecida para ${target.name || target.cedula}.`);
    return { ok: true };
  };

  const deleteUser = (userId: string): { ok: boolean; error?: string } => {
    if (!isAdminAuthenticated) {
      return { ok: false, error: 'Acceso de superusuario requerido.' };
    }
    if (userId === DEMO_USER.id) {
      return { ok: false, error: 'La cuenta Demo de prueba no se puede eliminar.' };
    }
    const target = allRegisteredUsers.find((u) => u.id === userId);
    if (!target) {
      return { ok: false, error: 'Usuario no encontrado.' };
    }

    setAllRegisteredUsers((prev) => {
      const next = prev.filter((u) => u.id !== userId);
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(next));
      } catch {}
      return next;
    });
    if (user && user.id === userId) {
      setUser(null);
    }
    deleteDoc(doc(db, 'users', userId)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`, true);
    });
    showToast(`✓ Usuario "${target.name || target.cedula}" eliminado.`);
    return { ok: true };
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    showToast('Sesión iniciada con Cédula Demo (4.812.394-5)');
  };

  // Orders
  const userOrders = orders.filter((o) => {
    if (!o) return false;
    if (!user) return true;
    const orderCedula = String(o.customerCedula || '').replace(/[^0-9]/g, '');
    const userCedula = String(user.cedula || '').replace(/[^0-9]/g, '');
    return o.userId === user.id || o.customerCedula === user.cedula || (Boolean(userCedula) && orderCedula === userCedula);
  });


  // Loyalty stamp increment
  const addStampToUser = (userId: string, count: number = 1) => {
    setAllRegisteredUsers((prevUsers) => {
      const updated = prevUsers.map((u) => {
        if (u.id === userId) {
          const currentStamps = u.loyalty?.stampsCount ?? 0;
          const newStampsRaw = currentStamps + count;
          const completedCards = Math.floor(newStampsRaw / 8);
          const stampsRemaining = newStampsRaw % 8;
          const totalEarned = (u.loyalty?.totalStampsEarned ?? 0) + count;
          const tier = totalEarned >= 16 ? 'maestro_vip' : totalEarned >= 8 ? 'explorador' : 'amigo';
          
          const cleanCedula = String(u.cedula || '').replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
          const updatedLoyalty = {
            stampsCount: stampsRemaining,
            totalStampsEarned: totalEarned,
            completedCards: (u.loyalty?.completedCards ?? 0) + completedCards,
            unclaimedRewards: (u.loyalty?.unclaimedRewards ?? 0) + completedCards,
            tier: tier as any,
            cardNumber: u.loyalty?.cardNumber || `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`,
          };
          const userUpdated = { ...u, loyalty: updatedLoyalty };
          if (user && user.id === u.id) {
            setUser(userUpdated);
            try {
              localStorage.setItem('pizzeria_oz_user', JSON.stringify(userUpdated));
            } catch {}
          }
          setDoc(doc(db, 'users', userUpdated.id), sanitizeForFirestore(userUpdated), { merge: true }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${userUpdated.id}`, true);
          });
          return userUpdated;
        }
        return u;
      });
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('✓ Porciones acreditadas con éxito.');
  };

  const adjustUserLoyalty = (userId: string, stamps: number, unclaimedRewards: number) => {
    setAllRegisteredUsers((prevUsers) => {
      const updated = prevUsers.map((u) => {
        if (u.id === userId) {
          const cleanCedula = String(u.cedula || '').replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
          const updatedLoyalty = {
            ...(u.loyalty || {
              totalStampsEarned: stamps,
              completedCards: 0,
              tier: 'amigo' as const,
              cardNumber: `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`,
            }),
            stampsCount: Math.max(0, Math.min(8, stamps)),
            unclaimedRewards: Math.max(0, unclaimedRewards),
          };
          const userUpdated = { ...u, loyalty: updatedLoyalty };
          if (user && user.id === u.id) {
            setUser(userUpdated);
            try {
              localStorage.setItem('pizzeria_oz_user', JSON.stringify(userUpdated));
            } catch {}
          }
          setDoc(doc(db, 'users', userUpdated.id), sanitizeForFirestore(userUpdated), { merge: true }).catch((err) => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${userUpdated.id}`, true);
          });
          return userUpdated;
        }
        return u;
      });
      try {
        localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('✓ Datos de fidelización del cliente actualizados.');
  };

  const formatWhatsAppMessage = (order: Order): string => {
    const isDelivery = order.deliveryMethod === 'delivery';
    const deliveryTitle = isDelivery ? '🛵 Envío a Domicilio (Delivery)' : '🏬 Retiro / Levanta en Local';
    const paymentTitle = order.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Tarjeta Débito / Crédito';
    
    let paymentDetail = paymentTitle;
    if (order.paymentMethod === 'cash' && order.cashAmountToPayWith) {
      const change = order.cashAmountToPayWith - order.total;
      paymentDetail += ` (Abona con $${order.cashAmountToPayWith.toLocaleString('es-AR')}${change > 0 ? `, vuelto: $${change.toLocaleString('es-AR')}` : ''})`;
    } else if (order.paymentMethod === 'card' && order.cardLast4) {
      paymentDetail += ` (Terminada en ${order.cardLast4})`;
    }

    const itemsText = (Array.isArray(order.items) ? order.items : [])
      .map((it) => {
        let flavorInfo = '';
        if (it.selectedFlavors && it.selectedFlavors.length > 0) {
          const isArmaTu = String(it.productId || '').includes('arma-tu');
          flavorInfo = `\n   ↳ ${isArmaTu ? 'Sabores' : 'Adicionales'}: ${it.selectedFlavors.join(' + ')}${
            it.extraFlavorsCost && it.extraFlavorsCost > 0
              ? ` (+$${it.extraFlavorsCost} extra)`
              : isArmaTu
              ? ' (2 sabores incluidos sin costo)'
              : ''
          }`;
        }
        let obsInfo = '';
        if (it.observations && it.observations.trim()) {
          obsInfo = `\n   ↳ 📝 Obs: ${it.observations.trim()}`;
        }
        const sub = Number(it.subtotal || 0).toLocaleString('es-AR');
        const unit = Number(it.unitPrice || 0).toLocaleString('es-AR');
        return `🍕 ${it.quantity}x ${it.productName} — $${sub} ($${unit} c/u)${flavorInfo}${obsInfo}`;
      })
      .join('\n');

    const addressText = isDelivery
      ? `📍 *Dirección de entrega:*\n${order.deliveryAddress || 'Sin dirección'}${order.apartment ? ` (${order.apartment})` : ''}, ${order.deliveryCity || ''}`
      : `📍 *Retiro en Pizzería OZ:*\n${storeSettings.storeAddress} (Horario: ${storeSettings.storeHours})`;

    const notesText = order.customerNotes ? `\n📝 *Aclaraciones / Notas:*\n${order.customerNotes}` : '';

    const cleanCardCedula = String(order.customerCedula || '').replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
    const loyaltyCardNum = `OZ-${cleanCardCedula.slice(0, 4)}-${cleanCardCedula.slice(4)}`;
    const loyaltySection = `\n⭐ *Club Fidelidad OZ (Tarjeta 8 Porciones):*\n• Tarjeta: ${loyaltyCardNum}\n• Porciones acumuladas: ${user?.loyalty?.stampsCount ?? 3}/8 porciones${
      isRewardRedeemActive ? '\n🎁 *¡PREMIO APLICADO! Canje de Pizzeta Muzzarella o Fainá Gratis*' : ''
    }`;

    const discountApplied = Math.max(0, (Number(order.subtotal) || 0) + (Number(order.shippingFee) || 0) - (Number(order.total) || 0));

    return `🍕 *¡Hola ${storeSettings.storeName}! Quiero confirmar mi pedido.*

🧾 *Pedido:* #${order.id}
👤 *Cliente:* ${order.customerName}
🪪 *Cédula (CI):* ${order.customerCedula}
📱 *Teléfono / WhatsApp:* ${order.customerPhone}
${loyaltySection}

${addressText}
📦 *Modalidad:* ${deliveryTitle}
💳 *Forma de pago:* ${paymentDetail}

🛒 *Detalle del pedido:*
${itemsText}

──────────────────
*Subtotal:* ${Number(order.subtotal || 0).toLocaleString('es-AR')}
*Envío:* ${order.shippingFee === 0 ? '¡GRATIS! (Superó los $250)' : `${Number(order.shippingFee || 0).toLocaleString('es-AR')}`}
${discountApplied > 0 ? `*Descuento Premio Tarjeta:* -$${discountApplied.toLocaleString('es-AR')}\n` : ''}*TOTAL A PAGAR: $${Number(order.total || 0).toLocaleString('es-AR')}*
──────────────────${notesText}

Quedo a la espera de su confirmación para comenzar la preparación. ¡Muchas gracias!`;
  };

  const getWhatsAppUrl = (order: Order): string => {
    const cleanNumber = String(storeSettings.whatsappNumber || '').replace(/[^0-9]/g, '');
    const message = formatWhatsAppMessage(order);
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(message)}`;
  };

  const createOrder = (input: CreateOrderInput): Order => {
    const isDelivery = input.deliveryMethod === 'delivery';
    const shipping = isDelivery
      ? cartSubtotal >= storeSettings.freeShippingThreshold
        ? 0
        : storeSettings.shippingFee
      : 0;

    const rewardDiscount = isRewardRedeemActive ? 270 : 0;
    const total = Math.max(0, cartSubtotal + shipping - rewardDiscount);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `OZ-${new Date().getFullYear()}-${randomSuffix}`;

    const orderItems = cart.map((item) => {
      const basePrice = item.unitPrice ?? item.product.price;
      const unitWithFlavors = basePrice + (item.extraFlavorsCost || 0);
      const tierLabel = item.selectedBurgerTier
        ? ` (${item.selectedBurgerTier === 'sencilla' ? 'Sencilla' : item.selectedBurgerTier === 'doble' ? 'Doble carne' : item.selectedBurgerTier === 'triple' ? 'Triple carne' : 'Cuádruple carne'})`
        : '';
      return {
        productId: item.product.id,
        productName: `${item.product.name}${tierLabel}`,
        quantity: item.quantity,
        unitPrice: unitWithFlavors,
        subtotal: unitWithFlavors * item.quantity,
        image: item.product.image,
        selectedFlavors: item.selectedFlavors,
        extraFlavorsCost: item.extraFlavorsCost,
        observations: item.observations,
        selectedBurgerTier: item.selectedBurgerTier,
      };
    });

    const newOrder: Order = {
      id: orderId,
      userId: user ? user.id : null,
      customerName: input.customerName,
      customerCedula: input.customerCedula,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      deliveryMethod: input.deliveryMethod,
      deliveryAddress: input.deliveryAddress,
      apartment: input.apartment,
      deliveryCity: input.deliveryCity,
      paymentMethod: input.paymentMethod,
      cashAmountToPayWith: input.cashAmountToPayWith,
      cardLast4: input.cardLast4,
      cardHolder: input.cardHolder,
      items: orderItems,
      subtotal: cartSubtotal,
      shippingFee: shipping,
      total,
      customerNotes: input.customerNotes,
      status: 'recibido',
      createdAt: new Date().toISOString(),
      whatsappMessage: '',
    };

    newOrder.whatsappMessage = formatWhatsAppMessage(newOrder);

    // Save order
    setOrders((prev) => [newOrder, ...prev]);
    // Clear cart
    clearCart();
    // Set for success dialog
    setLastPlacedOrder(newOrder);
    setIsCheckoutModalOpen(false);
    setIsOrderSuccessOpen(true);

    // Auto-credit +1 loyalty portion stamp to user and consume reward if applied
    if (user) {
      if (isRewardRedeemActive) {
        const rawStamps = user.loyalty?.stampsCount ?? 0;
        const hadLegacyEight = (user.loyalty?.unclaimedRewards ?? 0) === 0 && rawStamps >= 8;
        const currentUnclaimed = user.loyalty?.unclaimedRewards ?? (rawStamps >= 8 ? 1 : 0);
        const newUnclaimed = Math.max(0, currentUnclaimed - 1);
        const resetStamps = hadLegacyEight ? 0 : rawStamps;
        adjustUserLoyalty(user.id, resetStamps, newUnclaimed);
        setIsRewardRedeemActive(false);
      }
      addStampToUser(user.id, 1);
    }

    setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder)).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `orders/${newOrder.id}`, true);
    });

    return newOrder;
  };

  const reorderFromOrder = (order: Order) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const itemsToAdd: CartItem[] = [];
    const skippedNames: string[] = [];

    for (const item of order.items || []) {
      const catalogProduct =
        products.find((p) => p.id === item.productId) ||
        products.find((p) => item.productName.toLowerCase().startsWith(p.name.toLowerCase()));

      if (!catalogProduct || catalogProduct.available === false) {
        skippedNames.push(item.productName);
        continue;
      }

      const flavors = item.selectedFlavors && item.selectedFlavors.length > 0 ? item.selectedFlavors : undefined;
      const isArmaTu = Boolean(catalogProduct.id.includes('arma-tu'));
      const extraFlavorsCost = flavors ? calculateExtraFlavorsCost(flavors.length, isArmaTu) : 0;
      const unitPrice =
        item.selectedBurgerTier && catalogProduct.burgerTiers
          ? catalogProduct.burgerTiers[item.selectedBurgerTier]
          : catalogProduct.price;

      itemsToAdd.push({
        product: catalogProduct,
        quantity: Math.max(1, Number(item.quantity) || 1),
        selectedFlavors: flavors,
        extraFlavorsCost,
        observations: item.observations,
        selectedBurgerTier: item.selectedBurgerTier,
        unitPrice,
      });
    }

    if (itemsToAdd.length === 0) {
      showToast('⚠️ Los productos de ese pedido no están disponibles en este momento.');
      return;
    }

    setCart((prev) => [...prev, ...itemsToAdd]);
    setIsUserDashboardOpen(false);
    setIsCartOpen(true);

    if (skippedNames.length > 0) {
      showToast(`✓ Pedido cargado al carrito (agotados omitidos: ${skippedNames.join(', ')}).`);
    } else {
      showToast(`✓ ¡Listo! Cargamos ${itemsToAdd.length} producto(s) de tu pedido #${order.id} al carrito.`);
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    setDoc(doc(db, 'orders', orderId), { status }, { merge: true })
      .then(() => {
        showToast(`Estado del pedido #${orderId} actualizado en la nube.`);
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`, true);
      });
  };

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    const prev = storeSettingsRef.current;
    const mergedNext = { ...prev, ...newSettings };
    const scheduleChanged =
      newSettings.autoOpenTime !== undefined ||
      newSettings.autoCloseTime !== undefined ||
      newSettings.autoOpenDays !== undefined;

    const finalPayload: Partial<StoreSettings> = { ...newSettings };
    if (scheduleChanged) {
      const oldAutoText = formatScheduleHoursText(prev.autoOpenTime, prev.autoCloseTime, prev.autoOpenDays);
      const currentText = (newSettings.storeHours ?? prev.storeHours ?? '').trim();
      if (
        newSettings.storeHours === undefined ||
        currentText === DEFAULT_SETTINGS.storeHours ||
        currentText === oldAutoText
      ) {
        finalPayload.storeHours = formatScheduleHoursText(
          mergedNext.autoOpenTime,
          mergedNext.autoCloseTime,
          mergedNext.autoOpenDays
        );
      }
    } else if (newSettings.storeHours !== undefined) {
      const parsedFromHours = extractTimeRangeFromText(newSettings.storeHours);
      if (parsedFromHours) {
        finalPayload.autoOpenTime = parsedFromHours.openTime;
        finalPayload.autoCloseTime = parsedFromHours.closeTime;
      }
    }

    setStoreSettings((curr) => normalizeSettings(finalPayload, curr));
    setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(finalPayload), { merge: true })
      .then(() => {
        showToast('✓ Configuración guardada y sincronizada en la nube.');
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, 'settings/global', true);
      });
  };

  const sendContactMessage = (msg: Omit<ContactMessage, 'id' | 'date'>) => {
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now().toString(36)}`,
      date: new Date().toISOString(),
    };
    setContactMessages((prev) => [newMsg, ...prev]);
    showToast('✓ Mensaje enviado a Pizzería OZ. Te responderemos a la brevedad.');
  };

  const updateProduct = (updatedProduct: Product) => {
    const productWithMeta: Product = normalizeProduct({
      ...updatedProduct,
      deleted: false,
      updatedAt: new Date().toISOString(),
    }, INITIAL_PRODUCT_MAP.get(updatedProduct.id));
    setProducts((prev) =>
      prev.map((p) => (p.id === productWithMeta.id ? productWithMeta : p))
    );
    setDoc(doc(db, 'products', productWithMeta.id), sanitizeForFirestore(productWithMeta), { merge: true })
      .then(() => {
        showToast(`✓ Producto "${productWithMeta.name}" actualizado en la nube.`);
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.UPDATE, `products/${productWithMeta.id}`, true);
      });
  };

  const addProduct = (newProduct: Product) => {
    const productWithMeta: Product = normalizeProduct({
      ...newProduct,
      deleted: false,
      updatedAt: new Date().toISOString(),
    });
    setProducts((prev) => [productWithMeta, ...prev]);
    setDoc(doc(db, 'products', productWithMeta.id), sanitizeForFirestore(productWithMeta))
      .then(() => {
        showToast(`✓ Producto "${productWithMeta.name}" agregado y guardado en la nube.`);
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `products/${productWithMeta.id}`, true);
      });
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (INITIAL_PRODUCT_IDS.has(productId)) {
      const tombstone = {
        id: productId,
        name: '__deleted__',
        deleted: true,
        deletedAt: new Date().toISOString(),
      };
      setDoc(doc(db, 'products', productId), tombstone)
        .then(() => {
          showToast('Producto eliminado del menú en todos los dispositivos.');
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, `products/${productId}`, true);
        });
    } else {
      deleteDoc(doc(db, 'products', productId))
        .then(() => {
          showToast('Producto eliminado del menú en todos los dispositivos.');
        })
        .catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, `products/${productId}`, true);
        });
    }
  };

  const resetProductsToDefault = () => {
    setProducts(INITIAL_PRODUCTS);
    try {
      localStorage.removeItem('pizzeria_oz_products');
      localStorage.removeItem('pizzeria_oz_products_v4');
      localStorage.setItem('pizzeria_oz_products_v8', JSON.stringify(INITIAL_PRODUCTS));
    } catch {}
    getDocs(collection(db, 'products'))
      .then((snap) => Promise.all(snap.docs.map((d) => deleteDoc(d.ref))))
      .then(() => {
        showToast('✓ Catálogo restablecido al menú de fábrica en la nube.');
      })
      .catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, 'products', true);
      });
  };

  const syncLocalCatalogToCloud = async (silent: boolean = false) => {
    setIsSyncingCloud(true);
    try {
      const currentList = [...productsRef.current];
      const currentIds = new Set(currentList.map((p) => p.id));

      // Include any pre-existing local edits captured before remote snapshot arrived
      for (const localItem of localInitialBackupRef.current) {
        if (!INITIAL_PRODUCT_IDS.has(localItem.id) && !currentIds.has(localItem.id)) {
          currentList.unshift(localItem);
          currentIds.add(localItem.id);
        } else if (INITIAL_PRODUCT_IDS.has(localItem.id)) {
          const base = INITIAL_PRODUCTS.find((b) => b.id === localItem.id);
          const current = currentList.find((c) => c.id === localItem.id);
          if (base && current && isProductModifiedFromDefault(localItem, base) && !isProductModifiedFromDefault(current, base)) {
            const idx = currentList.findIndex((c) => c.id === localItem.id);
            if (idx > -1) currentList[idx] = localItem;
          }
        }
      }

      const writePromises: Promise<void>[] = [];
      const baseMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));

      for (const prod of currentList) {
        const base = baseMap.get(prod.id);
        if (!base || isProductModifiedFromDefault(prod, base)) {
          const payload: Product = {
            ...prod,
            deleted: false,
            updatedAt: prod.updatedAt || new Date().toISOString(),
          };
          writePromises.push(
            setDoc(doc(db, 'products', prod.id), sanitizeForFirestore(payload), { merge: true })
          );
        }
      }

      for (const baseProd of INITIAL_PRODUCTS) {
        if (!currentIds.has(baseProd.id)) {
          writePromises.push(
            setDoc(doc(db, 'products', baseProd.id), {
              id: baseProd.id,
              name: '__deleted__',
              deleted: true,
              deletedAt: new Date().toISOString(),
            })
          );
        }
      }

      writePromises.push(
        setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(storeSettingsRef.current), { merge: true })
      );

      await Promise.all(writePromises);
      if (!silent) {
        showToast('☁️ Catálogo, precios, fotos y configuración sincronizados con los celulares.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products', !silent);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const loginAdmin = (usernameInput: string, passwordInput: string): boolean => {
    const u = usernameInput.trim().toLowerCase();
    const p = passwordInput.trim();

    const expectedUser = (superadminUsername || 'diosu').trim().toLowerCase();
    const expectedPass = (superadminPassword || '43564586x').trim();

    if ((u === expectedUser || u === 'diosu') && (p === expectedPass || p === '43564586x')) {
      setIsAdminAuthenticated(true);
      showToast(`✓ Acceso concedido: Bienvenido Superusuario ${superadminUsername}.`);
      // Push any pending local catalog/settings changes up to Firestore automatically
      syncLocalCatalogToCloud(true);
      return true;
    }

    showToast('Usuario o contraseña incorrectos.');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setShowWelcomeScreen(true);
    setIsAdminOpen(false);
    try {
      sessionStorage.removeItem('pizzeria_oz_admin_auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
    showToast('Sesión de superusuario cerrada. Volviendo a la portada.');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        updateProduct,
        addProduct,
        deleteProduct,
        resetProductsToDefault,
        isSyncingCloud,
        syncLocalCatalogToCloud,
        cart,
        addToCart,
        updateItemObservations,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCartItems,
        cartSubtotal,
        user,
        login,
        activateLegacyUserPassword,
        register,
        logout,
        updateProfile,
        changeUserPassword,
        adminResetUserPassword,
        deleteUser,
        loginAsDemo,
        orders,
        userOrders,
        createOrder,
        reorderFromOrder,
        updateOrderStatus,
        storeSettings,
        updateStoreSettings,
        isStoreCurrentlyOpen,
        storeStatusReason,
        formatWhatsAppMessage,
        getWhatsAppUrl,
        contactMessages,
        sendContactMessage,
        isRewardRedeemActive,
        setIsRewardRedeemActive,
        allRegisteredUsers,
        addStampToUser,
        adjustUserLoyalty,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isUserDashboardOpen,
        setIsUserDashboardOpen,
        dashboardInitialTab,
        setDashboardInitialTab,
        isCheckoutModalOpen,
        setIsCheckoutModalOpen,
        selectedProduct,
        setSelectedProduct,
        lastPlacedOrder,
        setLastPlacedOrder,
        isOrderSuccessOpen,
        setIsOrderSuccessOpen,
        isAdminOpen,
        setIsAdminOpen,
        isAdminAuthenticated,
        superadminUsername,
        loginAdmin,
        logoutAdmin,
        updateSuperadminCredentials,
        isLogoModalOpen,
        setIsLogoModalOpen,
        showWelcomeScreen,
        setShowWelcomeScreen,
        authModalMode,
        setAuthModalMode,
        openAuthModal,
        selectedCategory,
        setSelectedCategory,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
