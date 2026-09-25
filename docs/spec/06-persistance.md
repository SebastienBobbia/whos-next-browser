# 06 — Persistance et Fichier d'Équipe

L'Équipe (Membres, Icônes, Liens) et la marque des Absents sont enregistrées dans le stockage de l'extension. La Session est conservée jusqu'à sa fin ou jusqu'à la fermeture du navigateur (SE-17). Le Fichier d'Équipe transporte une Équipe d'un navigateur à un autre ([ADR 0002](../adr/0002-equipe-partagee-par-fichier.md)).

## Stockage de l'extension

**PE-01** `[CHANGEMENT]` — Les données sont enregistrées dans le stockage local de l'extension, propre à chaque profil de navigateur. Chrome et Firefox d'un même poste ne partagent rien. Désinstaller l'extension efface ses données. Une mise à jour de l'extension les conserve (DI-10, DI-14, DI-15).
Application de bureau : `%APPDATA%\WhosNext\team.json` et le dossier `icons\`. L'extension ne lit et n'écrit jamais ce dossier.

**PE-02** `[CHANGEMENT]` — Pour chaque Membre, dans l'ordre de l'Équipe, le stockage contient : son nom, son Icône (emoji, ou image avec le nom de son fichier d'origine), son Lien et sa marque d'Absent. Le format interne est libre, mais il porte un numéro de version pour permettre de futures migrations.
Application de bureau : format `team.json` v2, sans Lien.

**PE-07** `[CHANGEMENT]` — Si les données enregistrées sont illisibles, l'extension démarre avec une Équipe vide (EQ-06) et ne les écrase pas avant la première modification de l'Équipe. L'import d'un Fichier d'Équipe permet alors de repartir.
Application de bureau : le fichier illisible était renommé `team.json.illisible-AAAAMMJJ-HHMMSS`.

**PE-08** `[CHANGEMENT]` — L'Équipe est enregistrée immédiatement après chaque modification :
- ajout d'un Membre ;
- suppression d'un Membre ;
- réordonnancement ;
- changement d'Icône ;
- changement de Lien ;
- lancement d'une Session (enregistrement des Absents, PR-09) ;
- import d'un Fichier d'Équipe.

Application de bureau : pas de Lien ni d'import.

**PE-09** — Les images sont gérées comme décrit dans IC-11 et IC-12 : enregistrement à l'import, suppression au remplacement, au retrait de l'Icône et à la suppression du Membre.

**PE-13** `[CHANGEMENT]` — L'extension n'intègre aucune Équipe. Au premier lancement, l'Équipe est vide (EQ-06).
Application de bureau : l'exe intégrait une Équipe par défaut, copiée au premier lancement (PE-10 à PE-12, supprimées).

Les exigences PE-03 à PE-06 de l'application de bureau (encodage de `team.json`, tolérances de lecture, compatibilité avec l'application Python, format v1) sont supprimées. L'encodage et les tolérances sont repris pour le Fichier d'Équipe (FI-03, FI-08).

## Fichier d'Équipe

**FI-01** `[NOUVEAU]` — La vue Équipe propose deux boutons : `Importer` et `Exporter` `[INDICATIF]`. Quand l'Équipe est vide, `Exporter` est désactivé.

**FI-02** `[NOUVEAU]` — `Exporter` télécharge un Fichier d'Équipe, par le mécanisme de téléchargement habituel du navigateur. Son nom est `whos-next-equipe-AAAAMMJJ.json` `[INDICATIF]`, avec la date du jour. Il contient l'Équipe dans son ordre : pour chaque Membre, son nom, son Icône (emoji, ou image complète avec le nom de son fichier d'origine) et son Lien. Il ne contient pas les marques d'Absent : chaque animateur garde sa propre mémoire des Absents.

**FI-03** `[NOUVEAU]` — Le Fichier d'Équipe est un fichier JSON en UTF-8, indenté de 2 espaces. Les caractères non ASCII (accents, emojis) sont écrits tels quels, sans séquence `\u`. Structure :

```json
{
  "format": "whos-next-equipe",
  "version": 1,
  "members": [
    {
      "name": "Alice",
      "icon": { "type": "emoji", "value": "🐱" },
      "link": "https://jira.entreprise.com/secure/RapidBoard.jspa?rapidView=528&projectKey=COP&quickFilter=5710#"
    },
    {
      "name": "Bob",
      "icon": { "type": "image", "file": "bob.png", "data": "data:image/png;base64,iVBORw0KGgo..." }
    },
    { "name": "Charlie" }
  ]
}
```

- `format` vaut toujours `"whos-next-equipe"`. Il distingue un Fichier d'Équipe du `team.json` de l'application de bureau.
- L'ordre du tableau `members` est l'ordre de l'Équipe.
- `icon` est facultatif. Sans `icon`, le Membre n'a pas d'Icône. Une Icône image contient toute l'image, encodée en `data:` URL, et le nom de son fichier d'origine.
- `link` est facultatif. Sans `link`, le Membre n'a pas de Lien.
- `version` vaut `1`. Elle n'augmente que si la structure change d'une façon qu'une version précédente de l'extension lirait mal.

**FI-04** `[NOUVEAU]` — `Importer` ouvre le sélecteur de fichiers du système, qui propose en priorité les fichiers `.json`. Si on ferme le sélecteur sans choisir, rien ne change. Si le fichier choisi est valide et que l'Équipe actuelle n'est pas vide, une confirmation s'affiche : `Remplacer l'équipe actuelle (18 membres) par celle du fichier (20 membres) ?` `[INDICATIF]`. Si l'Équipe actuelle est vide, l'import se fait sans confirmation.

