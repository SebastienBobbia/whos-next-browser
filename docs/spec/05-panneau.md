# 05 — Panneau latéral

Ce fichier remplace `05-fenetre-ecran.md` de l'application de bureau. Le panneau latéral du navigateur remplace la fenêtre de l'application ([ADR 0001](../adr/0001-extension-panneau-lateral.md)) : la page web se rétrécit au lieu d'être masquée.

## Exigences supprimées

Le navigateur gère la position, la taille et l'affichage du panneau. Ces exigences de l'application de bureau sont donc supprimées :

- FE-01 (fenêtre principale titrée) ;
- FE-03 et FE-11 (taille de la fenêtre selon la vue) ;
- FE-04 (fermeture de la fenêtre = Session perdue), remplacée par SE-17 ;
- FE-05 et FE-06 (option « toujours au premier plan ») ;
- FE-07 à FE-10 et FE-14 (calage de la fenêtre au bord droit de l'écran, bouton ↔) ;
- FE-12 et FE-13 (pixels logiques, changement d'écran de DPI), désormais gérés par le navigateur. PF-03 reste un critère d'acceptation.

## Panneau

**PA-01** `[NOUVEAU]` — L'interface s'affiche dans le panneau latéral du navigateur : le panneau latéral des extensions sous Chrome, la barre latérale des extensions sous Firefox et Zen. Elle ne s'affiche ni dans une popup, ni dans une fenêtre séparée.

**PA-02** `[NOUVEAU]` — Un clic sur l'icône de l'extension dans la barre d'outils ouvre le panneau. Un nouveau clic le ferme.

**PA-03** `[NOUVEAU]` — Le panneau reste ouvert quand on change d'onglet dans la même fenêtre.

**PA-04** `[NOUVEAU]` — La position du panneau (gauche ou droite) et sa largeur sont réglées par l'utilisateur dans le navigateur. L'extension ne les impose pas. Par défaut, Chrome place le panneau à droite, Firefox à gauche `[INDICATIF]`.

**PA-05** `[NOUVEAU]` — Les vues Équipe, Présence et Session, et les fenêtres Icône et Lien, restent utilisables sans défilement horizontal dès 300 px de large `[INDICATIF]`.

**PA-06** `[NOUVEAU]` — Le panneau fait partie de la fenêtre du navigateur. Quand l'animateur partage toute la fenêtre dans Teams, les autres participants voient le panneau, Célébration comprise. Quand il partage un seul onglet, ils ne le voient pas.

**FE-02** — L'extension utilise uniquement un thème sombre.
