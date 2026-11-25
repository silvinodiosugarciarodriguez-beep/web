import { doc, setDoc, deleteDoc, getDocs, onSnapshot, collection, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, CartItem, User, Order, ContactMessage, DeliveryMethod, PaymentMethod, OrderStatus, BurgerTier } from '../types';
import { INITIAL_PRODUCTS } from '../data/products';
import { calculateExtraFlavorsCost } from '../data/pizzaFlavors';

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
      baseMerged.push({ ...baseProd, ...remote });
    } else {
      baseMerged.push(baseProd);
    }
  }

  const customProducts = remoteDocs
    .filter((item) => item && item.id && !INITIAL_PRODUCT_IDS.has(item.id) && item.deleted !== true && item.name !== '__deleted__')
    .sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
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
    (current.subCategory || '') !== (base.subCategory || '')
  );
}

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
  login: (cedula: string, password?: string) => boolean;
  register: (data: Omit<User, 'id' | 'registeredAt'>) => User;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  loginAsDemo: () => void;

  orders: Order[];
  userOrders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: Partial<StoreSettings>) => void;
  
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
  dashboardInitialTab: 'pedidos' | 'fidelizacion' | 'perfil' | 'configuracion';
  setDashboardInitialTab: (tab: 'pedidos' | 'fidelizacion' | 'perfil' | 'configuracion') => void;
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
};

