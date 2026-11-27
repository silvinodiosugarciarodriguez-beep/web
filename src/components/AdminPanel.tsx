import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Settings,
  Pizza,
  Image as ImageIcon,
  FileText,
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Search,
  ExternalLink,
  MessageCircle,
  Truck,
  DollarSign,
  AlertCircle,
  ZoomIn,
  Camera,
  Upload,
  Award,
  Gift,
  Users,
  Sparkles,
  Cloud,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory, OrderStatus } from '../types';
import { STORE_CATEGORIES } from '../data/products';


// Helper to compress uploaded images into lightweight base64 JPEG to preserve storage and stay safely under Firestore 1MB limit
const compressImageFile = (file: File, maxWidth = 800, maxHeight = 600, quality = 0.82): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        let currentQuality = quality;
        let currentWidth = width;
        let currentHeight = height;
        let resultUrl = '';

        for (let attempt = 0; attempt < 4; attempt++) {
          canvas.width = currentWidth;
          canvas.height = currentHeight;
          ctx.clearRect(0, 0, currentWidth, currentHeight);
          ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          resultUrl = canvas.toDataURL('image/jpeg', currentQuality);
          if (resultUrl.length <= 650000) break;
          currentQuality = Math.max(0.5, currentQuality - 0.12);
          currentWidth = Math.round(currentWidth * 0.82);
          currentHeight = Math.round(currentHeight * 0.82);
        }

        resolve(resultUrl);
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
};

