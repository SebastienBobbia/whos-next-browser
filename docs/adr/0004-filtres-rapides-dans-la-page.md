# Filtres rapides appliqués dans la page Jira, un onglet par Tableau

Charger le Lien d'un Membre recharge tout le Tableau Jira. Essayé en conditions réelles, c'est trop lent pour un daily. Nous faisons donc autrement quand un onglet affiche déjà le Tableau du Lien : l'extension injecte un court script qui coche exactement les Filtres rapides du Lien et décoche les autres, comme l'animateur le faisait à la main. Chaque Tableau a son propre onglet, qui revient au premier plan à chaque Lien vers lui. L'accès au site Jira est demandé au navigateur site par site, au clic sur `Valider` dans la fenêtre Lien ou sur `Démarrer le Daily`, pour que l'adresse du Jira ne soit jamais écrite dans le paquet ([ADR 0002](0002-equipe-partagee-par-fichier.md)).

## Considered Options

- **Garder le rechargement** : simple et générique, mais trop lent en daily.
- **Précharger un onglet par Participant au lancement de la Session** : le clic ne fait que changer d'onglet, sans script. Mais 10 à 15 Tableaux Jira se chargent d'un coup (mémoire du poste, charge du serveur), et le partage Teams montre autant d'onglets.
- **Accès à tous les sites dès l'installation** : pas de demande pendant l'utilisation, mais un avertissement « toutes vos données sur tous les sites » qui inquiéterait les collègues et la DSI.
- **Un onglet par site**, comme dans la première version : un Membre suivi sur un autre Tableau imposait deux rechargements, un pour y aller, un pour revenir.

## Consequences

L'extension dépend de la structure HTML des Filtres rapides de Jira Data Center 10.3 : des liens `a.js-quickfilter-button`, identifiés par `data-filter-id`, et actifs quand `aria-pressed="true"`. Si une mise à jour de Jira change cette structure, l'extension ne trouve plus les boutons et recharge la page avec le Lien : plus lent, mais jamais faux. L'exigence « aucun script injecté » de la première version de la spec (DI-12) est remplacée.
