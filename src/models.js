// @ts-check
import { fetchMetadata } from "./ia";
/** @typedef {import('./ia').IAFullMetadata} IAFullMetadata */
/** @typedef {import('./ia').IAMetadataFile} IAMetadataFile */
/** @typedef {import('./ia').IAMetadataFileBase} IAMetadataFileBase */
/** @typedef {import('./ia').IAMetadataFileArchive} IAMetadataFileArchive */
/** @typedef {import('./ia').IAMetadataFileAudio} IAMetadataFileAudio */
import {findRecordLabelPosition} from './utils/imageUtils';

/**
 * @typedef {object} ErrorAlbum
 * @property {string} ocaid
 * @property {IAFullMetadata} metadata
 * @property {string} error
 */


export class Album {
  /**
   * @param {object} opts
   * @param {string} opts.ocaid
   * @param {IAFullMetadata} opts.metadata
   * @param {ReturnType<extractTrackList>} opts.tracklist
   * @param {Awaited<ReturnType<findRecordLabelPosition>>} opts.labelPosition
   */
  constructor(opts) {
    /** @type {string} Internet archive identifier (e.g. `goody`) */
    this.ocaid = opts.ocaid;
    /** @type {IAFullMetadata} */
    this.metadata = opts.metadata;
    /** @type {ReturnType<extractTrackList>} */
    this.tracklist = opts.tracklist;
    this.labelSource = `https://archive.org/download/${this.ocaid}/${this.ocaid}_itemimage.jpg`
    /** @type {Awaited<ReturnType<findRecordLabelPosition>>} */
    this.labelPosition = opts.labelPosition;
    this.hasCover = Boolean(this.tracklist[0]?.labelSource);
  }

  /**
   * @param {string} ocaid Internet archive identifier (e.g. `goody`)
   * @returns {Promise<Album | ErrorAlbum>}
   */
  static async fromOcaid(ocaid) {
    const metadata = await fetchMetadata(ocaid);
    if (!metadata.files) {
      return { ocaid, metadata, error: 'No files in item.' };
    }
    const tracklist = extractTrackList(metadata);
    if (!tracklist.length) {
      return { ocaid, metadata, error: 'Unable to find any tracks.' };
    }
    const thumb = `https://archive.org/cors/${ocaid}/__ia_thumb.jpg`;
    const labelPosition = await findRecordLabelPosition(thumb);
    return new Album({
      ocaid,
      metadata,
      tracklist,
      labelPosition,
    });
  }
}


/**
 * @param {IAFullMetadata} metadata
 */
