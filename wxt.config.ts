import { defineConfig } from "wxt";

/**
 * Clé publique qui fixe l'identifiant de l'extension non empaquetée sous Chrome
 * (fimkkabgaecgpjhklgefimmefecaoibl), quel que soit le dossier chargé (DI-10).
 * La clé privée n'a jamais été conservée : elle ne sert qu'à signer un .crx.
 */
const CHROME_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyT4sfLFGHE3P8k01Pb68wWi4aZfh0gc6vUxN4J79G2gmO4E6Una5shkP8Tc2q52UZggOdLSUIkQTUq0YPmcax/NNNY5+ecnLU21pnaH4KpOZkTdLyPP+GePcg3Qhwohjgird5w7v+2pFGz5JEzHgQh4VmoQ4KiclXCphjFVQFl32oTMXq0XWrnOvy8ZSeSmUV0hQn/zs1/LTgPePNd2En9j9IG01FxCRohAuDnwjqCv1EEG62aiKXZZyI5ZyVpAdStPD6uLcL2qG/29ICPqkB/3ugsTFxmn7nwmG0iT8SptmjFnHYxS+xpdq1hoEIawHQsSEEVUXTtwvkOGZtbqZEQIDAQAB";

/** Identifiant Firefox et Zen : définitif dès la première signature par Mozilla (DI-10). */
const GECKO_ID = "whos-next@sebastienbobbia.github.io";

/** Fichier de mises à jour lu par Firefox et Zen (DI-15). */
const UPDATE_URL =
  "https://raw.githubusercontent.com/SebastienBobbia/whos-next-browser/main/updates.json";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-svelte"],
  // Manifest V3 partout, Firefox compris (ADR 0001).
  manifestVersion: 3,
  // Pas de navigateur lancé par `wxt` : on charge .output/<navigateur>-mv3 à la main.
  webExt: { disabled: true },
  manifest: ({ browser }) => ({
    name: "Who's Next?",
    description:
      "Qui n'a pas encore parlé au daily ? Un clic sur la tuile affiche la page de la personne.",
    // Stockage de l'Équipe et de la Session, adresse des onglets pour les Liens, script
    // des Filtres rapides (DI-11). WXT ajoute sidePanel pour Chrome.
    permissions: ["storage", "tabs", "scripting"],
    // Accès aux sites des Tableaux Jira, demandé site par site pendant l'utilisation (LI-16) :
    // l'adresse du Jira n'est jamais écrite dans le paquet (ADR 0002).
    optional_host_permissions: ["https://*/*", "http://*/*"],
    // Sans action, pas d'icône dans la barre d'outils pour ouvrir le panneau (PA-02).
    action: {
      default_title: "Who's Next?",
      default_icon: { 16: "icon/16.png", 32: "icon/32.png", 48: "icon/48.png" },
    },
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: GECKO_ID,
              strict_min_version: "142.0",
              update_url: UPDATE_URL,
              data_collection_permissions: { required: ["none"] },
            },
          },
        }
      : {
          key: CHROME_KEY,
          minimum_chrome_version: "116",
        }),
  }),
});
