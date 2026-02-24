

# Correction du zoom iOS + OAuth Google/Apple

## Probleme 1 : L'ecran zoom quand on touche un champ de saisie

Sur iOS, le navigateur zoome automatiquement sur les champs de texte dont la taille de police est inferieure a 16px. Les inputs actuels utilisent `text-sm` (14px), ce qui declenche ce comportement.

### Corrections

**Fichier `index.html`** : Ajouter `maximum-scale=1` dans la balise viewport pour empecher le zoom automatique :

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover" />
```

**Fichier `src/index.css`** : Forcer tous les inputs et selects a avoir une taille de police de 16px minimum pour eviter le zoom iOS :

```css
input, select, textarea {
  font-size: 16px !important;
}
```

---

## Probleme 2 : Google et Apple ne fonctionnent pas ("missing OAuth secret")

Le code actuel detecte Capacitor et appelle directement `supabase.auth.signInWithOAuth(...)`. Cette methode contacte directement le serveur d'authentification, qui n'a pas les secrets OAuth configures (ils sont geres automatiquement par Lovable Cloud).

La solution est simple : **toujours utiliser `lovable.auth.signInWithOAuth()`**, que ce soit sur le web ou dans Capacitor. C'est cette methode qui passe par le proxy Lovable Cloud et gere les secrets automatiquement.

### Modification dans `src/pages/AuthPage.tsx`

Supprimer la detection Capacitor (`isNative`) et le code qui appelle `supabase.auth.signInWithOAuth` directement. Utiliser uniquement `lovable.auth.signInWithOAuth` pour les deux boutons (Google et Apple) :

```typescript
// Bouton Google - AVANT (KO) :
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
if (isNative) {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", ... });
  if (data?.url) window.open(data.url, "_blank");
} else {
  const { error } = await lovable.auth.signInWithOAuth("google", { ... });
}

// Bouton Google - APRES (OK) :
const { error } = await lovable.auth.signInWithOAuth("google", {
  redirect_uri: window.location.origin + "/home",
});
if (error) toast.error("Erreur avec Google : " + error.message);
```

Meme chose pour le bouton Apple.

---

## Resume des modifications

| Fichier | Modification |
|---|---|
| `index.html` | Ajouter `maximum-scale=1.0` a la balise viewport |
| `src/index.css` | Ajouter `font-size: 16px` sur tous les inputs |
| `src/pages/AuthPage.tsx` | Supprimer le code Capacitor natif et toujours utiliser `lovable.auth.signInWithOAuth` |

## Apres ces modifications

Pour voir les changements sur votre iPhone :
1. Exporter vers GitHub et faire `git pull`
2. `npm install`
3. `npx cap sync`
4. `npx cap run ios`
