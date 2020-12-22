<template>
  <div class="albums-queue-album">
    <img class="albums-queue-album__cover" :src="album.labelSource" />
    <TrackList :songs="tracklist || album.tracklist" />
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
  margin-bottom: -100px;
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
}

.albums-queue-album .tracklist {
  margin-top: 50px;
  flex: 1;
}

.albums-queue-album h3 {
  margin: 0;
  border-bottom: 1px solid #aaa;
}
</style>