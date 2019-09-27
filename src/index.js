import path from 'path';

import validateOptions from 'schema-utils';

import { formatSize, logMessage, hasOwnProperty } from './utils';

import schema from './options.json';

class ChunkRestrictionPlugin {
	constructor(opts = {}) {
		validateOptions(schema, opts, 'Chunk Restriction Plugin');
		this.opts = opts || {};
		this.handleHook = this.handleHook.bind(this);
	}

	static buildManifest(compilation, assetsMeta) {
		const manifest = {};
		compilation.chunks.forEach((chunk) => {
			if (!chunk.name) {
				return;
			}
			manifest[chunk.name] = {};
			for (let i = 0, len = chunk.files.length; i < len; i++) {
				switch (path.extname(chunk.files[i])) {
					case '.css':
					case '.scss':
						manifest[chunk.name].css = { file: chunk.files[i] };
						break;
					case '.js':
						manifest[chunk.name].js = { file: chunk.files[i] };
						break;
					default:
						break;
				}
			}
		});
		for (const chunkName in manifest) {
			if (hasOwnProperty(manifest, chunkName)) {
				if (
					!!manifest[chunkName].css &&
					manifest[chunkName].css.file &&
					hasOwnProperty(assetsMeta, manifest[chunkName].css.file)
				) {
					manifest[chunkName].css.size =
						assetsMeta[manifest[chunkName].css.file].size;
				}
				if (
					!!manifest[chunkName].js &&
					manifest[chunkName].js.file &&
					hasOwnProperty(assetsMeta, manifest[chunkName].js.file)
				) {
					manifest[chunkName].js.size =
						assetsMeta[manifest[chunkName].js.file].size;
				}
			}
		}
		return manifest;
	}

	handleHook(compilation) {
		const restrictions = this.opts.restrictions || {};
		const defaultLogType = this.opts.defaultLogType || 'warning';

		const assetsMeta = {};
		for (const asset in compilation.assets) {
			if (hasOwnProperty(compilation.assets, asset)) {
				assetsMeta[asset] = {
					size: compilation.assets[asset].size(),
					emitted: compilation.assets[asset].emitted
				};
			}
		}

		const manifest = this.buildManifest(compilation, assetsMeta);

		restrictions.forEach((restriction) => {
			if (
				typeof restriction.jsSize === 'number' &&
				restriction.jsSize < manifest[restriction.chunkName].js.size
			) {
				logMessage(
					restriction.logType || defaultLogType,
					`${
						restriction.chunkName
					} js chunk is exceeding the set threshold of ${
						restriction.jsSize
					} by ${formatSize(
						manifest[restriction.chunkName].js.size - restriction.jsSize
					)}`,
					compilation
				);
			}
			if (
				typeof restriction.cssSize === 'number' &&
				restriction.cssSize < manifest[restriction.chunkName].css.size
			) {
				logMessage(
					restriction.logType || defaultLogType,
					`${
						restriction.chunkName
					} css chunk is exceeding the set threshold of ${
						restriction.cssSize
					} by ${formatSize(
						manifest[restriction.chunkName].css.size - restriction.cssSize
					)}`,
					compilation
				);
			}
		});
	}

	apply(compiler) {
		if ('hooks' in compiler) {
			compiler.hooks.shouldEmit.tap('ChunkRestrictionPlugin', this.handleHook);
		} else {
			compiler.plugin('should-emit', this.handleHook);
		}
	}
}

module.exports = ChunkRestrictionPlugin;
