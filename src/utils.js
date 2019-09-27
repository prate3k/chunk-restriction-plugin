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
