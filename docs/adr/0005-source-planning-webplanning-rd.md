# Source du Planning : WebPlanning R&D via l'extension de navigateur

Pour pré-décocher les Membres indisponibles au daily (9h15–10h00) et afficher leur Statut Planning, l'extension interroge directement le WebPlanning R&D (`WebplanningRD`) en HTTP.

La page `Scheduler.aspx` du WebPlanning embarque directement en JSON (`v.resources` et `v.events.list`) l'ensemble des collaborateurs visibles et leurs événements horodatés avec leurs catégories métiers (`[Absence]`, `[Réunion Interne R&D]`, etc.).

Comme le dépôt `whos-next-browser` est public ([ADR 0002](./0002-equipe-partagee-par-fichier.md)) :
- l'adresse du Planning n'est jamais écrite en dur dans le code ni dans le paquet : elle est stockée dans `storage.local` et voyage dans le Fichier d'Équipe (`planningUrl` facultatif à la racine) ;
- l'autorisation d'accéder à l'hôte du Planning est demandée à l'exécution via `optional_host_permissions` ;
- l'extension tente d'abord de lire `Scheduler.aspx` avec la session déjà ouverte du navigateur (`credentials: "include"`), et si la session est expirée, s'authentifie automatiquement sur `Identification.aspx` avec les identifiants enregistrés dans `storage.local`.

## Considered Options

- **Outlook Windows / Microsoft Graph** : *New Outlook* n'expose aucune API locale accessible depuis une extension, et Graph API impose l'enregistrement d'une application Entra ID avec consentement administrateur. De plus, `FreeBusy` ne fournit pas les catégories métiers R&D (`Absence`, `Réunion Interne R&D`).
- **Adresse du Planning en dur dans le paquet** : écarté pour respecter la règle de confidentialité du dépôt public (DI-04, ADR 0002).
