Dynect API connector for node.js.
===

the node.js Dynect module provides a simple interface for making calls to the Dynect API.

API calls are serialized (by design), facilitated by an asynchronous queue and are therefore non-blocking.

the Dynect API connector for node.js is a work in progress and further functionality and examples will be provided soon.

contributions are welcome of course.

## object model

[Dynect](/wiki/Dynect)

[Record](/wiki/Record)

## examples

### Dynect connector instance

``` js
var Dynect = require('dynect');

var dynect = new Dynect(username, username, password);
```


### wiring up events

``` js
dynect.on('enqueued', function (task) {
	console.log('enqueued: ' + task.method + ' ' + task.path);
});

dynect.on('dequeued', function (task) {
	console.log('dequeued ' + task.method + ' ' + task.path);
});

dynect.on('queueComplete', function () {
	console.log('queue complete');
});

dynect.on('queueComplete', function () {
	console.log('*');
});

dynect.on('error', function (task, err) {
	console.log('error ' + task.method + ' ' + err);
});

dynect.on('response', function (task, response) {
	if (response.msgs) {
		for (var i = 0; i < response.msgs.length; i++) {
			var msg = response.msgs[i];

			if (msg.ERR_CD != null) {
				console.log('= ' + task.method + ' ' + msg.ERR_CD);
			}
			else {
				console.log('= ' + task.method + ' ' + msg.INFO);
			}
		}
	}
	else {
		console.log('~ ' + task.method + ' ' + response);
	}
});
```


### example 1 :
 
add A record www.example.com (address '123.45.67.89', TTL 5 mins)

``` js
dynect.on('connected', function () {
	dynect.ARecord.add({
		zone: 'example.com',
		fqdn: 'www.example.com',
		data: {
			rdata: { address: '123.45.67.89' },
			ttl: 300,
		}
	});

	dynect.publish(zone);

	dynect.disconnect(zone);
});

dynect.connect();
```

### example 2 : 

add CNAME record www.example.com (cname 'example.mydomain.com', TTL zone default)

``` js
dynect.on('connected', function () {
	dynect.CNAMERecord.add({
		zone: 'example.com',
		fqdn: 'www.example.com',
		data: {
			rdata: { cname: 'example.mydomain.com' },
			ttl: 0,
		}
	});

	dynect.publish(zone);

	dynect.disconnect(zone);
});

dynect.connect();
```

### example 3 (advanced) : 

add SRV records '_sip._tcp.example.com' (target 'voip.mydomain.com' on ports 5060 and 5070, replacing existing if any)

``` js
var zone = 'example.com';
var fqdn = '_sip._tcp.example.com';
var srvTarget = 'voip.mydomain.com';
var ports = [5060, 5070];

dynect.on('connected', function () {
	dynect.SRVRecord.get({
		zone: zone,
		fqdn: fqdn
	}, function (responses) {
		for (var x = 0; x < responses.length; x++) {
			var response = responses[x];

			if (response.data.rdata.target === srvTarget + '.') {
				dynect.SRVRecord.delete({
					zone: zone,
					fqdn: fqdn,
					record_id: response.data.record_id
				});
			}
		}

		for (var y = 0; y < ports.length; y++) {
			dynect.SRVRecord.add({
				zone: zone,
				fqdn: fqdn,
				data: {
					rdata: {
						port: ports[y],
						priority: 10,
						target: srvTarget,
						weight: 1
					},
					ttl: 60
				}
			});
		}

		dynect.publish(zone);

		dynect.disconnect();
	});
});

dynect.connect();
```

## installation

```
  npm install dynect
```

## enjoy :)

#### the frisB.com team ( [ring the world](http://www.frisb.com "frisB.com") )


## License

(The MIT License)

Copyright (c) frisB.com &lt;play@frisb.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.