# Spécification fonctionnelle — Who's Next? (extension de navigateur)

Cette spécification décrit l'extension de navigateur (voir [ADR 0001](../adr/0001-extension-panneau-lateral.md)). Elle reprend la spécification de l'application de bureau Tauri (dépôt [`whos-next`](https://github.com/SebastienBobbia/whos-next), dossier `docs/spec/`) et l'adapte au panneau latéral du navigateur. Le vocabulaire (Membre, Participant, Désigné, Lien, Fichier d'Équipe…) est défini dans [CONTEXT.md](../../CONTEXT.md).

## Règle de base

Toute exigence sans étiquette est imposée. Trois étiquettes signalent les exceptions :

| Étiquette | Sens |
|---|---|
| `[CHANGEMENT]` | Comportement volontairement différent de l'application de bureau. |
| `[NOUVEAU]` | Fonction absente de l'application de bureau. |
| `[INDICATIF]` | Valeur donnée comme repère (couleur, taille, libellé, durée). Le design est libre de la modifier. |

Une exigence reprise de l'application de bureau garde son identifiant (`EQ-05`, `SE-04`…). Les identifiants des exigences supprimées ne sont jamais réutilisés. Les nouvelles exigences utilisent trois préfixes : `LI` pour le Lien, `FI` pour le Fichier d'Équipe, `PA` pour le panneau.

## Fichiers

| Fichier | Contenu |
|---|---|
| [01-equipe.md](01-equipe.md) | Vue Équipe : ajout, suppression et ordre des Membres, saisie du Lien |
| [02-icones.md](02-icones.md) | Choix d'une Icône, import d'image, couleur dominante |
| [03-presence.md](03-presence.md) | Vue Présence : choix des Participants, mémoire des Absents |
| [04-session.md](04-session.md) | Session : Tuiles, chargement du Lien, Tirage, annulation, Célébration |
| [05-panneau.md](05-panneau.md) | Panneau latéral du navigateur |
| [06-persistance.md](06-persistance.md) | Stockage de l'extension, Fichier d'Équipe (import et export) |
| [07-performance.md](07-performance.md) | Budgets de performance et règles de conception |
| [08-distribution.md](08-distribution.md) | Navigateurs, autorisations, paquets, installation, construction |

## Changements par rapport à l'application de bureau

| Sujet | Application de bureau | Extension | Exigences |
|---|---|---|---|
| Affichage | Fenêtre calée au bord droit de l'écran, toujours au premier plan | Panneau latéral du navigateur | PA-01 à PA-06 |
| Clic sur une Tuile | Marque A parlé | Marque A parlé et affiche le Lien du Membre : Filtres rapides appliqués dans l'onglet du Tableau, ou chargement de la page | SE-03, LI-10 à LI-16, [ADR 0004](../adr/0004-filtres-rapides-dans-la-page.md) |
| Lien | — | Adresse web saisie pour chaque Membre | LI-01 à LI-08 |
| Données | `%APPDATA%\WhosNext\team.json` et dossier `icons\` | Stockage de l'extension, propre à chaque navigateur | PE-01, PE-02 |
| Équipe par défaut | Intégrée à l'exe, copiée au premier lancement | Aucune : partage par Fichier d'Équipe | FI-01 à FI-09, [ADR 0002](../adr/0002-equipe-partagee-par-fichier.md) |
| Session interrompue | Perdue à la fermeture de la fenêtre | Conservée jusqu'à sa fin ou la fermeture du navigateur | SE-17 |
| Fin de la Célébration | L'application se ferme | Retour à la vue Équipe | SE-10 |
| Barre d'actions | Calage, Tirage, annulation, fin | Tirage, annulation, fin | SE-11 |
| Livraison | Un exe portable | Un `.zip` pour Chrome, un `.xpi` signé pour Firefox et Zen | DI-03, [ADR 0003](../adr/0003-diffusion-hors-store.md) |

## Périmètre

Hors périmètre :

- publication dans le Chrome Web Store ou dans le catalogue public de Mozilla ([ADR 0003](../adr/0003-diffusion-hors-store.md)) ;
- mise à jour automatique sous Chrome ;
- synchronisation avec l'application de bureau, et lecture de `%APPDATA%\WhosNext\` ;
- import du `team.json` de l'application de bureau ;
- Edge, Safari et les autres navigateurs : non visés, non testés ;
- traduction (interface en français uniquement) ;
- thème clair ;
- renommage d'un Membre ;
- toute nouvelle fonctionnalité non décrite ici. Les idées vont dans la liste ci-dessous.

## Idées pour plus tard

- **Lien d'Équipe** : une adresse commune (par exemple le tableau Jira sans filtre), chargée au lancement ou à la fin d'une Session. Non retenu pour l'instant.
- **Chrome Web Store en non répertorié**, si les mises à jour manuelles sous Chrome deviennent pénibles ([ADR 0003](../adr/0003-diffusion-hors-store.md)).

## Design

Le visuel reprend celui de l'application de bureau (maquettes dans `docs/design/` du dépôt `whos-next`), adapté à la largeur du panneau. Les contraintes fonctionnelles suivantes restent imposées :

- L'interface s'affiche dans le panneau latéral du navigateur.
- Tous les Restants sont visibles sans défilement, et les Tuiles se partagent la hauteur.
- Un affichage compact (Icône seule) prend le relais quand les Tuiles sont trop petites.
- Chaque Tuile est teintée avec la couleur dominante de l'image du Membre.
- Le Désigné se repère au premier coup d'œil.
- Une Célébration s'affiche, puis la vue Équipe revient.
- L'extension utilise uniquement un thème sombre.

## Vérification

- Tests unitaires (vitest) : domaine Session, couleur dominante, lecture et écriture du Fichier d'Équipe, choix de l'onglet qui reçoit le Lien.
- Tests de bout en bout (Playwright) : extension chargée dans Chromium, parcours Équipe, Lien, Présence, Session, import et export. Playwright ne sait pas charger une extension dans Firefox : Firefox et Zen passent par la recette manuelle.
- Recette manuelle : Firefox, Zen, installation, mise à jour, autorisations, panneau ouvert dans deux fenêtres, partage de la fenêtre dans Teams.

Chaque exigence de cette spécification doit être couverte par au moins un test automatique ou une ligne de recette manuelle.
