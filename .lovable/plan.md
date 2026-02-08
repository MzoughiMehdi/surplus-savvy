
# Corriger les statuts de reservation cote consommateur

## Probleme identifie

Le statut initial d'une reservation est `confirmed` (defaut de la base de donnees), mais cote consommateur, ce statut est affiche comme "Confirmee" avec une icone de validation verte et un message invitant a presenter le QR code. Le consommateur pense donc que sa commande est validee alors que le commercant ne l'a pas encore acceptee.

Cote commercant, le meme statut `confirmed` est correctement affiche comme "En attente" avec des boutons Accepter/Refuser.

## Solution

Mettre a jour les deux fichiers cote consommateur pour refleter correctement le workflow a 4 etats :

| Statut DB | Cote commercant | Cote consommateur (actuel) | Cote consommateur (corrige) |
|---|---|---|---|
| `confirmed` | En attente | "Confirmee" (FAUX) | "En attente de validation" |
| `accepted` | Acceptee | (non gere) | "Acceptee -- Presentez votre QR code" |
| `completed` | Retire | Retiree | Retiree (inchange) |
| `cancelled` | Annule | Annulee | Annulee (inchange) |

## Fichiers modifies

### 1. `src/pages/OrdersPage.tsx`

- Ajouter le statut `accepted` dans le `statusConfig`
- Changer le label de `confirmed` de "Confirmee" a "En attente"
- Utiliser un badge jaune/outline pour `confirmed` au lieu du badge par defaut (bleu/teal)

### 2. `src/components/ReservationConfirmation.tsx`

- Ajouter le statut `accepted` dans le `statusConfig` (avec icone CheckCircle verte et texte "Acceptee")
- Changer `confirmed` : icone Clock (horloge), couleur jaune/warning, label "En attente de validation"
- Le QR code ne s'affiche que pour le statut `accepted` (et non plus `confirmed`)
- Le message pour `confirmed` devient "Le commercant doit valider votre reservation"
- Le message pour `accepted` devient "Presentez ce QR code au restaurant pour retirer votre commande"

## Detail technique

### OrdersPage.tsx -- statusConfig

```typescript
const statusConfig = {
  confirmed: { label: "En attente", variant: "outline" },
  accepted: { label: "Acceptee", variant: "default" },
  completed: { label: "Retiree", variant: "secondary" },
  cancelled: { label: "Annulee", variant: "destructive" },
};
```

### ReservationConfirmation.tsx -- statusConfig

```typescript
const statusConfig = {
  confirmed: { label: "En attente", color: "text-amber-600", bg: "bg-amber-100", icon: Clock },
  accepted: { label: "Acceptee", color: "text-primary", bg: "bg-primary/10", icon: CheckCircle },
  completed: { label: "Retiree", color: "text-muted-foreground", bg: "bg-muted", icon: Package },
  cancelled: { label: "Annulee", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
};
```

- QR code affiche uniquement si `status === "accepted"`
- Titre pour `confirmed` : "Reservation en attente"
- Titre pour `accepted` : "Reservation acceptee !"
- Sous-titre pour `confirmed` : "Le commercant doit encore valider votre reservation"
- Sous-titre pour `accepted` : "Presentez ce QR code au restaurant pour retirer votre commande"
