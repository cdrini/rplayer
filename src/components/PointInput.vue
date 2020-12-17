<template>
  <div>
    <NumberInput v-model="point.x" />
    <br />
    <NumberInput v-model="point.y" />
  </div>
</template>

<script>
import NumberInput from "./NumberInput";

export default {
  components: { NumberInput },
  props: {
    point: Object,
  },
};
</script>