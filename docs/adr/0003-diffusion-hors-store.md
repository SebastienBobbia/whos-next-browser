# Diffusion hors store : Chrome en non empaqueté, Firefox et Zen signés par Mozilla en non listé

L'extension est destinée aux collègues de l'équipe, pas au public. Sous Chrome, chacun la charge « non empaquetée » en mode développeur, que la DSI autorise sur nos postes, à partir du zip publié dans la release GitHub. Firefox et Zen refusent toute extension non signée : le `.xpi` est signé par addons.mozilla.org en mode « non listé » (signature automatique et gratuite, extension jamais publiée), puis hébergé dans la release GitHub, avec mise à jour automatique par `update_url`.

## Considered Options

- **Chrome Web Store en non répertorié** : 5 US$ une fois, revue de Google à chaque version, installable par toute personne qui a le lien. Écarté pour l'instant. Reste possible plus tard, puisque le paquet ne contient aucune donnée personnelle (ADR 0002).
- **Fichier `.crx` hors store** : Chrome le bloque sous Windows, sauf stratégie d'entreprise.
- **Chargement temporaire dans Firefox** : l'extension disparaît à chaque redémarrage.
- **Firefox Developer Edition sans vérification de signature** : impose un autre Firefox à chaque collègue.

## Consequences

Sous Chrome, l'extension ne se met pas à jour toute seule : il faut remplacer le contenu du dossier, puis cliquer sur « Recharger » dans `chrome://extensions`. Le dossier doit rester en place, sinon l'extension disparaît. Si la DSI interdit un jour le mode développeur, il faudra passer par le Chrome Web Store ou par la stratégie `ExtensionInstallForcelist`.
