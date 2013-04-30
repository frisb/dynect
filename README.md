Dyn DNS API connector for node.js.
===

### example 1 :
 
add A record

``` js
	// open Dynect API session
	var dynector = new Dynector('customername', 'username', 'password');

	dynector.on('connected', function () {
		var zone = 'example.com';

		// add A record with 5 min TTL
		dynector.addRecord('A', zone, 'www.example.com', {
			address: '123.45.67.89'
		}, 300, function (addResponse) {
			console.log(addResponse);

			//publish zone
			dynector.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);

				// close Dynect API session
				dynector.disconnect();
			});
		});
	})

	dynector.connect();
```

### example 2 : 

add CNAME record

``` js
	// open Dynect API session and send keepalive every 5mins
	var dynector = new Dynector('customername', 'username', 'password', 300000);

	dynector.on('connected', function () {
		var zone = 'example.com';

		// add CNAME record with default TTL
		dynector.addRecord('CNAME', zone, 'www.example.com', {
			cname: 'example.mydomain.com'
		}, 0, function (addResponse) {
			console.log(addResponse);

			// publish zone
			dynector.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);
			});
		});
	})

	dynector.connect();
```

## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing dynector
```
  [sudo] npm install dynect
```

#### Author: [Ashley Brener](http://twitter.com/ashleybrener)