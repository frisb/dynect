var async = require('async');
var https = require('https');

var Logger = require('./logger');

function Client() {
	var self = this;

	this.cLogger = new Logger('Dynect Client');
	this.qLogger = new Logger('Dynect Queue');

	this.Q = async.queue(function (task, callback) {
		self.qLogger.info('+ ' + task.method + ': ' + task.path);
		self.send(task.token, task.method, task.path, task.options, callback);
	}, 1);

	this.Q.drain = function () {
		self.qLogger.info('*');
	};
}

module.exports = Client;

Client.prototype.queue = function (token, method, path, options, callback) {
	var self = this;

	this.Q.push({ token: token, method: method, path: path, options: options }, function (response) {
		callback(response);
		self.qLogger.info('- ' + method + ': ' + path);
	});
}

Client.prototype.send = function (token, method, path, options, callback) {
	var self = this;

	var opt = {
		host: 'api2.dynect.net',
		port: 443,
		path: '/REST' + path,
		method: method,
		headers: {
			'Content-Type': 'application/json'
		}
	};

	if (options.data) {
		options.data = JSON.stringify(options.data);
		opt.headers['Content-Length'] = options.data.length;
	}
	else {
		opt.headers['Content-Length'] = 0;
	}

	if (path !== '/Session/' || method !== 'POST') {
		if (token == null) {
			throw new Error('must open a session first');
		}

		opt.headers['Auth-Token'] = token
	}

	var req = https.request(opt, function (res) {
		var data = '';

		res.on('readable', function () {
			var chunk = res.read();
			data += chunk.toString('ascii');
		});

		res.on('end', function () {
			try {
				var response;

				try {
					response = JSON.parse(data);
				}
				catch (e) {
					response = data;
				}

				if (response.msgs) {
					for (var i = 0; i < response.msgs.length; i++) {
						var msg = response.msgs[i];

						if (msg.ERR_CD != null) {
							self.cLogger.error('x ' + method + ': ' + msg.ERR_CD + ' (' + msg.INFO + ')');
						}
						else {
							self.cLogger.info('= ' + method + ': ' + msg.INFO);
						}
					}
				}
				else {
					self.cLogger.info('~ ' + method + ': ' + response);
				}

				if (callback) {
					callback(response);
				}
			}
			catch (e) {
				self.cLogger.error('x ' + method + ': ' + e.stack + '\n\n(' + data + ')');
			}
		});
	});

	req.on('error', function (e) {
		self.cLogger.error('x ' + method + ': ' + e);
	});

	if ((method === 'POST' || method === 'PUT') && options.data) {
		req.write(options.data);
	}

	req.end();
}