import {
	formatSize,
	parseHumanReadableSizeToByte,
	checkForChunkSizeLimit,
	processChunkStats,
	validateOptions
} from '../utils';

import { REASONS, SEVERITY_TYPES } from '../constants';

describe('Utils test scenarios', () => {
	describe('formatSize tests', () => {
		it('returns the size in Bytes, KB, MB, GB accordingly', () => {
			expect(formatSize(350)).toEqual('350 bytes');
			expect(formatSize(2560)).toEqual('2.5 KiB');
			expect(formatSize(2621440)).toEqual('2.5 MiB');
			expect(formatSize(2684354560)).toEqual('2.5 GiB');
		});

		it('returns "unknown size" in cases when size is not a number or its value is NaN', () => {
			expect(formatSize('test')).toEqual('unknown size');
			expect(formatSize(NaN)).toEqual('unknown size');
		});

		it('returns "0 bytes" when size is less than equal to zero', () => {
			expect(formatSize(0)).toEqual('0 bytes');
			expect(formatSize(-10)).toEqual('0 bytes');
		});
	});
	describe('parseHumanReadableSizeToByte tests', () => {
		it('handles valid text string correctly', () => {
			expect(parseHumanReadableSizeToByte('250 Bytes')).toEqual({
				invalid: false,
				parsedBytes: 250
			});
			expect(parseHumanReadableSizeToByte('1 Byte')).toEqual({
				invalid: false,
				parsedBytes: 1
			});
			expect(parseHumanReadableSizeToByte('2.5 KiB')).toEqual({
				invalid: false,
				parsedBytes: 2560
			});
			expect(parseHumanReadableSizeToByte('2.5 KB')).toEqual({
				invalid: false,
				parsedBytes: 2560
			});
			expect(parseHumanReadableSizeToByte('2.5 MiB')).toEqual({
				invalid: false,
				parsedBytes: 2621440
			});
			expect(parseHumanReadableSizeToByte('2.5 MB')).toEqual({
				invalid: false,
				parsedBytes: 2621440
			});
			expect(parseHumanReadableSizeToByte('2.5 GiB')).toEqual({
				invalid: false,
				parsedBytes: 2684354560
			});
			expect(parseHumanReadableSizeToByte('2.5 GB')).toEqual({
				invalid: false,
				parsedBytes: 2684354560
			});
		});
		it('handles invalid string correctly', () => {
			expect(parseHumanReadableSizeToByte('test')).toEqual({
				invalid: true,
				parsedBytes: 0
			});
			expect(parseHumanReadableSizeToByte('')).toEqual({
				invalid: true,
				parsedBytes: 0
			});
		});
		it('handles unit specified without spaces', () => {
			expect(parseHumanReadableSizeToByte('2.5MB')).toEqual({
				invalid: false,
				parsedBytes: 2621440
			});
		});
	});
	describe('checkForChunkSizeLimit tests', () => {
		it('gives reason type as INVALID_ASSET_SIZE when invalid limit is specified', () => {
			expect(
				checkForChunkSizeLimit({ limit: 'test', actualSize: 2560 })
			).toEqual({
				type: REASONS.INVALID_ASSET_SIZE
			});
		});
		it('gives reason type as EXCEEDS_LIMIT when asset size exceeds the restriction', () => {
			// restriction (limit): 2 KB, actual asset size: 2.5 KB
			expect(checkForChunkSizeLimit({ limit: 2048, actualSize: 2560 })).toEqual(
				{
					type: REASONS.EXCEEDS_LIMIT,
					difference: '512 bytes'
				}
			);
		});
		it('gives reason type as WARN_ON_DELTA_LIMIT when asset size is about to reach it safeSize restriction (if its specified)', () => {
			// restriction (limit): 2.5 KB, actual asset size: 2 KB, safeSizeDifference (i.e deltaInSizes): 500 bytes
			expect(
				checkForChunkSizeLimit({
					limit: 2560,
					actualSize: 2048,
					deltaInSizes: 512
				})
			).toEqual({
				type: REASONS.WARN_ON_DELTA_LIMIT,
				difference: '512 bytes'
			});
		});
		it('gives reason type as WITHIN_LIMIT when asset size is less than its set restriction', () => {
			expect(checkForChunkSizeLimit({ limit: 2560, actualSize: 2048 })).toEqual(
				{
					type: REASONS.WITHIN_LIMIT,
					difference: '512 bytes'
				}
			);
		});
	});
	describe('processChunkStats tests', () => {
		const mockCompliationObj = {
			namedChunks: new Map([
				[
					'a',
					{
						files: ['a.js', 'a.css']
					}
				],
				[
					'b',
					{
						files: ['b.js']
					}
				]
			]),
			assets: {
				// 2.5 kb
				'a.js': { size: () => 2560 },
				// 250 bytes,
				'a.css': { size: () => 250 },
				// 3 kb
				'b.js': { size: () => 3072 }
			}
		};
		it('returns early if restrictions are not specified or invalid', () => {
			// when restrictions value is invalid
			expect(
				processChunkStats(mockCompliationObj, {
					restrictions: {}
				})
			).toEqual({
				messages: [],
				chunks: {}
			});
			// when restrictions are not specified
			expect(processChunkStats(mockCompliationObj, {})).toEqual({
				messages: [],
				chunks: {}
			});
		});
		it('returns early when safeSizeDifference specified is invalid', () => {
			expect(
				processChunkStats(mockCompliationObj, {
					safeSizeDifference: 'test',
					restrictions: [
						{
							chunkName: 'a',
							jsSize: '2 kb',
							cssSize: '1 kb'
						}
					]
				}).messages
			).toEqual(
				expect.arrayContaining([
					{
						type: REASONS.INVALID_DELTA_SIZE,
						severity: SEVERITY_TYPES.WARNING,
						limit: 'test'
					}
				])
			);
		});
		it('returns chunks who does not meet specified safeSizeDifference', () => {
			expect(
				processChunkStats(mockCompliationObj, {
					restrictions: [
						{
							chunkName: 'a',
							jsSize: '2 kb',
							cssSize: '1 kb'
						},
						{
							chunkName: 'b',
							jsSize: '3.5 kb'
						}
					],
					defaultLogType: 'error',
					safeSizeDifference: '512 bytes'
				}).messages
			).toEqual(
				expect.arrayContaining([
					{
						type: 'WARN_ON_DELTA_LIMIT',
						chunkName: 'b',
						file: 'b.js',
						fileType: 'js',
						severity: 'error',
						size: '3 KiB',
						difference: '512 bytes',
						limit: '3.5 kb'
					}
				])
			);
		});
		it("returns missing chunk or chunk's asset", () => {
			expect(
				processChunkStats(mockCompliationObj, {
					restrictions: [
						{
							chunkName: 'c'
						},
						{
							chunkName: 'b',
							cssSize: '2 kb'
						}
					]
				}).messages
			).toEqual([
				{ type: 'MISSING', severity: 'warning', chunkName: 'c' },
				{
					type: 'MISSING',
					chunkName: 'b',
					fileType: 'css',
					severity: 'warning'
				}
			]);
		});
		it('returns severity based on the defaultLogType specified', () => {
			const restrictions = [
				{
					chunkName: 'b',
					jsSize: '2.5 kb'
				}
			];
			const expectedMessages = [
				{
					type: 'EXCEEDS_LIMIT',
					chunkName: 'b',
					file: 'b.js',
					fileType: 'js',
					severity: 'warning',
					size: '3 KiB',
					difference: '512 bytes',
					limit: '2.5 kb'
				}
			];
			expect(
				processChunkStats(mockCompliationObj, { restrictions }).messages
			).toEqual(expectedMessages);
			expect(
				processChunkStats(mockCompliationObj, {
					restrictions,
					defaultLogType: 'warning'
				}).messages
			).toEqual(expectedMessages);
		});
		it('returns error for chunks who does not meet the expectation', () => {
			const restrictionStats = processChunkStats(mockCompliationObj, {
				restrictions: [
					{
						chunkName: 'a',
						jsSize: '2 kb',
						cssSize: '1 kb'
					},
					{
						chunkName: 'b',
						jsSize: '3.5 kb'
					}
				],
				defaultLogType: 'error'
			});
			expect(restrictionStats.messages).toEqual([
				{
					type: 'EXCEEDS_LIMIT',
					chunkName: 'a',
					file: 'a.js',
					fileType: 'js',
					severity: 'error',
					size: '2.5 KiB',
					difference: '512 bytes',
					limit: '2 kb'
				},
				{
					type: 'WITHIN_LIMIT',
					chunkName: 'a',
					file: 'a.css',
					fileType: 'css',
					severity: 'error',
					size: '250 bytes',
					difference: '774 bytes',
					limit: '1 kb'
				},
				{
					type: 'WITHIN_LIMIT',
					chunkName: 'b',
					file: 'b.js',
					fileType: 'js',
					severity: 'error',
					size: '3 KiB',
					difference: '512 bytes',
					limit: '3.5 kb'
				}
			]);
		});
	});
	describe('validateOptions tests', () => {
		it('should throw error if no configuration is passed', () => {
			const mockErrorFn = jest.fn();
			try {
				validateOptions();
			} catch (e) {
				mockErrorFn();
			}
			expect(mockErrorFn).toBeCalled();
		});
		it('should throw error if no restrictions or blank option is specified', () => {
			const mockErrorFn = jest.fn();
			try {
				validateOptions({});
			} catch (e) {
				mockErrorFn();
			}
			expect(mockErrorFn).toBeCalled();
		});
	});
});
