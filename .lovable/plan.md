
# Correction : Echec de paiement sur les offres de demain

## Cause racine

Le trigger `handle_new_reservation()` (ligne 84-98 de la migration initiale) est execute a chaque insertion dans `reservations`. Il fait :

```sql
SELECT r.owner_id, o.title INTO restaurant_owner, offer_title
FROM restaurants r JOIN offers o ON o.restaurant_id = r.id
WHERE o.id = NEW.offer_id;
```

Pour les offres de demain, `NEW.offer_id` est **NULL** (l'offre n'existe pas encore). Le JOIN ne retourne rien, `restaurant_owner` est NULL, et l'INSERT dans `notifications` echoue avec :

```
null value in column "user_id" of relation "notifications" violates not-null constraint
```

Cela fait echouer toute la transaction, y compris la creation de la reservation.

## Correction

Modifier la fonction `handle_new_reservation()` pour gerer le cas des pre-reservations (offres de demain) ou `offer_id` est NULL et `config_id` est renseigne.

### Migration SQL

```sql
CREATE OR REPLACE FUNCTION public.handle_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  restaurant_owner uuid;
  offer_title text;
  consumer_name text;
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    -- Offre classique : decrementer le stock
    UPDATE public.offers SET items_left = items_left - 1 WHERE id = NEW.offer_id;

    -- Recuperer le proprietaire et le titre via l'offre
    SELECT r.owner_id, o.title INTO restaurant_owner, offer_title
    FROM public.restaurants r
    JOIN public.offers o ON o.restaurant_id = r.id
    WHERE o.id = NEW.offer_id;
  ELSIF NEW.config_id IS NOT NULL THEN
    -- Pre-reservation demain : recuperer le proprietaire via la config
    SELECT r.owner_id, c.title INTO restaurant_owner, offer_title
    FROM public.restaurants r
    JOIN public.surprise_bag_config c ON c.restaurant_id = r.id
    WHERE c.id = NEW.config_id;
  END IF;

  -- Ne creer la notification que si on a un destinataire
  IF restaurant_owner IS NOT NULL THEN
    SELECT full_name INTO consumer_name
    FROM public.profiles WHERE user_id = NEW.user_id;

    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      restaurant_owner,
      '🛒 Nouvelle réservation !',
      COALESCE(consumer_name, 'Un client') || ' a réservé "'
        || COALESCE(offer_title, 'Panier de demain') || '" — Code: ' || NEW.pickup_code,
      'reservation',
      jsonb_build_object(
        'reservation_id', NEW.id,
        'offer_id', COALESCE(NEW.offer_id, NEW.config_id),
        'pickup_code', NEW.pickup_code
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
```

### Ce que ca change

1. Si `offer_id` est present (offre du jour) : comportement identique a avant (decremente stock + notifie)
2. Si `config_id` est present (offre de demain) : recupere le proprietaire via `surprise_bag_config` et notifie
3. Si aucun des deux n'est trouve : pas de notification, mais la reservation est quand meme creee (pas de crash)

### Aucun changement de code frontend

Le probleme est uniquement dans le trigger SQL. Les edge functions et le frontend fonctionnent deja correctement.
