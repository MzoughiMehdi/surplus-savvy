
# Ameliorer la vitesse de la carte et changer le style

## Probleme 1 : Lenteur d'affichage des offres

Le geocodage des adresses se fait **sequentiellement** (une requete Nominatim apres l'autre). Avec 7 offres, cela prend environ 7 secondes. De plus, les marqueurs ne s'affichent qu'une fois **toutes** les adresses geocodees.

### Solution

Dans `src/components/MapView.tsx` :

- **Geocoder en parallele** : remplacer la boucle `for...of` sequentielle par `Promise.all` pour lancer toutes les requetes Nominatim en meme temps (gain de ~5-6 secondes)
- **Afficher les marqueurs progressivement** : au lieu d'attendre la fin de tous les geocodages, mettre a jour l'etat a chaque adresse resolue pour que les marqueurs apparaissent au fur et a mesure
- La combinaison des deux reduira le temps d'attente de ~7s a ~1s

## Probleme 2 : Style de la carte

Le modele actuel est le style par defaut OpenStreetMap (couleurs vives, aspect "wiki"). Il sera remplace par un style plus moderne et epure.

### Solution

Remplacer le tile layer dans `MapView.tsx` et `OfferDetail.tsx` :

- **Avant** : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Apres** : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` (CartoDB Voyager -- gratuit, moderne, sans cle API)

Ce style est plus propre avec des couleurs douces, une meilleure lisibilite et un aspect professionnel.

## Fichiers modifies

- **`src/components/MapView.tsx`** :
  - Geocodage parallele avec `Promise.all`
  - Mise a jour progressive des marqueurs
  - Changement du tile layer vers CartoDB Voyager
- **`src/components/OfferDetail.tsx`** :
  - Changement du tile layer vers CartoDB Voyager (mini-carte de detail)

## Aucune nouvelle dependance
CartoDB Voyager est un service gratuit de tuiles qui ne necessite pas de cle API.
