# Extension de navigateur en panneau latéral, un seul code pour Chrome, Firefox et Zen

L'application de bureau (Tauri) s'affiche par-dessus le navigateur et cache une partie de la page Jira. Pendant le daily, l'animateur clique d'abord sur le filtre Jira de la personne qui parle, puis sur sa Tuile. Nous portons l'application en extension de navigateur, affichée dans le panneau latéral : la page se rétrécit au lieu d'être masquée, et un seul clic sur une Tuile charge le Lien du Membre. Un seul code source (WXT, Svelte 5, TypeScript) produit le paquet Chrome et le paquet Firefox, que Zen installe aussi.

## Considered Options

- **Garder l'application de bureau** : elle ne peut qu'ouvrir un nouvel onglet à chaque clic, et sa fenêtre masque toujours la page.
- **Popup de l'extension** : elle se ferme au premier clic dans la page, ce qui la rend inutilisable pendant une Session.
- **Fenêtre détachée** : elle masque la page, comme l'application de bureau.
- **Un projet par navigateur** : Chrome et Firefox partagent l'API WebExtensions (Manifest V3). Seules quelques clés du manifeste diffèrent, et WXT les génère.

## Consequences

Les exigences de fenêtre de l'application Tauri (calage à droite, largeur, premier plan, DPI) disparaissent : le navigateur gère le panneau. Quand l'animateur partage toute la fenêtre du navigateur dans Teams, le panneau est visible par tous. L'application Tauri reste disponible mais n'évolue plus, et rien n'est synchronisé entre elle et l'extension.
