# 04 — Session

Une Session est un daily en cours. Elle affiche une Tuile pour chaque Restant, charge le Lien de chaque Participant qui prend la parole et se termine par la Célébration, quand tous les Participants ont parlé.

## Déroulement

**SE-01** `[CHANGEMENT]` — Une Session démarre avec ses Participants, dans l'ordre de l'Équipe. Au départ, tous les Participants sont Restants et il n'y a pas de Désigné. La Session est conservée par le navigateur jusqu'à sa fin (SE-09, SE-10) ou jusqu'à la fermeture du navigateur (voir SE-17). Elle n'est jamais écrite dans le stockage durable, ni dans le Fichier d'Équipe.
Application de bureau : Session en mémoire uniquement, perdue à la fermeture de la fenêtre.

**SE-02** — Seuls les Restants sont affichés, avec une Tuile chacun, dans l'ordre de l'Équipe. Un Participant qui A parlé disparaît de l'affichage. Aucun compteur n'est affiché.

**SE-03** `[CHANGEMENT]` — Un clic n'importe où sur une Tuile marque son Participant comme A parlé, et sa Tuile disparaît. Si le Membre a un Lien, ce Lien est chargé (LI-10). Si un Désigné existe, il est effacé, même si la Tuile cliquée est celle d'un autre Restant.
Application de bureau : le clic ne chargeait rien.

**SE-04** — Le bouton Tirage (🎲 `[INDICATIF]`) choisit au hasard, avec une probabilité égale, un Restant autre que le Désigné actuel. Ce Restant devient le Désigné. Le Tirage ne le marque pas A parlé et ne charge pas son Lien : il faut toujours cliquer sur sa Tuile.

**SE-05** — Le bouton Tirage est désactivé quand le seul Restant est déjà le Désigné, et quand il n'y a plus de Restant.

**SE-06** — Le Désigné se repère au premier coup d'œil. Sa Tuile garde sa mise en évidence tant qu'il reste Désigné, y compris après un changement de taille du panneau et après une fermeture puis une réouverture du panneau. Au moment du Tirage, une animation brève attire l'attention sur lui. Dans l'application de bureau `[INDICATIF]` : fond vert `#1a5c2a`, nom vert `#4ADE80` en gras, bordure jaune `#FACC15` qui clignote 3 fois (6 étapes de 150 ms) puis reste affichée.

**SE-07** — Le bouton d'annulation (↩ `[INDICATIF]`) agit ainsi :
- s'il y a un Désigné : il efface seulement le Désigné ;
- sinon : le dernier Participant marqué A parlé redevient Restant, et sa Tuile réapparaît à sa place dans l'ordre de l'Équipe.

On peut répéter l'annulation jusqu'à ce qu'il ne reste plus aucun Participant qui A parlé. L'annulation ne change aucun onglet (LI-13).

**SE-08** — Le bouton d'annulation est actif dès qu'il y a un Désigné ou qu'au moins un Participant A parlé. Il est désactivé dans les autres cas, et pendant la Célébration.

**SE-09** — Le bouton de fin (■ `[INDICATIF]`) termine la Session immédiatement, sans confirmation. La Session est oubliée et le panneau revient à la vue Équipe.

**SE-10** `[CHANGEMENT]` — Quand le dernier Restant A parlé, son Lien est chargé (LI-10), puis la Célébration s'affiche :
- un grand message `Tout le monde a parlé ! 🎉` `[INDICATIF]`, dont la taille s'adapte au panneau ;
- une animation pulsée `[INDICATIF : texte jaune #FFD600 sur fond noir, qui alterne avec #997F00 toutes les 250 ms]` ;
- les boutons Tirage et annulation sont désactivés ;
- la Session est oubliée, et **le panneau revient à la vue Équipe** 3 secondes `[INDICATIF]` après l'apparition de la Célébration. Le panneau reste ouvert.

Application de bureau : l'application se fermait 1 seconde après l'apparition de la Célébration.

## Barre d'actions

