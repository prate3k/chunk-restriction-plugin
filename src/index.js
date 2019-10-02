import validateOptions from 'schema-utils';

import { formatSize, logMessage, hasOwnProperty, buildManifest } from './utils';

import schema from './options.json';

class ChunkRestrictionPlugin {
	constructor(opts = {}) {
		this.opts = opts || {};
		validateOptions(schema, this.opts, 'Chunk Restriction Plugin');
		this.handleHook = this.handleHook.bind(this);
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

		const manifest = buildManifest(compilation, assetsMeta);

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

export default ChunkRestrictionPlugin;
