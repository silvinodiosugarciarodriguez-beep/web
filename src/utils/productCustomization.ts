import { Product } from '../types';

export interface ProductCustomizationConfig {
  isPizza: boolean;
  isBurger: boolean;
  isBeverage: boolean;
  isFaina: boolean;
  isDessert: boolean;
  isSandwich: boolean;
  isEmpanadaOrPicada: boolean;
  label: string;
  placeholder: string;
  quickChips: string[];
  cartAddButtonLabel: string;
  badgeText: string;
}

export function getProductCustomization(product: Pick<Product, 'category' | 'name' | 'burgerTiers'>): ProductCustomizationConfig {
  const cat = product.category;
  const name = product.name.toLowerCase();

  // 1. BEBIDAS: Solo opciones de bebidas (temperatura, pajita, vaso). NUNCA "mucho piso"
  if (
    cat === 'bebidas' ||
    name.includes('coca') ||
    name.includes('cerveza') ||
    name.includes('agua') ||
    name.includes('paso de los toros') ||
    name.includes('pilsen') ||
    name.includes('patricia') ||
    name.includes('refresco') ||
    name.includes('sprite') ||
    name.includes('fanta') ||
    name.includes('pepsi')
  ) {
    return {
      isPizza: false,
      isBurger: false,
      isBeverage: true,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Aclaración sobre tu bebida:',
      placeholder: 'Ej: bien fría, temperatura natural, con pajita, vaso descartable...',
      quickChips: ['Bien fría', 'Natural (sin frío)', 'Vaso descartable', 'Con pajita'],
      cartAddButtonLabel: '+ Aclaración (ej: bien fría)',
      badgeText: 'Bebida envasada en frío original lista para consumir',
    };
  }

  // 2. HAMBURGUESAS: Opciones específicas de burgers (cebolla, aderezos, cocción)
  if (cat === 'burgers' || Boolean(product.burgerTiers) || name.includes('hamburguesa') || name.includes('burger')) {
    return {
      isPizza: false,
      isBurger: true,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Personalizá tu hamburguesa:',
      placeholder: 'Ej: sin cebolla, poco aderezo, bien cocida, sin mayonesa...',
      quickChips: ['Sin cebolla', 'Poco aderezo', 'Sin mayonesa', 'Sin mostaza', 'Bien cocida', 'Papas crocantes', 'Cheddar extra fundido'],
      cartAddButtonLabel: '+ Aclaración (ej: sin cebolla)',
      badgeText: 'Carne seleccionada con pan artesanal y papas fritas',
    };
  }

  // 3. PIZZAS: ÚNICAMENTE aquí aplican "Mucho piso", "Bien dorada / cocida", "Masa tierna", "Poco orégano", etc.
  const isPizzaCategory = ['pizzetas', 'pizza_metro', 'pizzetas_gourmet', 'calzones'].includes(cat);
  const isPizzaName = name.includes('pizza') || name.includes('pizzeta') || name.includes('fugazzeta') || name.includes('chivimuzza') || name.includes('calzone');
  if (isPizzaCategory || isPizzaName) {
    return {
      isPizza: true,
      isBurger: false,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Observaciones para la Cocina:',
      placeholder: 'Ej: mucho piso, bien cocida, poco orégano, cortar en porciones...',
      quickChips: ['Mucho piso', 'Bien dorada / cocida', 'Masa tierna', 'Poco orégano', 'Sin orégano', 'Cortar en porciones chicas'],
      cartAddButtonLabel: '+ Aclaración (ej: mucho piso)',
      badgeText: 'Elaboración artesanal al momento con receta de masa obsesiva',
    };
  }

  // 4. FAINÁ: Pimienta, orillo, dorada
  if (cat === 'faina' || name.includes('faina') || name.includes('fainá')) {
    return {
      isPizza: false,
      isBurger: false,
      isBeverage: false,
      isFaina: true,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Observaciones para el horno:',
      placeholder: 'Ej: con pimienta negra, sin pimienta, bien dorada, del orillo...',
      quickChips: ['Con pimienta negra', 'Sin pimienta', 'Bien dorada', 'Del orillo', 'Bien caliente'],
      cartAddButtonLabel: '+ Aclaración (ej: con pimienta)',
      badgeText: 'Fainá tradicional horneada en su punto exacto',
    };
  }

  // 5. POSTRES
  if (cat === 'postres' || name.includes('postre') || name.includes('helado') || name.includes('flan') || name.includes('torta')) {
    return {
      isPizza: false,
      isBurger: false,
      isBeverage: false,
      isFaina: false,
      isDessert: true,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Aclaración sobre tu postre:',
      placeholder: 'Ej: bien frío, cuchara descartable, para consumo inmediato...',
      quickChips: ['Bien frío', 'Cuchara descartable', 'Para consumir ahora'],
      cartAddButtonLabel: '+ Aclaración (ej: bien frío)',
      badgeText: 'Postre fresco de elaboración diaria',
    };
  }

  // 6. CHIVITOS, SANDWICHES, BAURUS, MILANESAS, PANCHOS
  if (['chivitos', 'sandwiches', 'baurus', 'milanesas', 'panchos'].includes(cat)) {
    return {
      isPizza: false,
      isBurger: false,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: true,
      isEmpanadaOrPicada: false,
      label: 'Personalizá tu preparación:',
      placeholder: 'Ej: sin mayonesa, sin cebolla, pan bien tostado, cortar al medio...',
      quickChips: ['Sin mayonesa', 'Sin mostaza', 'Sin cebolla', 'Sin tomate', 'Pan bien tostado', 'Cortar al medio'],
      cartAddButtonLabel: '+ Aclaración (ej: sin mayonesa)',
      badgeText: 'Elaboración artesanal al momento en cocina',
    };
  }

  // 7. EMPANADAS, PAPAS / PICADAS, MEXICANA
  if (['empanadas', 'papas_picadas', 'mexicana'].includes(cat)) {
    return {
      isPizza: false,
      isBurger: false,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: true,
      label: 'Instrucciones para la cocina:',
      placeholder: 'Ej: bien crocantes, salsa aparte, bien caliente...',
      quickChips: ['Bien crocantes', 'Salsas aparte', 'Servir bien caliente', 'Poco condimento'],
      cartAddButtonLabel: '+ Aclaración (ej: bien crocante)',
      badgeText: 'Elaboración al momento con ingredientes seleccionados',
    };
  }

  // 8. PROMOS ACTIVAS / COMBOS
  const isPromoWithPizza = name.includes('metro') || name.includes('pizza') || name.includes('pizzeta') || name.includes('laboratorio');
  const isPromoWithBurger = name.includes('burger') || name.includes('hamburguesa');

  if (isPromoWithPizza) {
    return {
      isPizza: true,
      isBurger: false,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Observaciones para la Cocina (Pizza):',
      placeholder: 'Ej: mucho piso, bien dorada, poco orégano, cortar en porciones...',
      quickChips: ['Mucho piso', 'Bien dorada / cocida', 'Masa tierna', 'Poco orégano', 'Sin orégano'],
      cartAddButtonLabel: '+ Aclaración (ej: mucho piso)',
      badgeText: 'Combo promocional elaborado al momento',
    };
  }

  if (isPromoWithBurger) {
    return {
      isPizza: false,
      isBurger: true,
      isBeverage: false,
      isFaina: false,
      isDessert: false,
      isSandwich: false,
      isEmpanadaOrPicada: false,
      label: 'Personalizá tu combo burger:',
      placeholder: 'Ej: sin cebolla, poco aderezo, bien cocida, bebida bien fría...',
      quickChips: ['Sin cebolla', 'Poco aderezo', 'Bebida bien fría', 'Papas crocantes'],
      cartAddButtonLabel: '+ Aclaración (ej: sin cebolla)',
      badgeText: 'Combo promocional elaborado al momento',
    };
  }

  return {
    isPizza: false,
    isBurger: false,
    isBeverage: false,
    isFaina: false,
    isDessert: false,
    isSandwich: false,
    isEmpanadaOrPicada: false,
    label: 'Aclaraciones para tu pedido:',
    placeholder: 'Ej: detalles de preparación, entrega o aderezos...',
    quickChips: ['Bien caliente', 'Bebida bien fría', 'Sin aderezos extras'],
    cartAddButtonLabel: '+ Agregar aclaración',
    badgeText: 'Preparado con dedicación al momento de tu pedido',
  };
}
