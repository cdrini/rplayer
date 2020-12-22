<template>
  <div id="app">
    <RecordPlayer
      class="record-player"
      ref="recordPlayer"
      @loadedmetadata="handleVideoLoaded"
      :videoWidth="videoWidth"
      :videoHeight="videoHeight"
      :videoRegions="videoRegions"
      :labelRegions="labelRegions"
      :labelCoords="labelCoords"
      :labelPosition="labelPosition"
      :labelSource="labelSource"
      :backgroundRecords="backgroundRecords"
      :showRegions="showRegions"
      :cycleLength="cycleLength"
      @play="$refs.aplayer.play()"
      @pause="$refs.aplayer.pause()"
    />

    <audio
      controls
      ref="aplayer"
      :src="activeSong.src"
      @play="playing = true"
      @pause="playing = false"
      @ended="nextSong()"
    />

    <div class="albums-queue">
      <AlbumsQueueAlbum
        v-for="album of albumsQueue"
        :key="album.ocaid"
        :album="album"
        :tracklist="filterTrackList(album.tracklist)"
      />
    </div>

    <div class="right-toolbar">
      <ChunkyButton @click="shuffleBackgroundRecords">
        <template #label>Shuffle</template>
      </ChunkyButton>
      <ChunkyButton @click="settingsDrawerOpen = !settingsDrawerOpen">
        <SettingsIcon />
        <template #label>Settings</template>
      </ChunkyButton>
    </div>

    <div v-if="drawerOpen" class="drawer-screen" @click="closeDrawers" />

    <div v-if="settingsDrawerOpen" class="settings-drawer">
      <header>
        <button @click="settingsDrawerOpen = false">
          «
          <h2>Settings</h2>
        </button>
      </header>
      <main>
        <h3>Queue</h3>
        <!-- <input
          type="text"
          class="query-input"
          v-model="query"
          placeholder="IA Query"
        /> -->
        IA Ids:
        <br />
        <textarea class="ocaid-input" v-model="ocaid" placeholder="IA ids" />

        <hr />
        <div>
          <h3>Preferred Track Quality</h3>
          <small
            >Some tracks have been digitally restored for better quality.</small
          >
          <br />
          <label>
            <input type="radio" v-model="preferredQuality" value="restored" />
            Restored
          </label>
          <br />
          <label>
            <input type="radio" v-model="preferredQuality" value="unrestored" />
            Unrestored
          </label>
          <br />
          <label>
            <input type="radio" v-model="preferredQuality" value="both" />
            <div style="display: inline-block; vertical-align: top">
              Both
              <br />
              <small>May result in songs appearing duplicated</small>
            </div>
          </label>
        </div>

        <hr />
        <details>
          <summary>Dev Controls</summary>

          <label>
            <input type="checkbox" v-model="showRegions" />
            Show pin dots
          </label>

          <label>
            Pin Position in video:
            <PointInput :point="videoRegions.pin" />
          </label>

          <br />

          <label>
            Pin Position in label image:
            <br />
            <PointInput :point="labelRegions.pin" />
          </label>

          <br />

          <label>
            Label Opacity
            <input
              type="range"
              step="0.01"
              min="0"
              :max="1"
              v-model="labelPosition.opacity"
            />
          </label>
          <br />

          <label>
            RPM
            <NumberInput :step="1" :min="1" :max="100" v-model="rpm" />
          </label>
          <br />
          <label>
            Label Clip
            <NumberInput
              :step="1"
              :min="0"
              :max="100"
              v-model="labelPosition.clipPadding"
            />
          </label>
        </details>
      </main>
    </div>

    <div class="center-toolbar">
      <ChunkyButton v-if="!playing" @click="$refs.aplayer.play()">
        <template #label>Play</template>
      </ChunkyButton>
    </div>

    <br />
    Video Source:
    <a href="https://pixabay.com/videos/record-player-vinyl-retro-record-38392/"
      >Record Player 38392</a
    >
    by
    <a href="https://pixabay.com/users/matthias_groeneveld-4535957"
      >Matthias Groeneveld</a
    >
  </div>
</template>

<script>
import shuffle from "lodash/shuffle";
import PointInput from "./components/PointInput";
import NumberInput from "./components/NumberInput";
import AlbumsQueueAlbum from "./components/AlbumsQueueAlbum";
import RecordPlayer from "./components/RecordPlayer";
import SettingsIcon from "./components/icons/SettingsIcon";
import ChunkyButton from "./components/ChunkyButton";
import Vue from "vue";
import AsyncComputed from "vue-async-computed";

