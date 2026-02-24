

# Correction de l'affichage trop large sur mobile (Capacitor iOS/Android)

## Problemes identifies

1. **`index.html`** : La balise viewport ne contient pas `viewport-fit=cover`, indispensable pour que le WebView Capacitor utilise tout l'ecran sur iOS et Android.

2. **`src/App.css`** : Le fichier contient des styles par defaut de Vite qui posent probleme :
   - `#root { max-width: 1280px; padding: 2rem; }` ajoute un padding de 2rem sur tous les cotes et limite la largeur, ce qui cree un debordement horizontal sur petit ecran.
   - Ce fichier est un vestige du template Vite initial et n'est plus utile.

3. **`src/index.css`** : Aucun style pour gerer les "safe areas" iOS (encoche, barre d'accueil) et les marges de securite Android.

## Corrections prevues

### 1. Fichier `index.html`

Ajouter `viewport-fit=cover` a la balise viewport :

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### 2. Fichier `src/App.css`

Supprimer le contenu inutile (styles par defaut Vite) et ne garder qu'un reset propre :

```css
#root {
  min-height: 100dvh;
  width: 100%;
}
```

Cela supprime le `max-width: 1280px` et le `padding: 2rem` qui causent le debordement.

### 3. Fichier `src/index.css`

Ajouter les styles de safe areas sur le body pour gerer l'encoche et la barre d'accueil sur iOS, et les marges systeme sur Android :

```css
body {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

### 4. Fichier `src/components/BottomNav.tsx`

Ce composant gere deja `env(safe-area-inset-bottom)` dans son padding. Aucun changement necessaire.

## Resume

| Fichier | Modification |
|---|---|
| `index.html` | Ajouter `viewport-fit=cover` a la balise viewport |
| `src/App.css` | Supprimer les styles Vite par defaut, remplacer par un reset minimal |
| `src/index.css` | Ajouter padding safe-area sur le body |

Ces 3 modifications garantissent que l'app s'adapte a tous les ecrans mobiles, que ce soit sur iPhone ou Android, avec ou sans encoche.
