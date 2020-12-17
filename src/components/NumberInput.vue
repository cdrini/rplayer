<template>
  <div>
    <input
      type="range"
      :step="getProperty('sliderStep')"
      :min="getProperty('min')"
      :max="getProperty('max')"
      :value="value"
      @input="$emit('input', parseFloat($event.target.value))"
    />
    <input
      type="number"
      :step="getProperty('inputStep')"
      :min="getProperty('min')"
      :max="getProperty('max')"
      :value="value"
      @input="$emit('input', parseFloat($event.target.value))"
    />
  </div>
</template>

<script>
const TYPES = {
  unitless: {
    min: 0,
    max: 1,
    sliderStep: 0.01,
    inputStep: 0.001,
  },
};

export default {
  props: {
    value: Number,
    type: {
      required: false,
      default: "unitless",
    },
    min: {
      required: false,
      type: Number,
      default: undefined,
    },
    max: {
      required: false,
      type: Number,
      default: undefined,
    },
    sliderStep: {
      required: false,
      type: Number,
      default: undefined,
    },
    inputStep: {
      required: false,
      type: Number,
      default: undefined,
    },
  },

  methods: {
    getProperty(name) {
      if (typeof this[name] !== "undefined") return this[name];
      if (typeof TYPES[this.type][name] !== "undefined")
        return TYPES[this.type][name];
      return TYPES.unitless[name];
    },
  },
};
</script>
