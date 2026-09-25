# 03 — Vue Présence

La vue Présence (« Qui est présent ? ») sert à choisir les Participants avant de lancer une Session.

## Affichage

**PR-01** — La vue est reconstruite à partir de l'Équipe à chaque ouverture. Elle affiche donc toujours les derniers ajouts, suppressions, Icônes, imports et Absents.

**PR-02** — Chaque Membre a une ligne, dans l'ordre de l'Équipe. Une ligne contient une case à cocher avec le nom du Membre, et son Icône (emoji ou image) si elle existe.

**PR-03** — Une Icône image s'affiche en conservant ses proportions, dans un carré de 20 px `[INDICATIF]`.

**PR-04** — Quand la vue s'ouvre, les Membres marqués Absents sont décochés. Tous les autres Membres sont cochés, y compris ceux qui n'ont jamais participé à une Session, ceux qui viennent d'être ajoutés et ceux qui viennent d'être importés sans marque d'Absent (FI-06).

**PR-05** — Un compteur affiche le nombre de cases cochées sur le nombre de Membres, par exemple `15/18 présent(s)` `[INDICATIF]`. Il se met à jour à chaque changement.

## Actions

**PR-06** — Le bouton `Tout cocher` coche toutes les cases. Le bouton `Tout décocher` les décoche toutes.

**PR-07** — Le bouton `<<< Retour` `[INDICATIF]` ramène à la vue Équipe, sans rien enregistrer.

**PR-08** — Le bouton `Démarrer le Daily >>>` `[INDICATIF]` lance une Session. Les Membres cochés deviennent ses Participants, dans l'ordre de l'Équipe. Si aucune case n'est cochée, le bouton n'a aucun effet et aucun message ne s'affiche. Le lancement ne change aucun onglet, mais demande l'accès aux sites des Tableaux Jira des Participants, s'il n'est pas encore accordé (LI-16).

**PR-09** — Au lancement d'une Session (PR-08 réussi), l'extension enregistre les Absents :
- chaque Membre décoché est marqué Absent ;
- chaque Membre coché perd sa marque d'Absent ;
- l'Équipe est sauvegardée.

Rien n'est enregistré dans les autres cas : retour à la vue Équipe, fermeture du panneau, clic sur `Démarrer` sans aucune case cochée.

**PR-10** — Si l'Équipe est vide, la vue affiche `Aucun membre dans l'équipe. Retournez en arrière pour en ajouter.` `[INDICATIF]` et le bouton `Démarrer` est désactivé. Ce cas ne peut pas se produire en passant par la vue Équipe (EQ-18), mais la vue doit quand même le gérer.
