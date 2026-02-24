

# Correction de la page 404 sur Google/Apple

## Diagnostic

Le `redirect_uri` est toujours configure avec `/home` a la fin (`window.location.origin + "/home"`). La bibliotheque OAuth de Lovable Cloud redirige vers un chemin special (`/~oauth`) sur l'origine du site pour intercepter le callback. En ajoutant `/home`, le proxy ne peut pas intercepter correctement le callback, ce qui provoque une erreur 404 avant meme d'arriver a la page de connexion Google/Apple.

## Correction

### Fichier `src/pages/AuthPage.tsx`

Deux lignes a modifier :

**Ligne 183 (bouton Google)** :
- Avant : `redirect_uri: window.location.origin + "/home"`
- Apres : `redirect_uri: window.location.origin`

**Ligne 201 (bouton Apple)** :
- Avant : `redirect_uri: window.location.origin + "/home"`
- Apres : `redirect_uri: window.location.origin`

La redirection vers `/home` apres connexion est deja geree automatiquement par le `useEffect` existant dans le composant, qui detecte la session utilisateur et redirige vers `/home`.

## Resume

| Fichier | Modification |
|---|---|
| `src/pages/AuthPage.tsx` | Retirer `/home` du `redirect_uri` des boutons Google et Apple |

## Apres ces modifications

Pour voir les changements sur votre iPhone :
1. Exporter vers GitHub et faire `git pull`
2. `npx cap sync`
3. `npx cap run ios`

