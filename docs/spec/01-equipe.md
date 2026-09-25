# 01 — Vue Équipe

La vue Équipe sert à gérer la liste des Membres et leurs Liens. C'est la vue affichée à l'ouverture du panneau quand aucune Session n'est en cours.

## Affichage

**EQ-01** — À l'ouverture du panneau, l'extension affiche la vue Équipe. Si une Session est en cours, elle affiche la Session à la place (voir SE-17).

**EQ-02** `[CHANGEMENT]` — La vue affiche les Membres dans l'ordre de l'Équipe. Chaque ligne contient, dans cet ordre `[INDICATIF]` : une poignée de réordonnancement, l'Icône du Membre (si elle existe), son numéro de position à partir de 1 et son nom (`3. Camille`), un bouton Icône, un bouton Lien, un bouton de suppression.
Application de bureau : pas de bouton Lien.

**EQ-03** — Le bouton Icône montre l'état de l'Icône du Membre : l'emoji lui-même pour une Icône emoji, un pictogramme d'image pour une Icône image (`🖼` `[INDICATIF]`), un signe d'ajout pour un Membre sans Icône (`＋` `[INDICATIF]`).

**EQ-04** — Une Icône image s'affiche en conservant ses proportions, dans un carré de 24 px `[INDICATIF]`. Si l'image est illisible, la ligne s'affiche sans Icône, sans message d'erreur. Le bouton Icône garde alors le pictogramme d'image.

**EQ-05** — Un compteur affiche le nombre de Membres : `18 membre(s) dans l'équipe` `[INDICATIF]`.

**EQ-06** `[CHANGEMENT]` — Quand l'Équipe est vide, la liste affiche `Aucun membre. Ajoutez des personnes ci-dessus ou importez un Fichier d'Équipe.` `[INDICATIF]` et l'indication de réordonnancement est masquée. C'est la vue du premier lancement : l'extension n'intègre aucune Équipe (ADR 0002).
Application de bureau : le message ne mentionnait pas l'import.

## Ajout

**EQ-07** — Un champ de saisie (texte d'aide `Nom du membre...` `[INDICATIF]`) et un bouton `Ajouter` permettent d'ajouter un Membre. La touche Entrée dans le champ équivaut au bouton.

**EQ-08** — Le nom saisi est débarrassé de ses espaces de début et de fin. Le Membre est ajouté à la fin de l'Équipe, sans Icône et sans Lien. Après un ajout réussi, le champ est vidé, le message d'erreur est effacé et l'Équipe est sauvegardée.

**EQ-09** — Si le nom est vide après retrait des espaces, le message `Veuillez entrer un nom.` `[INDICATIF]` s'affiche et rien n'est ajouté.

**EQ-10** — Un nom déjà présent dans l'Équipe est refusé. La comparaison ignore la casse (« Alice », « alice » et « ALICE » sont le même nom) mais pas les accents (« Loïc » et « Loic » sont deux noms différents). Le message `"<nom saisi>" existe déjà dans l'équipe.` `[INDICATIF]` s'affiche et rien n'est ajouté. Des noms qui ne diffèrent que par la casse et qui arrivent par un Fichier d'Équipe sont chargés tels quels, sans erreur.

**EQ-11** — Le message d'erreur reste affiché jusqu'au prochain ajout réussi.

## Suppression

**EQ-12** — Le bouton de suppression retire immédiatement le Membre, avec son Icône et son Lien, sans demander de confirmation. Si le Membre avait une Icône image, l'image est supprimée du stockage. La numérotation est mise à jour et l'Équipe est sauvegardée.

## Réordonnancement

**EQ-13** — On change la position d'un Membre par glisser-déposer : on maintient le clic sur la ligne (ou sa poignée) et on la fait glisser. Pendant le glissement, la ligne déplacée est mise en évidence, et un indicateur montre où elle sera insérée. Au relâchement, le Membre est inséré à l'endroit indiqué, la numérotation est mise à jour et l'Équipe est sauvegardée.

