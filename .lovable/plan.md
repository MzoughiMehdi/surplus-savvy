

# Corriger le bouton "Configurer paiement" - page blanche

## Probleme

`window.location.href = url` navigue l'iframe de previsualisation vers le domaine Stripe, qui bloque l'affichage en iframe (X-Frame-Options). Resultat : une page blanche dans l'onglet.

## Solution

Ouvrir une fenetre vierge **avant** l'appel asynchrone (au moment du clic utilisateur, donc non bloquee par le navigateur), puis definir son URL apres reception de la reponse API.

## Modification

### `src/pages/Dashboard.tsx` - Fonction `handleSetupConnect` (lignes 98-112)

```typescript
// AVANT :
const handleSetupConnect = async () => {
  if (!restaurantId) return;
  setConnectLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke("create-connect-account", {
      body: { restaurantId },
    });
    if (error) throw error;
    if (data?.url) window.location.href = data.url;
  } catch {
    toast.error("Erreur lors de la configuration");
  } finally {
    setConnectLoading(false);
  }
};

// APRES :
const handleSetupConnect = async () => {
  if (!restaurantId) return;
  setConnectLoading(true);
  // Ouvrir la fenetre au moment du clic (synchrone) pour eviter le blocage popup
  const newWindow = window.open("about:blank", "_blank");
  try {
    const { data, error } = await supabase.functions.invoke("create-connect-account", {
      body: { restaurantId },
    });
    if (error) throw error;
    if (data?.url) {
      if (newWindow) {
        newWindow.location.href = data.url;
      } else {
        // Fallback si la fenetre a ete bloquee malgre tout
        window.location.href = data.url;
      }
    } else {
      newWindow?.close();
    }
  } catch {
    newWindow?.close();
    toast.error("Erreur lors de la configuration");
  } finally {
    setConnectLoading(false);
  }
};
```

## Pourquoi cette approche

- `window.open` appele de maniere **synchrone** dans le gestionnaire de clic n'est pas bloque par les navigateurs
- La fenetre s'ouvre immediatement (page blanche temporaire), puis redirige vers Stripe des que l'URL est recue
- En cas d'erreur, la fenetre est fermee automatiquement
- Fallback vers `window.location.href` si la fenetre est quand meme bloquee

## Fichier modifie

| Fichier | Changement |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Remplacement de `window.location.href` par `window.open` synchrone + redirection differee |
