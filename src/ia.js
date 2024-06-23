// @ts-check

/**
 * @typedef {Object} IAMetadata
 * Stub of the fields that are returned by the IA metadata API,
 * containing mainly the fields that are used in the app.
 * 
 * @property {string} identifier The IA identifier (e.g. `goody`)
 * @property {string} title
 */

/**
 * @typedef {Object} IAFullMetadata
 * Full metadata returned by the IA metadata API, including files, etc.
 * Note only defining the fields that are used in the app.
 * @property {IAMetadata} metadata
 * @property {IAMetadataFile[]} files
 * @property {number} files_count
 */

/**
 * @typedef {Object} IAMetadataFileBase
 * @property {string} name
 * @property {'original' | 'derivative' | 'metadata'} source
 * @property {string} mtime (e.g. "1658004731")
 * @property {string} size
 * @property {string} format
 * @property {string | undefined} original
 */

/**
 * @typedef {object} _IAMetadataFileAudioProperties
 * @property {string} [title]
 * @property {string} [track] (e.g. "01")
 * @property {string} [creator]
 * @property {string} [album]
 * @property {string} [artist]
 * @property {string} length (e.g. "271.84")
 */

/**
 * @typedef {object} _IAMetadataFileArchiveProperties
 * @property {string} filecount
 */

/** @typedef {IAMetadataFileBase & _IAMetadataFileAudioProperties} IAMetadataFileAudio */
/** @typedef {IAMetadataFileBase & _IAMetadataFileArchiveProperties} IAMetadataFileArchive */

/** @typedef {IAMetadataFileArchive | IAMetadataFileAudio} IAMetadataFile */

/**
 * @param {string} ocaid Internet archive identifier (e.g. `goody`)
 * @returns {Promise<IAFullMetadata>}
 */
export async function fetchMetadata(ocaid) {
    return fetch(`https://archive.org/metadata/${ocaid}`).then((r) => r.json());
}
