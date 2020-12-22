// @ts-check
import { hsl, rgb } from "d3-color";
import { rev, slidingWindow } from "./iterableUtils";

/**
 * @param {Blob} blob
 * @return {Promise<string>}
 */
async function readBlobAsBase64(blob) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.toString());
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

/**
 * Draw a cross-domain image to a canvas (if the image can be CORS fetched)
 * @param {string} src
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<HTMLImageElement>}
 */
export async function drawImage(src, canvas) {
  const imgBase64 = await fetch(src)
      .then((resp) => resp.blob())
      .then(readBlobAsBase64);
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      canvas.getContext("2d").drawImage(img, 0, 0);
      res(img);
    };
    img.onerror = rej;
    img.src = imgBase64;
  });
}

/**
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 */
const getRGBLightness = (r, g, b) => hsl(rgb(r, g, b)).l;

/**
 * Finds the center/size of the record label given the IA thumbnail link
 * @param {string} imgSrc
 */
export async function findRecordLabelPosition(imgSrc, pixelFunction=getRGBLightness, dataLabeller=recordImageDataLabeller) {
  const c = document.createElement('canvas');
  const ctx = c.getContext("2d");
  
  const img = await drawImage(imgSrc, c);
  c.width = img.width;
  c.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const { floor } = Math;
  const midX = floor(img.width / 2);
  const midY = floor(img.height / 2);
  
  // Check horizontal
  const horizRow = ctx.getImageData(0, midY - 1, img.width, 1);
  const horizontalRowResults = [];
  for (let i = 0; i < img.width; i++) {
      const r = horizRow.data[i * 4 + 0];
      const g = horizRow.data[i * 4 + 1];
      const b = horizRow.data[i * 4 + 2];
      horizontalRowResults.push({ index: i, data: pixelFunction(r, g, b) });
  }

  // Check vertical
  const verticalCol = ctx.getImageData(midX - 1, 0, 1, img.height);
  const verticalColResults = [];
  for (let i = 0; i < img.height; i++) {
      const r = verticalCol.data[i * 4 + 0];
      const g = verticalCol.data[i * 4 + 1];
      const b = verticalCol.data[i * 4 + 2];
      verticalColResults.push({ index: i, data: pixelFunction(r, g, b) });
  }

  dataLabeller(horizontalRowResults);
  dataLabeller(verticalColResults);
  
  /**
   * @param {Array<{data: number, index: number, region?: 'label' | 'record'}>} vals
   * @param {'label' | 'record'} newVal 
   * @param {'label' | 'record'} defaultVal 
   */
  function findStart(vals, newVal, defaultVal) {
      let lastRegion = defaultVal;
      let start = null;
      for (const val of vals) {
      if (val.region === newVal && val.region !== lastRegion) {
          start = val.index;
          break;
      }
      lastRegion = val.region;
      }
      return start;
  }
  
  const labelPosition = {
      xStart:
      findStart(horizontalRowResults.slice(0, midX), "label", "record") ||
      0,
      xEnd:
      findStart(horizontalRowResults.slice(midX), "record", "label") ||
      img.width,
      yStart:
      findStart(verticalColResults.slice(0, midY), "label", "record") || 0,
      yEnd:
      findStart(verticalColResults.slice(midY), "record", "label") ||
      img.height,
  };

  const center = {
      x: (labelPosition.xStart + labelPosition.xEnd) / 2,
      y: (labelPosition.yStart + labelPosition.yEnd) / 2,
  };
  const radius = Math.min(
      Math.abs(center.x - labelPosition.xStart),
      Math.abs(center.x - labelPosition.xEnd),
      Math.abs(center.y - labelPosition.yStart),
      Math.abs(center.y - labelPosition.yEnd)
  );
  
  return {
    center: {
      x: center.x / img.width,
      y: center.y / img.height,
    },
    radius: radius / img.width,
  };
}

/**
 * Where `data` is the lightness
 * @param {Array<{data: number, index: number, region?: 'label' | 'record'}>} vals
 */
function recordImageDataLabeller(vals) {
  // first go forward and find first such jump
  /**
   * @param {Iterable<{data: number, index: number, region?: 'label' | 'record'}>} vals
   * @param {number} factor How much the data must jump by
   * @param {number} window Size of the sliding window within which the data must jump
   * @param {number} sustain How long the jump must be sustained for
   */
  function labelJump(vals, factor, window = 5, sustain = 10) {
    let prev = null;
    let enteredLabel = false;
    let prevWhenEntered = null;
    let sustained = 0;
    let labelLimbo = false;
    let valsInLimbo = [];
    for (let win of slidingWindow(vals, window)) {
      const max = Math.max(...win.map((x) => x.data));
      const min = Math.min(...win.map((x) => x.data));
      for (const val of win) {
        if (val.data > 0.4) {
          enteredLabel = true;
        }
        val.region =
          val.data > 0.4
            ? "label"
            : val.region === "record"
            ? "record"
            : enteredLabel
            ? "label"
            : "record";
        if (labelLimbo) valsInLimbo.push(val);
      }
      if (labelLimbo) {
        if (sustained >= sustain) {
          labelLimbo = false;
        } else {
          const stillHigh = max > factor * prevWhenEntered;
          if (stillHigh) sustained++;
          else {
            // Oh no! Cancel the labelling
            enteredLabel = false;
            labelLimbo = false;
            sustained = 0;
            prevWhenEntered = null;
            valsInLimbo.forEach((v) => (v.region = "record"));
            valsInLimbo = [];
          }
        }
      }
      if (prev != null) {
        const enteringLabel = !enteredLabel && max > factor * prev;
        if (enteringLabel) {
          prevWhenEntered = prev;
          enteredLabel = true;
          labelLimbo = true;
          sustained = 1;
        }
      }
      prev = min;
    }
  }

  labelJump(vals, 2.5);
  labelJump(rev(vals), 2.5);
}
