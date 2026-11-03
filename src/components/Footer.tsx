import React from 'react';
import { Store, MessageCircle, Heart, Flame, Shield, ZoomIn, Sparkles, LogOut, Lock } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { storeSettings, setIsAuthModalOpen, setIsUserDashboardOpen, user, logout, setIsAdminOpen, setIsLogoModalOpen, setShowWelcomeScreen, isAdminAuthenticated, logoutAdmin, superadminUsername } = useStore();

  return (
    <footer className="bg-stone-900 text-stone-300 py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-stone-800">
          
          {/* Brand Col with Large Logo */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-4 text-white">
              <button
                onClick={() => setIsLogoModalOpen(true)}
                className="relative group p-0.5 rounded-full cursor-pointer shrink-0"
                title="Click para ver el logo oficial ampliado"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xs opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src={storeSettings.logoUrl || '/assets/aistudio/logo2_a9100ce6.png'}
                  alt="Pizzería OZ Logo Oficial - 8 Porciones"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black object-contain p-0.5 border-2 border-amber-400 shadow-lg group-hover:scale-105 transition-transform"
                />
              </button>
              <div>
                <span className="font-serif font-bold text-xl sm:text-2xl text-white block">
                  {storeSettings.storeName}
                </span>
                <span className="text-xs text-amber-400 font-medium">
                  El Laboratorio · Receta 2020 · 8 Porciones
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              No somos una pizzería tradicional. Somos un Laboratorio. Nacidos en la pandemia de 2020 con una receta de masa obsesiva para llevar alegría a las mesas. Envíos gratis a partir de ${storeSettings.freeShippingThreshold} pesos o retiro en local.
            </p>
            <div className="pt-1 text-xs text-stone-400">
              📍 {storeSettings.storeAddress}
            </div>
          </div>

          {/* Nav links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Navegación
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => setShowWelcomeScreen(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Pantalla de Bienvenida (Portada)</span>
                </button>
              </li>
              <li>
                <a href="#catalogo" className="hover:text-amber-300 transition-colors">
                  Catálogo de Productos
                </a>
              </li>
              <li>
                <a href="#nosotros" className="hover:text-amber-300 transition-colors">
                  Nosotros & El Laboratorio
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-amber-300 transition-colors">
                  Contacto & Pedidos
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsLogoModalOpen(true)}
                  className="text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>Ver Logo Oficial (8 porciones)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Account & Administration */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              Tu Cuenta & Gestión
            </h4>
            <ul className="space-y-1.5 text-xs text-stone-400">
              {user ? (
                <>
                  <li className="font-medium text-amber-300 truncate">
                    👤 {user.name} (CI: {user.cedula})
                  </li>
                  <li>
                    <button
                      onClick={() => setIsUserDashboardOpen(true)}
                      className="hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Mis Pedidos
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={logout}
                      className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="hover:text-amber-300 transition-colors"
                    >
                      Registrate con Cédula
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="hover:text-amber-300 transition-colors"
                    >
                      Ya tengo cuenta (CI)
                    </button>
                  </li>
                </>
              )}
              
              {/* Owner CMS access */}
              <li className="pt-2">
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-amber-400 bg-stone-800 hover:bg-stone-750 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
                >
                  <Shield className="w-3 h-3" />
                  <span>Panel Dueño (CMS Precios)</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} {storeSettings.storeName}. El Laboratorio de Pizza · Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Pasión & Masa Obsesiva desde 2020</span>
            <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline ml-1" />
          </div>
        </div>

      </div>
    </footer>
  );
};
