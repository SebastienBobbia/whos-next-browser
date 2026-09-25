# Recette manuelle

Ces vérifications ne sont pas automatisables de façon fiable. Elles touchent au vrai panneau du navigateur, à Firefox et Zen (Playwright ne sait pas y charger une extension), aux demandes d'autorisation, au vrai Jira et à la distribution. Le reste de la spec est couvert par `npm test` (domaine, stockage, Fichier d'Équipe, choix de l'onglet) et `npm run test:e2e` (parcours des vues dans Chromium).

À passer avant chaque version distribuée aux collègues. Les lignes marquées « Firefox et Zen » se passent dans les deux. `npm run check:coverage` vérifie que chaque exigence de la spec est couverte par un test automatique ou par une ligne de cette fiche.

## Installation et panneau

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-01 | Installer le `.zip` dans Chrome, en mode développeur, « Charger l'extension non empaquetée » | L'extension apparaît sous le nom `Who's Next?`, avec le logo de l'application | DI-01, DI-03, DI-05, DI-14 |
| R-02 | Installer le `.xpi` signé dans Firefox, puis dans Zen, depuis `about:addons` | L'installation demande seulement l'accès aux onglets, et l'extension reste après un redémarrage | DI-01, DI-03, DI-11, DI-15 |
| R-03 | Dans `chrome://extensions`, ouvrir les détails de l'extension | Autorisations : historique de navigation (onglets), stockage, panneau latéral. Aucun accès à un site avant la première demande | DI-11 |
| R-04 | Cliquer sur l'icône de l'extension, puis cliquer de nouveau (Chrome, Firefox et Zen) | Le panneau s'ouvre dans le panneau latéral du navigateur, puis se ferme. La vue Équipe est utilisable en moins d'une seconde | PA-01, PA-02, PF-01 |
| R-05 | Panneau ouvert, changer d'onglet | Le panneau reste ouvert et garde sa vue | PA-03 |
| R-06 | Élargir le panneau à la souris ; dans Firefox, le passer à droite dans les réglages | La largeur et la position choisies sont gardées ; la page web se rétrécit au lieu d'être masquée | PA-04 |
| R-07 | Recharger l'extension, puis la réinstaller depuis un autre dossier (Chrome) | L'identifiant reste `fimkkabgaecgpjhklgefimmefecaoibl` et l'Équipe est toujours là | DI-10, PE-01 |
| R-08 | Désinstaller l'extension, puis la réinstaller | L'Équipe est vide : les données appartenaient au profil du navigateur | PE-01 |
| R-09 | Ouvrir le panneau dans Chrome et dans Firefox sur le même poste | Chaque navigateur a sa propre Équipe | PE-01 |

## Firefox et Zen

Parcours déjà automatisés dans Chromium, à confirmer dans Firefox et Zen.

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-20 | Réordonner l'Équipe par glisser-déposer, puis essayer de glisser depuis un bouton | La ligne se déplace ; depuis un bouton, rien ne bouge | EQ-13, EQ-15 |
| R-21 | Bouton Icône, « Parcourir… », choisir un PNG, puis un SVG sans largeur ni hauteur | Le sélecteur de fichiers s'ouvre depuis la barre latérale ; les deux images s'affichent partout, et la Tuile du SVG est teintée | IC-05, IC-14 |
| R-22 | `Exporter`, puis `Importer` le fichier obtenu | Le téléchargement habituel du navigateur enregistre le fichier ; l'import redonne la même Équipe | FI-02, FI-04 |
| R-23 | Pendant une Session, fermer le panneau, ouvrir un autre panneau latéral, puis rouvrir celui de l'extension | La Session reprend où elle était, Désigné compris | SE-17 |
| R-24 | Ouvrir le panneau dans deux fenêtres, marquer une personne dans l'une | L'autre fenêtre se met à jour ; le Lien se charge dans la fenêtre du clic | SE-18 |

