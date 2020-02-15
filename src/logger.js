import { SEVERITY_TYPES, REASONS } from './constants';

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
				`💀 [FAILED] Chunk's asset exceeds the defined limit : ${
					message.file
				}\n${[
					`  Chunk Name: ${message.chunkName}`,
					`  Asset type: "${message.fileType}`,
					`  Defined Restriction: ${message.limit}`,
					`  Current Size: ${message.size}`,
					`  Exceeds by: ${message.difference}`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.INVALID_STRING) {
			this.record(
				SEVERITY_TYPES.ERROR,
				`🚫 [INVALID] Incorrect string specified in restriction : ${
					message.file
				}\n${[
					`  Chunk Name: ${message.chunkName}`,
					`  Asset Type: "${message.fileType}"`,
					`  Incorrect string: "${message.limit}"`
				].join('\n')}\n`
			);
		} else if (message.type === REASONS.MISSING) {
			if (typeof message.fileType === 'undefined') {
				this.record(
					SEVERITY_TYPES.WARNING,
					`🙁 [NOT FOUND] Chunk not found, ignoring restriction\n  Chunk Name: ${message.chunkName}`
				);
			} else {
				this.record(
					message.severity,
					`🙁 [NOT FOUND] Chunk's asset not found\n${[
						`  Chunk Name: ${message.chunkName}`,
						`  Asset type: "${message.fileType}"`
					].join('\n')}\n`
				);
			}
		} else if (message.type === REASONS.WITHIN_LIMIT) {
			this.record(
				SEVERITY_TYPES.INFO,
				`👌🏻 [OK] Chunk's asset is within the defined limit : ${
					message.file
				}\n${[
					`  Chunk Name: ${message.chunkName}`,
					`  Asset type: "${message.fileType}"`,
					`  Defined Restriction: ${message.limit}`,
					`  Current Size: ${message.size}`,
					`  Short by: ${message.difference}`
				].join('\n')}\n`
			);
		}
	}

	getErrors() {
		return this.errors.length > 0
			? `ERROR in Chunk Restriction Plugin 😵, Chunk(s) does not meet the restrictions defined or there is some issue with the configuration, refer below error(s) for more information\n${this.errors.join(
					'\n\n'
			  )}\n`
			: '';
	}

	log(compilation, enableInfoLogs) {
		if (this.warnings && this.warnings.length > 0) {
			compilation.warnings.push(
				`Chunk restriction plugin, check the following instructions:\n${this.warnings.join(
					'\n\n'
				)}\n`
			);
		}
		if (enableInfoLogs && this.infos && this.infos.length > 0) {
			(compilation.getLogger
				? compilation.getLogger(this.pluginName)
				: console
			).info(
				`\nINFO for Chunk restriction plugin, chunk(s) whose size is within the restriction 🤩\n${this.infos.join(
					'\n\n'
				)}\n`
			);
		}
	}
}
