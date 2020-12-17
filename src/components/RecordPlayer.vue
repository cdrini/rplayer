<template>
  <div class="video-wrapper" ref="root">
    <video
      ref="video"
      xmlns="http://www.w3.org/1999/xhtml"
      src="/Record%20Player%20-%2038392.mp4"
      style="width: 100%"
      loop
      muted
      @loadedmetadata="$emit('loadedmetadata', $event)"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
    />
    <svg
      :viewBox="`0 0 ${videoWidth} ${videoHeight}`"
      style="cursor: pointer"
      @click="playing ? pause() : play()"
    >
      <defs>
          <mask id="label-mask">
            <ellipse
              fill="white"
              :cx="labelCoords.cx"
              :cy="labelCoords.cy"
              :rx="labelCoords.rx"
              :ry="labelCoords.ry"
            />
            <ellipse
              fill="black"
              :cx="labelCoords.cx"
              :cy="labelCoords.cy"
              :rx="6"
              :ry="6"
            />
          </mask>

          <mask id="record-player-obsturction">
            <rect width="100%" height="100%" fill="white" />
            <path
              fill="black"
              style="filter: blur(2px)"
              d="m 321.53321,71.993932 14.44116,0.312257 1.29192,2.723163 44.36726,-0.324629 1.06323,4.087345 435.27091,1.106808 0.56081,1.338234 60.63899,0.09581 0.95155,-4.475101 42.66908,-0.188666 2.22057,-2.262169 15.83955,-0.427756 11.49884,543.390502 -643.4237,1.94874 z"
            />
          </mask>

          <mask id="background-record-mask">
            <rect
              width="100"
              height="100"
              style="fill: white; filter: blur(0.5px)"
            />
          </mask>

          <linearGradient id="shadow-gradient">
            <stop offset="0" style="stop-fill: black; stop-opacity: 1" />
            <stop offset="1" style="stop-fill: black; stop-opacity: 0" />
          </linearGradient>

          <radialGradient
            id="record-player-shadow"
            gradientUnits="userSpaceOnUse"
            gradientTransform="matrix(1.6024561,-0.78916575,0.57731892,1.1723708,-830.73545,659.05402)"
            r="241.28072"
            fy="470.43475"
            fx="952.91327"
            cy="470.43475"
            cx="952.91327"
            href="#shadow-gradient"
          />
        </defs>
        <g class="video-regions" v-if="showRegions">
          <ellipse
            fill="red"
            :cx="videoUnitCoordToCanvasCoord(videoRegions.pin).x"
            :cy="videoUnitCoordToCanvasCoord(videoRegions.pin).y"
            rx="5"
            ry="5"
          />
        </g>

        <g
          v-if="backgroundRecords.length"
          class="background-records-layer"
          mask="url(#record-player-obsturction)"
        >
          <g class="background-records">
            <a
              class="background-record"
              transform="matrix(3.6803983,-2.3394427,2.3394427,3.6803983,18.455985,-53.349974)"
              :href="`#ocaid=${backgroundRecords[12]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMax meet"
                :href="`https://archive.org/download/${backgroundRecords[12]}/${backgroundRecords[12]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.4124285,-0.48897121,0.48897121,4.4124285,958.88356,478.19657)"
              :href="`#ocaid=${backgroundRecords[5]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[5]}/${backgroundRecords[5]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(-0.12717073,-4.4376173,4.4376173,-0.12717073,913.5741,653.32312)"
              :href="`#ocaid=${backgroundRecords[6]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[6]}/${backgroundRecords[6]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.2566704,0.94819885,-0.94819885,4.2566704,376.8816,-391.54565)"
              :href="`#ocaid=${backgroundRecords[11]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMax meet"
                :href="`https://archive.org/download/${backgroundRecords[11]}/${backgroundRecords[11]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(3.1021782,-3.2614561,3.2614561,3.1021782,542.695,-109.05265)"
              :href="`#ocaid=${backgroundRecords[10]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMax meet"
                :href="`https://archive.org/download/${backgroundRecords[10]}/${backgroundRecords[10]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.4316424,-0.26299094,0.26299094,4.4316424,894.00036,49.550936)"
              :href="`#ocaid=${backgroundRecords[8]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[8]}/${backgroundRecords[8]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(3.7144129,2.5423893,-2.5423893,3.7144129,1302.2755,-312.7138)"
              :href="`#ocaid=${backgroundRecords[9]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMax meet"
                :href="`https://archive.org/download/${backgroundRecords[9]}/${backgroundRecords[9]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.1952754,-1.4519927,1.4519927,4.1952754,1122.3047,331.49099)"
              :href="`#ocaid=${backgroundRecords[7]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[7]}/${backgroundRecords[7]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.4124285,-0.48897121,0.48897121,4.4124285,512.45499,531.05371)"
              :href="`#ocaid=${backgroundRecords[4]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[4]}/${backgroundRecords[4]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(3.9649807,-2.1238039,2.1238039,3.9649807,121.8584,624.03177)"
              :href="`#ocaid=${backgroundRecords[2]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[2]}/${backgroundRecords[2]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.3311581,1.2135433,-1.2135433,4.3311581,403.52856,438.85555)"
              :href="`#ocaid=${backgroundRecords[3]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[3]}/${backgroundRecords[3]}_itemimage.jpg`"
              />
            </a>

            <a
              class="background-record"
              transform="matrix(4.3054209,1.3019086,-1.3019086,4.3054209,-108.7461,219.55149)"
              :href="`#ocaid=${backgroundRecords[1]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMin meet"
                :href="`https://archive.org/download/${backgroundRecords[1]}/${backgroundRecords[1]}_itemimage.jpg`"
              />
            </a>
            <a
              class="background-record"
              transform="matrix(3.6791067,-2.2481018,2.2481018,3.6791067,-231.29385,117.76111)"
              :href="`#ocaid=${backgroundRecords[0]}`"
            >
              <image
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMax meet"
                :href="`https://archive.org/download/${backgroundRecords[0]}/${backgroundRecords[0]}_itemimage.jpg`"
              />
            </a>
          </g>
          <g class="lighting-effects">
            <path
              style="
                filter: blur(4px);
                fill: url(#record-player-shadow);
                pointer-events: none;
                opacity: 0.5;
              "
              d="m 943.57143,560 c 0,0 209.99997,-15.71428 250.71427,-9.28571 40.7143,6.42857 117.1429,-29.28572 117.1429,-29.28572 L 1393.5714,298.57143 1067.1429,72.857143 912.14286,98.571429 Z"
            />
          </g>
        </g>

        <g class="label-layer">
          <image
            :x="labelCoords.x"
            :y="labelCoords.y"
            :width="labelCoords.width"
            :height="labelCoords.height"
            :href="labelSource"
            mask="url(#label-mask)"
            :style="{
              animation: playing
                ? `rotating ${cycleLength}s linear infinite`
                : '',
              opacity: labelPosition.opacity,
              transformOrigin: [
                labelCoords.cx + 'px',
                labelCoords.cy + 'px',
              ].join(' '),
            }"
          />
        </g>
        <g class="label-regions" v-if="showRegions">
          <ellipse
            fill="blue"
            :cx="this.labelCoords.cx"
            :cy="this.labelCoords.cy"
            rx="5"
            ry="5"
          />
        </g>
      </svg>
    </div>
</template>

<script>
export default {
  props: {
    videoWidth: {
      type: Number,
      required: true,
    },
    videoHeight: {
      type: Number,
      required: true,
    },
    cycleLength: {
      type: Number,
      required: true,
    },

    showRegions: {
      default: false,
    },
    videoRegions: {
      type: Object,
      required: true,
    },
    labelRegions: {
      type: Object,
      required: true,
    },


    labelCoords: {
      type: Object,
      required: true,
    },
    labelPosition: {
      type: Object,
      required: true,
    },
    labelSource: {
      type: String,
      require: true,
    },

    backgroundRecords: {
      type: Array,
      require: true,
    }
  },

  data() {
    return {
      playing: false
    }
  },

  methods: {
    play() {
      this.$emit('play');
      this.$refs.video?.play();
    },
    pause() {
      this.$emit('pause');
      this.$refs.video?.pause();
    }
  },
};
</script>

<style>
svg {
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

a.background-record {
  filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.5));
  
}
a.background-record image {
  mask: url(#background-record-mask);
  transition: filter 0.5s;
}

a.background-record:hover image {
  filter: brightness(1.2);
}
</style>