var events = require('events');
var util = require('util');

var Client = require('./client');

function Session(customer, username, password) {
	events.EventEmitter.call(this);
	var self = this;

	this.openTime = null;
	this.customer = customer;
	this.username = username;
	this.password = password;
	this.token = null;

	this.client = new Client();
}

util.inherits(Session, events.EventEmitter);
module.exports = Session;

Session.prototype.open = function (callback) {
	var self = this;

	this.client.queue(null, 'POST', '/Session/', {
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

	this.client.queue(this.token, 'DELETE', '/Session/', {}, function (response) {
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

	this.client.queue(this.token, 'GET', '/Session/', {}, function (response) {
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

	this.client.queue(this.token, 'PUT', '/Session/', {}, function (response) {
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
		// session open for 50 mins
		if (Date.now() - this.openTime >= (50 * 60 * 1000)) {
			this.verify(function (err) {
				if (err) {
					self.open(function (err) {
						if (!err) {
							self.client.queue(self.token, method, path, options);
						}
					});
				}
			});
		}
		else {
			this.client.queue(this.token, method, path, options, callback);
		}
	}
	else {
		this.open(function (err) {
			if (!err) {
				self.client.queue(self.token, method, path, options, callback);
			}
		});
	}
}