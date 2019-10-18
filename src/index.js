import validateOptions from 'schema-utils';

import { hasOwnProperty, buildChunkStatsJson, performCheck } from './utils';

import schema from './options.json';

export class LogMessage {
	constructor() {
		this.warnings = '';
		this.errors = '';
	}
	pushMessage(type, msg) {
		if (type === 'warning') {
			this.warnings += `- ${msg}\n\n`;
		} else {
			this.errors += `- ${msg}\n\n`;
		}
	}
	logMessage(compilation) {
		if (this.warnings && this.warnings.length > 0) {
			compilation.warnings.push(
				`Chunk Restriction Plugin => \n\n${this.warnings}`
			);
		}
		if (this.errors && this.errors.length > 0) {
			compilation.errors.push(`Chunk Restriction Plugin => \n\n${this.errors}`);
		}
	}
}

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
		const messages = new LogMessage();
		const restrictionParams = [
			{ property: 'jsSize', fileExt: 'js' },
			{ property: 'cssSize', fileExt: 'css' }
		];
		restrictions.forEach((restriction) => {
			const severity = restriction.logType || defaultLogType;
			if (!hasOwnProperty(manifest, restriction.chunkName)) {
				messages.pushMessage(
					severity,
					`[Missing] No chunk with name : "${restriction.chunkName}" present, Either remove the restriction or check if correct chunk name is specified.`
				);
				return;
			}
			restrictionParams.forEach((restrictionParam) => {
				performCheck({
					property: restrictionParam.property,
					fileExt: restrictionParam.fileExt,
					manifest,
					restriction,
					severity,
					messages,
					msgFormat: restriction.logMessageFormat || defaultLogMessageFormat
				});
			});
		});
		messages.logMessage(compilation);
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
