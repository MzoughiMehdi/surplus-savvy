

# Corrections pour que l'app fonctionne sur iOS/Android (Capacitor)

## Probleme 1 : OAuth Google / Apple ne fonctionne pas dans Capacitor

Le WebView de Capacitor bloque les redirections OAuth classiques. Quand vous appuyez sur "Continuer avec Google" ou "Continuer avec Apple", le WebView intercepte la navigation et l'annule silencieusement.

### Solution

Detecter si l'app tourne dans Capacitor (via `window.Capacitor`) et utiliser `supabase.auth.signInWithOAuth` avec `skipBrowserRedirect: true` pour obtenir l'URL OAuth, puis ouvrir cette URL dans une fenetre externe via `window.open`. Quand l'utilisateur revient dans l'app, la session sera automatiquement detectee par le listener `onAuthStateChange` deja present dans `useAuth`.

### Modification : `src/pages/AuthPage.tsx`

- Ajouter une fonction helper `handleOAuthNative(provider)` qui :
  1. Detecte Capacitor : `const isNative = !!(window as any).Capacitor?.isNativePlatform?.()`
  2. Si natif : appelle `supabase.auth.signInWithOAuth({ provider, options: { skipBrowserRedirect: true, redirectTo: window.location.origin + '/home' } })` pour obtenir l'URL, puis ouvre avec `window.open(url, '_blank')`
  3. Si web : continue d'utiliser `lovable.auth.signInWithOAuth()` comme actuellement
- Remplacer les `onClick` des boutons Google et Apple pour utiliser cette nouvelle fonction

```text
Flux actuel (KO dans Capacitor) :
  Bouton -> lovable.auth.signInWithOAuth -> redirection dans WebView -> BLOQUE

Nouveau flux :
  Bouton -> detecter Capacitor ?
    OUI -> supabase.auth.signInWithOAuth(skipBrowserRedirect) -> window.open(url) -> retour auto
    NON -> lovable.auth.signInWithOAuth (inchange, web classique)
```

---

## Probleme 2 : Pages pas adaptees a la taille de l'ecran

Les corrections `viewport-fit=cover` et safe areas sont deja en place. Mais certains composants peuvent forcer un debordement horizontal invisible.

### Modification : `src/index.css`

Ajouter `overflow-x: hidden` et `width: 100%` sur `html` et `body` pour empecher tout scroll horizontal parasite :

```css
html {
  overflow-x: hidden;
  width: 100%;
}

body {
  /* styles existants conserves */
  overflow-x: hidden;
  width: 100%;
}
```

---

## Resume des modifications

| Fichier | Modification |
|---|---|
| `src/pages/AuthPage.tsx` | Detecter Capacitor et ouvrir OAuth via `window.open` au lieu d'une redirection WebView |
| `src/index.css` | Ajouter `overflow-x: hidden` et `width: 100%` sur html/body |

## Apres ces modifications

Pour voir les changements sur votre iPhone :
1. Exporter vers GitHub et faire `git pull`
2. `npm install`
3. `npx cap sync`
4. `npx cap run ios`

