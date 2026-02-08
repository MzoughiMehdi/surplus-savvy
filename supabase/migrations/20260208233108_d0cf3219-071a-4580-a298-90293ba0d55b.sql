
-- ============================================
-- INSERT 6 RESTAURANTS
-- ============================================

INSERT INTO public.restaurants (id, owner_id, name, address, postal_code, city, category, description, image_url, status, phone) VALUES
('a1000001-0000-0000-0000-000000000001', '13ccade6-e39c-4a18-abd6-398333328e4b', 'Le Fournil de Montmartre', '52 Rue Lepic', '75018', 'Paris', 'boulangerie', 'Boulangerie artisanale au cœur de Montmartre. Pains au levain, viennoiseries maison et pâtisseries du jour.', 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800', 'approved', '01 42 58 12 34'),
('a1000002-0000-0000-0000-000000000002', '24bbb88b-bfd9-4d7c-8e97-2f265172d591', 'Sakura Sushi', '15 Rue Sainte-Anne', '75001', 'Paris', 'sushi', 'Restaurant japonais authentique. Sushis frais préparés chaque jour par notre chef Yuki.', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', 'approved', '01 42 97 56 78'),
('a1000003-0000-0000-0000-000000000003', '4d78a67b-b63e-4f00-8304-64c25c599aec', 'L''Épicerie Verte', '28 Rue des Martyrs', '75009', 'Paris', 'epicerie', 'Épicerie bio et locale. Fruits, légumes de saison et produits artisanaux du terroir.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', 'approved', '01 48 78 23 45'),
('a1000004-0000-0000-0000-000000000004', 'afe08883-55b9-4cec-900e-1972df5e9643', 'Café des Arts', '8 Place du Tertre', '75018', 'Paris', 'cafe', 'Café-pâtisserie avec terrasse. Brunchs le week-end, pâtisseries maison et cafés de spécialité.', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800', 'approved', '01 46 06 89 12'),
('a1000005-0000-0000-0000-000000000005', '43a9bcc3-5d16-41cf-bc42-ac2fb9995cbf', 'Le Bistrot du Marché', '42 Rue de Bretagne', '75003', 'Paris', 'bistrot', 'Cuisine française de marché. Plats du jour avec des produits frais achetés chaque matin.', 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800', 'approved', '01 42 72 34 56'),
('a1000006-0000-0000-0000-000000000006', '8a6c7d7a-dad6-4f05-b2a3-e3eb7ad0f7db', 'Chez Nadia - Traiteur Oriental', '67 Rue du Faubourg Saint-Denis', '75010', 'Paris', 'autre', 'Traiteur oriental fait maison. Mezze, tajines, couscous et pâtisseries orientales.', 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800', 'approved', '01 48 24 67 89');

-- ============================================
-- INSERT 12 OFFERS (2 per restaurant)
-- ============================================

INSERT INTO public.offers (restaurant_id, title, description, original_price, discounted_price, quantity, items_left, pickup_start, pickup_end, date, category, image_url, is_active) VALUES
-- Le Fournil de Montmartre
('a1000001-0000-0000-0000-000000000001', 'Panier Viennoiseries', '3 croissants, 2 pains au chocolat et 1 brioche du jour', 12.00, 4.99, 5, 5, '18:00', '19:30', CURRENT_DATE, 'bakery', 'https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800', true),
('a1000001-0000-0000-0000-000000000001', 'Panier Pains Artisanaux', '2 baguettes tradition, 1 pain de campagne et 1 pain aux noix', 14.00, 5.49, 4, 4, '18:30', '20:00', CURRENT_DATE, 'bakery', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800', true),

-- Sakura Sushi
('a1000002-0000-0000-0000-000000000002', 'Plateau Sushi du Soir', '12 pièces variées : nigiri saumon, thon, crevette et maki californien', 18.00, 6.99, 6, 6, '20:00', '21:30', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800', true),
('a1000002-0000-0000-0000-000000000002', 'Bento Surprise', 'Bento complet : riz, protéine du jour, légumes sautés et soupe miso', 15.00, 5.99, 4, 4, '19:30', '21:00', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800', true),

-- L'Épicerie Verte
('a1000003-0000-0000-0000-000000000003', 'Panier Fruits & Légumes', 'Assortiment de 3kg de fruits et légumes de saison', 15.00, 5.99, 8, 8, '17:00', '19:00', CURRENT_DATE, 'groceries', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800', true),
('a1000003-0000-0000-0000-000000000003', 'Panier Bio Surprise', 'Sélection de produits bio : fromage, yaourts, jus et granola', 20.00, 7.99, 5, 5, '17:30', '19:30', CURRENT_DATE, 'groceries', 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800', true),

-- Café des Arts
('a1000004-0000-0000-0000-000000000004', 'Panier Pâtisseries', '4 pâtisseries du jour : éclair, tarte, mille-feuille et macaron', 16.00, 5.99, 5, 5, '17:00', '18:30', CURRENT_DATE, 'bakery', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800', true),
('a1000004-0000-0000-0000-000000000004', 'Brunch Box', 'Box brunch complète : scone, granola, jus frais et salade de fruits', 18.00, 6.99, 3, 3, '14:00', '16:00', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800', true),

-- Le Bistrot du Marché
('a1000005-0000-0000-0000-000000000005', 'Panier du Marché', 'Entrée + plat du jour à base de produits frais du marché', 16.00, 5.99, 6, 6, '14:00', '15:30', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800', true),
('a1000005-0000-0000-0000-000000000005', 'Plat du Jour Surprise', 'Plat du jour complet avec accompagnement et dessert', 14.00, 4.99, 4, 4, '14:30', '16:00', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800', true),

-- Chez Nadia
('a1000006-0000-0000-0000-000000000006', 'Mezze Surprise', 'Assortiment de mezze : houmous, taboulé, falafel, caviar d''aubergine', 15.00, 5.99, 5, 5, '18:00', '20:00', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800', true),
('a1000006-0000-0000-0000-000000000006', 'Panier Oriental', 'Tajine du jour + semoule + pâtisseries orientales (baklava, cornes de gazelle)', 18.00, 6.99, 4, 4, '18:30', '20:30', CURRENT_DATE, 'meals', 'https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1?w=800', true);

-- ============================================
-- INSERT 6 SURPRISE BAG CONFIGS
-- ============================================

INSERT INTO public.surprise_bag_config (restaurant_id, base_price, daily_quantity, pickup_start, pickup_end, is_active) VALUES
('a1000001-0000-0000-0000-000000000001', 12.00, 5, '18:00', '19:30', true),
('a1000002-0000-0000-0000-000000000002', 18.00, 6, '20:00', '21:30', true),
('a1000003-0000-0000-0000-000000000003', 15.00, 8, '17:00', '19:00', true),
('a1000004-0000-0000-0000-000000000004', 16.00, 5, '17:00', '18:30', true),
('a1000005-0000-0000-0000-000000000005', 16.00, 6, '14:00', '15:30', true),
('a1000006-0000-0000-0000-000000000006', 15.00, 5, '18:00', '20:00', true);
