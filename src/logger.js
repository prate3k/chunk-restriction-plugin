import { SEVERITY_TYPES, REASONS } from './constants';

const spaces = '   ';
export default class Logger {
	constructor(pluginName) {
		this.pluginName = pluginName;
		this.warnings = [];
		this.errors = [];
		this.infos = [];
		this.interpret = this.interpret.bind(this);
	}

	record(type, message) {
		if (type === SEVERITY_TYPES.WARNING) {
			this.warnings.push(message);
		} else if (type === SEVERITY_TYPES.ERROR) {
			this.errors.push(message);
		} else if (type === SEVERITY_TYPES.INFO) {
			this.infos.push(message);
		}
	}

	interpret(message) {
		if (message.type === REASONS.EXCEEDS_LIMIT) {
			this.record(
				message.severity,
				`💀 [FAILED] Chunk's asset exceeds the defined limit of "${
					message.limit
				}" : ${message.file}\n${[
					`${spaces}Chunk Name\t: ${message.chunkName}`,
					`${spaces}Asset type\t: "${message.fileType}"`,
					`${spaces}Current Size\t: ${message.size}`,
					`${spaces}Exceeds by\t: +${message.difference}`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.INVALID_ASSET_SIZE) {
			this.record(
				SEVERITY_TYPES.ERROR,
				`🚫 [INVALID] Incorrect string specified in restriction : ${
					message.file
				}\n${[
					`${spaces}Chunk Name\t: ${message.chunkName}`,
					`${spaces}Asset Type\t: "${message.fileType}"`,
					`${spaces}Invalid string\t: "${message.limit}"`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.INVALID_DELTA_SIZE) {
			this.record(
				SEVERITY_TYPES.WARNING,
				`🚫 [INVALID] Incorrect string specified for property "safeDifferenceInSizes"\n${[
					`${spaces}Invalid string\t: "${message.limit}"`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.WARN_ON_DELTA_LIMIT) {
			this.record(
				SEVERITY_TYPES.WARNING,
				`😱 [CAUTION] Chunk's asset size about to reach its set limit of "${
					message.limit
				}" : ${message.file}\n${[
					`${spaces}Chunk Name\t: ${message.chunkName}`,
					`${spaces}Asset type\t: "${message.fileType}"`,
					`${spaces}Current Size\t: ${message.size}`,
					`${spaces}Short by\t: ${message.difference}`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.MISSING) {
			if (typeof message.fileType === 'undefined') {
				this.record(
					SEVERITY_TYPES.WARNING,
					`🙁 [NOT FOUND] Chunk not found, hence ignoring restriction\n${spaces}Chunk Name\t: ${message.chunkName}`
				);
			} else {
				this.record(
					message.severity,
					`🙁 [NOT FOUND] Chunk's asset not found\n${[
						`${spaces}Chunk Name\t: ${message.chunkName}`,
						`${spaces}Asset type\t: "${message.fileType}"`
					].join('\n')}\n`
				);
			}
		} else if (message.type === REASONS.WITHIN_LIMIT) {
			this.record(
				SEVERITY_TYPES.INFO,
				`👌🏻 [OK] Chunk's asset is within the defined limit (i.e. ${
					message.limit
				}) : ${message.file}\n${[
					`${spaces}Chunk Name\t: ${message.chunkName}`,
					`${spaces}Asset type\t: "${message.fileType}"`,
					`${spaces}Current Size\t: ${message.size}`,
					`${spaces}Difference\t: ${message.difference}`
				].join('\n')}\n`
			);
		}
	}

	hasErrors() {
		return this.errors && this.errors.length > 0;
	}

	getErrors() {
		if (this.hasErrors()) {
			return `\nERROR in Chunk Restriction Plugin ¯\\_(ツ)_/¯, Chunk(s) does not meet the restrictions defined or there is some issue with the configuration, check below error(s) for more details:\n${this.errors.join(
				'\n'
			)}\n`;
		}
		return '';
	}

	log(compilation, logSafeChunks) {
		if (this.warnings && this.warnings.length > 0) {
			compilation.warnings.push(
				`Chunk Restriction Plugin (◕_◕), check the following instructions:\n${this.warnings.join(
					'\n'
				)}\n`
			);
		}
		if (logSafeChunks && this.infos && this.infos.length) {
			(compilation.getLogger
				? compilation.getLogger(this.pluginName)
				: console
			).log(
				`\nINFO about chunk(s) whose size is within the restriction 🤩 ( Chunk Restriciton Plugin ):\n${this.infos.join(
					'\n'
				)}\n`
			);
		}
		const errors = this.getErrors();
		if (errors) {
			compilation.errors.push(errors);
		}
	}
}
