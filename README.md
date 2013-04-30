Dynect API connector for node.js.
===

the node.js Dynect module provides a simple interface for making calls to the Dynect API.

it is a work in progress and further functionality and examples will be provided soon.

contributions are welcome of course.

### example 1 :
 
add A record www.example.com (address '123.45.67.89')

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
	});

	dynect.connect();
```

### example 2 : 

add CNAME record www.example.com (cname 'example.mydomain.com')

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
	});

	dynect.connect();
```

### example 3 : 

get all SRV records for '_sip._tcp.example.com' and remove any record with matching target 'voip.mydomain.com'

``` js
	var Dynect = require('dynect');

	// open Dynect API session
	var dynect = new Dynect('customername', 'username', 'password');
	var zone = 'example.com';

	dynect.on('connected', function () {
		var fqdn = '_sip._tcp.example.com';

		dynect.getRecordSet('SRV', zone, fqdn, function (response) {
			console.log(response);

			if (response.status === 'failure' && response.msgs[0].ERR_CD === 'NOT_FOUND') {
				// SRV records not found

				// close Dynect API session
				dynect.disconnect();
			}
			else {
				// SRV records found

				var uri = response.data[0];
				var parts = uri.split('/');
				var recordId = parts[parts.length - 1];

				removeTargetIfExists(fqdn, recordId, 'voip.mydomain.com', function (isRemoved) {
					console.log(isRemoved ? 'removed' : 'nothing removed')

					// close Dynect API session
					dynect.disconnect();
				});
			}
		});
	});

	function removeTargetIfExists(fqdn, recordId, target, callback) {
		dynect.getRecord('SRV', zone, fqdn, recordId, function (response) {
			if (response.data.rdata.target === target + '.') {
				// SRV record for CNAME exists so remove

				dynect.removeRecord('SRV', zone, fqdn, recordId, function () {
					callback(true);
				});
			}
			else {
				// SRV record for CNAME does not exist

				callback(false);
			}
		});
	}

	dynect.connect();
```

## installation

```
  npm install dynect
```


#### the [frisB.com](http://www.frisb.com) team :)