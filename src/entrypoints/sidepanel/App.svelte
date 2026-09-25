<!-- Panneau provisoire : les vues Équipe, Présence et Session arrivent à l'étape 3.
     Il charge déjà l'Équipe et la Session, pour vérifier le stockage dans le navigateur. -->
<script lang="ts">
  import { session } from "../../lib/session.svelte";
  import { team } from "../../lib/team.svelte";

  const logo = browser.runtime.getURL("/icon/96.png");

  let ready = $state(false);

  $effect(() => {
    Promise.all([team.load(), session.load()]).then(() => (ready = true));
  });
</script>

<main>
  <img src={logo} alt="" width="48" height="48" />
  <h1>Who's Next?</h1>
  {#if ready}
    <p>
      {team.members.length} membre(s) dans l'équipe ·
      {session.state ? "Session en cours" : "aucune Session"}
    </p>
  {/if}
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    height: 100%;
    background: #15152b;
    color: #ecebf5;
    color-scheme: dark;
    font-family: "Manrope", "Segoe UI", system-ui, sans-serif;
  }

  main {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 16px;
    text-align: center;
  }

  h1 {
    margin: 0;
    font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
    font-size: 1.8rem;
  }

  p {
    margin: 0;
    color: #8d8cab;
  }
</style>
