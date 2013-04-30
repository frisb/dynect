var events = require('events');
var https = require('https');
var util = require('util');
var winston = require('winston');

var logger = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({
	  	colorize: true,
	  	handleExceptions: true,
	  	timestamp: false
	  })
	],
	levels: {
		silly: 0,
		verbose: 1,
		info: 2,
		data: 3,
		warn: 4,
		debug: 5,
		error: 6
	},
	colors: {
		silly: 'blue',
		verbose: 'cyan',
		info: 'green',
		data: 'grey',
		warn: 'magenta',
		debug: 'yellow',
		error: 'red'
	}
});

function Session(customer, username, password) {
	events.EventEmitter.call(this);
	this.openTime = null;
	this.customer = customer;
	this.username = username;
	this.password = password;
	this.token = null;
}

util.inherits(Session, events.EventEmitter);
module.exports = Session;

Session.prototype.open = function (callback) {
	var self = this;

	send(null, 'POST', '/Session/', {
		data: {
			customer_name: this.customer,
			user_name: this.username,
			password: this.password
		}
	}, function (response) {
		//{'status': 'success',
		//'data': {
		//'token': 'L555zUgaQaEUKPaWls9jO9A6foxWkXrNRuaFREksrqS1GsKBFwqSUrA7RKZ82/NtthnhXoSijher/Y2tyWleEDIDbdkFv/1uQUq7Vm4LJ12QPow68S3fSQJOmkv4mxuo9syvt3BOh0cOQTY2YUmNug==', 
		//'version': '3.0.0'
		//},
		//'job_id': 8236528,
		//'msgs': [{'INFO': 'login: Login successful', 'SOURCE': 'BLL', 'ERR_CD': null, 'LVL': 'INFO'}]}

		var err;

		if (response.status == 'success') {
			self.token = response.data.token;
			self.openTime = Date.now();
			self.emit('opened', self.token);
		}
		else {
			err = response.msgs[0].ERR_CD;
			self.emit('error', err);
		}

		if (callback) {
			callback(err, self.token);
		}
	});
}

Session.prototype.close = function () {
	var self = this;

	send(this.token, 'DELETE', '/Session/', {}, function (response) {
		//{ status: 'success',
		//	data: {},
		//	job_id: 187784305,
		//	msgs:
		//	[ { INFO: 'logout: Logout successful',
		//		SOURCE: 'BLL',
		//		ERR_CD: null,
		//		LVL: 'INFO' } ] }

		if (response.status == 'success') {
			self.token = null;
			self.openTime = null;
			self.emit('closed');
		}
		else {
			self.emit('error', response.msgs[0].ERR_CD);
		}
	});
}

Session.prototype.verify = function () {
	var self = this;

	send(this.token, 'GET', '/Session/', {}, function (response) {
		//{ status: 'success',
		//	data: {},
		//	job_id: 187782563,
		//	msgs:
		//	[ { INFO: 'isalive: User session is still active',
		//		SOURCE: 'BLL',
		//		ERR_CD: null,
		//		LVL: 'INFO' } ] }

		var err;

		if (response.status == 'success') {
			self.emit('verified');
		}
		else {
			self.emit('error', response.msgs[0].ERR_CD);
		}

		if (callback) {
			callback(err);
		}
	});
}

Session.prototype.keepAlive = function () {
	var self = this;

	send(this.token, 'PUT', '/Session/', {}, function (response) {
		//{ status: 'success',
		//	data: {},
		//	job_id: 187784261,
		//	msgs:
		//	[ { INFO: 'keepalive: User session extended',
		//		SOURCE: 'BLL',
		//		ERR_CD: null,
		//		LVL: 'INFO' } ] }

		if (response.status == 'success') {
			self.emit('keepalive');
		}
		else {
			self.emit('error', response.msgs[0].ERR_CD);
		}
	});
}

Session.prototype.execute = function (method, path, options, callback) {
	var self = this;

	if (this.token != null) {
		if (Date.now() - this.openTime >= (50 * 60 * 1000)) {
			this.verify(function (err) {
				if (err) {
					self.open(function (err) {
						if (!err) {
							send(self.token, method, path, options, callback);
						}
					});
				}
			});
		}
		else {
			send(this.token, method, path, options, callback);
		}
	}
	else {
		this.open(function (err) {
			if (!err) {
				send(self.token, method, path, options, callback);
			}
		});
	}
}

function send(token, method, path, options, callback) {
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
							winston.error(msg.ERR_CD + ' (' + msg.INFO + ')\n');
						}
						else {
							winston.info(msg.INFO + '\n');
						}
					}
				}
				else {
					winston.info(response + '\n');
				}

				if (callback) {
					callback(response);
				}
			}
			catch (e) {
				winston.error('[request exception] ' + e.message + '\n\n' + data);
			}
		});
	});

	req.on('error', function (e) {
		winston.error('[request] ' + e);
	});

	winston.info(method + ' https://' + opt.host + opt.path);

	if ((method === 'POST' || method === 'PUT') && options.data) {
		req.write(options.data);
	}

	req.end();
}