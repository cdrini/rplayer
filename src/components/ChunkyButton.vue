<template>
  <button
    class="chunky-button"
    @click="$emit('click', $event)"
  >
    <div class="chunky-button__icon">
      <slot />
    </div>
    <div class="chunky-button__label">
      <slot name="label" />
    </div>
  </button>
</template>

<style scoped>
.chunky-button__icon svg {
  width: 28px;
  height: 28px;
}
button {
  font: inherit;
  font-size: 0.9em;
  cursor: pointer;
  padding: 6px;
}

.chunky-button {
  border: 2px solid currentColor;
  background: rgba(255, 255, 255, 0.6);
  color: #444;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin: 8px;
  text-align: center;
}

.chunky-button:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #555;
}
</style>