
# Plan de corrections

## ✅ Corriger les statuts de reservation cote consommateur (FAIT)

## ✅ Synchroniser les creneaux lors de la modification de la config (FAIT)

Quand un commercant modifie les creneaux/prix/quantite dans `SurpriseBagConfig`, l'offre du jour est maintenant automatiquement mise a jour via `syncTodayOffer()` dans `useSurpriseBagConfig.ts`.

## ✅ Corriger la geolocalisation sur la carte (FAIT)

- Ajout des champs `postal_code` et `city` dans la table `restaurants`
- Le formulaire d'inscription commercant demande maintenant le code postal et la ville (champs obligatoires)
- Verification de la geolocalisation via Nominatim avant de passer a l'etape suivante
- Fallback automatique dans `MapView.tsx` : si l'adresse echoue, on retente avec ", France"
- L'adresse stockee est maintenant au format complet : "rue, code_postal ville"
