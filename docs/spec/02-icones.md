# 02 — Icônes

Une Icône est soit un emoji, soit une image importée. Un Membre peut ne pas avoir d'Icône. Ce fichier décrit la fenêtre de choix d'Icône, l'import des images et le calcul de la couleur dominante.

## Fenêtre de choix d'Icône

**IC-01** `[CHANGEMENT]` — La fenêtre s'affiche par-dessus le contenu du panneau. Tant qu'elle est ouverte, le reste du panneau ne réagit pas. Son titre est `Icône — <nom du Membre>` `[INDICATIF]`.
Application de bureau : fenêtre modale centrée sur la fenêtre principale.

**IC-02** — La fenêtre propose une grille de 64 emojis, dans cet ordre (8 par ligne `[INDICATIF]`) :

- Visages : 😀 😎 🤓 😍 🤩 😜 🥸 🧐 😇 🤠 🥳 😈 👻 🤖 👽 🎃
- Animaux : 🐱 🐶 🦊 🐻 🐼 🐨 🐯 🦁 🐸 🐵 🦄 🐲 🦋 🐧 🦉 🦅
- Métiers et objets : 👨‍💻 👩‍💻 🧑‍🚀 👨‍🎨 👩‍🔬 🧑‍🍳 👨‍🎤 🧑‍🏫 ⚡ 🔥 💎 🌟 🎯 🚀 🎸 🎮
- Nature : 🌈 ☀️ 🌙 ⭐ ❄️ 🌊 🌸 🍀
- Divers : ❤️ 💙 💜 🖤 🤍 💛 🧡 💚

**IC-03** — À l'ouverture, la fenêtre montre l'Icône actuelle du Membre. Une Icône emoji est mise en évidence dans la grille. Pour une Icône image, le nom de son fichier d'origine est affiché dans la zone image.

**IC-04** — Un clic sur un emoji le sélectionne et annule le choix d'un fichier image. Un clic sur l'emoji déjà sélectionné le désélectionne.

**IC-05** `[CHANGEMENT]` — Le bouton `Parcourir…` `[INDICATIF]` ouvre le sélecteur de fichiers du système, qui propose en priorité les images (`.png .jpg .jpeg .gif .bmp .webp .svg`). Après un choix, la zone image affiche le nom du fichier et l'emoji sélectionné est désélectionné. Un nom de plus de 28 caractères est coupé à 25 caractères, suivi de `…`. Si on ferme le sélecteur sans choisir, rien ne change.
Application de bureau : sélecteur de Windows titré `Choisir une image`, avec deux filtres nommés. Le navigateur ne permet pas de fixer le titre ni le nom des filtres.

**IC-06** — Le bouton `Valider` ferme la fenêtre et applique le choix, dans cet ordre de priorité :
1. un fichier image a été choisi : il devient l'Icône image du Membre ;
2. sinon, un emoji est sélectionné : il devient l'Icône emoji du Membre ;
3. sinon : aucune modification.

**IC-07** — Valider sans avoir rien changé ne modifie pas l'Icône et ne supprime aucune image.

**IC-08** — Le bouton `Annuler`, la touche Échap et la fermeture de la fenêtre ne modifient rien.

**IC-09** — Le bouton `Supprimer l'icône` `[INDICATIF]` retire tout de suite l'Icône du Membre et ferme la fenêtre, sans passer par `Valider`.

**IC-10** — Tout changement d'Icône est sauvegardé immédiatement. La vue Équipe affiche la nouvelle Icône dès la fermeture de la fenêtre.

## Import et stockage des images

**IC-11** `[CHANGEMENT]` — Une image importée est enregistrée dans le stockage de l'extension, avec le nom de son fichier d'origine, qui sert seulement à l'affichage (IC-03).
Application de bureau : copie dans le dossier `icons\`, avec un suffixe numérique en cas de nom déjà pris.

**IC-12** — Quand une Icône image est remplacée ou retirée, et quand son Membre est supprimé, l'ancienne image est supprimée du stockage.

**IC-13** — Le fichier choisi est enregistré sans vérification de format. Une image illisible (fichier corrompu, format non géré) n'empêche pas l'extension de fonctionner : le Membre s'affiche sans image, avec la couleur de Tuile par défaut.

**IC-14** — Une image SVG s'affiche partout (vue Équipe, vue Présence, Session) et donne une couleur dominante.

**IC-17** `[NOUVEAU]` — Une image de plusieurs mégaoctets s'importe sans erreur. Le poids des images ne doit ni empêcher l'enregistrement de l'Équipe, ni ralentir l'ouverture du panneau au-delà du budget PF-01, ni alourdir le Fichier d'Équipe au point de gêner son partage sur Teams. Le moyen (réduction de l'image à l'import, par exemple) est libre.

## Couleur dominante

**IC-15** — Une Icône image donne une couleur dominante, qui sert de fond à la Tuile du Membre en Session (voir SE-15). La méthode est imposée :

1. réduire l'image à 64 × 64 px ;
2. ne garder que les pixels assez opaques (alpha ≥ 128 sur 255) ;
3. réduire ces pixels à 8 couleurs par quantification « median cut » ;
4. prendre la couleur qui couvre le plus de pixels ;
5. l'assombrir en multipliant R, G et B par 0,6 `[INDICATIF]` ;
6. si sa luminance (0,299 R + 0,587 G + 0,114 B) dépasse encore 140 `[INDICATIF]`, la multiplier de nouveau par 0,6 `[INDICATIF]`.

Le résultat doit être visuellement proche de celui de l'application de bureau. Le code TypeScript de l'application de bureau (`src/lib/icons.ts`) peut être repris.

**IC-16** — Si l'image n'a aucun pixel opaque ou si le calcul échoue, la Tuile prend la couleur par défaut. Une Icône emoji ou l'absence d'Icône donne aussi la couleur par défaut.
