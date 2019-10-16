import validateOptions from 'schema-utils';

import {
	formatSize,
	logMessage,
	hasOwnProperty,
	buildChunkStatsJson,
	parseHumanReadableSizeToByte,
	replaceMessagePlaceholder
} from './utils';

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
		const { defaultLogMessageFormat } = this.opts;

		const assetsMeta = {};
		for (const asset in compilation.assets) {
			if (hasOwnProperty(compilation.assets, asset)) {
				assetsMeta[asset] = {
					size: compilation.assets[asset].size(),
					emitted: compilation.assets[asset].emitted
				};
			}
		}

		const manifest = buildChunkStatsJson(compilation, assetsMeta);
		restrictions.forEach((restriction) => {
			if (typeof restriction.jsSize === 'string' && !!restriction.jsSize) {
				const jsNumberParser = parseHumanReadableSizeToByte(restriction.jsSize);
				const jsSize = jsNumberParser.parsedBytes;
				if (jsNumberParser.invalid) {
					logMessage('error', jsNumberParser.message, compilation);
				}
				if (
					!jsNumberParser.invalid &&
					typeof jsSize === 'number' &&
					jsSize < manifest[restriction.chunkName].js.size
				) {
					logMessage(
						restriction.logType || defaultLogType,
						replaceMessagePlaceholder(
							{
								chunkName: restriction.chunkName,
								ext: 'js',
								totalSize: formatSize(manifest[restriction.chunkName].js.size),
								difference: formatSize(
									manifest[restriction.chunkName].js.size - jsSize
								),
								restriction: formatSize(jsSize)
							},
							restriction.logMessageFormat || defaultLogMessageFormat
						),
						compilation
					);
				}
			}

			if (typeof restriction.cssSize === 'string' && !!restriction.cssSize) {
				const cssNumberParser = parseHumanReadableSizeToByte(
					restriction.cssSize
				);
				const cssSize = cssNumberParser.parsedBytes;
				if (cssNumberParser.invalid) {
					logMessage('error', cssNumberParser.message, compilation);
				}
				if (
					!cssNumberParser.invalid &&
					typeof cssSize === 'number' &&
					cssSize < manifest[restriction.chunkName].css.size
				) {
					logMessage(
						restriction.logType || defaultLogType,
						replaceMessagePlaceholder(
							{
								chunkName: restriction.chunkName,
								ext: 'css',
								totalSize: formatSize(manifest[restriction.chunkName].css.size),
								difference: formatSize(
									manifest[restriction.chunkName].css.size - cssSize
								),
								restriction: formatSize(cssSize)
							},
							restriction.logMessageFormat || defaultLogMessageFormat
						),
						compilation
					);
				}
			}
		});
	}

	apply(compiler) {
		if ('hooks' in compiler) {
			compiler.hooks.afterEmit.tap('ChunkRestrictionPlugin', this.handleHook);
		} else {
			compiler.plugin('after-emit', this.handleHook);
		}
	}
}

export default ChunkRestrictionPlugin;
