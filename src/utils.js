import path from 'path';

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

export function buildChunkStatsJson(compilation, assetsMeta) {
	const chunkStats = {};
	compilation.chunks.forEach((chunk) => {
		if (!chunk.name) {
			return;
		}
		chunkStats[chunk.name] = {};
		for (let i = 0, len = chunk.files.length; i < len; i++) {
			switch (path.extname(chunk.files[i])) {
				case '.css':
				case '.scss':
					chunkStats[chunk.name].css = { file: chunk.files[i] };
					break;
				case '.js':
					chunkStats[chunk.name].js = { file: chunk.files[i] };
					break;
				default:
					break;
			}
		}
	});
	for (const chunkName in chunkStats) {
		if (hasOwnProperty(chunkStats, chunkName)) {
			if (
				!!chunkStats[chunkName].css &&
				chunkStats[chunkName].css.file &&
				hasOwnProperty(assetsMeta, chunkStats[chunkName].css.file)
			) {
				chunkStats[chunkName].css.size =
					assetsMeta[chunkStats[chunkName].css.file].size;
			}
			if (
				!!chunkStats[chunkName].js &&
				chunkStats[chunkName].js.file &&
				hasOwnProperty(assetsMeta, chunkStats[chunkName].js.file)
			) {
				chunkStats[chunkName].js.size =
					assetsMeta[chunkStats[chunkName].js.file].size;
			}
		}
	}
	return chunkStats;
}

const regex = /^([.0-9]+)[ ]?(Byte|Bytes|KiB|KB|MB|GB)?$/i;
function parseHumanReadableSizeToByte(text) {
	const matches = regex.exec(text);
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

export function performCheck({
	property,
	fileExt,
	manifest,
	restriction,
	severity,
	msgFormat,
	messages
}) {
	if (typeof restriction[property] === 'string' && !!restriction[property]) {
		const numberParser = parseHumanReadableSizeToByte(restriction[property]);
		const size = numberParser.parsedBytes;
		if (numberParser.invalid) {
			messages.pushMessage(
				'error',
				`Incorrect string specified : ${restriction[property]} for chunkName "${restriction.chunkName}", Please check. Supported format {Byte, Bytes, Kb/Kib, Mb}`
			);
		}
		if (
			!numberParser.invalid &&
			typeof size === 'number' &&
			!hasOwnProperty(manifest[restriction.chunkName], fileExt)
		) {
			messages.pushMessage(
				'warning',
				`[Not Found] No ${fileExt.toUpperCase()} asset found for chunk name : "${
					restriction.chunkName
				}", hence ignoring its ${fileExt} restriction`
			);
			return;
		}
		if (
			!numberParser.invalid &&
			typeof size === 'number' &&
			size < manifest[restriction.chunkName][fileExt].size
		) {
			messages.pushMessage(
				severity,
				replaceMessagePlaceholder(
					{
						chunkName: restriction.chunkName,
						ext: fileExt,
						totalSize: formatSize(
							manifest[restriction.chunkName][fileExt].size
						),
						difference: formatSize(
							manifest[restriction.chunkName][fileExt].size - size
						),
						restriction: formatSize(size)
					},
					msgFormat
				)
			);
		}
	}
}
