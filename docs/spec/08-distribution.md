# 08 — Navigateurs et distribution

## Navigateurs

**DI-01** `[CHANGEMENT]` — L'extension fonctionne dans Chrome, Firefox et Zen, dans leurs versions à jour, sur les postes Windows 10 et 11 de l'équipe. Les versions minimales sont fixées dans le manifeste, selon les API utilisées.
Application de bureau : Windows 10 et 11 en x64, exe natif.

**DI-02** — L'interface est uniquement en français.

## Paquets

**DI-03** `[CHANGEMENT]` — Un seul code source produit deux paquets ([ADR 0001](../adr/0001-extension-panneau-lateral.md)) :
- un `.zip` pour Chrome, à décompresser puis à charger « non empaqueté » ;
- un `.xpi` signé par Mozilla pour Firefox et Zen.

Application de bureau : un seul fichier `WhosNext.exe`.

**DI-04** `[CHANGEMENT]` — Aucun paquet ne contient de donnée d'Équipe (noms, images, Liens) ni l'adresse du Jira ([ADR 0002](../adr/0002-equipe-partagee-par-fichier.md)).
Application de bureau : l'exe intégrait l'Équipe par défaut.

**DI-05** — L'extension s'appelle `Who's Next?`. Son icône est le logo de l'application de bureau (`assets/logo.png` du dépôt `whos-next`).

**DI-10** `[NOUVEAU]` — L'identifiant de l'extension est fixe, sous Chrome comme sous Firefox. Réinstaller ou mettre à jour l'extension ne crée jamais une nouvelle extension, et les données sont conservées.

Les exigences DI-06 (remplacement de l'ancienne application Python) et DI-07 (message si WebView2 est absent) de l'application de bureau sont supprimées.

## Autorisations

**DI-11** `[NOUVEAU]` — L'extension demande uniquement ces autorisations :
- le stockage local ;
- le panneau latéral (Chrome) ;
- les onglets (`tabs`), pour lire l'adresse des onglets (LI-04, LI-10).

Firefox et Zen affichent l'autorisation des onglets à l'installation (« Accéder aux onglets du navigateur »). Chrome ne montre pas de demande pour une extension chargée non empaquetée, mais affiche cette autorisation dans les détails de l'extension (« Lire votre historique de navigation »).

**DI-12** `[NOUVEAU]` — L'extension n'injecte aucun script dans les pages web et ne lit pas leur contenu. Elle ne fait aucun accès réseau elle-même : seul le chargement des Liens, dans les onglets, touche le réseau. Les polices sont intégrées au paquet.

## Installation et mises à jour

**DI-14** `[NOUVEAU]` — Sous Chrome ([ADR 0003](../adr/0003-diffusion-hors-store.md)) :
- installation : mode développeur activé dans `chrome://extensions`, puis « Charger l'extension non empaquetée » sur un dossier permanent qui contient le `.zip` décompressé ;
- mise à jour, à la main : remplacer le contenu du dossier par la nouvelle version, puis cliquer sur « Recharger » dans `chrome://extensions`. L'Équipe est conservée.

**DI-15** `[NOUVEAU]` — Sous Firefox et Zen ([ADR 0003](../adr/0003-diffusion-hors-store.md)) :
- installation : ouvrir le `.xpi` signé, depuis `about:addons` (« Installer un module depuis un fichier… ») ou en le glissant dans la fenêtre ;
- mise à jour automatique : le manifeste désigne, par `update_url`, un fichier `updates.json` hébergé dans le dépôt GitHub. Le navigateur y trouve les nouvelles versions signées. L'Équipe est conservée.

La procédure pas à pas pour les collègues est dans le [README](../../README.md).

## Construction

**DI-08** `[CHANGEMENT]` — Pour développer, seul Node est nécessaire : ni Rust, ni outils de compilation Windows. Le dossier de sortie de la construction se charge directement dans Chrome et dans Firefox pour les essais.
Application de bureau : construction de l'exe sur le poste Windows, avec Rust, les VS Build Tools et Node.

**DI-13** — GitHub Actions vérifie chaque pull request et chaque commit sur `main` : typage, tests unitaires, tests de bout en bout dans Chromium.

**DI-09** `[CHANGEMENT]` — Un tag de version (`v*`) déclenche en plus :
1. la construction des deux paquets ;
2. la signature du `.xpi` par addons.mozilla.org, sur le canal « non listé », avec les clés API enregistrées dans les secrets du dépôt ;
3. la publication des deux paquets dans une release GitHub ;
4. la mise à jour de `updates.json` (DI-15).

Application de bureau : construction de l'exe sur un runner Windows, déclenchée par un tag.
