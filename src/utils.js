import path from 'path';

import { SEVERITY_TYPES, REASONS } from './constants';

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

export function hasOwnProperty(object, property) {
	return Object.prototype.hasOwnProperty.call(object, property);
}

const regex = /^([.0-9]+)[ ]?(Byte|Bytes|KiB|KB|MB|GB)?$/i;
function parseHumanReadableSizeToByte(text) {
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
		case 'mb':
			times = 2;
			break;
		default:
			break;
	}
	return {
		invalid: false,
		parsedBytes: 1024 ** times * Number(number)
	};
}

const DEFAULT_MSG_FORMAT =
	'__CHUNK_NAME__ __EXT__ chunk (size: __TOTAL_SIZE__) is exceeding the set threshold of __RESTRICTION__ by __DIFFERENCE__';
export function replaceMessagePlaceholder(
	{ chunkName, ext, totalSize, restriction, difference },
	messageFormat
) {
	return (messageFormat || DEFAULT_MSG_FORMAT)
		.replace('__CHUNK_NAME__', chunkName)
		.replace('__EXT__', ext.toUpperCase())
		.replace('__TOTAL_SIZE__', totalSize)
		.replace('__RESTRICTION__', restriction)
		.replace('__DIFFERENCE__', difference);
}

function isExceedingSetLimit({ limit, actualSize }) {
	const numberParser = parseHumanReadableSizeToByte(limit);
	const restrictedToSize = numberParser.parsedBytes;
	if (numberParser.invalid || typeof restrictedToSize !== 'number') {
		return {
			type: REASONS.INVALID_STRING
		};
	}
	if (restrictedToSize < actualSize) {
		return {
			type: REASONS.EXCEEDS_LIMIT,
			difference: formatSize(actualSize - restrictedToSize)
		};
	}
	return {
		type: REASONS.WITHIN_LIMIT,
		difference: formatSize(restrictedToSize - actualSize)
	};
}

export function processChunkStats(
	compilation,
	{ restrictions, defaultLogType, defaultLogMessageFormat }
) {
	const restrictionStats = {
		messages: []
	};
	if (!restrictions || !restrictions.length) {
		return restrictionStats;
	}

	restrictions.forEach((restriction) => {
		const { chunkName, logType, logMessageFormat } = restriction;
		const severity = logType || defaultLogType || SEVERITY_TYPES.WARNING;
		const msgFormat = logMessageFormat || defaultLogMessageFormat;

		/* Checking to see if chunk name is present in final assets */
		if (compilation.namedChunks.get(chunkName)) {
			const chunk = compilation.namedChunks.get(chunkName);
			restrictionStats[chunkName] = {};

			const hasAssets = {
				js: false,
				css: false
			};

			// Iterating over chunk files and collecting stats of file with css/js extension
			chunk.files.forEach((file) => {
				const size = compilation.assets[file].size();
				let fileType = '';
				const fileExt = path.extname(file);
				if (fileExt === '.css' || fileExt === '.scss') {
					fileType = 'css';
				} else if (fileExt === '.js') {
					fileType = 'js';
				}

				if (fileType === 'js' || fileType === 'css') {
					hasAssets[fileType] = true;
					const sizeProp = fileType === 'js' ? 'jsSize' : 'cssSize';
					if (typeof restriction[sizeProp] === 'undefined') {
						return;
					}
					restrictionStats[chunkName][fileType] = {
						file,
						size,
						limit: restriction[sizeProp]
					};
					const reason = isExceedingSetLimit({
						limit: restriction[sizeProp],
						actualSize: size
					});

					restrictionStats.messages.push({
						type: reason.type,
						chunkName,
						file,
						fileType,
						severity,
						msgFormat,
						size: formatSize(size),
						difference: reason.difference,
						limit: restriction[sizeProp]
					});
				}
			});
			if (!hasAssets.js || !hasAssets.css) {
				let missingFileType;
				if (!hasAssets.js) {
					missingFileType = 'js';
				} else if (!hasAssets.css) {
					missingFileType = 'css';
				}
				restrictionStats.messages.push({
					type: REASONS.MISSING,
					chunkName,
					fileType: missingFileType,
					severity: SEVERITY_TYPES.WARNING
				});
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
