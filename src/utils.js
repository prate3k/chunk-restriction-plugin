import path from 'path';

import validate from 'schema-utils';
import ValidationError from 'schema-utils/dist/ValidationError';

import schema from './schema.json';

import { SEVERITY_TYPES, REASONS } from './constants';

export function hasOwnProperty(object, property) {
	return Object.prototype.hasOwnProperty.call(object, property);
}

export function formatSize(size) {
	if (typeof size !== 'number' || Number.isNaN(size) === true) {
		return 'unknown size';
	}
	if (size <= 0) {
		return '0 bytes';
	}
	const abbreviations = ['bytes', 'KiB', 'MiB', 'GiB'];
	const index = Math.floor(Math.log(size) / Math.log(1024));
	return `${+(size / 1024 ** index).toPrecision(3)} ${abbreviations[index]}`;
}

const regex = /^([.0-9]+)[ ]?(Byte|Bytes|KiB|KB|MiB|MB|GiB|GB)?$/i;
export function parseHumanReadableSizeToByte(text) {
	const matches = text ? regex.exec(text) : null;
	if (matches == null) {
		return {
			invalid: true,
			parsedBytes: 0
		};
	}
	const [_, number, unit] = matches; // eslint-disable-line no-unused-vars
	let times = 0;
	switch ((unit || '').toLowerCase()) {
		case 'kib':
		case 'kb':
			times = 1;
			break;
		case 'mib':
		case 'mb':
			times = 2;
			break;
		case 'gib':
		case 'gb':
			times = 3;
			break;
		default:
			break;
	}
	return {
		invalid: false,
		parsedBytes: 1024 ** times * Number(number)
	};
}

export function checkForChunkSizeLimit({ limit, actualSize, deltaInSizes }) {
	const numberParser = parseHumanReadableSizeToByte(limit);
	const restrictedToSize = numberParser.parsedBytes;
	if (numberParser.invalid || typeof restrictedToSize !== 'number') {
		return {
			type: REASONS.INVALID_ASSET_SIZE
		};
	}
	if (restrictedToSize < actualSize) {
		return {
			type: REASONS.EXCEEDS_LIMIT,
			difference: formatSize(actualSize - restrictedToSize)
		};
	}
	if (deltaInSizes && restrictedToSize - actualSize <= deltaInSizes) {
		return {
			type: REASONS.WARN_ON_DELTA_LIMIT,
			difference: formatSize(restrictedToSize - actualSize)
		};
	}
	return {
		type: REASONS.WITHIN_LIMIT,
		difference: formatSize(restrictedToSize - actualSize)
	};
}

export function processChunkStats(
	compilation,
	{ safeSizeDifference, restrictions, defaultLogType }
) {
	const restrictionStats = {
		messages: [],
		chunks: {}
	};
	if (!restrictions || !restrictions.length) {
		return restrictionStats;
	}

	let delta;
	if (safeSizeDifference) {
		const deltaInSizesParser = parseHumanReadableSizeToByte(safeSizeDifference);
		delta = deltaInSizesParser.parsedBytes;
		if (deltaInSizesParser.invalid || typeof delta !== 'number') {
			restrictionStats.messages.push({
				type: REASONS.INVALID_DELTA_SIZE,
				severity: SEVERITY_TYPES.WARNING,
				limit: safeSizeDifference
			});
		}
	}

	restrictions.forEach((restriction) => {
		const { chunkName, logType } = restriction;
		const severity = logType || defaultLogType || SEVERITY_TYPES.WARNING;

		/* Checking to see if chunk name is present in final assets */
		if (compilation.namedChunks.get(chunkName)) {
			const chunk = compilation.namedChunks.get(chunkName);
			const chunkAssets = {};

			// used to check which assets are present & which are not
			const hasAssets = {
				js: false,
				css: false
			};

			// Iterating over chunk files and collecting stats of file with css/js extension
			chunk.files.forEach((file) => {
				// get the file size from assets array
				const size = compilation.assets[file].size();
				let fileType = '';
				const fileExt = path.extname(file);
				if (fileExt === '.css' || fileExt === '.scss') {
					fileType = 'css';
				} else if (fileExt === '.js') {
					fileType = 'js';
				}

				if (fileType === 'js' || fileType === 'css') {
					const sizeProp = fileType === 'js' ? 'jsSize' : 'cssSize';
					if (
						!hasOwnProperty(restriction, sizeProp) ||
						!restriction[sizeProp]
					) {
						// exit if 'jsSize' or 'cssSize' is not specified for 'js' and 'css' file respectively
						return;
					}
					hasAssets[fileType] = true;
					chunkAssets[fileType] = {
						file,
						size,
						limit: restriction[sizeProp]
					};
					// check the restriction against the asset's size
					const reason = checkForChunkSizeLimit({
						limit: restriction[sizeProp],
						actualSize: size,
						deltaInSizes: delta
					});

					restrictionStats.messages.push({
						type: reason.type,
						chunkName,
						file,
						fileType,
						severity,
						size: formatSize(size),
						difference: reason.difference,
						limit: restriction[sizeProp]
					});
				}
			});
			if (!hasAssets.js || !hasAssets.css) {
				let missingFileType;
				if (!hasAssets.js && !!restriction.jsSize) {
					missingFileType = 'js';
				} else if (!hasAssets.css && !!restriction.cssSize) {
					missingFileType = 'css';
				}
				if (missingFileType) {
					restrictionStats.messages.push({
						type: REASONS.MISSING,
						chunkName,
						fileType: missingFileType,
						severity: SEVERITY_TYPES.WARNING
					});
				}
			}
			if (hasAssets.js || hasAssets.css) {
				restrictionStats.chunks[chunkName] = chunkAssets;
			}
		} else {
			restrictionStats.messages.push({
				type: REASONS.MISSING,
				severity: SEVERITY_TYPES.WARNING,
				chunkName
			});
		}
	});
	return restrictionStats;
}

export function validateOptions(opts) {
	if (!opts) {
		throw new ValidationError(
			[
				{
					dataPath: '',
					keyword: 'type',
					params: {
						type: 'object'
					},
					parentSchema: {
						type: 'null',
						description: 'Invalid configuration supplied'
					}
				}
			],
			schema
		);
	} else if (!opts.restrictions) {
		throw new ValidationError(
			[
				{
					dataPath: '',
					keyword: 'required',
					params: {
						type: 'object',
						missingProperty: 'restrictions'
					},
					parentSchema: {
						type: 'null',
						description: 'Property "restrictions" can not be blank'
					}
				}
			],
			schema
		);
	} else {
		validate(schema, opts, 'Chunk Restriction Plugin');
	}
}
