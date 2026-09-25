# Who's Next?

Extension de navigateur pour les daily meetings : savoir qui n'a pas encore pris la parole, et afficher dans le navigateur la page de la personne qui la prend (ses tickets Jira, par exemple). Elle s'affiche dans le panneau latéral de Chrome, Firefox ou Zen : la page se rétrécit au lieu d'être masquée.

Portage de l'application de bureau [whos-next](https://github.com/SebastienBobbia/whos-next) (Tauri 2), qui reste disponible mais n'évolue plus. Les deux ne partagent aucune donnée.

> En cours de développement : toutes les fonctions marchent et sont testées. Reste la publication automatique des paquets dans les [releases](https://github.com/SebastienBobbia/whos-next-browser/releases). En attendant, construisez l'extension vous-même (voir « Pour développer »).

## Fonctionnalités

- **Équipe** : ajout, suppression et réordonnancement des membres, avec une icône emoji ou une image par personne.
- **Lien** : une adresse web par personne, par exemple son filtre sur le tableau Jira.
- **Présence** : cocher les personnes présentes au daily. Les personnes décochées reviennent décochées au daily suivant.
- **Session** : une tuile par personne restante. Un clic sur la tuile de la personne qui prend la parole la retire et charge son Lien dans l'onglet Jira.
- **Tirage au sort** : désigne au hasard quelqu'un qui n'a pas encore parlé.
- **Annulation** : efface la désignation, puis rend leur tuile aux personnes déjà passées.
- **Fichier d'Équipe** : export et import de l'équipe complète (membres, icônes, liens) pour la partager entre collègues.

## Installer l'extension

### Chrome

1. Télécharger le fichier `.zip` pour Chrome dans la dernière [release](https://github.com/SebastienBobbia/whos-next-browser/releases).
2. Le décompresser dans un dossier permanent, par exemple `C:\Users\<vous>\WhosNext-extension\`. **Ne pas supprimer ni déplacer ce dossier** : Chrome s'en sert en continu.
3. Ouvrir `chrome://extensions`.
4. Activer **Mode développeur**, en haut à droite.
5. Cliquer sur **Charger l'extension non empaquetée** et choisir le dossier.
6. Cliquer sur l'icône en forme de pièce de puzzle dans la barre d'outils, puis sur l'épingle à côté de **Who's Next?**.

**Mettre à jour** : télécharger le nouveau `.zip`, remplacer le contenu du dossier par celui du zip, puis cliquer sur le bouton ↻ de **Who's Next?** dans `chrome://extensions`. L'équipe est conservée.

### Firefox et Zen

1. Télécharger le fichier `.xpi` dans la dernière [release](https://github.com/SebastienBobbia/whos-next-browser/releases).
2. Ouvrir `about:addons`, cliquer sur la roue dentée, puis sur **Installer un module depuis un fichier…** et choisir le `.xpi`. On peut aussi glisser le fichier dans la fenêtre du navigateur.
3. Accepter l'ajout. Firefox indique que l'extension peut **accéder aux onglets du navigateur** : elle en a besoin pour charger les Liens dans l'onglet Jira.
4. Épingler **Who's Next?** dans la barre d'outils si l'icône n'y apparaît pas.

**Mettre à jour** : rien à faire, Firefox et Zen installent les nouvelles versions tout seuls.

### Autorisations

- **Onglets** : l'extension lit l'adresse des onglets pour retrouver l'onglet du tableau Jira, et pour le bouton **Prendre l'onglet actuel**. Chrome décrit cette autorisation comme « Lire votre historique de navigation ».
- **Accès au site Jira** : demandé une seule fois, la première fois que vous cliquez sur **Valider** dans la fenêtre d'un Lien Jira, ou sur **Démarrer le Daily**. Acceptez : l'extension peut alors cocher le filtre de la personne directement dans la page, sans la recharger. Si vous refusez, tout fonctionne, mais la page Jira se recharge à chaque personne.

L'extension n'envoie aucune donnée. Dans Jira, elle ne fait que cocher et décocher les filtres rapides.

## Premier lancement

1. Cliquer sur l'icône **Who's Next?** : le panneau s'ouvre.
2. Cliquer sur **Importer** et choisir le Fichier d'Équipe reçu sur Teams. Chaque membre arrive avec son icône et son Lien.

Le Fichier d'Équipe contient des noms, des images et des adresses internes. **Ne jamais le déposer dans ce dépôt GitHub : il est public.**

## Régler le Lien d'une personne

1. Dans Jira, cliquer sur le filtre de la personne.
2. Dans le panneau, vue Équipe, cliquer sur 🔗 sur la ligne de la personne.
3. Cliquer sur **Prendre l'onglet actuel**, puis sur **Valider**.

Pour partager les Liens avec les collègues : **Exporter**, puis envoyer le fichier sur Teams. Chacun l'importe.

## Pendant le daily

1. **Préparer le Daily**, cocher les présents, **Démarrer le Daily**.
2. Quand quelqu'un prend la parole, cliquer sur sa tuile : elle disparaît et Jira affiche ses tickets. Si le tableau Jira est déjà ouvert, son filtre est coché directement dans la page, sans rechargement. Une personne suivie sur un autre tableau a son propre onglet.
3. Quand tout le monde a parlé, la célébration s'affiche, puis le panneau revient à la vue Équipe.

La session est conservée si le panneau se ferme par erreur : il suffit de le rouvrir.

## Pour développer

Prérequis : Node 22 ou plus. Rien d'autre.

```bash
npm install
npm run build            # paquet Chrome dans .output/chrome-mv3
npm run build:firefox    # paquet Firefox et Zen dans .output/firefox-mv3
npm run check            # typage Svelte et TypeScript
npm test                 # domaine, stockage, Fichier d'Équipe, onglets (vitest)
npm run test:e2e         # parcours des vues, extension chargée dans Chromium (Playwright)
npm run check:coverage   # chaque exigence de la spec a un test ou une ligne de recette
npm run lint:firefox     # validation du paquet Firefox (web-ext)
```

Créer un Fichier d'Équipe à partir des données de l'application de bureau (noms et icônes, sans Liens) :

```bash
npm run team-file -- "%APPDATA%\WhosNext"       # invite de commandes (cmd)
npm run team-file -- "$env:APPDATA\WhosNext"    # PowerShell
```

Le fichier `whos-next-equipe-AAAAMMJJ.json` apparaît dans le dossier courant. Git l'ignore : il ne doit jamais aller dans le dépôt.

Charger la version construite pour l'essayer :

- **Chrome** : dans `chrome://extensions`, mode développeur activé, **Charger l'extension non empaquetée**, dossier `.output\chrome-mv3`. Après chaque construction, cliquer sur ↻. L'identifiant reste `fimkkabgaecgpjhklgefimmefecaoibl`, quel que soit le dossier.
- **Firefox et Zen** : dans `about:debugging#/runtime/this-firefox`, **Charger un module complémentaire temporaire…**, fichier `.output\firefox-mv3\manifest.json`. Le module disparaît au redémarrage du navigateur.

## Documentation

| Fichier | Contenu |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Glossaire du domaine |
| [docs/spec/](docs/spec/) | Spécification fonctionnelle, une exigence par identifiant |
| [docs/adr/](docs/adr/) | Décisions structurantes et leurs alternatives écartées |
| [docs/recette-manuelle.md](docs/recette-manuelle.md) | Vérifications manuelles avant distribution : panneau réel, Firefox et Zen, Jira, paquets |
