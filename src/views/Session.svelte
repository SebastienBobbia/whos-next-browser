<script lang="ts">
  import Glyph from "../lib/Glyph.svelte";
  import { loadIcon, TILE_DEFAULT } from "../lib/icons";
  import { session, type SessionState } from "../lib/session.svelte";
  import { openLink } from "../lib/tabs";
  import { team } from "../lib/team.svelte";
  import type { Member } from "../lib/types";

  let { current }: { current: SessionState } = $props();

  /** Seuil de bascule en affichage compact, en pixels logiques (SE-14). */
  const COMPACT_BELOW = 48;
  /** Durée d'affichage de la Célébration avant le retour à la vue Équipe (SE-10). */
  const CELEBRATION_MS = 3000;

  let flashing = $state(false);
  let tileHeight = $state(60);
  let listEl = $state<HTMLElement | null>(null);

  const tints = $state<Record<string, string>>({});
  const images = $state<Record<string, string>>({});
  const compact = $derived(tileHeight < COMPACT_BELOW);

  const membersByName = $derived(new Map(team.members.map((m) => [m.name, m] as const)));

  function member(name: string): Member | undefined {
    return membersByName.get(name);
  }

  // Icônes et couleurs dominantes : une seule lecture pour toute la Session (PF-11, PF-12).
  $effect(() => {
    for (const name of current.attendees) {
      const icon = member(name)?.icon;
      if (icon?.type !== "image") continue;
      loadIcon(icon.id).then((loaded) => {
        if (!loaded) return;
        images[name] = loaded.url;
        tints[name] = loaded.color;
      });
    }
  });

  /**
   * Marque le Participant A parlé, puis charge son Lien. Le panneau est mis à
   * jour avant la demande de chargement, qui n'est pas attendue (PF-16, LI-14).
   */
  function markSpoken(name: string) {
    void session.markSpoken(name);
    const link = member(name)?.link;
    if (link) openLink(link).catch(() => {});
  }

  function draw() {
    void session.draw();
    flashing = false;
    requestAnimationFrame(() => (flashing = true));
  }

  // Célébration : la Session est oubliée après quelques secondes, et le panneau
  // revient à la vue Équipe (SE-10).
  $effect(() => {
    if (!current.complete) return;
    const timer = setTimeout(() => void session.end(), CELEBRATION_MS);
    return () => clearTimeout(timer);
  });

  // Mesure de la hauteur d'une Tuile : sert seulement à basculer en affichage
  // compact. La mise en page reste faite par le CSS (PF-13).
  $effect(() => {
    const el = listEl;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const count = Math.max(1, current.remaining.length);
      tileHeight = (el.clientHeight - 2 * (count - 1)) / count;
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  $effect(() => {
    const count = Math.max(1, current.remaining.length);
    if (listEl) tileHeight = (listEl.clientHeight - 2 * (count - 1)) / count;
  });
</script>

<div class="session">
  <nav>
    <button title="Tirage au sort" onclick={draw} disabled={!current.canDraw}>
      <Glyph name="draw" />
    </button>
    <button title="Annuler" onclick={() => void session.undo()} disabled={!current.canUndo}>
      <Glyph name="undo" />
    </button>
    <button class="end" title="Terminer" onclick={() => void session.end()}>
      <Glyph name="stop" />
    </button>
  </nav>

  {#if current.complete}
    <div class="celebration">
      <p class="cheer">Tout le monde<br />a parlé</p>
      <span class="rule"></span>
      <p class="closing">Retour à l'équipe</p>
    </div>
  {:else}
    <ul class="tiles" bind:this={listEl}>
      {#each current.remaining as name (name)}
        {@const icon = member(name)?.icon}
        <li
          class="tile"
          class:designated={current.designated === name}
          class:flash={current.designated === name && flashing}
          class:compact
          style="background: {tints[name] ?? TILE_DEFAULT}">
          <button onclick={() => markSpoken(name)}>
            <span class="avatar">
              {#if images[name]}
                <img src={images[name]} alt="" />
              {:else if icon?.type === "emoji"}
                <span class="emoji">{icon.value}</span>
              {:else}
                <span class="initial">{name.slice(0, 1).toLocaleUpperCase("fr")}</span>
              {/if}
            </span>
            {#if !compact}<span class="name">{name}</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .session {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--night);
  }

  nav {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  nav button {
    flex: 1 1 0;
    height: 30px;
    border: 1px solid #23232f;
    background: transparent;
    color: #d4d4d4;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  nav button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  nav .end {
    border-color: #5c1a1a;
    background: #2a0c12;
    color: #f87171;
  }

  .tiles {
    flex: 1 1 0;
    min-height: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tile {
    flex: 1 1 0;
    min-height: 0;
  }

  .tile button {
    width: 100%;
    height: 100%;
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--tile-txt);
    display: flex;
    align-items: stretch;
    cursor: pointer;
    font: inherit;
  }

  .avatar {
    width: 64px;
    flex-shrink: 0;
    background: rgba(0, 0, 0, 0.28);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tile.compact .avatar {
    width: 100%;
    background: transparent;
  }

  .avatar img {
    max-width: 70%;
    max-height: 70%;
    object-fit: contain;
  }

  .emoji,
  .initial {
    font-size: clamp(14px, 3.2vh, 30px);
    line-height: 1;
  }

  .initial {
    font-family: var(--font-display);
    font-weight: 700;
  }

  .name {
    flex-grow: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    padding: 0 12px;
    font-family: var(--font-display);
    font-size: clamp(16px, 3.4vh, 30px);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Désigné : anneau jaune permanent (SE-06) */
  .tile.designated {
    outline: 2px solid var(--designe-ring);
    outline-offset: -2px;
    box-shadow: 0 0 22px rgba(250, 204, 21, 0.38);
  }

  .tile.designated .name {
    color: var(--designe-txt);
  }

  /* Clignotement du Tirage : 3 fois, puis l'anneau reste (SE-06) */
  .tile.flash {
    animation: blink 0.3s steps(1, end) 3;
  }

  @keyframes blink {
    0%,
    49% {
      outline-color: transparent;
      box-shadow: none;
    }
    50%,
    100% {
      outline-color: var(--designe-ring);
      box-shadow: 0 0 22px rgba(250, 204, 21, 0.38);
    }
  }

  .celebration {
    flex: 1 1 0;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 24px;
    text-align: center;
  }

  .cheer {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(28px, 5vh, 46px);
    font-weight: 700;
    line-height: 0.95;
    text-transform: uppercase;
    color: var(--designe-ring);
  }

  .rule {
    width: 64px;
    height: 4px;
    background: var(--designe-ring);
  }

  .closing {
    margin: 0;
    font-size: 13px;
    color: #8a8a6a;
  }
</style>