**EQ-14** — Relâcher la ligne à sa position d'origine ne change pas l'ordre.

**EQ-15** `[CHANGEMENT]` — Le glisser-déposer ne démarre pas depuis le bouton Icône, le bouton Lien ni le bouton de suppression. Un clic sur ces boutons déclenche leur action.
Application de bureau : pas de bouton Lien.

**EQ-16** — Quand l'Équipe n'est pas vide, une indication explique le glisser-déposer : `⠿ Maintenir et glisser pour réordonner` `[INDICATIF]`.

## Navigation

**EQ-17** — Le bouton Icône d'un Membre ouvre la fenêtre de choix d'Icône pour ce Membre (voir [02-icones.md](02-icones.md)).

**EQ-18** — Le bouton `Préparer le Daily >>>` `[INDICATIF]` ouvre la vue Présence (voir [03-presence.md](03-presence.md)). Quand l'Équipe est vide, ce bouton n'a aucun effet et aucun message ne s'affiche.

**EQ-19** `[NOUVEAU]` — La vue propose les boutons `Importer` et `Exporter` du Fichier d'Équipe (voir FI-01 à FI-09 dans [06-persistance.md](06-persistance.md)).

## Lien

**LI-01** `[NOUVEAU]` — Le bouton Lien (`🔗` `[INDICATIF]`) montre si le Membre a un Lien : il est mis en valeur quand le Lien existe, estompé sinon `[INDICATIF]`. Au survol, il affiche l'adresse du Lien.

**LI-02** `[NOUVEAU]` — Le bouton Lien ouvre la fenêtre Lien pour ce Membre. Elle s'affiche par-dessus le contenu du panneau. Tant qu'elle est ouverte, le reste du panneau ne réagit pas. Son titre est `Lien — <nom du Membre>` `[INDICATIF]`.

**LI-03** `[NOUVEAU]` — La fenêtre contient un champ d'adresse, prérempli avec le Lien actuel (vide si le Membre n'a pas de Lien), et les boutons `Prendre l'onglet actuel`, `Tester`, `Supprimer le lien`, `Annuler` et `Valider` `[INDICATIF]`.

**LI-04** `[NOUVEAU]` — `Prendre l'onglet actuel` remplit le champ avec l'adresse de l'onglet actif de la fenêtre du panneau. Usage prévu : cliquer sur le filtre de la personne dans Jira, puis sur ce bouton. Si l'adresse de l'onglet actif ne commence pas par `http://` ou `https://` (page interne du navigateur, par exemple), le champ ne change pas et le message `Cet onglet n'affiche pas une page web.` `[INDICATIF]` s'affiche.

**LI-05** `[NOUVEAU]` — `Tester` affiche l'adresse du champ comme le ferait un clic sur la Tuile du Membre (LI-10, LI-11), sans rien enregistrer. Une adresse invalide (LI-06) affiche le message d'erreur et ne charge rien.

**LI-06** `[NOUVEAU]` — Le contenu du champ est débarrassé de ses espaces de début et de fin. Une adresse est valide si elle est absolue et commence par `http://` ou `https://`. Elle est enregistrée telle quelle, fragment `#` compris. Si l'adresse n'est pas valide, `Valider` affiche `Adresse invalide : elle doit commencer par http:// ou https://.` `[INDICATIF]` et la fenêtre reste ouverte. Valider un champ vide retire le Lien.

**LI-07** `[NOUVEAU]` — `Valider` enregistre le Lien et ferme la fenêtre. Pour un Tableau Jira, `Valider` et `Tester` demandent aussi l'accès au site, s'il n'est pas encore accordé (LI-16). `Supprimer le lien` retire tout de suite le Lien et ferme la fenêtre, sans passer par `Valider`. `Annuler`, la touche Échap et la fermeture de la fenêtre ne modifient rien.

**LI-08** `[NOUVEAU]` — Tout changement de Lien est sauvegardé immédiatement. Plusieurs Membres peuvent avoir le même Lien.
