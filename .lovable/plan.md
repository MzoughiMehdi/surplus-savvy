

# Corriger "navigation was blocked" sur le bouton "Voir mon compte"

## Probleme

L'appel `window.open("about:blank", "_blank")` est bloque par le sandbox de l'iframe de previsualisation Lovable. L'edge function fonctionne correctement et retourne bien l'URL (`https://connect.stripe.com/express/...`).

## Solution

Remplacer l'approche `window.open` pre-ouverture par une approche en deux temps :
1. Appeler l'edge function pour obtenir l'URL
2. Creer un element `<a>` temporaire avec `target="_blank"` et le cliquer programmatiquement

Cette methode est generalement mieux supportee dans les contextes iframe sandboxes.

Si meme cette approche est bloquee (sandbox strict), on ajoutera un fallback qui affiche l'URL dans un toast cliquable.

## Modification

### `src/pages/Dashboard.tsx` - Fonction `handleOpenStripeDashboard`

```typescript
// AVANT :
const newWindow = window.open("about:blank", "_blank");
// ... puis newWindow.location.href = data.url

// APRES :
const { data, error } = await supabase.functions.invoke("create-connect-login-link", {
  body: { restaurantId },
});
if (error) throw error;
if (data?.url) {
  const link = document.createElement("a");
  link.href = data.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

## Fichier modifie

| Fichier | Changement |
|---|---|
| `src/pages/Dashboard.tsx` | Remplacer `window.open` par un clic programmatique sur un lien `<a>` |