**SE-11** `[CHANGEMENT]` — Pendant la Session, 3 actions restent toujours visibles au-dessus des Tuiles : Tirage, annulation et fin. Dans l'application de bureau, ce sont de petits boutons alignés de gauche à droite, dans cet ordre `[INDICATIF]`.
Application de bureau : une quatrième action, le calage de la fenêtre (↔), qui n'a plus de sens dans un panneau.

## Tuiles

**SE-12** — Tous les Restants sont visibles sans défilement. Les Tuiles occupent toute la largeur du panneau et se partagent sa hauteur à parts égales. Dans l'application de bureau `[INDICATIF]` : hauteur d'une Tuile = max(24, (hauteur disponible − 4 × n) / n), avec n le nombre de Restants.

**SE-13** — Le contenu d'une Tuile dépend de l'Icône du Membre : image + nom, emoji + nom, ou nom seul. Dans l'application de bureau `[INDICATIF]` : l'image est dans le coin supérieur gauche, de côté max(12, hauteur de Tuile / 4) ; l'emoji est à gauche ; le nom est centré ; la taille du texte vaut environ 55 % de la hauteur de la Tuile, limitée à largeur / 5, avec un minimum de 9.

**SE-14** — Quand les Tuiles deviennent trop basses pour un nom lisible (moins de 48 px dans l'application de bureau `[INDICATIF]`), elles passent en affichage compact et ne montrent plus que l'Icône : l'image, l'emoji, ou, pour un Membre sans Icône, l'initiale de son nom en majuscule.

**SE-15** — Le fond d'une Tuile est choisi dans cet ordre :
1. la couleur du Désigné, si le Participant est le Désigné ;
2. sinon, la couleur dominante de son Icône image (voir IC-15) ;
3. sinon, la couleur par défaut (`#2d2d44` `[INDICATIF]`).

**SE-16** `[CHANGEMENT]` — Quand la taille du panneau change pendant la Session (largeur réglée à la souris, fenêtre du navigateur redimensionnée, changement d'écran), les Tuiles se recalculent : hauteur, taille du texte, passage en affichage compact ou retour à l'affichage normal.
Application de bureau : redimensionnement et calage de la fenêtre.

## Session conservée

**SE-17** `[NOUVEAU]` — Si le panneau est fermé, ou remplacé par un autre panneau, pendant une Session, la Session est conservée. À la réouverture du panneau, la vue Session s'affiche dans l'état où elle était : Restants, Participants qui A parlé, Désigné. La Session est perdue à la fermeture du navigateur.

**SE-18** `[NOUVEAU]` — Il n'existe qu'une Session à la fois. Si le panneau est ouvert dans plusieurs fenêtres du navigateur, toutes affichent la même Session et se mettent à jour ensemble. Un clic sur une Tuile charge le Lien dans la fenêtre où le clic a eu lieu.

## Chargement du Lien

**LI-10** `[NOUVEAU]` — Quand une Tuile est cliquée et que son Membre a un Lien, l'extension charge ce Lien dans un onglet de la fenêtre du panneau, choisi dans cet ordre :
1. l'onglet actif, s'il affiche une page du même site que le Lien ;
2. sinon, le premier onglet de la fenêtre qui affiche une page du même site, qui devient l'onglet actif ;
3. sinon, un nouvel onglet, qui devient l'onglet actif.

« Même site » veut dire même origine : même protocole, même hôte et même port (par exemple `https://jira.entreprise.com`).

**LI-11** `[NOUVEAU]` — Le Lien est chargé tel qu'il est enregistré, sans modification.

**LI-12** `[NOUVEAU]` — Si le Membre n'a pas de Lien, le clic sur sa Tuile ne change aucun onglet.

**LI-13** `[NOUVEAU]` — Le Tirage, l'annulation, le bouton de fin et la Célébration ne changent aucun onglet.

**LI-14** `[NOUVEAU]` — Le chargement du Lien ne retarde pas la mise à jour des Tuiles (PF-02). Un échec du chargement (onglet fermé au même moment, par exemple) n'affiche aucun message et n'interrompt pas la Session. Une adresse injoignable s'affiche comme le navigateur l'affiche d'habitude, dans l'onglet choisi.
