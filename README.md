Dynect API connector for node.js.
===

the node.js Dynect module provides a simple interface for making calls to the Dynect API.

API calls are serialized (by design), facilitated by an asynchronous queue and are therefore non-blocking.

the Dynect API connector for node.js is a work in progress and further functionality and examples will be provided soon.

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
		});

		//publish zone
		dynect.publishZone(zone, function (publishResponse) {
			console.log(publishResponse);
		});

		// close Dynect API session
		dynect.disconnect();
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
		});

		// publish zone
		dynect.publishZone(zone, function (publishResponse) {
			console.log(publishResponse);
		});

		// do not disconnect because session is kept alive
	});

	dynect.connect();
```

### example 3 (advanced) : 

add SRV records '_sip._tcp.example.com' (target 'voip.mydomain.com' on ports 5060 and 5070, replacing existing if any)

``` js
	var Dynect = require('dynect');

	// open Dynect API session
	var dynect = new Dynect('customername', 'username', 'password');
	var zone = 'example.com';
	var fqdn = '_sip._tcp.example.com';
	var srvTarget = 'voip.mydomain.com';
	var ports = [5060, 5070];

	dynect.on('connected', function () {
		addSrvRecords(zone, fqdn, srvTarget, ports, function () {
			dynect.publishZone(zone, function () {
				if (callback) {
					callback();
				}
			});

			// close Dynect API session
			dynect.disconnect();
		});
	})

	dynect.connect();
	
	function addSrvRecords(zone, fqdn, srvTarget, ports, callback) {
		dynect.getRecordSet('SRV', zone, fqdn, function (response) {
			if (ports !== null && response.status === 'failure' && response.msgs[0].ERR_CD === 'NOT_FOUND') {
				// SRV records not found

				//{ status: 'failure',
				//	data: {},
				//	job_id: 187775860,
				//	msgs:
				//	[ { INFO: 'node: Not in zone',
				//		SOURCE: 'BLL',
				//		ERR_CD: 'NOT_FOUND',
				//		LVL: 'ERROR' },
				//	  { INFO: 'detail: Host is not in this zone',
				//	  	SOURCE: 'BLL',
				//	  	ERR_CD: null,
				//	  	LVL: 'INFO' } ] }

				newSrvRecords(zone, fqdn, srvTarget, ports, callback);
			}
			else {			
				// SRV records found

				for (var i = 0; i < response.data.length; i++) {
					var uri = response.data[i];
					var parts = uri.split('/');
					var recordId = parts[parts.length - 1];

					dynect.getRecord('SRV', zone, fqdn, recordId, function (response) {
						if (response.data.rdata.target === srvTarget + '.') {
							// SRV record for target exists so remove

							dynect.removeRecord('SRV', zone, fqdn, recordId);
						}
					});
				}

				if (ports !== null) {
					newSrvRecords(zone, fqdn, srvTarget, ports, callback);
				}
				else {
					callback();
				}
			}
		});
	}

	function newSrvRecords(zone, fqdn, srvTarget, ports, callback) {
		// add a new SRV record for each port

		for (var i = 0; i < ports.length; i++) {
			dynect.addRecord('SRV', zone, fqdn, {
				port: ports[i],
				priority: 10,
				target: srvTarget,
				weight: 1
			}, 60);
		}

		callback();
	}
```

## installation

```
  npm install dynect
```

## enjoy

#### the frisB.com team ([ring the world](http://www.frisb.com "frisB.com"))