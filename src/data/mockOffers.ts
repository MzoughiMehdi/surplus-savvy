export interface Offer {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  category: string;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  pickupStart: string;
  pickupEnd: string;
  distance: string;
  rating: number;
  reviewCount: number;
  itemsLeft: number;
  image: string;
}

export const categories = [
  { id: "all", label: "Tout", icon: "🍽️" },
  { id: "meals", label: "Repas", icon: "🥘" },
  { id: "bakery", label: "Boulangerie", icon: "🥐" },
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "grocery", label: "Épicerie", icon: "🥬" },
  { id: "dessert", label: "Desserts", icon: "🍰" },
];

export const mockOffers: Offer[] = [
  {
    id: "1",
    restaurantName: "Le Petit Bistro",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop",
    category: "meals",
    title: "Panier Surprise – Sélection du Chef",
    description: "Un mélange des meilleurs plats du jour : entrées, plats et accompagnements. Parfait pour 2 personnes.",
    originalPrice: 25.00,
    discountedPrice: 8.99,
    pickupStart: "18:00",
    pickupEnd: "20:00",
    distance: "0,3 km",
    rating: 4.7,
    reviewCount: 234,
    itemsLeft: 3,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    restaurantName: "Boulangerie Dorée",
    restaurantImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop",
    category: "bakery",
    title: "Boîte de Viennoiseries Assorties",
    description: "Croissants, pains au chocolat et autres gourmandises fraîchement préparées aujourd'hui.",
    originalPrice: 15.00,
    discountedPrice: 4.99,
    pickupStart: "17:00",
    pickupEnd: "19:00",
    distance: "0,8 km",
    rating: 4.9,
    reviewCount: 512,
    itemsLeft: 5,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    restaurantName: "Sakura Sushi",
    restaurantImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop",
    category: "sushi",
    title: "Plateau Sushi – 12 Pièces",
    description: "Assortiment de nigiri et maki préparés frais aujourd'hui. Sélection surprise du chef.",
    originalPrice: 22.00,
    discountedPrice: 7.99,
    pickupStart: "20:00",
    pickupEnd: "21:30",
    distance: "1,2 km",
    rating: 4.5,
    reviewCount: 178,
    itemsLeft: 2,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    restaurantName: "Marché Vert",
    restaurantImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop",
    category: "grocery",
    title: "Panier de Légumes Frais",
    description: "Légumes bio de saison à consommer aujourd'hui. Suffisant pour plusieurs repas.",
    originalPrice: 18.00,
    discountedPrice: 5.99,
    pickupStart: "16:00",
    pickupEnd: "18:30",
    distance: "0,5 km",
    rating: 4.6,
    reviewCount: 89,
    itemsLeft: 7,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop",
  },
  {
    id: "5",
    restaurantName: "Dolce Vita",
    restaurantImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop",
    category: "dessert",
    title: "Surprise Sucrée – Desserts Italiens",
    description: "Tiramisu, panna cotta et autres douceurs italiennes du menu du jour.",
    originalPrice: 20.00,
    discountedPrice: 6.99,
    pickupStart: "19:00",
    pickupEnd: "21:00",
    distance: "1,5 km",
    rating: 4.8,
    reviewCount: 321,
    itemsLeft: 4,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
  },
  {
    id: "6",
    restaurantName: "Trattoria Roma",
    restaurantImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&h=100&fit=crop",
    category: "meals",
    title: "Box Pâtes & Pizza",
    description: "Pâtes fraîches et parts de pizza. Idéal pour un dîner en famille.",
    originalPrice: 30.00,
    discountedPrice: 9.99,
    pickupStart: "19:30",
    pickupEnd: "21:00",
    distance: "2,0 km",
    rating: 4.4,
    reviewCount: 156,
    itemsLeft: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  },
];
