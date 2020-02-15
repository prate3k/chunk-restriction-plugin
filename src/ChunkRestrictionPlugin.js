import validateOptions from 'schema-utils';

import { PLUGIN_NAME } from './constants';
import { processChunkStats } from './utils';
import Logger from './logger';

import schema from './options.json';

class ChunkRestrictionPlugin {
	constructor(opts = {}) {
		this.opts = opts || {};
		validateOptions(schema, this.opts, 'Chunk Restriction Plugin');
		this.handleHook = this.handleHook.bind(this);
	}

	handleHook(compilation, callback) {
		console.log('#### inside');
		const logger = new Logger(PLUGIN_NAME);
		const manifest = processChunkStats(compilation, this.opts);
		manifest.messages.forEach(logger.interpret);
		logger.log(compilation, this.opts.enableInfoLogs);

		if (typeof callback === 'function') {
			callback(logger.getErrors());
		}
	}

	apply(compiler) {
		if ('hooks' in compiler) {
			compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, this.handleHook);
		} else {
			compiler.plugin('after-emit', this.handleHook);
		}
	}
}

export default ChunkRestrictionPlugin;
