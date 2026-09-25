<script lang="ts">
  let {
    message,
    confirmLabel,
    onConfirm,
    onCancel,
  }: { message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void } =
    $props();
</script>

<svelte:window onkeydown={(e) => e.key === "Escape" && onCancel()} />

<div class="backdrop" aria-hidden="true" onclick={onCancel}></div>

<div class="dialog" role="alertdialog" aria-modal="true" aria-label={message}>
  <p>{message}</p>
  <div class="actions">
    <button class="ghost" onclick={onCancel}>Annuler</button>
    <button class="primary" onclick={onConfirm}>{confirmLabel}</button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(8, 8, 18, 0.7);
  }

  .dialog {
    position: fixed;
    left: 12px;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    border-radius: 12px;
    background: var(--ink);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5);
  }

  p {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  button {
    height: 34px;
    padding: 0 14px;
    border: 0;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    color: var(--txt);
    cursor: pointer;
  }

  .ghost {
    background: var(--ink-field);
    border: 1px solid var(--ink-line);
    color: var(--txt-dim);
  }

  .primary {
    background: var(--blue);
  }
</style>
