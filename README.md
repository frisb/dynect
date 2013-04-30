dynector
========

Dyn DNS API connector for node.js

example 1 : add A record
=========

	var dynector = new Dynector('customername', 'username', 'password');

	dynector.on('connected', function () {
		var zone = 'example.com';

		dynector.addRecord('A', zone, 'www.example.com', {
			address: '123.45.67.89'
		}, 300, function (addResponse) {
			console.log(addResponse);

			dynector.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);

				dynector.disconnect();
			});
		});
	})

	dynector.connect();


example 2 : add CNAME record
=========

	var dynector = new Dynector('customername', 'username', 'password');

	dynector.on('connected', function () {
		var zone = 'example.com';

		dynector.addRecord('CNAME', zone, 'www.example.com', {
			cname: 'example.mydomain.com'
		}, 300, function (addResponse) {
			console.log(addResponse);

			dynector.publishZone(zone, function (publishResponse) {
				console.log(publishResponse);

				dynector.disconnect();
			});
		});
	})

	dynector.connect();