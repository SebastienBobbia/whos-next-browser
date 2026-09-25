# 07 — Performance

L'application de bureau a été réécrite pour supprimer les lenteurs de l'application Python d'origine. L'extension garde les mêmes exigences. Les budgets ci-dessous sont des critères d'acceptation. Les règles de conception empêchent de réintroduire les causes de lenteur connues.

## Budgets

Conditions de mesure : poste Windows 10 ou 11 standard, Chrome ou Firefox à jour, Équipe de 20 Membres ayant tous une Icône image et un Lien, Session de 20 Participants.

| ID | Action | Budget |
|---|---|---|
| **PF-01** `[CHANGEMENT]` | Clic sur l'icône de l'extension jusqu'à la vue affichée et utilisable dans le panneau | < 1 s |
| **PF-02** | Clic sur une Tuile jusqu'à l'affichage du panneau mis à jour (le chargement de la page du Lien n'est pas compté) | < 50 ms |
| **PF-03** | Changement de largeur du panneau, ou passage de la fenêtre sur un écran de DPI différent | Aucun gel, nouvelle mise en page < 200 ms |
| **PF-06** `[NOUVEAU]` | Import d'un Fichier d'Équipe de 20 Membres avec images, jusqu'à la vue Équipe à jour | < 1 s `[INDICATIF]` |

PF-01 dans l'application de bureau : lancement de l'exe. PF-04 (calage de la fenêtre) est supprimée avec le calage.

**PF-05** — Les autres actions (ajout, suppression, fin d'un réordonnancement, changement d'Icône ou de Lien, Tirage, ouverture d'une vue, export) réagissent en moins de 100 ms. Le glisser-déposer suit la souris sans à-coups.

## Règles de conception

**PF-10** — Une action ne reconstruit pas toute une liste. Elle met à jour seulement ce qui change : retirer une Tuile, mettre en évidence le Désigné, déplacer une ligne.

**PF-11** — Une image n'est lue et décodée qu'une fois, jamais pendant l'affichage d'une Tuile ou d'une ligne.

**PF-12** — La couleur dominante d'une image est calculée une fois, puis mise en cache.

**PF-13** — La taille des Tuiles découle de la mise en page (par exemple en CSS). Le code n'écoute pas les redimensionnements pour reconstruire l'interface, afin qu'aucune boucle de redimensionnement ne puisse se former.

**PF-14** — Pendant un glisser-déposer, seules la ligne déplacée et l'indicateur d'insertion changent. Aucun élément n'est créé ni détruit à chaque mouvement de la souris.

**PF-15** — Aucune attente fixe dans l'enchaînement des actions. La durée d'affichage de la Célébration (SE-10) n'est pas une attente : c'est un temps d'affichage voulu.

**PF-16** `[NOUVEAU]` — Le clic sur une Tuile met d'abord à jour le panneau, puis demande le chargement du Lien, sans attendre le résultat de cette demande (LI-14).

## Mesure

- PF-02 et PF-06 : un test Playwright, avec l'extension chargée dans Chromium, mesure le temps entre l'action et l'affichage mis à jour. La recette manuelle confirme la mesure dans Firefox.
- PF-01 : en recette manuelle, dans Chrome et dans Firefox.
- PF-03 : en recette manuelle, avec deux écrans de DPI différents (par exemple 100 % et 150 %).
