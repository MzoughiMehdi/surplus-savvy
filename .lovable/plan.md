
# Mode Maintenance - Mettre l'application en indisponible

## Ce que ca fait
- L'admin peut activer/desactiver un "mode maintenance" depuis la page Admin > Parametres
- Quand le mode maintenance est actif, **tous les utilisateurs** (consommateurs et commercants) voient une page d'indisponibilite au lieu de l'application
- L'admin peut ecrire un message personnalise (ex: "Maintenance en cours, retour prevu a 14h")
- Un petit bouton discret "Admin" en bas de la page de maintenance permet a l'admin de se connecter et d'acceder au back-office pour desactiver la maintenance

## Comment ca marche

```text
Utilisateur arrive
       |
       v
  Mode maintenance actif ?
       |
  OUI  |   NON
   v       v
Page maintenance    Application normale
(message custom)
   |
   v
Bouton discret "Admin"
   |
   v
Connexion admin -> /admin/settings
   -> Desactiver maintenance
```

## Modifications techniques

### 1. Base de donnees : ajouter les colonnes dans `platform_settings`
Ajouter deux colonnes a la table `platform_settings` :
- `maintenance_mode` (boolean, defaut `false`) : active/desactive la maintenance
- `maintenance_message` (text, nullable) : message personnalise affiche aux utilisateurs

La politique RLS existante permet deja la lecture par tous les utilisateurs authentifies et la modification par les admins. On ajoute une politique SELECT pour les utilisateurs anonymes (non connectes) afin qu'ils puissent aussi voir le statut de maintenance.

### 2. Nouveau hook : `src/hooks/useMaintenanceMode.ts`
- Charge `maintenance_mode` et `maintenance_message` depuis `platform_settings`
- Expose `isMaintenanceMode` et `maintenanceMessage`
- Utilise `useQuery` avec un `staleTime` court pour garder l'etat a jour

### 3. Nouvelle page : `src/pages/MaintenancePage.tsx`
- Page plein ecran avec un design simple et clair
- Affiche une icone de maintenance, le message personnalise de l'admin (ou un message par defaut)
- En bas de page, un petit texte discret gris clair "Administration" qui est en fait un lien vers `/auth?redirect=admin`
- Pas de navigation, pas de barre de menu

### 4. Modifier `src/App.tsx`
- Utiliser le hook `useMaintenanceMode` au niveau du routeur
- Si `isMaintenanceMode` est `true` :
  - Afficher `MaintenancePage` sur **toutes les routes** sauf `/admin/*` et `/auth`
  - Les routes admin restent accessibles pour que l'admin puisse desactiver la maintenance
- Si `false` : fonctionnement normal

### 5. Modifier `src/pages/admin/AdminSettings.tsx`
- Ajouter une section "Mode maintenance" en haut de la page avec :
  - Un `Switch` pour activer/desactiver le mode
  - Un champ `Textarea` pour saisir le message de maintenance
  - Un bouton "Sauvegarder" quand le message est modifie
- Indicateur visuel clair (badge rouge) quand le mode est actif

### 6. Modifier `src/pages/AuthPage.tsx`
- Apres connexion, si l'utilisateur est admin et vient de la page maintenance (param `redirect=admin`), rediriger vers `/admin/settings` au lieu de `/`
