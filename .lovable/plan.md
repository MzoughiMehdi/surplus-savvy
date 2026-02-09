

# Ajouter la connexion Google et Apple pour les consommateurs

## Reponse a votre question : compatibilite app native

Oui, la connexion Google et Apple continuera de fonctionner si vous passez en app native (App Store / Play Store). Le flux OAuth ouvre une page web pour l'authentification puis redirige vers l'app. Quand vous passerez en mode natif avec Capacitor, il faudra simplement configurer le "deep linking" pour que la redirection revienne vers l'app au lieu du navigateur. Le code cote Lovable restera identique.

## Ce que ca fait

Les utilisateurs pourront se connecter ou s'inscrire en un seul clic via leur compte Google ou Apple, en plus du formulaire email/mot de passe existant. Ces boutons apparaitront uniquement sur les ecrans "connexion" et "inscription consommateur" (pas pour les marchands).

## Modifications techniques

### Etape 1 : Configurer les providers Google et Apple
- Utiliser l'outil de configuration d'authentification sociale pour generer le module necessaire (cree automatiquement `src/integrations/lovable/`)

### Etape 2 : Modifier `src/pages/AuthPage.tsx`
- Importer le module `lovable` depuis `@/integrations/lovable`
- Ajouter deux boutons sociaux avec icones :
  - "Continuer avec Google"
  - "Continuer avec Apple"
- Ces boutons appellent `lovable.auth.signInWithOAuth("google", ...)` et `lovable.auth.signInWithOAuth("apple", ...)`
- Afficher uniquement sur les modes "login" et "signup" (pas "merchant-signup" ni "forgot-password")
- Ajouter un separateur visuel "ou" entre les boutons sociaux et le formulaire email
- Gestion des erreurs avec notification en cas d'echec

### Etape 3 : Verification du profil automatique
- Le trigger existant `handle_new_user` cree deja automatiquement un profil avec le `full_name` des metadonnees, donc les utilisateurs qui se connectent via Google/Apple auront leur profil cree automatiquement
- Le role par defaut sera "consumer" car seul le formulaire classique permet l'inscription marchand

