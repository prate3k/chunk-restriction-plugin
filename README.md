<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200"
      src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
  <h1>Chunk Restriction Plugin</h1>
</div>

[![npm][npm]][npm-url]
[![node][node]][node-url]
[![deps][deps]][deps-url]
[![size][size]][size-url]

# chunk-restriction-plugin

Help you monitor your chunk size.

## Getting Started

To begin, you'll need to install `chunk-restriction-plugin`:

```console
npm install --save chunk-restriction-plugin
```

Then add the loader to your `webpack` config. For example:

**webpack.config.js**

```js
const ChunkRestrictionPlugin = require('chunk-restriction-plugin');

module.exports = {
	plugins: [
		new ChunkRestrictionPlugin({
			restrictions: [
				{
					chunkName: 'vendor',
					jsSize: '200 KiB',
					logType: 'warning'
				},
				{
					chunkName: 'app',
					jsSize: '150 KiB',
					cssSize: '100 KiB',
					logType: 'error'
				}
			]
		})
	]
};
```

## Options

|                      Name                       |          Type           | Required |  Default  | Description                                                                                                                                                      |
| :---------------------------------------------: | :---------------------: | :------: | :-------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       [**`restrictions`**](#restrictions)       | `{Array<Restrictions>}` |  `true`  |           | Allows to define restriction on chunk's assets (js & css only)                                                                                                   |
|     [**`defaultLogType`**](#defaultLogType)     |       `{String}`        | `false`  | `warning` | Allows to define default treatment for all the restrictions specified.                                                                                           |
|     [**`enableInfoLogs`**](#enableInfoLogs)     |       `{Boolean}`       | `false`  |  `false`  | Allows to log information about chunks who are within the specified restriction.                                                                                 |
| [**`safeSizeDifference`**](#safeSizeDifference) |       `{String}`        | `false`  |    ''     | Allows to define difference between asset's size and its restriction, to be considered safe size. If specified, warns about chunks who does not meet this value. |

### `restrictions`

Type: `Array`
Default: `null`

Allows to define restrictions on multiple chunks based on its chunk name.

Each restriction's object shape:

|      Param      |    Type    | Description                                                                                                                      |
| :-------------: | :--------: | :------------------------------------------------------------------------------------------------------------------------------- |
| **`chunkName`** | `{String}` | Allows to define chunk name                                                                                                      |
|  **`jsSize`**   | `{String}` | Allows to define restriction on its JS asset. <br/> (in `Bytes/KiB/MiB`)                                                         | . |
|  **`cssSize`**  | `{String}` | Allows to define restriction on its CSS asset. <br/> (in `Bytes/KiB/MiB`)                                                        |
|  **`logType`**  | `{String}` | Allows to define severity of this restriction, overrides `defaultLogType` value. <br/>Possible values : `"error"` or `"warning"` |

##### jsSize :

Used to set the limit on the chunk's js asset size. <br/>

Possible units:

- `Byte/Bytes`
- `Kb/KiB`
- `Mb,MiB`

##### cssSize :

Used to set the limit on the chunk's css asset size.<br/>

Possible units:

- `Byte/Bytes`
- `Kb/KiB`
- `Mb,MiB`

##### logType :

Allows to specify severity of this restriction. Overrides `defaultLogType`. Its default value gets set on the basis of `defaultLogType` option value.

Possible values :

- `"error"`
- `"warning"`

### `defaultLogType`

Type: `String`
Default: `warning`

Allows to define default treatment (either treat it as warning or error) for all the restrictions specified.

Possible values :

- `"error"`
- `"warning"`

### `enableInfoLogs`

Type: `Boolean`
Default: `false`

Enable logging information about all the chunks who are within the defined restriction.

### `safeSizeDifference`

Type: `String`
Default: `""`

Allows to define difference between asset's size and its restriction, to be considered safe size for all the chunks. If specified, warns about chunks who does not meet this value. Useful when you want to get information about chunk's asset, whose size is about to meet its restriction.

Possible units:

- `Byte/Bytes`
- `Kb/KiB`
- `Mb,MiB`

## License

[MIT](./LICENSE)

[npm]: https://img.shields.io/npm/v/chunk-restriction-plugin.svg
[npm-url]: https://npmjs.com/package/chunk-restriction-plugin
[node]: https://img.shields.io/node/v/chunk-restriction-plugin.svg
[node-url]: https://nodejs.org
[deps]: https://david-dm.org/prate3k/chunk-restriction-plugin.svg
[deps-url]: https://david-dm.org/prate3k/chunk-restriction-plugin
[size]: https://packagephobia.now.sh/badge?p=chunk-restriction-plugin
[size-url]: https://packagephobia.now.sh/result?p=chunk-restriction-plugin
