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
      :minLabelWidth="minLabelWidth"
      @play="$refs.aplayer.play()"
      @pause="$refs.aplayer.pause()"
    />

    <audio
      controls
      ref="aplayer"
      :src="activeSong?.src"
      @play="playing = true"
      @pause="playing = false"
      @ended="nextSong()"
    />

    <div class="albums-queue">
      <template v-for="(album, albumIndex) of albumsQueue">
        <div v-if="'error' in album" class="albums-queue--error" :key="album.ocaid">
          Error loading album (<a :href="`https://archive.org/details/${album.ocaid}`" target="_blank">Details</a>)
        </div>
        <AlbumsQueueAlbum
          v-else
          :key="album.ocaid"
          :album="album"
          :tracklist="filterTrackList(album.tracklist)"
        >
          <template #post-controls>
            <button @click="jumpToSong(0, albumIndex)">Play</button>
          </template>
        </AlbumsQueueAlbum>
      </template>
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

    <transition name="fade">
      <div v-if="drawerOpen" class="drawer-screen" @click="closeDrawers" />
    </transition>

    <transition name="slide-fade">
      <div v-if="settingsDrawerOpen" class="settings-drawer">
        <header>
          <button @click="settingsDrawerOpen = false">
            «
            <h2>Settings</h2>
          </button>
        </header>
        <main>
          <section>
            <h3>Queue</h3>
            <label>
              <input type="radio" value="ocaids" v-model="queueSource" />
              Play a specific list of IA identifiers
              <br />
              <textarea
                class="ocaid-input"
                v-model="ocaid"
                placeholder="IA ids"
              />
            </label>
            <label>
              <input type="radio" value="query" v-model="queueSource" />
              Play results of an IA query (alpha)
              <input
                type="text"
                class="query-input"
                v-model.lazy="query"
                placeholder="IA Query"
              />
              <label>
                Sort:
                <label>
                  <input type="radio" value="" v-model="querySort" />Relevance
                </label>
                <label>
                  <input
                    type="radio"
                    value="downloads desc"
                    v-model="querySort"
                  />Views
                </label>
                <label>
                  <input
                    type="radio"
                    value="date desc"
                    v-model="querySort"
                  />Date published (newest)</label
                >
                <label>
                  <input
                    type="radio"
                    value="publicdate desc"
                    v-model="querySort"
                  />Date archived (newest)</label
                >
                <label>
                  <input
                    type="radio"
                    value="reviewdate desc"
                    v-model="querySort"
                  />Recently Reviewed</label
                >
                <label>
                  <input
                    type="radio"
                    value="avg_rating desc"
                    v-model="querySort"
                  />Top rated</label
                >
                <label>
                  <input type="radio" v-model="querySort" :value="querySort" />
                  Custom: <input type="text" v-model="querySort" />
                </label>
              </label>
            </label>

            <button @click="loadAlbumsQueue()">Load Queue</button>
          </section>

          <hr />
          <section>
            <h3>Preferred Track Quality</h3>
            <small
              >Some tracks have been digitally restored for better
              quality.</small
            >
            <br />
            <label>
              <input type="radio" v-model="preferredQuality" value="restored" />
              Restored
            </label>
            <br />
            <label>
              <input
                type="radio"
                v-model="preferredQuality"
                value="unrestored"
              />
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
          </section>

          <hr />
          <section>
            <h3>About</h3>
            A little record player. Powered by
            <a href="https://archive.org">Internet Archive</a>'s record
            collection. The beautiful record player video is
            <a
              href="https://pixabay.com/videos/record-player-vinyl-retro-record-38392/"
              >Record Player 38392</a
            >
            by
            <a href="https://pixabay.com/users/matthias_groeneveld-4535957"
              >Matthias Groeneveld</a
            >. The code is available on GitHub:
            <a href="https://github.com/cdrini/rplayer"
              >github.com/cdrini/rplayer</a
            >.
          </section>

          <hr />
          <details>
            <summary>Dev Controls</summary>

            <label>
              Min Label Width
              <NumberInput :step="1" :min="0" :max="500" v-model="minLabelWidth" />
            </label>

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
    </transition>

    <div class="center-toolbar">
      <ChunkyButton v-if="!playing" @click="$refs.aplayer.play()">
        <template #label>Play</template>
      </ChunkyButton>
    </div>
  </div>
</template>

<script>
import chunk from "lodash/chunk";
import shuffle from "lodash/shuffle";
import PointInput from "./components/PointInput";
import NumberInput from "./components/NumberInput";
import AlbumsQueueAlbum from "./components/AlbumsQueueAlbum";
import RecordPlayer from "./components/RecordPlayer";
import SettingsIcon from "./components/icons/SettingsIcon";
import ChunkyButton from "./components/ChunkyButton";
import Vue from "vue";
import {findRecordLabelPosition} from './utils/imageUtils';
import {Album} from './models';
/** @typedef {import('./models').ErrorAlbum} ErrorAlbum */


