<script lang="ts">
  import { session } from "../../lib/session.svelte";
  import { team } from "../../lib/team.svelte";
  import type { Member } from "../../lib/types";
  import Equipe from "../../views/Equipe.svelte";
  import IconPicker from "../../views/IconPicker.svelte";
  import Presence from "../../views/Presence.svelte";
  import Session from "../../views/Session.svelte";

  /** Vue affichée hors Session. Pendant une Session, la vue Session prend le dessus (EQ-01). */
  let form = $state<"equipe" | "presence">("equipe");
  let editing = $state<Member | null>(null);
  let ready = $state(false);

  $effect(() => {
    Promise.all([team.load(), session.load()]).then(() => (ready = true));
  });

  // Une Session lancée ici ou dans une autre fenêtre (SE-18) se termine
  // toujours sur la vue Équipe (SE-09, SE-10).
  $effect(() => {
    if (session.state) {
      form = "equipe";
      editing = null;
    }
  });

  function startSession(present: string[]) {
    void session.start(present);
  }
</script>

{#if ready}
  {#if session.state}
    <Session current={session.state} />
  {:else if form === "equipe"}
    <Equipe onPrepare={() => (form = "presence")} onEditIcon={(m) => (editing = m)} />
  {:else}
    <Presence onBack={() => (form = "equipe")} onStart={startSession} />
  {/if}

  {#if editing}
    <IconPicker member={editing} onClose={() => (editing = null)} />
  {/if}
{/if}
