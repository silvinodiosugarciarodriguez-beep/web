export type ProductCategory =
  | 'promos_activas'
  | 'pizzetas'
  | 'pizza_metro'
  | 'pizzetas_gourmet'
  | 'faina'
  | 'celiacos'
  | 'calzones'
  | 'papas_picadas'
  | 'chivitos'
  | 'baurus'
  | 'milanesas'
  | 'mexicana'
  | 'burgers'
  | 'sandwiches'
  | 'panchos'
  | 'postres'
  | 'bebidas';

export type BurgerTier = 'sencilla' | 'doble' | 'triple' | 'cuadruple';

export interface BurgerTiers {
  sencilla: number;
  doble: number;
  triple: number;
  cuadruple: number;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  originalPrice?: number; // Precio anterior tachado para ofertas y combos
  discountBadge?: string; // Ej: '17% OFF' o 'Ahorrás 90'
  category: ProductCategory;
  image: string;
  unit: string;
  origin?: string;
  stock: number;
  featured?: boolean;
  notes?: string;
  supportsCustomFlavors?: boolean; // true for 32cm pizzetas, gourmet pizzetas, and pizza por metro!
  subCategory?: string; // e.g. 'arma_tu' | 'medio_metro_sabores' | 'metro_entero_sabores' | 'muzzarella_pala'
  burgerTiers?: BurgerTiers; // Tiers for burgers: sencilla, doble, triple, cuadruple
  available?: boolean; // false = agotado temporalmente ("Agotado hoy")
  deleted?: boolean;
  deletedAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedFlavors?: string[]; // Up to 2 without cost, each extra is +$50
  extraFlavorsCost?: number; // (selectedFlavors.length - 2) * 50 if > 2, else 0
  observations?: string; // Observaciones del producto (ej: mucho piso, bien cocida, etc.)
  selectedBurgerTier?: BurgerTier; // Sencilla, Doble, Triple o Cuádruple
  unitPrice?: number; // Pre-calculated unit price including burger tier
}

export type LoyaltyTier = 'amigo' | 'explorador' | 'maestro_vip';

export interface LoyaltyData {
  stampsCount: number; // 0 to 8 porciones
  totalStampsEarned: number; // Historico acumulado
  completedCards: number; // Cuantas pizzas de 8 porciones completó
  unclaimedRewards: number; // Cuántas pizzas o premios gratis tiene disponibles para canjear
  tier: LoyaltyTier; // 'amigo' | 'explorador' | 'maestro_vip'
  cardNumber: string; // Ej: 'OZ-4812-3945'
}

export interface User {
  id: string;
  name: string;
  cedula: string; // Número de Cédula de Identidad (CI)
  password?: string; // Legacy plaintext fallback only for migrating existing accounts
  passwordHash?: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  apartment?: string;
  registeredAt: string;
  loyalty?: LoyaltyData;
}

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card';
export type OrderStatus = 'recibido' | 'preparando' | 'en_camino' | 'listo_retiro' | 'entregado';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
  selectedFlavors?: string[];
  extraFlavorsCost?: number;
  observations?: string; // Observaciones del producto para la cocina
  selectedBurgerTier?: BurgerTier;
}

export interface Order {
  id: string;
  userId: string | null;
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
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  customerNotes?: string;
  status: OrderStatus;
  createdAt: string;
  whatsappMessage: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  cedula?: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  date: string;
}