## Jira réel

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-30 | Donner un Lien Jira à un Membre et cliquer sur `Valider` (Chrome, puis Firefox et Zen) | Le navigateur demande « Lire et modifier vos données » pour le site Jira, une seule fois | LI-16, DI-11 |
| R-31 | Importer un Fichier d'Équipe avec des Liens dans un profil neuf, puis `Démarrer le Daily` | La demande d'accès au site Jira apparaît au lancement de la Session | LI-16 |
| R-32 | Refuser l'accès, puis cliquer sur une Tuile | La page Jira se recharge avec le Lien, sans message d'erreur | LI-15, LI-16 |
| R-33 | Accès accordé, onglet du Tableau ouvert : cliquer sur plusieurs Tuiles de suite, dont une sans filtre | Les Filtres rapides changent dans la page, sans rechargement, aussi vite qu'un clic à la main ; le Tableau sans filtre décoche tout | LI-10, LI-11, PF-07 |
| R-34 | Cliquer sur le Membre suivi sur un autre Tableau, puis sur un Membre du premier | Un second onglet s'ouvre, puis l'onglet du premier Tableau revient au premier plan | LI-10 |
| R-35 | Partager toute la fenêtre du navigateur dans Teams pendant une Session | Les participants voient le panneau et la Célébration ; en partageant un seul onglet, ils ne le voient pas | PA-06 |

## Écrans

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-40 | Déplacer la fenêtre du navigateur sur un écran de DPI différent (100 % et 150 %) pendant une Session | Aucun gel, les Tuiles se recalculent en moins de 200 ms | PF-03 |

## Paquets et dépôt

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-50 | Chercher `entreprise.com` et les noms de l'Équipe dans le `.zip` et le `.xpi` décompressés | Aucun résultat : ni données d'Équipe, ni adresse du Jira | DI-04 |
| R-51 | `git check-ignore whos-next-equipe-20260925.json` | Le fichier est ignoré : un Fichier d'Équipe n'entre jamais dans le dépôt | FI-10 |
| R-52 | Sur un poste avec seulement Node : `npm ci`, `npm run build`, `npm run build:firefox` | Les deux dossiers `.output/chrome-mv3` et `.output/firefox-mv3` sont produits, sans Rust ni outils Windows | DI-08 |
| R-53 | Ouvrir une pull request | GitHub Actions passe le typage, les tests unitaires, les tests de bout en bout et `check:coverage` | DI-13 |
| R-54 | Pousser un tag `v*` | La release GitHub contient le `.zip` et le `.xpi` signé, et `updates.json` annonce la nouvelle version | DI-09, DI-15 |
| R-55 | Avec l'ancienne version installée dans Firefox, publier une nouvelle version | Firefox installe la mise à jour tout seul et garde l'Équipe | DI-15 |

## Relecture du code

À vérifier en lisant le code, à chaque changement qui touche ces points.

| # | Vérification | Attendu | Spec |
|---|---|---|---|
| R-60 | Mises à jour de l'affichage | Aucune action ne reconstruit toute une liste : les `{#each}` sont indexés par nom | PF-10 |
| R-61 | Lecture des images | Une image est lue et décodée une fois, par `loadIcon`, avec cache | PF-11, PF-12 |
| R-62 | Taille des Tuiles | Elle vient du CSS ; le code ne mesure la hauteur que pour l'affichage compact | PF-13 |
| R-63 | Glisser-déposer | Seules la ligne déplacée et l'indicateur changent pendant le mouvement | PF-14 |
| R-64 | Enchaînement des actions | Aucune attente fixe, hormis la durée voulue de la Célébration | PF-15 |
| R-65 | Script injecté | Le seul script injecté est `setQuickFilters`, sur l'onglet d'un Tableau Jira ; il ne lit que les boutons de Filtre rapide | DI-12 |
| R-66 | Stockage | L'enregistrement de l'Équipe porte un numéro de version | PE-02 |