function updateToHash(data) {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  if (data.queueSource == "query") {
    hashParams.set("query", data.query);
    if (data.querySort) hashParams.set("querySort", data.querySort);
    hashParams.delete("ocaid");
  } else {
    if (data.ocaid) {
      hashParams.set("ocaid", data.ocaid);
      hashParams.delete("query");
      hashParams.delete("querySort");
    }
  }
  window.location.hash = hashParams.toString();
}

function updateFromHash(data) {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  if (hashParams.get("ocaid") && hashParams.get("ocaid") !== data.ocaid)
    data.ocaid = hashParams.get("ocaid");
  if (hashParams.get("query") && hashParams.get("query") !== data.query)
    data.query = hashParams.get("query");
  if (hashParams.has("ocaid")) data.queueSource = 'ocaids';
  else if (hashParams.has("query")) data.queueSource = 'query';
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
    const data = {
      // Queue stuff
      activeSongIndex: 0,
      activeAlbumIndex: 0,

      /** @type {'ocaids' | 'query'} */
      queueSource: "ocaids",
      query: "collection:georgeblood",
      querySort: "",
      ocaid:
        "78_pomp-and-circumstance_chicago-symphony-orchestra-sir-edward-elgar-frederick-stock_gbia7035420b",

      /** @type {'restored' | 'unrestored' | 'both'} */
      preferredQuality: "restored",

      settingsDrawerOpen: false,

      showRegions: false,
      videoWidth: 300,
      videoHeight: 300,
      playing: false,

      rpm: 33,

      minLabelWidth: 176,
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

      /** @type {Array<Album | ErrorAlbum>} */
      albumsQueue: [],

      /** @type {string?} */
      lastHash: null,
    };

    updateFromHash(data);
    return data;
  },
  mounted() {
    window.addEventListener("hashchange", this.updateFromHash, false);
    this.updateFromHash();
    this.loadAlbumsQueue();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.updateFromHash);
  },
  computed: {
    activeTrackList() {
      if (!this.activeAlbum) return [];
      return this.filterTrackList(this.activeAlbum.tracklist);
    },
    activeSong() {
      return this.activeTrackList?.[this.activeSongIndex];
    },
    activeAlbum() {
      return this.albumsQueue[this.activeAlbumIndex];
    },

    drawerOpen() {
      return this.settingsDrawerOpen;
    },
    cycleLength() {
      return 1 / (this.rpm / 60);
    },
    labelSource() {
      return this.activeSong?.labelSource || this.activeAlbum?.labelSource;
    },
    labelCoords() {
      // we position it so that the two pins are in the same place on the canvas
      const videoPin = this.videoUnitCoordToCanvasCoord(this.videoRegions.pin);
      const curLabelPosition = this.activeSong?.labelPosition || this.activeAlbum?.labelPosition;
      const labelPin = {
        x: (curLabelPosition ? curLabelPosition.center.x : this.labelRegions.pin.x) * this.labelPosition.width,
        y: (curLabelPosition ? curLabelPosition.center.y : this.labelRegions.pin.y) * this.labelPosition.height,
      };
      const labelOffset = {
        x: videoPin.x - labelPin.x,
        y: videoPin.y - labelPin.y,
      };

      return Object.assign({}, this.labelPosition, labelOffset, {
        cx: labelOffset.x + labelPin.x,
        cy: labelOffset.y + labelPin.y,
        rx: curLabelPosition ? (curLabelPosition.radius * this.labelPosition.width + 5) : (this.labelPosition.width / 2 - this.labelPosition.clipPadding),
        ry: curLabelPosition ? (curLabelPosition.radius * this.labelPosition.width + 5) : (this.labelPosition.height / 2 - this.labelPosition.clipPadding),
      });
    },
  },
  watch: {
    activeSong(song) {
      if (song) {
        this.preloadTrack(song);
        this.updateMediaSession(song);
      }
      this.preloadNext();
    },
    playing(newVal) {
      if (newVal) this.$refs.recordPlayer?.play();
      else this.$refs.recordPlayer?.pause();
    },
  },
  methods: {
    updateToHash() {
      updateToHash(this);
      this.lastHash = window.location.hash;
    },
    updateFromHash() {
      if (this.lastHash != window.location.hash) {
        updateFromHash(this);
        this.loadAlbumsQueue();
      }
    },

    async loadAlbumsQueue() {
      this.updateToHash();

      /** @type {string[]} */
      let ocaids = [];
      if (this.queueSource == "query") {
        // e.g. https://archive.org/advancedsearch.php?q=christmas+collection%3Ageorgeblood&fl[]=identifier&rows=50&page=1&output=json
        const results = await fetch(
          `https://archive.org/advancedsearch.php?${new URLSearchParams({
            q: this.query,
            page: 1,
            rows: 25,
            output: "json",
            // only fetch identifier; then fetch the metadata for each
            "fl[]": "identifier",
            "sort[]": this.querySort,
          })}`
        ).then((r) => r.json());
        ocaids = results.response.docs.map((d) => d.identifier);
      } else if (this.queueSource == "ocaids") {
        if (!this.ocaid) {
          this.albumsQueue = [];
          return;
        }
        ocaids = this.ocaid.split(/[,|;\n]/gm);
      } else {
        throw new Error(`Unexpected queueSource: ${this.queueSource}`);
      }

      const chunks = chunk(ocaids, 5);
      let albumsReset = false;
      for (const ch of chunks) {
        const albums = await Promise.all(ch.map(Album.fromOcaid));
        if (!albumsReset) {
          this.activeAlbumIndex = 0;
          this.activeSongIndex = 0;
          this.albumsQueue = albums;
          albumsReset = true;
        } else {
          this.albumsQueue.push(...albums);
        }
      }
    },

    updateMediaSession(song) {
      if (!window.MediaMetadata) return;
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album,
        artwork: song.artwork,
      });
      const atStart = this.activeSongIndex == 0 && this.activeAlbumIndex == 0;
      const atEnd =
        this.activeSongIndex == this.activeTrackList.length - 1 &&
        this.activeAlbumIndex == this.albumsQueue.length - 1;
      navigator.mediaSession.setActionHandler(
        "previoustrack",
        atStart ? null : this.prevSong
      );
      navigator.mediaSession.setActionHandler(
        "nexttrack",
        atEnd ? null : this.nextSong
      );
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

    async loadAndPlay() {
      this.activeSong && await this.preloadTrack(this.activeSong);
      this.$refs.aplayer?.load();
      this.$refs.aplayer?.addEventListener(
        "loadedmetadata",
        () => {
          this.$refs.aplayer.play();
        },
        { once: true }
      );
    },

    async preloadTrack(track) {
      track._preloadPromise ||= this._preloadTrack(track);
      await track._preloadPromise;
    },

    async _preloadTrack(track) {
      if (track.labelThumbSource) {
        console.log('PRELOAD', track.title);
        Vue.set(track, 'labelPosition', await findRecordLabelPosition(track.labelThumbSource));
      }
    },

    preloadNext() {
      let nextTrack = this.peekSong(this.activeSongIndex + 1);
      if (!nextTrack) {
        // TODO: Get next album
        return;
      }
      this.preloadTrack(nextTrack);
    },

    jumpToSong(songIndex, albumIndex = this.activeAlbumIndex) {
      this.activeAlbumIndex = albumIndex;
      const album = this.albumsQueue[albumIndex];
      const tracks = this.filterTrackList(album.tracklist);
      this.activeSongIndex =
        songIndex < 0 ? tracks.length + songIndex : songIndex;
      this.loadAndPlay();
    },

    peekSong(songIndex, albumIndex = this.activeAlbumIndex) {
      const album = this.albumsQueue[albumIndex];
      if (!album) return;
      const tracks = this.filterTrackList(album.tracklist);
      return tracks[songIndex < 0 ? tracks.length + songIndex : songIndex];
    },

    nextSong() {
      if (!this.peekSong(this.activeSongIndex + 1)) {
        // out! Try to go to next album
        this.nextAlbum();
      } else {
        this.jumpToSong(this.activeSongIndex + 1);
      }
    },
    prevSong() {
      if (this.activeSongIndex == 0) {
        // out! Try to go to next album
        this.prevAlbum();
      } else {
        this.jumpToSong(this.activeSongIndex - 1);
      }
    },

    nextAlbum() {
      for (let i = this.activeAlbumIndex + 1; i < this.albumsQueue.length; i++) {
        const album = this.albumsQueue[i];
        if (!album.error && this.peekSong(0, i)) {
          this.jumpToSong(0, i);
          return;
        }
      }
    },
    prevAlbum() {
      for (let i = this.activeAlbumIndex - 1; i >= 0; i--) {
        const album = this.albumsQueue[i];
        if (!album.error && this.peekSong(0, i)) {
          this.jumpToSong(0, i);
          return;
        }
      }
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

body {
  overflow: hidden;
}
#app {
  font-family: "Roboto", "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

.record-player {
  user-select: none;
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
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  white-space: pre;
}

.ocaid-input {
  min-height: 200px;
}

button {
  cursor: pointer;
}

button:hover {
  opacity: 1;
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
  position: fixed;
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

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition-property: transform, opacity;
  transition-duration: 0.2s;
}
.slide-fade-enter-active {
  transition-timing-function: ease-in;
}
.slide-fade-leave-active {
  transition-timing-function: ease-out;
}
.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
  transition-duration: 0.2s;
}
.fade-enter-active {
  transition-timing-function: ease-in;
}
.fade-leave-active {
  transition-timing-function: ease-out;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.albums-queue--error {
  max-width: 600px;
  background: rgba(255, 0, 0, 0.1);
  padding: 8px;
  border: 1px solid rgba(255, 0, 0, 0.5);
  border-radius: 8px;
  margin: 10px auto;
  margin-top: 30px;
}

.albums-queue--error + .albums-queue--error {
  margin-top: 10px;
}

.albums-queue--error:has(+ :not(.albums-queue--error)) {
  margin-bottom: 30px;
}
</style>
