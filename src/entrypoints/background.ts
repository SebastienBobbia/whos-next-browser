/**
 * Ouvre ou ferme le panneau au clic sur l'icône de l'extension (PA-02).
 * Chrome le fait seul une fois le comportement réglé. Firefox et Zen n'ont pas
 * d'équivalent : on bascule la barre latérale depuis le clic, seul moment où
 * Firefox l'autorise.
 */
export default defineBackground(() => {
  if (import.meta.env.FIREFOX) {
    browser.action.onClicked.addListener(() => {
      void (browser as unknown as FirefoxBrowser).sidebarAction.toggle();
    });
  } else {
    void browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }
});

/** API `sidebarAction`, propre à Firefox, absente des types Chrome de WXT. */
type FirefoxBrowser = { sidebarAction: { toggle(): Promise<void> } };
