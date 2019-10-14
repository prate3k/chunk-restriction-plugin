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
Properties are define like this :
> type &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; mandatory &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; defaultValue


#### restrictions :
> array  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;_mandatory_ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; []

Chunks you want to put restriction on. Consist of array of object with each object having following properties : 

##### chunkName :
Used to specify the chunk name you want to put limit on.

##### jsSize :
Used to set the hard limit on the js chunk size. <br/>
Accepted value : `String` <br/>
Accepted units : `Bytes, KiB/Kb, Mb` only<br/>
e.g.: '11 Bytes, 22 Kb, 24 Mb etc.'

##### cssSize :
Used to set the hard limit on the css chunk size.<br/>
type : `String` <br/>
Accepted units : `Bytes, KiB/Kb, Mb` only <br/>
e.g.: '11 Bytes, 22 KB, 24 Mb etc.'

##### logType :
To specify how to treat this restriction check once its met, as error or warning. Overrides `defaultLogType`. Default value set on the basis of `defaultLogType` option value.
Possible values : "error" or "warning"

##### logMessageFormat :
Used to customize log message format as per the way you want to log message. Overrides `defaultLogMessageFormat`. See `defaultLogmessageFormat` for more details.

#### defaultLogMessageFormat :
> String &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; optional &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 'warning'

Used to customize log message format.<br/>

Available placeholders : 
<ul>
    <li><b>__CHUNK_NAME__</b> : Gets replaced with the chunk name</li>
    <li><b>__EXT__</b> : Gets replaced with the chunk extension</li>
    <li><b>__TOTAL_SIZE__</b> : Gets replaced with total chunk size</li>
    <li><b>__RESTRICTION__</b> : Gets replaced with the restriction you have specified for that chunk</li>
    <li><b>__DIFFERENCE__</b> : Gets replaced with how many bytes that chunk is exceeding the set restriction.</li>
</ul>
Default message format : "__CHUNK_NAME__ __EXT__ chunk (size: __TOTAL_SIZE__) is exceeding the set threshold of __RESTRICTION__ by __DIFFERENCE__"

#### defaultLogType :
> String &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; optional &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 'warning'

To set the default treatment for all the restriction check specified. Possible values : "error" or "warning"


License
-
[MIT](https://github.com/prate3k/reactify-observe/blob/master/LICENSE)