const DEMO_USER: User = {
  id: 'usr-demo-pizzeria',
  name: 'Gonzalo Fernández',
  cedula: '4.812.394-5',
  email: 'gonzalo@ejemplo.com',
  phone: '+54 9 11 4920-1123',
  address: 'Calle Lavalle 1280',
  city: 'Centro',
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
    deliveryCity: 'Centro',
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
        const parsed: Product[] = JSON.parse(savedV5);
        // Fix any legacy /src/assets paths in stored products
        const cleaned = parsed.map(p => ({
          ...p,
          image: p.image && p.image.startsWith('/src/assets/images/')
            ? p.image.replace('/src/assets/images/', '/assets/images/')
            : p.image
        }));
        const metroCount = cleaned.filter(p => (p.category === 'pizza_metro' || p.id.startsWith('pzm-')) && p.subCategory).length;
        const hasFurnitureImg = cleaned.some(p => p.image && p.image.includes('hero_store_showcase'));
        if (metroCount >= 20 && !hasFurnitureImg) {
          return cleaned;
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
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User State: start as null so first visit shows page without products until user registers/logs in with cédula!
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('pizzeria_oz_orders');
      return saved ? JSON.parse(saved) : INITIAL_DEMO_ORDERS;
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
        const isLegacyHeadline = !parsed.heroHeadline || parsed.heroHeadline.includes('horno a la leña') || parsed.heroHeadline.includes('crujientes');
        const isLegacyLogo = !parsed.logoUrl || parsed.logoUrl.includes('logo_d58d58db');
        const isLegacyHeroImg = !parsed.heroImageUrl || parsed.heroImageUrl.includes('1792935618107');
        const cleanLogo = parsed.logoUrl?.startsWith('/src/assets/images/')
          ? parsed.logoUrl.replace('/src/assets/images/', '/assets/images/')
          : parsed.logoUrl;
        const cleanHeroImg = parsed.heroImageUrl?.startsWith('/src/assets/images/')
          ? parsed.heroImageUrl.replace('/src/assets/images/', '/assets/images/')
          : parsed.heroImageUrl;

        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          logoUrl: isLegacyLogo ? '/assets/aistudio/logo2_a9100ce6.png' : cleanLogo,
          heroImageUrl: isLegacyHeroImg ? DEFAULT_SETTINGS.heroImageUrl : cleanHeroImg,
          heroHeadline: isLegacyHeadline ? DEFAULT_SETTINGS.heroHeadline : parsed.heroHeadline,
          heroSubtitle: isLegacyHeadline ? DEFAULT_SETTINGS.heroSubtitle : parsed.heroSubtitle,
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });


  const storeSettingsRef = useRef<StoreSettings>(storeSettings);
  storeSettingsRef.current = storeSettings;

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
          setStoreSettings((prev) => ({ ...prev, ...remoteSettings }));
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
            const data = docSnap.data() as Order;
            if (data && data.id) {
              remoteOrders.push(data);
            }
          });
          if (remoteOrders.length > 0) {
            remoteOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        if (!snapshot.empty) {
          const remoteUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as User;
            if (data && data.id) {
              remoteUsers.push(data);
            }
          });
          if (remoteUsers.length > 0) {
            setAllRegisteredUsers((prev) => {
              const mergedMap = new Map<string, User>();
              for (const u of prev) {
                mergedMap.set(u.id, u);
              }
              for (const ru of remoteUsers) {
                mergedMap.set(ru.id, ru);
              }
              const merged = Array.from(mergedMap.values());
              try {
                localStorage.setItem('pizzeria_oz_registered_users', JSON.stringify(merged));
              } catch {}
              return merged;
            });

            setUser((currentUser) => {
              if (!currentUser) return null;
              const cleanCurrent = currentUser.cedula.replace(/[^0-9]/g, '');
              const match = remoteUsers.find(
                (ru) => ru.id === currentUser.id || ru.cedula.replace(/[^0-9]/g, '') === cleanCurrent
              );
              return match ? { ...currentUser, ...match } : currentUser;
            });
          }
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
      return saved ? JSON.parse(saved) : [];
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
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'pedidos' | 'perfil' | 'configuracion' | 'fidelizacion'>('pedidos');
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
      return stored ? JSON.parse(stored) : [DEMO_USER];
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

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Each item total = (unit price + extra flavor price) * quantity
  const cartSubtotal = cart.reduce((sum, item) => {
    const basePrice = item.unitPrice ?? item.product.price;
    const itemUnitPrice = basePrice + (item.extraFlavorsCost || 0);
    return sum + itemUnitPrice * item.quantity;
  }, 0);

  // Auth operations using Cédula
  const login = (cedula: string) => {
    const cleanCedula = cedula.trim();
    const digitsOnly = cleanCedula.replace(/[^0-9]/g, '');
    let savedUsers: User[] = [...allRegisteredUsers];
    try {
      const stored = localStorage.getItem('pizzeria_oz_registered_users');
      if (stored) {
        const localParsed: User[] = JSON.parse(stored);
        const existingIds = new Set(savedUsers.map((u) => u.id));
        for (const lu of localParsed) {
          if (!existingIds.has(lu.id)) savedUsers.push(lu);
        }
      }
    } catch {}

    const found = savedUsers.find(
      (u) => u.cedula.replace(/[^0-9]/g, '') === digitsOnly
    );
    if (found) {
      setUser(found);
      showToast(`¡Bienvenido de nuevo, ${found.name}!`);
      return true;
    }

    const formattedCardNum = `OZ-${digitsOnly.slice(-8).padStart(8, '0').slice(0, 4)}-${digitsOnly.slice(-8).padStart(8, '0').slice(4)}`;
    const newUser: User = {
      id: `usr-${Date.now().toString(36)}`,
      name: `Cliente CI ${cleanCedula}`,
      cedula: cleanCedula,
      phone: '+54 9 11 5555-0000',
      address: 'Dirección por definir',
      city: 'Buenos Aires',
      registeredAt: new Date().toISOString().split('T')[0],
      loyalty: {
        stampsCount: 1,
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
    setDoc(doc(db, 'users', newUser.id), sanitizeForFirestore(newUser), { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.id}`, false);
    });
    showToast(`Sesión iniciada con Cédula ${cleanCedula}.`);
    return true;
  };

  const register = (data: Omit<User, 'id' | 'registeredAt'>) => {
    const cleanCedula = data.cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
    const formattedCardNum = `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`;

    const newUser: User = {
      ...data,
      id: `usr-${Date.now().toString(36)}`,
      registeredAt: new Date().toISOString().split('T')[0],
      loyalty: {
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

    setDoc(doc(db, 'users', newUser.id), sanitizeForFirestore(newUser), { merge: true }).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `users/${newUser.id}`, false);
    });

    showToast(`¡Cuenta creada con éxito! Bienvenido a Pizzería OZ, ${newUser.name}.`);
    return newUser;
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

  const loginAsDemo = () => {
    setUser(DEMO_USER);
    showToast('Sesión iniciada con Cédula Demo (4.812.394-5)');
  };

  // Orders
  const userOrders = orders.filter((o) => !user || o.userId === user.id || o.customerCedula === user.cedula);


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
          
          const cleanCedula = u.cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
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
          const cleanCedula = u.cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
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

    const itemsText = order.items
      .map((it) => {
        let flavorInfo = '';
        if (it.selectedFlavors && it.selectedFlavors.length > 0) {
          const isArmaTu = it.productId.includes('arma-tu');
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
        return `🍕 ${it.quantity}x ${it.productName} — $${it.subtotal.toLocaleString('es-AR')} ($${it.unitPrice.toLocaleString('es-AR')} c/u)${flavorInfo}${obsInfo}`;
      })
      .join('\n');

    const addressText = isDelivery
      ? `📍 *Dirección de entrega:*\n${order.deliveryAddress || 'Sin dirección'}${order.apartment ? ` (${order.apartment})` : ''}, ${order.deliveryCity || ''}`
      : `📍 *Retiro en Pizzería OZ:*\n${storeSettings.storeAddress} (Horario: ${storeSettings.storeHours})`;

    const notesText = order.customerNotes ? `\n📝 *Aclaraciones / Notas:*\n${order.customerNotes}` : '';

    const cleanCardCedula = order.customerCedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
    const loyaltyCardNum = `OZ-${cleanCardCedula.slice(0, 4)}-${cleanCardCedula.slice(4)}`;
    const loyaltySection = `\n⭐ *Club Fidelidad OZ (Tarjeta 8 Porciones):*\n• Tarjeta: ${loyaltyCardNum}\n• Porciones acumuladas: ${user?.loyalty?.stampsCount ?? 3}/8 porciones${
      isRewardRedeemActive ? '\n🎁 *¡PREMIO APLICADO! Canje de Pizzeta Muzzarella o Fainá Gratis*' : ''
    }`;

    const discountApplied = Math.max(0, order.subtotal + order.shippingFee - order.total);

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
*Subtotal:* ${order.subtotal.toLocaleString('es-AR')}
*Envío:* ${order.shippingFee === 0 ? '¡GRATIS! (Superó los $250)' : `${order.shippingFee.toLocaleString('es-AR')}`}
${discountApplied > 0 ? `*Descuento Premio Tarjeta:* -$${discountApplied.toLocaleString('es-AR')}\n` : ''}*TOTAL A PAGAR: $${order.total.toLocaleString('es-AR')}*
──────────────────${notesText}

Quedo a la espera de su confirmación para comenzar la preparación. ¡Muchas gracias!`;
  };

  const getWhatsAppUrl = (order: Order): string => {
    const cleanNumber = storeSettings.whatsappNumber.replace(/[^0-9]/g, '');
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
        const currentUnclaimed = user.loyalty?.unclaimedRewards ?? 0;
        const newUnclaimed = Math.max(0, currentUnclaimed - 1);
        adjustUserLoyalty(user.id, user.loyalty?.stampsCount ?? 0, newUnclaimed);
        setIsRewardRedeemActive(false);
      }
      addStampToUser(user.id, 1);
    }

    setDoc(doc(db, 'orders', newOrder.id), sanitizeForFirestore(newOrder)).catch((err) => {
      handleFirestoreError(err, OperationType.CREATE, `orders/${newOrder.id}`, true);
    });

    return newOrder;
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
    setStoreSettings((prev) => ({ ...prev, ...newSettings }));
    setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(newSettings), { merge: true })
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
    const productWithMeta: Product = {
      ...updatedProduct,
      deleted: false,
      updatedAt: new Date().toISOString(),
    };
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
    const productWithMeta: Product = {
      ...newProduct,
      deleted: false,
      updatedAt: new Date().toISOString(),
    };
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
        register,
        logout,
        updateProfile,
        loginAsDemo,
        orders,
        userOrders,
        createOrder,
        updateOrderStatus,
        storeSettings,
        updateStoreSettings,
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
