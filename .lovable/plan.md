

# Creation d'un nouveau compte administrateur

## Ce qui sera fait

1. **Ajouter une fonctionnalite "Mot de passe oublie"** sur la page de connexion (`/auth`) pour permettre la reinitialisation du mot de passe via email -- utile pour tous les utilisateurs, pas seulement l'admin.

2. **Creer un nouveau compte admin** via une migration SQL :
   - Inserer une nouvelle entree dans la table `user_roles` avec le role `admin` apres que vous aurez cree le compte depuis la page `/auth`.

## Etapes

1. Vous creez un compte depuis la page `/auth` > "S'inscrire" avec l'email et le mot de passe de votre choix (par exemple `admin@savebite.com`).
2. Une fois le compte cree et confirme, je lancerai une migration SQL pour attribuer le role `admin` a ce nouveau compte dans la table `user_roles`.
3. Vous pourrez ensuite vous connecter et acceder au back-office `/admin`.

## Marche a suivre immediate

Avant de pouvoir creer le compte en base, j'ai besoin de savoir :
- **Quel email** souhaitez-vous utiliser pour ce compte admin ?

Une fois que vous aurez cree le compte via la page d'inscription et que vous me donnerez l'email, j'ajouterai le role admin a ce compte.

## Details techniques

- Migration SQL : `INSERT INTO public.user_roles (user_id, role) VALUES ('<user_id>', 'admin');` -- le `user_id` sera recupere depuis la table `profiles` en filtrant par email.
- Optionnel : ajout d'un lien "Mot de passe oublie" sur la page `/auth` utilisant `supabase.auth.resetPasswordForEmail()`.

