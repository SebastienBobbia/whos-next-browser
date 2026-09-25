<script lang="ts">
  import { loadIcon } from "./icons";
  import type { Member } from "./types";

  let { member, size = 24 }: { member: Member; size?: number } = $props();

  // L'Icône image est lue une seule fois puis servie par le cache (PF-11).
  let url = $state<string | null>(null);

  $effect(() => {
    const icon = member.icon;
    if (icon?.type !== "image") {
      url = null;
      return;
    }
    let cancelled = false;
    loadIcon(icon.id).then((loaded) => {
      if (!cancelled) url = loaded?.url ?? null;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if member.icon?.type === "emoji"}
  <span class="emoji" style="font-size: {size - 4}px; width: {size}px">{member.icon.value}</span>
{:else if url}
  <img src={url} alt="" width={size} height={size} />
{/if}

<style>
  .emoji {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;
  }

  img {
    object-fit: contain;
    flex-shrink: 0;
  }
</style>