Vue.use(AsyncComputed);

function extract_tracklist(ocaid, metadata) {
  const get_original = (file) =>
    file.source === "original"
      ? file
      : metadata.files.find((f) => f.name === file.original);

  const get_artist = (orig) => {
    const normalize_creator = (c) =>
      c instanceof Array
        ? c.join(", ")
        : c
        ? normalize_creator(c.split(";"))
        : c;
    const artist = normalize_creator(orig.artist);
    const creator = normalize_creator(orig.creator);
    return artist && creator
      ? artist.length < creator.length
        ? artist
        : creator
      : artist || creator;
  };

  const get_track = (orig) => {
    const m = orig.name.match(/^_?(\d{2})/);
    return m ? m[1] : orig.track;
  };
  const get_quality = (f) => {
    return /restored\.[a-z0-9]+$/.test(f.name) ? "restored" : "unrestored";
  };

  const originals = metadata.files
    .filter((f) => f.source === "original")
    .map((f) => Object.assign({}, f, { deriveds: [] }));
  const deriveds = metadata.files.filter((f) => f.source !== "original");
  // Attach the deriveds to the originals
  deriveds
    .filter((f) => get_original(f))
    .forEach((f) => {
      const orig = get_original(f);
      originals.find((o) => o.name == orig.name).deriveds.push(f);
    });

  const tracklist = originals
    .filter((f) => f.title && !f.name.startsWith("history/"))
    // .filter(f => get_quality(f) == this.quality)
    .map((orig) => {
      const mp3 = orig.deriveds.find((f) => f.name.endsWith(".mp3"));
      const quality = get_quality(orig);
      return {
        // title: orig.title.replace(/ \(restored\)$/, ''),
        title: orig.title,
        quality,
        src: `https://archive.org/download/${ocaid}/${mp3.name}`,
        artist: get_artist(orig),
        track: get_track(orig),
        album: orig.album,
        duration: parseFloat(orig.length),
        original: orig,
      };
    });
  tracklist.forEach((track) => {
    if (track.quality === "restored") {
      // See if it has an un-restored version
      const unrestoredCandidates = tracklist.filter(
        (t2) => t2.track == track.track && t2 != track
      );
      if (unrestoredCandidates.length == 1) {
        track.hasUnrestoredCopy = true;
        unrestoredCandidates[0].hasRestoredCopy = true;
      }
      // otherwise all false (show twice)
    }
  });
  return tracklist;
}

async function album_from_ocaid(ocaid) {
  const metadata = await fetch(
    `https://archive.org/metadata/${ocaid}`
  ).then((r) => r.json());
  return {
    ocaid,
    metadata,
    tracklist: extract_tracklist(ocaid, metadata),
    labelSource: `https://archive.org/download/${ocaid}/${ocaid}_itemimage.jpg`,
  };
}

