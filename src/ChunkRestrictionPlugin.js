import { PLUGIN_NAME } from './constants';
import { processChunkStats, validateOptions } from './utils';
import Logger from './logger';

class ChunkRestrictionPlugin {
	constructor(opts) {
		this.opts = opts;
		validateOptions(this.opts);
		this.handleAfterEmitHook = this.handleAfterEmitHook.bind(this);
		this.logger = new Logger(PLUGIN_NAME);
	}

	handleAfterEmitHook(compilation, callback) {
		const manifest = processChunkStats(compilation, this.opts);
		manifest.messages.forEach(this.logger.interpret);
		this.logger.log(compilation, this.opts.logSafeChunks);

		if (typeof callback === 'function') {
			callback(this.logger.getErrors());
		}
	}

	apply(compiler) {
		if ('hooks' in compiler) {
			compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, this.handleAfterEmitHook);
		} else {
			compiler.plugin('after-emit', this.handleAfterEmitHook);
		}
	}
}

export default ChunkRestrictionPlugin;
