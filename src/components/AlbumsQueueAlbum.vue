<template>
  <div class="albums-queue-album">
    <img class="albums-queue-album__cover" :src="album.labelSource" loading="lazy" />
    <div style="flex: 1">
      <TrackList :songs="tracklist || album.tracklist" />
      <div class="albums-queue-album__controls">
        <a :href="`https://archive.org/details/${album.ocaid}`" target="_blank"
          >Details</a
        >
        <slot name="post-controls" />
      </div>
    </div>
  </div>
</template>

<script>
import TrackList from "./TrackList";

export default {
  components: { TrackList },
  props: {
    album: {
      type: Object,
      required: true,
    },
    tracklist: {
      type: Array,
      required: false,
    },
  },
};
</script>

<style scoped>
.albums-queue-album {
  display: flex;
  align-items: flex-start;
  margin: 0 auto;
  max-width: 1000px;
}

.albums-queue-album:last-child {
  margin-bottom: 100px;
}

.albums-queue-album__cover {
  width: 90%;
  max-width: 400px;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
  border-radius: 100%;
  margin-bottom: -100px;
  transition: transform 0.2s;
}

.albums-queue-album__cover:hover {
  z-index: 100;
  transform: scale(1.01);
}

.albums-queue-album .tracklist {
  margin-top: 50px;
  margin-bottom: 0;
  background: rgba(255, 255, 255, 0.95);
}

.albums-queue-album h3 {
  margin: 0;
  border-bottom: 1px solid #aaa;
}

.albums-queue-album__controls {
  padding: 0 10px;
}

.albums-queue-album__controls a {
  display: inline-block;
  padding: 5px;
}

@media (max-width: 650px) {
  .albums-queue-album {
    flex-direction: column;
    align-items: center;
  }
}
</style>