const PRESET_PIZZA_PHOTOS = [
  { label: '🍕 Muzzarella OZ', url: '/assets/images/pizza_muzzarella_oz_1792935617970.jpg' },
  { label: '🍕 Calabresa Artesanal', url: '/assets/images/pizza_calabresa_artesanal_1792935620290.jpg' },
  { label: '🍕 Fugazzeta Rellena', url: '/assets/images/pizza_fugazzeta_rellena_1792935618753.jpg' },
  { label: '🥟 Empanadas Caseras', url: '/assets/images/empanadas_artesanales_1792935619456.jpg' },
  { label: '🍔 Hamburguesa Artesanal', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { label: '🥤 Bebida Helada', url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80' },
  { label: '🥪 Chivito Uruguayo', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80' },
  { label: '🍟 Papas Fritas', url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80' },
  { label: '🍰 Postre Casero', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80' },
  { label: '🔥 Horno a la Leña', url: '/assets/images/hero_pizzeria_oz_1792935618107.jpg' },
];

export const AdminPanel: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    isAdminAuthenticated,
    loginAdmin,
    logoutAdmin,
    superadminUsername,
    updateSuperadminCredentials,
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    resetProductsToDefault,
    isSyncingCloud,
    syncLocalCatalogToCloud,
    storeSettings,
    updateStoreSettings,
    orders,
    updateOrderStatus,
    showToast,
    setIsLogoModalOpen,
    allRegisteredUsers,
    addStampToUser,
    adjustUserLoyalty,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'productos' | 'textos' | 'logo' | 'pedidos' | 'fidelizacion'>('productos');
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [editSuperUser, setEditSuperUser] = useState(superadminUsername || 'diosu');
  const [editSuperPass, setEditSuperPass] = useState('');

  // Search & filter for products tab
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // New product form state
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    tagline: '',
    description: '',
    price: 300,
    category: 'pizzetas',
    image: '/assets/images/pizza_muzzarella_oz_1792935617970.jpg',
    unit: 'unidad',
    stock: 99,
    supportsCustomFlavors: false,
  });

  // Business texts edit state
  const [textsForm, setTextsForm] = useState({
    storeName: storeSettings.storeName,
    whatsappNumber: storeSettings.whatsappNumber,
    storeAddress: storeSettings.storeAddress,
    storeHours: storeSettings.storeHours,
    shippingFee: storeSettings.shippingFee,
    freeShippingThreshold: storeSettings.freeShippingThreshold,
    topBannerAnnouncement: storeSettings.topBannerAnnouncement,
    heroHeadline: storeSettings.heroHeadline,
    heroSubtitle: storeSettings.heroSubtitle,
    logoUrl: storeSettings.logoUrl,
  });

  useEffect(() => {
    setTextsForm({
      storeName: storeSettings.storeName,
      whatsappNumber: storeSettings.whatsappNumber,
      storeAddress: storeSettings.storeAddress,
      storeHours: storeSettings.storeHours,
      shippingFee: storeSettings.shippingFee,
      freeShippingThreshold: storeSettings.freeShippingThreshold,
      topBannerAnnouncement: storeSettings.topBannerAnnouncement,
      heroHeadline: storeSettings.heroHeadline,
      heroSubtitle: storeSettings.heroSubtitle,
      logoUrl: storeSettings.logoUrl,
    });
  }, [storeSettings]);

  // Quick inline price editing
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<number>(0);

  // Quick Photo Change Modal
  const [photoModalProduct, setPhotoModalProduct] = useState<Product | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoDraftUrl, setPhotoDraftUrl] = useState('');

  // Handle uploading image from phone or computer
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>, targetCallback: (base64Url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor seleccioná un archivo de imagen válido.');
      return;
    }

    try {
      setIsProcessingPhoto(true);
      const compressedDataUrl = await compressImageFile(file, 900, 675, 0.82);
      targetCallback(compressedDataUrl);
      showToast('✓ Foto cargada y optimizada con éxito.');
    } catch (err) {
      showToast('No se pudo procesar la foto. Probá con otra imagen.');
    } finally {
      setIsProcessingPhoto(false);
      e.target.value = '';
    }
  };


  if (!isAdminOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserInput.trim() || !adminPassInput.trim()) return;
    const success = loginAdmin(adminUserInput, adminPassInput);
    if (success) {
      setAuthError(false);
      setAdminPassInput('');
    } else {
      setAuthError(true);
    }
  };

  const handleSaveTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      ...textsForm,
      shippingFee: Number(textsForm.shippingFee) || 0,
      freeShippingThreshold: Number(textsForm.freeShippingThreshold) || 0,
    });
  };

  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (isCreatingProduct) {
      const newProd: Product = {
        id: `custom-${Date.now().toString(36)}`,
        name: productForm.name || 'Nuevo Producto',
        tagline: productForm.tagline || 'Especialidad Pizzería OZ',
        description: productForm.description || '',
        price: Number(productForm.price) || 0,
        category: (productForm.category as ProductCategory) || 'pizzetas',
        image: productForm.image || '/assets/images/pizza_muzzarella_oz_1792935617970.jpg',
        unit: productForm.unit || 'unidad',
        stock: 99,
        supportsCustomFlavors: Boolean(productForm.supportsCustomFlavors),
      };
      addProduct(newProd);
      setIsCreatingProduct(false);
    } else if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        ...productForm,
        name: productForm.name || editingProduct.name,
        price: Number(productForm.price) || editingProduct.price,
        category: (productForm.category as ProductCategory) || editingProduct.category,
      };
      updateProduct(updated);
      setEditingProduct(null);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setIsCreatingProduct(false);
    setProductForm({
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      category: p.category,
      image: p.image,
      unit: p.unit,
      supportsCustomFlavors: Boolean(p.supportsCustomFlavors),
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setIsCreatingProduct(true);
    setProductForm({
      name: '',
      tagline: 'Especialidad Pizzería OZ',
      description: 'Elaborado artesanalmente con nuestra receta de masa obsesiva.',
      price: 350,
      category: 'pizzetas',
      image: '/assets/images/pizza_muzzarella_oz_1792935617970.jpg',
      unit: 'unidad',
      supportsCustomFlavors: false,
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'todos' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div 
        className="relative bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-5xl text-stone-100 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-stone-800 bg-stone-950/90 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-lg font-serif font-bold text-white truncate">
                  Panel Dueño
                </h2>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                  CMS
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 truncate hidden sm:block">
                Gestión en tiempo real de productos, precios, textos del negocio, logo y pedidos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                  <span>👑 Superusuario:</span>
                  <span className="font-mono text-white font-bold">{superadminUsername}</span>
                </span>
                <button
                  onClick={logoutAdmin}
                  className="inline-flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 text-xs text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700 cursor-pointer"
                  title="Cerrar sesión de superusuario"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Cerrar panel de administración"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate if not authenticated */}
        {!isAdminAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-md mx-auto my-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1.5">
              Acceso Superusuario Dueño
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mb-6 leading-relaxed">
              Ingresá con tu usuario y contraseña para gestionar los precios, productos, textos y pedidos de Pizzería OZ.
            </p>

            <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Usuario de Administrador *
                </label>
                <input
                  type="text"
                  required
                  value={adminUserInput}
                  onChange={(e) => {
                    setAdminUserInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="Usuario (ej: diosu)"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassInput}
                  onChange={(e) => {
                    setAdminPassInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="Contraseña secreta"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono transition-colors"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Usuario o contraseña incorrectos. Verificá tus credenciales.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Ingresar como Superusuario</span>
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Nav Tabs */}
            <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-stone-800 bg-stone-950/40 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('productos')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'productos'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Pizza className="w-4 h-4" />
                <span>Productos & Precios ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('textos')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'textos'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Textos del Negocio & Envíos</span>
              </button>

              <button
                onClick={() => setActiveTab('logo')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'logo'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Logo & Identidad de Marca</span>
              </button>

              <button
                onClick={() => setActiveTab('pedidos')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'pedidos'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Gestión de Pedidos ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('fidelizacion')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'fidelizacion'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Club 8 Porciones & Clientes ({allRegisteredUsers.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {/* TAB 1: PRODUCTOS & PRECIOS */}
              {activeTab === 'productos' && (
                <div className="space-y-4">
                  {/* Action Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar producto por nombre..."
                          className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                      >
                        <option value="todos">Todas las categorías</option>
                        {STORE_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => syncLocalCatalogToCloud(false)}
                        disabled={isSyncingCloud}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                        title="Publicar todos los cambios guardados en esta PC hacia los celulares en la nube"
                      >
                        {isSyncingCloud ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Cloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar con Celulares'}</span>
                      </button>

                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Nuevo Producto</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('¿Restablecer el menú al catálogo inicial original?')) {
                            resetProductsToDefault();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 rounded-xl text-xs transition-colors cursor-pointer"
                        title="Restablecer todos los productos a su estado original de fábrica"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                        <span className="hidden sm:inline">Restablecer Menú</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px]">
                    <Cloud className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>
                      Cada producto nuevo, precio o foto se guarda en la nube en tiempo real para que aparezca al instante en los celulares.
                    </span>
                  </div>

                  {/* Products Table */}
                  <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-stone-900/90 text-stone-400 border-b border-stone-800 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">Producto</th>
                            <th className="py-3 px-4">Categoría</th>
                            <th className="py-3 px-4">Precio Actual ($)</th>
                            <th className="py-3 px-4">Sabores Extra</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-800/60 text-stone-300">
                          {filteredProducts.map((p) => {
                            const isEditingPrice = quickPriceId === p.id;
                            return (
                              <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                                <td className="py-2.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="w-10 h-10 rounded-lg object-cover border border-stone-800 bg-stone-900 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-bold text-white truncate max-w-[220px]">
                                        {p.name}
                                      </div>
                                      <div className="text-[11px] text-stone-400 truncate max-w-[260px]">
                                        {p.description}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-full bg-stone-800 text-[10px] text-stone-300 border border-stone-700">
                                    {STORE_CATEGORIES.find((c) => c.id === p.category)?.label || p.category}
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  {isEditingPrice ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-amber-400 font-bold">$</span>
                                      <input
                                        type="number"
                                        value={quickPriceValue}
                                        onChange={(e) => setQuickPriceValue(Number(e.target.value))}
                                        className="w-20 px-2 py-1 bg-stone-900 border border-amber-500 rounded text-white font-mono text-xs focus:outline-none"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          updateProduct({ ...p, price: quickPriceValue });
                                          setQuickPriceId(null);
                                        }}
                                        className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                                        title="Guardar precio"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setQuickPriceId(null)}
                                        className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-amber-300 text-sm">
                                        ${p.price.toLocaleString('es-AR')}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setQuickPriceId(p.id);
                                          setQuickPriceValue(p.price);
                                        }}
                                        className="p-1 rounded text-stone-500 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                                        title="Editar precio rápido"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  {p.supportsCustomFlavors || p.id.includes('arma-tu') ? (
                                    <span className="text-amber-400 text-[11px] font-medium">
                                      ✓ Arma tu pizza
                                    </span>
                                  ) : (
                                    <span className="text-stone-500 text-[11px]">
                                      Receta fija
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => openEditModal(p)}
                                      className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-colors"
                                      title="Editar producto completo"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`¿Seguro que deseas eliminar "${p.name}" del menú?`)) {
                                          deleteProduct(p.id);
                                        }
                                      }}
                                      className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors border border-rose-900/40"
                                      title="Eliminar producto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TEXTOS DEL NEGOCIO & ENVÍOS */}
              {activeTab === 'textos' && (
                <form onSubmit={handleSaveTexts} className="max-w-2xl space-y-5">
                  <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>Datos del Local & WhatsApp</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Nombre del Negocio
                        </label>
                        <input
                          type="text"
                          value={textsForm.storeName}
                          onChange={(e) => setTextsForm({ ...textsForm, storeName: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          WhatsApp de Pedidos (sin + ni guiones)
                        </label>
                        <input
                          type="text"
                          value={textsForm.whatsappNumber}
                          onChange={(e) => setTextsForm({ ...textsForm, whatsappNumber: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          placeholder="5491158492011"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Dirección del Local
                        </label>
                        <input
                          type="text"
                          value={textsForm.storeAddress}
                          onChange={(e) => setTextsForm({ ...textsForm, storeAddress: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Días y Horarios de Atención
                        </label>
                        <input
                          type="text"
                          value={textsForm.storeHours}
                          onChange={(e) => setTextsForm({ ...textsForm, storeHours: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span>Condiciones de Envío (Delivery)</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Envío Gratis a partir de ($)
                        </label>
                        <input
                          type="number"
                          value={textsForm.freeShippingThreshold}
                          onChange={(e) => setTextsForm({ ...textsForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          required
                        />
                        <span className="text-[10px] text-stone-400">Actualmente fijado en $250</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Costo de Envío Estándar ($)
                        </label>
                        <input
                          type="number"
                          value={textsForm.shippingFee}
                          onChange={(e) => setTextsForm({ ...textsForm, shippingFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Titulares y Anuncios Promocionales</span>
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Barra superior de aviso
                        </label>
                        <input
                          type="text"
                          value={textsForm.topBannerAnnouncement}
                          onChange={(e) => setTextsForm({ ...textsForm, topBannerAnnouncement: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Título Principal de la Portada
                        </label>
                        <input
                          type="text"
                          value={textsForm.heroHeadline}
                          onChange={(e) => setTextsForm({ ...textsForm, heroHeadline: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">
                          Descripción / Bajada de la Portada
                        </label>
                        <textarea
                          rows={3}
                          value={textsForm.heroSubtitle}
                          onChange={(e) => setTextsForm({ ...textsForm, heroSubtitle: e.target.value })}
                          className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Subir Foto de Portada (Hero) */}
                      <div className="pt-2 border-t border-stone-800/80">
                        <label className="block text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>Foto de Fondo de Portada (Pizzas)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer active:scale-95">
                            <Upload className="w-3.5 h-3.5" />
                            <span>📷 Subir Foto de Portada desde Celular/PC</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadImageFile(e, (dataUrl) => {
                                updateStoreSettings({ heroImageUrl: dataUrl });
                                setTextsForm((prev) => ({ ...prev, heroImageUrl: dataUrl }));
                              })}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              updateStoreSettings({ heroImageUrl: '/assets/images/hero_pizzeria_oz_1792935618107.jpg' });
                              showToast('Foto de portada restablecida.');
                            }}
                            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white rounded-xl text-xs border border-stone-800 transition-colors"
                          >
                            Restablecer Original
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Guardar Textos y Ajustes del Negocio
                  </button>
                </form>
              )}

              {/* TAB 3: LOGO & IDENTIDAD DE MARCA */}
              {activeTab === 'logo' && (
                <div className="max-w-2xl space-y-6">
                  <div className="bg-stone-950/60 border border-stone-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      <span>Visualización del Logo Oficial Renovado</span>
                    </h3>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-stone-900/60 rounded-xl border border-stone-800">
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full opacity-60 blur-sm group-hover:opacity-90 transition-opacity" />
                        <img
                          src={storeSettings.logoUrl || '/assets/aistudio/logo_d58d58db.jpg'}
                          alt="Logo Pizzería OZ"
                          className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-black object-contain p-2 border-4 border-amber-400 shadow-xl"
                        />
                      </div>

                      <div className="space-y-3 text-center sm:text-left">
                        <div className="text-base font-serif font-bold text-white">
                          Pizzería OZ · Nueva Imagen
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">
                          Este logo se muestra de manera prominente en el encabezado, portada, pie de página y recibos de pedidos.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95">
                            <Upload className="w-3.5 h-3.5" />
                            <span>📷 Subir Nuevo Logo desde mi Dispositivo</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleUploadImageFile(e, (dataUrl) => {
                                updateStoreSettings({ logoUrl: dataUrl });
                                setTextsForm((prev) => ({ ...prev, logoUrl: dataUrl }));
                              })}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsLogoModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Ver Tamaño Gigante</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-stone-800 space-y-3">
                      <label className="block text-xs font-semibold text-stone-300">
                        Ruta o URL del Logo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={textsForm.logoUrl}
                          onChange={(e) => setTextsForm({ ...textsForm, logoUrl: e.target.value })}
                          className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateStoreSettings({ logoUrl: textsForm.logoUrl });
                          }}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm shrink-0"
                        >
                          Aplicar URL
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Ruta oficial predeterminada: <code>/assets/aistudio/logo2_a9100ce6.png</code>
                      </p>
                    </div>

                    {/* SECCIÓN CREDENCIALES DEL SUPERUSUARIO */}
                    <div className="mt-6 pt-5 border-t border-stone-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <label className="text-xs font-bold text-white uppercase tracking-wider">
                          Credenciales de Acceso Superusuario
                        </label>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">
                        Superusuario actual: <strong className="text-amber-300 font-mono">{superadminUsername}</strong>. Podés cambiar el usuario o contraseña cuando lo desees.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-400 mb-1">Usuario</label>
                          <input
                            type="text"
                            value={editSuperUser}
                            onChange={(e) => setEditSuperUser(e.target.value)}
                            placeholder="Usuario (ej: diosu)"
                            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-stone-400 mb-1">Nueva Contraseña</label>
                          <input
                            type="password"
                            value={editSuperPass}
                            onChange={(e) => setEditSuperPass(e.target.value)}
                            placeholder="Nueva contraseña..."
                            className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (updateSuperadminCredentials(editSuperUser, editSuperPass)) {
                            setEditSuperPass('');
                          }
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Actualizar Credenciales de Superusuario
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: GESTIÓN DE PEDIDOS */}
              {activeTab === 'pedidos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Pedidos Recibidos ({orders.length})
                    </h3>
                  </div>

                  {orders.length === 0 ? (
                    <div className="p-8 text-center bg-stone-950/40 rounded-xl border border-stone-800 text-stone-400 text-xs">
                      No hay pedidos registrados en este momento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((o) => (
                        <div
                          key={o.id}
                          className="p-4 bg-stone-950/60 border border-stone-800 rounded-xl space-y-3 hover:border-stone-700 transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-400 text-xs">
                                #{o.id}
                              </span>
                              <span className="text-xs text-stone-300 font-semibold">
                                {o.customerName} (CI: {o.customerCedula})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-400">
                                Total: <strong className="text-white">${o.total.toLocaleString('es-AR')}</strong>
                              </span>
                              <select
                                value={o.status}
                                onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                                className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-semibold focus:outline-none"
                              >
                                <option value="recibido">Recibido</option>
                                <option value="preparando">En Preparación</option>
                                <option value="en_camino">En Camino (Delivery)</option>
                                <option value="listo_retiro">Listo p/ Retiro</option>
                                <option value="entregado">Entregado</option>
                              </select>
                            </div>
                          </div>

                          <div className="text-xs text-stone-300 space-y-1">
                            <div>
                              <strong>Modalidad:</strong> {o.deliveryMethod === 'delivery' ? `🛵 Delivery a ${o.deliveryAddress || ''} (${o.apartment || ''})` : `🏬 Retiro en Local`}
                            </div>
                            <div>
                              <strong>Teléfono:</strong> {o.customerPhone}
                            </div>
                            {o.customerNotes && (
                              <div className="text-amber-300">
                                <strong>Nota general:</strong> {o.customerNotes}
                              </div>
                            )}
                          </div>

                          {/* Items Detail */}
                          <div className="bg-stone-900/60 rounded-lg p-2.5 space-y-1 text-xs">
                            <div className="text-[10px] uppercase font-bold text-stone-400">Artículos:</div>
                            {o.items.map((it, i) => (
                              <div key={i} className="flex flex-col text-stone-300 py-0.5 border-b border-stone-800/40 last:border-none">
                                <div className="flex justify-between">
                                  <span>{it.quantity}x {it.productName}</span>
                                  <span className="font-mono text-stone-400">${it.subtotal}</span>
                                </div>
                                {it.observations && (
                                  <span className="text-amber-400 text-[11px] pl-2 font-mono">
                                    ↳ 📝 Obs cocina: {it.observations}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CLUB 8 PORCIONES & CLIENTES */}
              {activeTab === 'fidelizacion' && (
                <div className="space-y-6">
                  {/* Top Header Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Fidelización Digital Pizzería OZ</span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white mt-0.5">
                        Club «Las 8 Porciones» & Base de Clientes
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 max-w-xl">
                        Cada cliente registrado con su Cédula acumula porciones con sus pedidos. Al completar 8 porciones ganan 1 Pizzeta Muzzarella o Fainá gratis. Acá podés sumar o quitar porciones manualmente y otorgar premios de regalo.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-2 bg-stone-900/90 rounded-xl border border-stone-800 text-center">
                        <div className="text-xs text-stone-400">Total Clientes</div>
                        <div className="text-lg font-bold text-amber-400 font-mono">{allRegisteredUsers.length}</div>
                      </div>
                      <div className="px-3 py-2 bg-stone-900/90 rounded-xl border border-stone-800 text-center">
                        <div className="text-xs text-stone-400">Premios Pendientes</div>
                        <div className="text-lg font-bold text-emerald-400 font-mono">
                          {allRegisteredUsers.reduce((sum, u) => sum + (u.loyalty?.unclaimedRewards ?? (u.loyalty?.stampsCount === 8 ? 1 : 0)), 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        placeholder="Buscar por Nombre, Cédula o Número de Tarjeta (OZ-XXXX-XXXX)..."
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    {clientSearchQuery && (
                      <button
                        onClick={() => setClientSearchQuery('')}
                        className="px-3 py-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl cursor-pointer"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {/* Clients List */}
                  <div className="space-y-3">
                    {allRegisteredUsers
                      .filter((u) => {
                        if (!clientSearchQuery.trim()) return true;
                        const q = clientSearchQuery.toLowerCase();
                        return (
                          u.name.toLowerCase().includes(q) ||
                          u.cedula.toLowerCase().includes(q) ||
                          (u.loyalty?.cardNumber || '').toLowerCase().includes(q) ||
                          (u.phone || '').includes(q)
                        );
                      })
                      .map((client) => {
                        const cleanCedula = client.cedula.replace(/[^0-9]/g, '').slice(-8).padStart(8, '0');
                        const cardNum = client.loyalty?.cardNumber || `OZ-${cleanCedula.slice(0, 4)}-${cleanCedula.slice(4)}`;
                        const stamps = client.loyalty?.stampsCount ?? 0;
                        const unclaimed = client.loyalty?.unclaimedRewards ?? (stamps >= 8 ? 1 : 0);
                        const tier = client.loyalty?.tier || (stamps >= 8 ? 'explorador' : 'amigo');
                        const tierLabel = tier === 'maestro_vip' ? '🥇 Maestro VIP' : tier === 'explorador' ? '🥈 Explorador' : '🥉 Amigo OZ';

                        return (
                          <div
                            key={client.id}
                            className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                          >
                            {/* Client Identification */}
                            <div className="flex items-start gap-3 min-w-[240px]">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-white text-sm">{client.name}</h4>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 font-semibold">
                                    {tierLabel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5 font-mono">
                                  <span>CI: {client.cedula}</span>
                                  <span>·</span>
                                  <span>{client.phone}</span>
                                </div>
                                <div className="text-[11px] text-amber-300/80 font-mono mt-0.5">
                                  Tarjeta: <strong>{cardNum}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Pizza Slices Status */}
                            <div className="flex flex-col items-start md:items-center gap-1.5">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
                                  const filled = s <= (stamps % 8 || (stamps >= 8 ? 8 : 0));
                                  return (
                                    <div
                                      key={s}
                                      className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                        filled
                                          ? 'bg-amber-500 text-stone-950 ring-1 ring-amber-300 shadow-xs'
                                          : 'bg-stone-900 border border-stone-800 text-stone-600'
                                      }`}
                                      title={`Porción ${s}`}
                                    >
                                      {filled ? '🍕' : s}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                <strong className="text-amber-400">{stamps % 8}/8</strong> porciones de la tarjeta
                                {unclaimed > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                    🎁 {unclaimed} Pizza(s) Gratis
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Control Buttons for Admin */}
                            <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 self-end md:self-center">
                              <button
                                type="button"
                                onClick={() => adjustUserLoyalty(client.id, Math.max(0, stamps - 1), unclaimed)}
                                disabled={stamps <= 0}
                                className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                title="Quitar 1 porción"
                              >
                                -1
                              </button>

                              <button
                                type="button"
                                onClick={() => addStampToUser(client.id, 1)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="Acreditar 1 porción por pedido realizado"
                              >
                                <span>+1 Porción</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => adjustUserLoyalty(client.id, stamps, unclaimed + 1)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                title="Otorgar premio de Pizzeta Muzzarella o Fainá gratis"
                              >
                                <Gift className="w-3.5 h-3.5" />
                                <span>+1 Premio</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const nextStamps = (client.loyalty?.unclaimedRewards ?? 0) === 0 && stamps >= 8 ? 0 : stamps;
                                  adjustUserLoyalty(client.id, nextStamps, Math.max(0, unclaimed - 1));
                                }}
                                disabled={unclaimed <= 0}
                                className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all shadow-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                title="Marcar 1 premio como entregado / canjeado en el local"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Canjear / -1 Premio</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* Modal for Creating or Editing Product */}
        {(editingProduct || isCreatingProduct) && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div 
              className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-lg p-6 text-stone-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <h3 className="text-base font-serif font-bold text-white">
                  {isCreatingProduct ? 'Agregar Nuevo Producto al Menú' : `Editar Producto: ${editingProduct?.name}`}
                </h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingProduct(false);
                  }}
                  className="p-1 rounded text-stone-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="Ej: Pizzeta Napolitana Especial"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">Precio ($)</label>
                    <input
                      type="number"
                      value={productForm.price || 0}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-300 mb-1">Categoría</label>
                    <select
                      value={productForm.category || 'pizzetas'}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value as ProductCategory })}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    >
                      {STORE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Descripción</label>
                  <textarea
                    rows={2}
                    value={productForm.description || ''}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                    placeholder="Detalle de ingredientes..."
                  />
                </div>

                {/* MÓDULO INTELIGENTE DE FOTO DEL PRODUCTO */}
                <div className="bg-stone-950/80 border border-stone-800 p-4 rounded-xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>Foto del Producto</span>
                    </label>
                    <span className="text-[11px] text-stone-400">Podés subir desde celular o elegir foto</span>
                  </div>

                  {/* Vista Previa y Botón de Subida */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-stone-700 bg-stone-900 shrink-0 shadow-md">
                      <img
                        src={productForm.image || '/assets/images/pizza_muzzarella_oz_1792935617970.jpg'}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer active:scale-95">
                        <Upload className="w-4 h-4" />
                        <span>{isProcessingPhoto ? 'Procesando...' : '📷 Subir Foto desde mi Dispositivo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isProcessingPhoto}
                          onChange={(e) => handleUploadImageFile(e, (dataUrl) => setProductForm({ ...productForm, image: dataUrl }))}
                        />
                      </label>
                      <p className="text-[11px] text-stone-400 leading-tight">
                        Se optimiza automáticamente para cargar instantáneamente en cualquier celular.
                      </p>
                    </div>
                  </div>

                  {/* Galería Rápida de Fotos Oficiales */}
                  <div>
                    <span className="block text-[11px] font-semibold text-stone-300 mb-1.5">
                      O elegí una foto oficial de Pizzería OZ con 1 clic:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PRESET_PIZZA_PHOTOS.slice(0, 5).map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, image: preset.url })}
                          className={`p-1.5 rounded-lg border text-left text-[11px] flex flex-col gap-1 transition-all cursor-pointer ${
                            productForm.image === preset.url
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300'
                              : 'border-stone-800 bg-stone-900 hover:border-stone-700 text-stone-300'
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded" />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Campo opcional de URL */}
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">O pegar enlace de foto externa (URL):</label>
                    <input
                      type="text"
                      value={productForm.image || ''}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="https://... o /assets/images/..."
                      className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsCreatingProduct(false);
                    }}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-md"
                  >
                    Guardar Producto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
