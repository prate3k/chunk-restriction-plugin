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

export function logMessage(type, msg, compilation) {
	if (type === 'warning') {
		compilation.warnings.push(msg);
	} else {
		compilation.errors.push(msg);
	}
}

export function hasOwnProperty(object, property) {
	return Object.prototype.hasOwnProperty.call(object, property);
}

export function buildManifest(compilation, assetsMeta) {
	const manifest = {};
	compilation.chunks.forEach((chunk) => {
		if (!chunk.name) {
			return;
		}
		manifest[chunk.name] = {};
		for (let i = 0, len = chunk.files.length; i < len; i++) {
			switch (path.extname(chunk.files[i])) {
				case '.css':
				case '.scss':
					manifest[chunk.name].css = { file: chunk.files[i] };
					break;
				case '.js':
					manifest[chunk.name].js = { file: chunk.files[i] };
					break;
				default:
					break;
			}
		}
	});
	for (const chunkName in manifest) {
		if (hasOwnProperty(manifest, chunkName)) {
			if (
				!!manifest[chunkName].css &&
				manifest[chunkName].css.file &&
				hasOwnProperty(assetsMeta, manifest[chunkName].css.file)
			) {
				manifest[chunkName].css.size =
					assetsMeta[manifest[chunkName].css.file].size;
			}
			if (
				!!manifest[chunkName].js &&
				manifest[chunkName].js.file &&
				hasOwnProperty(assetsMeta, manifest[chunkName].js.file)
			) {
				manifest[chunkName].js.size =
					assetsMeta[manifest[chunkName].js.file].size;
			}
		}
	}
	return manifest;
}
