# 03 — Vue Présence

La vue Présence (« Qui est présent ? ») sert à choisir les Participants avant de lancer une Session.

## Affichage

**PR-01** — La vue est reconstruite à partir de l'Équipe à chaque ouverture. Elle affiche donc toujours les derniers ajouts, suppressions, Icônes, imports et Absents, en excluant les Membres Désactivés (EQ-20).

**PR-02** — Chaque Membre actif (non Désactivé) a une ligne, dans l'ordre de l'Équipe. Une ligne contient une case à cocher avec le nom du Membre, et son Icône (emoji ou image) si elle existe.

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

## Synchronisation avec le Planning

**PR-11** `[NOUVEAU]` — À chaque ouverture de la vue Présence, si l'adresse du Planning est configurée et que l'accès à son hôte est autorisé, l'extension interroge en tâche de fond le Planning (`WebplanningRD`) pour la journée courante sur le créneau du daily (**09h15–10h00**), sans bloquer l'affichage initial issu de l'Équipe (PR-04). Voir [ADR 0005](../adr/0005-source-planning-webplanning-rd.md).

**PR-12** `[NOUVEAU]` — L'extension tente d'abord de lire `Sched/Scheduler.aspx` avec la session déjà ouverte du navigateur (`credentials: "include"`). Si la session n'est pas authentifiée et que des identifiants sont enregistrés dans `storage.local` (PE-14), l'extension s'authentifie automatiquement sur `Identification.aspx`. Une fenêtre modale dans la vue Présence (`Adresse du planning`, `Identifiant`, `Mot de passe`, `Enregistrer`) permet de configurer ou modifier ces informations et demande l'autorisation d'accès à l'hôte du Planning (`optional_host_permissions`). Un bouton permet également de rafraîchir le Planning à tout moment.

**PR-13** `[NOUVEAU]` — La correspondance entre un Membre de l'Équipe et une ressource du Planning (`v.resources`) est établie en comparant les noms normalisés (sans casse, sans accents, sans points, espaces superflus retirés).

**PR-14** `[NOUVEAU]` — Pour chaque Membre trouvé dans les ressources du Planning :
- On recherche dans `v.events.list` les événements de cette ressource qui chevauchent le créneau **09h15–10h00** du jour (`start < AAAA-MM-JJT10:00:00` et `end > AAAA-MM-JJT09:15:00`), en ignorant la catégorie `[Activité autre]` (`x_id_type_rdv == "18"`).
- Si au moins un événement d'indisponibilité chevauche le créneau : le Membre est **décoché** et son **Statut Planning** (le nom de la catégorie sans les crochets, ex. `Absence`, `Absence prév.`, `Réunion Interne R&D`) s'affiche à côté de son prénom. Si plusieurs événements chevauchent le créneau, les absences journée/demi-journée (`[Absence]`, `[Absence prév.]`, `[Férié - Pas travaillé]`) sont prioritaires sur les autres événements.
- Si aucun événement d'indisponibilité ne chevauche le créneau : le Membre est **coché** (même s'il était marqué `absent: true` lors de la Session précédente).

**PR-15** `[NOUVEAU]` — Pour chaque Membre de l'Équipe qui **n'apparaît pas** dans les ressources renvoyées par le Planning (ou lorsque le Planning est injoignable / non configuré), l'état coché/décoché initial issu de l'Équipe (PR-04) est conservé.

**PR-16** `[NOUVEAU]` — Le **Statut Planning** affiché à côté du prénom reste visible à titre informatif sur la ligne du Membre même si l'utilisateur coche ou décoche manuellement la case, ou utilise `Tout cocher` / `Tout décocher`.

