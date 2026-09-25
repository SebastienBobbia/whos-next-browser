# Aucune Équipe intégrée au paquet, partage par Fichier d'Équipe

L'exe Tauri embarque une Équipe par défaut, copiée au premier lancement. L'extension n'embarque aucune Équipe : les Membres, leurs Icônes et leurs Liens circulent entre collègues dans un Fichier d'Équipe, que chacun importe. Deux raisons. Les dépôts GitHub sont publics, et le paquet Firefox est envoyé à Mozilla pour signature : y intégrer les noms, les images et l'adresse du Jira interne les exposerait. Et une Équipe intégrée n'est copiée qu'au premier lancement : un collègue déjà installé ne recevrait jamais les nouveaux Liens, sauf nouvelle version et remise à zéro de ses données.

## Considered Options

- **Équipe intégrée, plus import et export** : aucun réglage au premier lancement, mais les données personnelles et l'adresse Jira partent dans le paquet.
- **Équipe intégrée seule, comme l'exe** : chaque changement de Lien impose une nouvelle version et une remise à zéro chez chaque collègue.

## Consequences

Au premier lancement, l'Équipe est vide et la vue Équipe propose l'import. Pour la même raison, l'adresse du Jira n'est jamais écrite dans le code : l'extension demande l'autorisation `tabs` à l'installation pour lire l'adresse des onglets, ce qui affiche un avertissement « historique de navigation ».
