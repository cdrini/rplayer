<template>
  <ol class="tracklist">
    <li
      class="tracklist__song"
      v-for="(song, i) of songs"
      :key="i"
      style="display: flex; align-items: center"
    >
      <div class="tracklist__song-index">
        {{ song.track || (i + 1) }}
      </div>
      <div style="flex: 1">
        <div class="tracklist__song-title">{{ song.title }}</div>
        <div class="tracklist__song-artist" v-if="song.artist">
          {{ song.artist }}
        </div>
      </div>
      <div class="tracklist__song-duration" v-if="song.duration">
        {{ formatDuration(song.duration) }}
      </div>
    </li>
  </ol>
</template>

<script>
/**
 * @param {number|string} duration
 * @return {string}
 */
function formatDuration(duration) {
  if (typeof duration === 'string') return duration;

  const secs = duration % 60;
  const mins = (duration - secs) / 60;
  return [mins, secs]
    .map(Math.round)
    .map(n => n.toString().padStart(2, '0'))
    .join(':');
}

export default {
  props: {
    songs: {
      type: Array,
      default: () => [
        {
          title: "Santa Baby (Restored)",
          artist: "Someone or other",
          duration: "3:12",
          playing: true,
        },
        {
          title: "Santa Baby",
          artist: "Someone or other",
          duration: "3:20",
          playing: false,
        },
      ],
    },
  },
  methods: { formatDuration }
};
</script>

<style>
.tracklist {
  border: 1px solid #aaa;
  padding: 4px 8px;
  border-radius: 4px;
  box-sizing: border-box;
}
.tracklist__song:last-child {
  border-bottom: 0;
}
.tracklist__song {
  border-bottom: 1px solid #aaa;
  padding: 4px;
  margin: 0;
  position: relative;
}
.tracklist__song-index {
  padding-right: 8px;
  padding-left: 2px;
}
.tracklist__song-artist,
.tracklist__song-index,
.tracklist__song-duration {
  font-size: 0.9em;
  opacity: 0.75;
}
</style>