**FI-05** `[NOUVEAU]` — Après confirmation, l'Équipe est entièrement remplacée par celle du fichier : Membres, ordre, Icônes et Liens. Les images de l'ancienne Équipe sont supprimées du stockage. Refuser la confirmation ne change rien.

**FI-06** `[NOUVEAU]` — Après l'import, un Membre est marqué Absent si un Membre Absent de l'ancienne Équipe portait le même nom (comparaison de EQ-10 : casse ignorée, accents distincts). Les autres Membres ne sont pas Absents.

**FI-07** `[NOUVEAU]` — Un fichier illisible est refusé : JSON invalide, `format` différent de `"whos-next-equipe"`, `version` inconnue ou `members` qui n'est pas un tableau. Le message `Ce fichier n'est pas un Fichier d'Équipe valide.` `[INDICATIF]` s'affiche, et rien n'est modifié.

**FI-08** `[NOUVEAU]` — À la lecture d'un fichier valide :
- un Membre sans `name`, ou avec un `name` vide après retrait des espaces, est ignoré ;
- une Icône inutilisable (type inconnu, emoji vide, image absente) est ignorée : le Membre n'a pas d'Icône ;
- un `link` qui n'est pas une adresse valide au sens de LI-06 est ignoré : le Membre n'a pas de Lien ;
- les champs inconnus sont ignorés ;
- des noms qui ne diffèrent que par la casse sont chargés tels quels (EQ-10) ;
- un Membre dont le nom répète exactement celui d'un Membre précédent est ignoré : un nom identifie un Membre.

**FI-09** `[NOUVEAU]` — Exporter une Équipe puis importer le fichier obtenu redonne exactement la même Équipe : mêmes Membres, même ordre, mêmes Icônes, mêmes Liens. Seules les marques d'Absent suivent FI-06.

## Confidentialité

**FI-10** `[NOUVEAU]` — Un Fichier d'Équipe contient des noms, des images et des adresses internes. Il circule entre collègues (sur Teams par exemple) et n'est jamais versionné dans le dépôt, qui est public. Le dépôt ignore les fichiers `whos-next-equipe*.json`.
