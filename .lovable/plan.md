
# Remplacer la liste deroulante par un champ texte avec autocompletion

## Modification

**Fichier : `src/pages/admin/AdminPayouts.tsx`**

Remplacer le `Select` du filtre "Commercant" (lignes 82-95) par un composant Popover + Command (cmdk) qui fonctionne comme un champ texte avec autocompletion :

- L'admin tape du texte dans un champ `Input`
- Une liste de suggestions filtrees apparait en dessous (basee sur la liste des restaurants)
- Cliquer sur une suggestion selectionne le restaurant et filtre les paiements
- Un bouton "x" ou vider le champ remet le filtre a "Tous"

### Details techniques

- Utiliser les composants `Popover` + `Command` (deja disponibles dans le projet via `cmdk`) pour creer un combobox avec recherche textuelle
- Ajouter un state `searchQuery` pour le texte saisi
- Le `Popover` s'ouvre quand le champ est focus et qu'il y a du texte
- La liste `CommandItem` affiche les restaurants dont le nom contient le texte saisi
- Selectionner un item met a jour `restaurantFilter` avec l'id du restaurant et affiche le nom dans le champ
- Vider le champ remet `restaurantFilter` a `"all"`
- Imports a ajouter : `Popover`, `PopoverTrigger`, `PopoverContent`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`
- Imports a retirer : `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` (si plus utilises -- ils restent pour le filtre Statut)
