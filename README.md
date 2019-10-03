# chunk-restriction-plugin
> Webpack plugin to help you monitor your chunk size.


##### Install the package :
```bash
npm install chunk-restriction-plugin --save
```

##### Usage :
```javascript
const ChunkRestrictionPlugin = require('chunk-restriction-plugin')

const webpackConfig = {
	mode: 'production',
	.
	.
	.
	plugins: [
		new ChunkRestrictionPlugin({
		    restrictions: [{
		    	chunkName: '<chunk_name>',
		    	jsSize: <limit_on_js_size>,
		    	cssSize: <limit_on_css_size>,
		    	logType: '<error_or_warning>'
		    }]
		})
	]
}

```
#### Options :
It contains set of options instructing component when to start observing, notify once it comes to viewport etc. Properties are define like this :
> type &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mandatory &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; defaultValue


#### restrictions :
> array  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_mandatory_ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; []

Chunks you want to put restriction on. Consist of object with key value pair with following schema : 

##### chunkName :
Used to specify the chunk name you want to put limit on.

##### jsSize :
Used to set the hard limit on the js chunk size.

##### cssSize :
Used to set the hard limit on the css chunk size.

##### logType :
To specify how to treat this restriction check once its met, as error or warning. Overrides `defaultLogType`. Default value set on the basis of `defaultLogType` option value.
Possible values : "error" or "warning"

#### defaultLogType :
> String &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; optional &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 'warning'

To set the default treatment for all the restriction check specified.


License
-
[MIT](https://github.com/prate3k/reactify-observe/blob/master/LICENSE)