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
  { id: "all", label: "All", icon: "🍽️" },
  { id: "meals", label: "Meals", icon: "🥘" },
  { id: "bakery", label: "Bakery", icon: "🥐" },
  { id: "sushi", label: "Sushi", icon: "🍣" },
  { id: "grocery", label: "Grocery", icon: "🥬" },
  { id: "dessert", label: "Desserts", icon: "🍰" },
];

export const mockOffers: Offer[] = [
  {
    id: "1",
    restaurantName: "Le Petit Bistro",
    restaurantImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop",
    category: "meals",
    title: "Surprise Bag – Chef's Selection",
    description: "A mix of today's best dishes including appetizers, mains, and sides. Perfect for 2 people.",
    originalPrice: 25.00,
    discountedPrice: 8.99,
    pickupStart: "18:00",
    pickupEnd: "20:00",
    distance: "0.3 km",
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
    title: "Pastry Box – Assorted Viennoiseries",
    description: "Croissants, pains au chocolat, and other freshly baked treats from today.",
    originalPrice: 15.00,
    discountedPrice: 4.99,
    pickupStart: "17:00",
    pickupEnd: "19:00",
    distance: "0.8 km",
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
    title: "Sushi Platter – 12 Pieces",
    description: "Assorted nigiri and maki rolls prepared fresh today. Chef's surprise selection.",
    originalPrice: 22.00,
    discountedPrice: 7.99,
    pickupStart: "20:00",
    pickupEnd: "21:30",
    distance: "1.2 km",
    rating: 4.5,
    reviewCount: 178,
    itemsLeft: 2,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop",
  },
  {
    id: "4",
    restaurantName: "Green Market",
    restaurantImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop",
    category: "grocery",
    title: "Fresh Veggie Box",
    description: "Seasonal organic vegetables that need to go today. Enough for several meals.",
    originalPrice: 18.00,
    discountedPrice: 5.99,
    pickupStart: "16:00",
    pickupEnd: "18:30",
    distance: "0.5 km",
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
    title: "Dessert Surprise – Sweet Treats",
    description: "Tiramisu, panna cotta, and other Italian desserts from today's menu.",
    originalPrice: 20.00,
    discountedPrice: 6.99,
    pickupStart: "19:00",
    pickupEnd: "21:00",
    distance: "1.5 km",
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
    title: "Pasta & Pizza Box",
    description: "Freshly made pasta and pizza slices. Great for a family dinner.",
    originalPrice: 30.00,
    discountedPrice: 9.99,
    pickupStart: "19:30",
    pickupEnd: "21:00",
    distance: "2.0 km",
    rating: 4.4,
    reviewCount: 156,
    itemsLeft: 1,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
  },
];
