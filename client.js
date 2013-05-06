var async = require('async');
var events = require('events');
var https = require('https');
var util = require('util');

function Client() {
	events.EventEmitter.call(this);
	var self = this;

	this.Q = async.queue(function (task, callback) {
		self.send(task, callback);
		self.emit('enqueued', task);
	}, 1);

	this.Q.drain = function () {
		self.emit('drained');
	};
}

util.inherits(Client, events.EventEmitter);
module.exports = Client;

Client.prototype.queue = function (token, method, path, options, callback) {
	var self = this;
	var task = {
		token: token, 
		method: method, 
		path: path
	};

	if (options.data) {
		task.data = options.data;
	}

	this.Q.push(task, function (response) {
		callback(response);
		self.emit('dequeued', task);
	});
}

Client.prototype.send = function (task, callback) {
	var self = this;

	var opt = {
		host: 'api2.dynect.net',
		port: 443,
		path: '/REST' + task.path,
		method: task.method,
		headers: {
			'Content-Type': 'application/json'
		}
	};

	if (task.data) {
		task.data = JSON.stringify(task.data);
		opt.headers['Content-Length'] = task.data.length;
	}
	else {
		opt.headers['Content-Length'] = 0;
	}

	if (task.path !== '/Session/' || task.method !== 'POST') {
		if (task.token == null) {
			throw new Error('must open a session first');
		}

		opt.headers['Auth-Token'] = task.token
	}

	var req = https.request(opt, function (res) {
		var data = '';

		res.on('readable', function () {
			var chunk = res.read();
			data += chunk.toString('ascii');
		});

		res.on('end', function () {
			try {
				var response = JSON.parse(data);

				if (callback) {
					callback(response);
				}

				self.emit('response', task, response);
			}
			catch (e) {
				self.emit('error', task, e.stack + '\n\n' + data);
			}
		});
	});

	req.on('error', function (e) {
		self.emit('err', task, e.stack);
	});

	if ((task.method === 'POST' || task.method === 'PUT') && task.data) {
		req.write(task.data);
	}

	req.end();
}