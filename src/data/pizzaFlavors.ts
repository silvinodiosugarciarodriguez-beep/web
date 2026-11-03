export interface PizzaFlavor {
  id: string;
  name: string;
  description: string;
  isExtraMuzza?: boolean;
}

/**
 * Sabores base de las pizzetas de 32 cm (extraídos directamente del menú oficial PDF):
 * La muzzarella tradicional viene de base incluida en toda pizza y NO cuenta como sabor,
 * salvo que el cliente elija "Extra de Muzzarella", la cual sí suma como sabor.
 * 
 * Regla de negocio:
 * - Hasta 2 sabores sin costo adicional ($0 extra).
 * - A partir del 3er sabor, cada sabor adicional cuesta $50 pesos.
 */
export const BASE_32CM_FLAVORS: PizzaFlavor[] = [
  { id: 'jamon', name: 'Jamón', description: 'Fetas de jamón cocido seleccionado de primera calidad' },
  { id: 'panceta', name: 'Panceta', description: 'Crocantes tiras de panceta ahumada dorada' },
  { id: 'atun', name: 'Atún', description: 'Lomitos de atún al natural' },
  { id: 'palmito', name: 'Palmito', description: 'Rodajas de palmitos tiernos frescos' },
  { id: 'aceituna', name: 'Aceituna', description: 'Aceitunas seleccionadas descarozadas al orégano' },
  { id: 'huevo', name: 'Huevo Cocido', description: 'Huevo cocido picado artesanalmente' },
  { id: 'choclo', name: 'Choclo', description: 'Granos de choclo dulce dorados' },
  { id: 'pollo', name: 'Pollo', description: 'Pechuga desmenuzada sazonada con finas hierbas' },
  { id: 'pesto', name: 'Pesto', description: 'Pesto genovés casero con albahaca fresca' },
  { id: 'morron', name: 'Morrón', description: 'Tiras de morrón dulce asado al horno' },
  { id: 'lomito', name: 'Lomito', description: 'Fetas de lomito canadiense ahumado' },
  { id: 'sardina', name: 'Sardina', description: 'Sardinas seleccionadas en aceite' },
  { id: 'brocoli', name: 'Brócoli', description: 'Ramilletes de brócoli al vapor sazonados' },
  { id: 'extra_muzza', name: 'Extra de Muzzarella', description: 'Doble capa de queso muzzarella fundido (cuenta como sabor)', isExtraMuzza: true },
];

export const ALL_PIZZA_FLAVORS: PizzaFlavor[] = BASE_32CM_FLAVORS;

/**
 * Calculates extra flavors cost:
 * - For "Arma tu..." products (isArmaTu === true):
 *   - Up to 2 flavors: $0 (included / gratis)
 *   - 3 or more flavors: $50 for each flavor beyond the 2nd
 * - For all other pizzas (predefined pizzetas, gourmet, etc.):
 *   - Every additional flavor selected costs $50 each (no free slots)
 */
export function calculateExtraFlavorsCost(flavorCount: number, isArmaTu: boolean = true): number {
  if (isArmaTu) {
    if (flavorCount <= 2) return 0;
    return (flavorCount - 2) * 50;
  }
  return flavorCount * 50;
}