function extractTrackList(metadata) {
  const ocaid = metadata.metadata.identifier;

  /**
   * @param {IAMetadataFile} file
   */
  const get_original = (file) =>
    file.source === "original"
      ? file
      : metadata.files.find((f) => f.name === file.original);

  /**
   * @param {IAMetadataFileAudio} orig
   */
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

  /**
   * @param {IAMetadataFileAudio} orig
   */
  const get_track = (orig) => {
    const m = orig.name.match(/^_?(\d{2})/);
    return m ? m[1] : orig.track;
  };

  /**
   * @param {IAMetadataFileAudio} f 
   * @returns {'restored' | 'unrestored'}
   */
  const get_quality = (f) => {
    return /restored\.[a-z0-9]+$/.test(f.name) ? "restored" : "unrestored";
  };

  const originals = metadata.files
    .filter((f) => f.source === "original")
    .map((f) => Object.assign({}, f, { deriveds: /** @type {IAMetadataFile[]} */([]) }));
  const deriveds = metadata.files.filter((f) => f.source !== "original");
  // Attach the deriveds to the originals
  deriveds
    .filter((f) => get_original(f))
    .forEach((f) => {
      const orig = get_original(f);
      if (!orig) {
        throw new Error(`Could not find original for ${f.name}`);
      }
      const original = originals.find((o) => o.name == orig.name);
      // Some PDFs/JSON can have a chain of deriveds!
      if (original) {
        original.deriveds.push(f);
      }
    });

  const getAudioOriginals = () => {
    const originalsByTitle = originals.filter(f => 'title' in f && !f.name.startsWith("history/"));
    if (originalsByTitle.length) {
      return originalsByTitle;
    }

    // If no titles, then we have to guess based on the length.
    return originals.filter(f => 'length' in f && !f.name.startsWith("history/"));
  };
  
  const audioOriginals = getAudioOriginals();

  const tracklist = audioOriginals
    // .filter(f => get_quality(f) == this.quality)
    .map((orig) => {
      const mp3 = orig.deriveds.find((f) => f.name.endsWith(".mp3"));
      if (!('length' in orig)) {
        throw new Error(`Missing length in ${orig.name}`);
      }
      return {
        // title: orig.title.replace(/ \(restored\)$/, ''),
        title: orig.title || orig.name.replace(/\.[^.]+$/, ''),
        quality: get_quality(orig),
        src: mp3 ? `https://archive.org/download/${ocaid}/${mp3.name}` : null,
        artist: get_artist(orig),
        track: get_track(orig),
        album: metadata.metadata.title,
        artwork: [
          {
            src: `https://archive.org/download/${ocaid}/${ocaid}_itemimage.jpg`,
            sizes: null,
            type: "image/jpg",
          },
          {
            src: `https://archive.org/download/${ocaid}/__ia_thumb.jpg`,
            sizes: "180x180",
            type: "image/jpg",
          },
        ],
        duration: orig.length ? parseFloat(orig.length) : null,
        original: orig,
        hasRestoredCopy: false,
        hasUnrestoredCopy: false,
        /** @type {string?} */
        labelSource: null,
        /** @type {string?} */
        labelThumbSource: null,
      };
    });
  tracklist.forEach((track) => {
    if (track.quality === "restored") {
      // See if it has an un-restored version
      const unrestoredCandidates = tracklist.filter(
        (t2) => (
          (t2.track == track.track)
          || (track.title.toLocaleLowerCase().replace('(restored)', '').trim() == t2.title.toLocaleLowerCase().trim())
        ) && t2 != track
      );
      if (unrestoredCandidates.length) {
        track.hasUnrestoredCopy = true;
        unrestoredCandidates.forEach(t => t.hasRestoredCopy = true);
      }
      // otherwise all false (show twice)
    }
  });

  // We want to see if we can get the record covers.

  // Test:
  // let n be the number of tracks.
  // If (1) a _jp2.zip file exists and (2) it has n + 1 images (1 for the cover),
  // then assume everything maps.
  // Examples:
  // - 78_pomp-and-circumstance_chicago-symphony-orchestra-sir-edward-elgar-frederick-stock_gbia7035420b
  const track_count = Math.max(
    tracklist.filter(t => t.quality == 'restored').length,
    tracklist.filter(t => t.quality == 'unrestored').length,
  );
  if (track_count > 2) {
    const jp2_zip_name = `${ocaid}_jp2.zip`;
    const file_metadata = metadata.files.find(f => f.name == jp2_zip_name);
    if (file_metadata) {
      if (!('filecount' in file_metadata)) {
        throw new Error('Missing filecount in jp2.zip metadata.')
      }
      const jp2_count = parseFloat(file_metadata.filecount);
      // If +1, only has cover at start
      // If +2, also has back cover at end, but the offset is still the same
      if (jp2_count >= track_count + 1) {
        // We have a cover and a record label for each track listing!
        tracklist.forEach((track, i) => {
          const src = `https://archive.org/cors/${ocaid}/${ocaid}_jp2.zip/${ocaid}_jp2%2F${ocaid}_${(i + 1).toString().padStart(4, '0')}.jp2&ext=jpg`
          track.labelSource = src + '&reduce=2';
          track.labelThumbSource = src + '&reduce=4';
        });
      }
    }
  }
  return tracklist;
}