export default {
  name: "App",
  components: {
    ChunkyButton,
    PointInput,
    NumberInput,
    AlbumsQueueAlbum,
    RecordPlayer,
    SettingsIcon,
  },
  data() {
    return {
      // Queue stuff
      activeSongIndex: 0,
      activeAlbumIndex: 0,

      query: "",
      ocaid:
        "78_santa-baby_eartha-kitt-p.-springer-javits-t.-springer-henri-rene-and-his-orchestra_gbia0001251a",

      /** @type {'restored' | 'unrestored' | 'both'} */
      preferredQuality: "restored",

      settingsDrawerOpen: false,

      showRegions: false,
      videoWidth: 300,
      videoHeight: 300,
      playing: false,

      rpm: 33,

      videoRegions: {
        pin: {
          x: 0.453,
          y: 0.48,
        },
      },

      labelRegions: {
        pin: {
          x: 0.497,
          y: 0.49,
        },
      },

      labelPosition: {
        width: 235,
        height: 235,
        clipPadding: 25,
        opacity: 1,
      },

      backgroundRecords: [],

      candidateBackgroundRecords: [
        // Christmas songs
        "78_christmas-day-part-ii_men-about-town_gbia0020416",
        // Other
        "78_alice-in-wonderland-songs-from-mother-goose__gbia0007708",
        "78_whispering-grass-dont-tell-the-trees_ink-spots-jack-lawrence_gbia0020004",
        "78_nine-pound-hammer_merle-travis-travis-nation-hensley_gbia0085986",
        "78_for-quiet-beauty_y-ciannella-l-winter-r-hunter-t-pyle-carringer_gbia0082727",
        "78_the-young-birch-tree_red-army-choir-of-the-ussr-a-alexandrov-v-pankov_gbia0020378",
        "78_pavanne_glenn-miller-and-his-orchestra-j-r-shannon-frederic-knight-logan_gbia0020267",
        "78_ive-got-a-right-to-cry_erskine-hawkins-and-his-orchestra-jimmy-mitchelle-unger-ber_gbia0083001",
        "78_lullaby-for-a-man-condemned-to-be-hanged-at-dawn_alexander-kipnis-with-balalaika-or_gbia0033142",
        "78_song-of-praise_malinke-tribe-laura-c-boulton_gbia0067634",
        "78_always_swing-and-sway-with-sammy-kaye-irving-berlin_gbia0083045",
        "78_king-cole-trio-vol.-2_the-king-cole-trio-nat-cole_gbia0003357",
        "78_ja-so-bin-ich_marlene-dietrich-peter-kreuder-and-his-orchestra-nelson-hollander_gbia0020059",
        "78_the-first-nowell_the-lyn-murray-singers-oakeley-lyn-murray_gbia0020460",
        "78_good-night-sweetheart_tony-martin-earle-hagen-and-his-orchestra-otto-harbach-jerom_gbia0083008",
        "78_west-end-blues_louis-armstrong-and-his-orchestra-spencer-williams_gbia0031327",
        "78_boogie-woogie-music-vol.-2_meade-lux-lewis-shayne_gbia0003369",
        "78_in-the-mood_glenn-miller-and-his-orchestra-johnson-dash-hawkins_gbia0020402",
        "78_cuban-rhythms_hotel-nacional-orchestra-beltran_gbia0002479",
        "78_when-a-woman-loves-a-man_billie-holiday-and-her-orchestra-billie-holiday-buck-clayt_gbia0031202",
        "78_semper-paratus_victor-military-band-the-four-clubmen-r-j-burt-sr-simon-dapp-phi_gbia0082738",
        "78_music-of-latin-america_enric-madriguera-and-orchestra-marcelino-guerra_gbia0002363",
        "78_st-louis-blues_louis-armstrong-and-his-orchestra-original-dixieland-jazz-band_gbia0039403",
        "78_frankie-and-johnnie_duke-ellington-and-his-orchestra-clarence-and-spencer-williams_gbia0020273",
        "78_moonglow_vaughn-monroe-and-his-orchestra-watson-monroe-pope-vaughn-monroe_gbia0082957",
        "78_xavier-cugats-mexico_xavier-cugat-and-his-waldorf-astoria-orchestra-lina-romay-and_gbia0002483",
        "78_our-america_y-ciannella-r-hunter_gbia0082728",
        "78_the-woodpecker-song_mark-warnow-and-his-orchestra-arthur-johnston-sam-coslow-your-s_gbia0082964",
      ],
    };
  },
  mounted() {
    window.addEventListener("hashchange", this.updateFromHash, false);
    this.updateFromHash();
    this.updateToHash();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.updateFromHash);
  },
  asyncComputed: {
    async albumsQueue() {
      if (this.ocaid) {
        const ocaids = this.ocaid.split(/[,|;\n]/gm);
        return await Promise.all(ocaids.map(album_from_ocaid));
      }
    },
    async activeAlbum() {
      let album = this.albumsQueue[this.activeAlbumIndex];
      if (!album.metadata) {
        album = this.albumsQueue[
          this.activeAlbumIndex
        ] = await album_from_ocaid(album.ocaid);
      }
      return album;
    },
  },
  computed: {
    activeTrackList() {
      if (!this.activeAlbum) return;
      return this.filterTrackList(this.activeAlbum?.tracklist);
    },
    activeSong() {
      return this.activeTrackList?.[this.activeSongIndex];
    },

    drawerOpen() {
      return this.settingsDrawerOpen;
    },
    cycleLength() {
      return 1 / (this.rpm / 60);
    },
    labelSource() {
      return this.activeAlbum?.labelSource;
    },
    labelCoords() {
      // we position it so that the two pins are in the same place on the canvas
      const videoPin = this.videoUnitCoordToCanvasCoord(this.videoRegions.pin);
      const labelPin = {
        x: this.labelRegions.pin.x * this.labelPosition.width,
        y: this.labelRegions.pin.y * this.labelPosition.height,
      };
      const labelOffset = {
        x: videoPin.x - labelPin.x,
        y: videoPin.y - labelPin.y,
      };

      return Object.assign({}, this.labelPosition, labelOffset, {
        cx: labelOffset.x + labelPin.x,
        cy: labelOffset.y + labelPin.y,
        rx: this.labelPosition.width / 2 - this.labelPosition.clipPadding,
        ry: this.labelPosition.height / 2 - this.labelPosition.clipPadding,
      });
    },
  },
  watch: {
    query() {
      this.updateToHash();
    },
    ocaid() {
      this.updateToHash();
    },
    playing(newVal) {
      if (newVal) this.$refs.recordPlayer?.play();
      else this.$refs.recordPlayer?.pause();
    },
  },
  methods: {
    updateToHash() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      if (this.query) {
        hashParams.set("query", this.query);
        hashParams.delete("ocaid");
      }
      // query takes precedency
      if (this.ocaid && !this.query) {
        hashParams.set("ocaid", this.ocaid);
      }
      window.location.hash = hashParams.toString();
    },
    updateFromHash() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      if (hashParams.get("ocaid") && hashParams.get("ocaid") !== this.ocaid)
        this.ocaid = hashParams.get("ocaid");
      if (hashParams.get("query") && hashParams.get("query") !== this.query)
        this.query = hashParams.get("query");
    },

    closeDrawers() {
      this.settingsDrawerOpen = false;
    },

    filterTrackList(tracklist) {
      return (tracklist || []).filter(
        (track) =>
          this.preferredQuality === "both" ||
          track.quality === this.preferredQuality ||
          (this.preferredQuality === "restored" && !track.hasRestoredCopy) ||
          (this.preferredQuality === "unrestored" && !track.hasUnrestoredCopy)
      );
    },

    loadAndPlay() {
      this.$refs.aplayer?.load();
      this.$refs.aplayer?.addEventListener(
        "loadedmetadata",
        () => {
          this.$refs.aplayer.play();
        },
        { once: true }
      );
    },

    skipToSong(index) {
      this.activeSongIndex = index;
      this.loadAndPlay();
    },

    nextSong() {
      if (this.activeSongIndex + 1 == this.activeTrackList.length) {
        // out! Try to go to next album
        this.nextAlbum();
      } else {
        this.skipToSong(this.activeSongIndex + 1);
      }
    },

    nextAlbum() {
      if (this.activeAlbumIndex + 1 == this.albumsQueue.length) {
        // got nothing :)
        return;
      }
      this.activeAlbumIndex++;
      this.activeSongIndex = 0;
      this.loadAndPlay();
    },

    shuffleBackgroundRecords() {
      this.backgroundRecords = shuffle(this.candidateBackgroundRecords);
    },
    videoUnitCoordToCanvasCoord({ x, y }) {
      return {
        x: x * this.videoWidth,
        y: y * this.videoHeight,
      };
    },

    handleVideoLoaded(ev) {
      this.videoWidth = ev.target.videoWidth;
      this.videoHeight = ev.target.videoHeight;
    },
  },
};
</script>

