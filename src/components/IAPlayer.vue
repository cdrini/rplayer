<template>
  <iframe
    :src="url"
    width="100%"
    :height="listHeight + 60"
    frameborder="0"
    webkitallowfullscreen="true"
    mozallowfullscreen="true"
    allowfullscreen
  />
</template>

<script>
export default {
  props: {
    ocaid: {
      require: true,
      type: String,
    },
    autoplay: {
      type: Boolean,
      default: false,
    },
    playlist: {
      type: Boolean,
      default: false,
    },
    listHeight: {
      type: Number,
      default: 150,
    },
  },

  computed: {
    url() {
      const params = new URLSearchParams({
        autoplay: this.autoplay ? 1 : 0,
        playlist: this.playlist ? 1 : 0,
        listHeight: this.listHeight,
      });
      return `https://archive.org/embed/${this.ocaid}?${params}`;
    },
  },
};
</script>