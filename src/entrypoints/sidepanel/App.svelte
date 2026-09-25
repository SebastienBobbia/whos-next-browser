<!-- Panneau provisoire : les vues Équipe, Présence et Session arrivent à l'étape 3. -->
<script lang="ts">
  const logo = browser.runtime.getURL("/icon/96.png");
</script>

<main>
  <img src={logo} alt="" width="48" height="48" />
  <h1>Who's Next?</h1>
  <p>Le panneau fonctionne.</p>
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    height: 100%;
    background: #15152b;
    color: #ecebf5;
    color-scheme: dark;
    font-family: "Segoe UI", system-ui, sans-serif;
  }

  main {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
  }

  p {
    margin: 0;
    color: #8d8cab;
  }
</style>
