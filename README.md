Dyn DNS API connector for node.js.
===

### example 1 :
 
add A record

``` js
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

### installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### installing dynect
```
  [sudo] npm install dynect
```

#### author: [ashley brener](http://twitter.com/ashleybrener)