<style>
html,
body {
  margin: 0;
  overflow-x: hidden;
}

body { overflow: hidden; }
#app {
  font-family: "Roboto", "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.record-player video,
.record-player svg {
  height: 100vh;
  object-fit: cover;
}

.ia-player-wrapper {
  position: relative;
}

.ia-player-wrapper button {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  cursor: pointer;
}

input {
  box-sizing: border-box;
  font: inherit;
}

input.query-input,
.ocaid-input {
  background: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.5);
  min-height: 200px;;
}

button {
  cursor: pointer;
}

:is(button):hover {
  opacity: 1;
}

input.query-input,
.ocaid-input {
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  white-space: pre;
}

button.play-button {
  opacity: 1;
}

.right-toolbar {
  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
}

.right-toolbar .chunky-button + .chunky-button {
  margin-top: 0;
}

.settings-drawer {
  top: 10px;
  bottom: 10px;
  right: 0;
  width: 300px;
  max-width: 100vw;
  position: fixed;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 4px 0 0 4px;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
  overflow-y: auto;
}

.settings-drawer > main {
  padding: 8px;
}

.settings-drawer > header {
  position: sticky;
  top: 0;
}

.settings-drawer > header button {
  width: 100%;
  display: flex;
}
.settings-drawer h3 {
  margin: 0;
}

.drawer-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: black;
  opacity: 0.2;

  cursor: pointer;
  transition: opacity 0.2s;
}
.drawer-screen:hover {
  opacity: 0.1;
}

.center-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2em;
}

audio {
  width: 100%;
}
</style>
