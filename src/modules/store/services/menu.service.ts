import type { MenuSection, Restaurant } from "../schemas/store.chema";

// Plantillas de menú por categoría (mock). Reemplazar por el menú real de cada restaurante desde el API.
const MENU_TEMPLATES: Record<string, MenuSection[]> = {
  Hamburguesas: [
    {
      id: "combos",
      title: "Combos",
      items: [
        { id: "combo-clasico", name: "Combo Clásico", description: "1 hamburguesa clásica, papas regulares y gaseosa de 500 ml.", price: 24.9, oldPrice: 34.9 },
        { id: "combo-doble", name: "Combo Doble con Queso", description: "1 hamburguesa doble carne con queso, papas medianas y gaseosa de 500 ml.", price: 29.9, oldPrice: 42.9 },
        { id: "combo-crispy", name: "Combo Pollo Crispy", description: "1 hamburguesa de pollo crispy, papas regulares y gaseosa de 500 ml.", price: 22.9, oldPrice: 31.9 },
        { id: "combo-familiar", name: "Combo Familiar", description: "4 hamburguesas clásicas, 4 papas regulares y 4 gaseosas de 500 ml.", price: 79.9, oldPrice: 99.9 },
      ],
    },
    {
      id: "hamburguesas",
      title: "Hamburguesas",
      items: [
        { id: "clasica", name: "Hamburguesa Clásica", description: "Carne de res, lechuga, tomate, cebolla y salsa de la casa.", price: 14.9 },
        { id: "doble-queso", name: "Doble con Queso", description: "Doble carne de res, doble queso cheddar, pepinillos y salsa especial.", price: 18.9 },
        { id: "bacon-bbq", name: "Bacon BBQ", description: "Carne de res, tocino crocante, cebolla caramelizada y salsa BBQ.", price: 19.9 },
        { id: "vegetariana", name: "Vegetariana", description: "Medallón de quinua y verduras, palta, tomate y mayonesa de hierbas.", price: 17.9 },
      ],
    },
    {
      id: "acompanamientos",
      title: "Para acompañar",
      items: [
        { id: "papas", name: "Papas Regulares", description: "Papas fritas crocantes con sal.", price: 6.9 },
        { id: "aros", name: "Aros de Cebolla", description: "Porción de aros de cebolla empanizados.", price: 8.9 },
        { id: "nuggets", name: "Nuggets x6", description: "6 nuggets de pollo con salsa a elección.", price: 10.9 },
        { id: "gaseosa", name: "Gaseosa 500 ml", description: "Sabor a elección.", price: 5.9 },
      ],
    },
  ],
  Pizzas: [
    {
      id: "promos",
      title: "Promos",
      items: [
        { id: "promo-2-medianas", name: "2 Pizzas Medianas", description: "2 pizzas medianas a elección: Americana, Pepperoni o Hawaiana.", price: 59.9, oldPrice: 89.9 },
        { id: "promo-grande-bebida", name: "Pizza Grande + Bebida 1.5 L", description: "1 pizza grande a elección con gaseosa de 1.5 L.", price: 54.9, oldPrice: 69.9 },
        { id: "promo-duo", name: "Dúo Personal", description: "2 pizzas personales y 2 gaseosas de 500 ml.", price: 34.9, oldPrice: 46.9 },
      ],
    },
    {
      id: "pizzas",
      title: "Pizzas",
      items: [
        { id: "americana", name: "Pizza Americana", description: "Salsa de tomate, mozzarella y jamón.", price: 32.9 },
        { id: "pepperoni", name: "Pizza Pepperoni", description: "Salsa de tomate, mozzarella y abundante pepperoni.", price: 36.9 },
        { id: "hawaiana", name: "Pizza Hawaiana", description: "Salsa de tomate, mozzarella, jamón y piña.", price: 34.9 },
        { id: "suprema", name: "Pizza Suprema", description: "Pepperoni, jamón, pimiento, cebolla, champiñones y aceituna.", price: 41.9 },
      ],
    },
    {
      id: "extras",
      title: "Extras",
      items: [
        { id: "pan-ajo", name: "Pan al Ajo", description: "6 piezas con mantequilla de ajo y queso.", price: 12.9 },
        { id: "alitas", name: "Alitas x8", description: "8 alitas bañadas en salsa BBQ o picante.", price: 18.9 },
        { id: "gaseosa-15", name: "Gaseosa 1.5 L", description: "Sabor a elección.", price: 9.9 },
      ],
    },
  ],
  Pollería: [
    {
      id: "promos",
      title: "Promos",
      items: [
        { id: "cuarto", name: "1/4 Pollo a la Brasa", description: "Con papas fritas y ensalada fresca.", price: 22.9, oldPrice: 29.9 },
        { id: "medio", name: "1/2 Pollo a la Brasa", description: "Con papas fritas, ensalada y cremas.", price: 39.9, oldPrice: 52.9 },
        { id: "entero-familiar", name: "Pollo Entero Familiar", description: "1 pollo entero, papas familiares, ensalada y gaseosa de 1.5 L.", price: 74.9, oldPrice: 89.9 },
      ],
    },
    {
      id: "platos",
      title: "Platos",
      items: [
        { id: "anticuchos", name: "Anticuchos de Corazón", description: "2 palitos con papas doradas, choclo y ají.", price: 24.9 },
        { id: "mostrito", name: "Mostrito", description: "Media porción de arroz chaufa y de pollo saltado.", price: 26.9 },
        { id: "chaufa-pollo", name: "Chaufa de Pollo", description: "Arroz chaufa salteado al wok con pollo y tortilla.", price: 21.9 },
        { id: "salchipollo", name: "Salchipollo", description: "Papas fritas, presas de pollo y salchicha.", price: 19.9 },
      ],
    },
    {
      id: "bebidas",
      title: "Bebidas",
      items: [
        { id: "chicha", name: "Chicha Morada 1 L", description: "Jarra de chicha morada bien fría.", price: 12.9 },
        { id: "inca-kola", name: "Inca Kola 1.5 L", description: "Botella familiar.", price: 9.9 },
        { id: "limonada", name: "Limonada Frozen", description: "Vaso grande de limonada frozen.", price: 8.9 },
      ],
    },
  ],
  Sushi: [
    {
      id: "promos",
      title: "Promos",
      items: [
        { id: "combo-30", name: "Combo Sushi 30 piezas", description: "Selección de makis, uramakis y nigiris para compartir.", price: 89.9, oldPrice: 119.9 },
        { id: "combo-20", name: "Combo Dúo 20 piezas", description: "20 piezas de makis variados con salsas.", price: 64.9, oldPrice: 79.9 },
        { id: "combo-acevichado", name: "2 Acevichados", description: "2 rolls acevichados de 10 piezas cada uno.", price: 59.9, oldPrice: 72.9 },
      ],
    },
    {
      id: "makis",
      title: "Makis",
      items: [
        { id: "acevichado", name: "Maki Acevichado", description: "Pescado blanco, palta y salsa acevichada. 10 piezas.", price: 32.9 },
        { id: "furai", name: "Maki Furai", description: "Langostino empanizado, queso crema y palta. 10 piezas.", price: 29.9 },
        { id: "california", name: "California Roll", description: "Kanikama, palta y pepino con sésamo. 10 piezas.", price: 27.9 },
        { id: "tempura", name: "Tempura Roll", description: "Roll frito con salmón y queso crema. 10 piezas.", price: 30.9 },
      ],
    },
    {
      id: "entradas",
      title: "Entradas",
      items: [
        { id: "gyozas", name: "Gyozas x6", description: "Empanaditas japonesas de cerdo con salsa ponzu.", price: 18.9 },
        { id: "edamame", name: "Edamame", description: "Vainas de soya al vapor con sal marina.", price: 12.9 },
        { id: "miso", name: "Sopa Miso", description: "Caldo de miso con tofu y cebollita china.", price: 10.9 },
      ],
    },
  ],
  Saludable: [
    {
      id: "bowls",
      title: "Bowls",
      items: [
        { id: "bowl-pollo", name: "Bowl de Pollo Teriyaki", description: "Arroz integral, pollo teriyaki, edamame y zanahoria.", price: 26.9 },
        { id: "bowl-vegano", name: "Bowl Vegano", description: "Quinua, garbanzos, palta, betarraga y hummus.", price: 24.9 },
        { id: "poke-salmon", name: "Poke de Salmón", description: "Arroz de sushi, salmón fresco, palta y sésamo.", price: 32.9 },
        { id: "cesar", name: "Ensalada César", description: "Lechuga romana, pollo grillado, crutones y parmesano.", price: 22.9 },
      ],
    },
    {
      id: "jugos",
      title: "Jugos y smoothies",
      items: [
        { id: "smoothie-verde", name: "Smoothie Verde", description: "Espinaca, piña, manzana verde y jengibre.", price: 14.9, oldPrice: 17.9 },
        { id: "naranja", name: "Jugo de Naranja", description: "Exprimido al momento, 500 ml.", price: 9.9 },
        { id: "limonada-frozen", name: "Limonada Frozen", description: "Con hierbabuena, sin azúcar añadida.", price: 10.9 },
      ],
    },
    {
      id: "snacks",
      title: "Snacks",
      items: [
        { id: "wrap", name: "Wrap Integral", description: "Tortilla integral, pavo, palta y vegetales.", price: 16.9 },
        { id: "parfait", name: "Parfait de Yogur", description: "Yogur griego, granola casera y frutos rojos.", price: 12.9 },
      ],
    },
  ],
};

const FALLBACK_CATEGORY = "Hamburguesas";

export async function getMenu(restaurant: Restaurant): Promise<MenuSection[]> {
  const template = MENU_TEMPLATES[restaurant.category] ?? MENU_TEMPLATES[FALLBACK_CATEGORY];

  // Los ids de producto llevan el id del restaurante para que sean únicos en el carrito
  return template.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item, id: `${restaurant.id}-${item.id}` })),
  }));
}