Dynect API connector for node.js.
===

the node.js Dynect module provides a simple interface for making calls to the Dynect API.
it is a work in progress and further functionality and examples will be provided soon.
contributions are welcome of course :)

### example 1 :
 
add A record

``` js
	var Dynect = require('dynect');

	// open Dynect API session
	var dynect = new Dynect('customername', 'username', 'password');

	dynect.on('connected', function () {
		var zone = 'example.com';

		// add A record with 5 min TTL
		dynect.addRecord('A', zone, 'www.example.com', {
			address: '123.45.67.89'
		}, 300, function (addResponse) {
			console.log(addResponse);

			//publish zone
			dynect.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);

				// close Dynect API session
				dynect.disconnect();
			});
		});
	})

	dynect.connect();
```

### example 2 : 

add CNAME record

``` js
	var Dynect = require('dynect');

	// open Dynect API session and send keepalive every 5mins
	var dynect = new Dynect('customername', 'username', 'password', 300000);

	dynect.on('connected', function () {
		var zone = 'example.com';

		// add CNAME record with default TTL
		dynect.addRecord('CNAME', zone, 'www.example.com', {
			cname: 'example.mydomain.com'
		}, 0, function (addResponse) {
			console.log(addResponse);

			// publish zone
			dynect.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);
			});
		});
	})

	dynect.connect();
```

## installation

```
  npm install dynect
```

#### the [frisB.com](http://www.frisb.com) team