var events = require('events');
var https = require('https');
var util = require('util');

var Record = require('./lib/Record');
var Session = require('./session');

function Dynect(customer, username, password, keepalive) {
	events.EventEmitter.call(this);

	this.connected = false;
	this.session = new Session(customer, username, password);
	this.timer_id = '';

	this.Record = new Record(this.session);
	this.ARecord = new Record(this.session,			'A',		['address']);
	this.AAAARecord = new Record(this.session,		'AAAA',		['address']);
	this.CERTRecord = new Record(this.session,		'CERT',		['format', 'tag', 'algorithm', 'certificate']);
	this.CNAMERecord = new Record(this.session,		'CNAME',	['cname']);
	this.MXRecord = new Record(this.session,		'MX',		['exchange', 'preference']);
	this.SRVRecord = new Record(this.session,		'SRV',		['port', 'priority', 'target', 'weight']);
	this.TXTRecord = new Record(this.session,		'TXT',		['txtdata']);

	this.services = null;
	this.misc = null;
	this.users = null;
	this.permissions = null;
	this.zones = null;
	this.reports = null;

	this._wireSessionEvents(keepalive);
}

util.inherits(Dynect, events.EventEmitter);
module.exports = Dynect;

Dynect.prototype._wireSessionEvents = function (keepalive) {
	var self = this;

	this.session.on('opened', function (token) {
		self.connected = true;
		self.emit('connected', token);

		if (keepalive) {
			self.timer_id = setInterval(function () {
				self.session.keepAlive();
			}, keepalive);
		}
	});

	function onClosed() {
		self.connected = false;
		self.emit('disconnected');

		if (keepalive && self.timer_id != '') {
			clearInterval(self.timer_id);
			self.timer_id = '';
		}
	}

	this.session.on('closed', onClosed);

	this.session.on('error', function () {
		if (self.connected) {
			onClosed();
			self.session.open();
		}
	});

	this._wireClientEvents();
}

Dynect.prototype._wireClientEvents = function () {
	var self = this;

	this.session.client.on('enqueued', function (task) {
		self.emit('enqueued', task);
	});

	this.session.client.on('dequeued', function (task) {
		self.emit('dequeued', task);
	});

	this.session.client.on('drained', function () {
		self.emit('queueComplete');
	});

	this.session.client.on('response', function (task, response) {
		self.emit('response', task, response);
	});

	this.session.client.on('error', function (task, err) {
		self.emit('error', task, err);
	});
}

Dynect.prototype.connect = function (callback) {
	this.session.open(callback);
}

Dynect.prototype.disconnect = function () {
	this.session.close();
}

Dynect.prototype.publish = function (zone, callback) {
	this.session.execute('PUT', '/Zone/' + zone + '/', {
		data: { publish: 'true' }
	}, function (response) {
		//{'status': 'success', 
		//'data': {'zone_type': 'Primary', 'serial_style': 'day', 'serial': 2013010101, 'zone': 'example.com'},  
		//'job_id': 8969227,  
		//'msgs': [{'INFO': 'publish: example.com published', 'SOURCE': 'BLL', 'ERR_CD': null, 'LVL': 'INFO'}]}

		if (callback) {
			callback(response);
		}
	});
}

Dynect.prototype.getGSLBRegionPoolEntry = function (zone, fqdn, regionCode, address, callback) {
	this.gslbRegionPoolEntry('GET', zone, fqdn, regionCode, address, {}, callback);
}

Dynect.prototype.addGSLBRegionPoolEntry = function(zone, fqdn, regionCode, address, label, weight, serveMode, callback) {
	this.gslbRegionPoolEntry('POST', zone, fqdn, regionCode, address, {
		rdata: {
			address: address,
			label: label,
			weight: weight,
			serve_mode: serveMode
		}
	}, callback);

	//{'status': 'success', 
	//'data': { 
	//'zone': 'example.com',  
	//'ttl': 60,  
	//'fqdn': 'www.example.com',  
	//'record_type': 'A',  
	//'rdata': {'address': '12.13.14.15'},  
	//'record_id': 0 
	//},  
	//'job_id': 8965933,  
	//'msgs': [{'INFO': 'add: Record added', 'SOURCE': 'BLL', 'ERR_CD': null, 'LVL': 'INFO'}]}
}

Dynect.prototype.editGSLBRegionPoolEntry = function (zone, fqdn, regionCode, address, newAddress, label, weight, serveMode, callback) {
	this.gslbRegionPoolEntry('PUT', zone, fqdn, regionCode, address, {
		rdata: {
			new_address: newAddress,
			label: label,
			weight: weight,
			serve_mode: serveMode
		}
	}, callback);
}

Dynect.prototype.removeGSLBRegionPoolEntry = function (zone, fqdn, regionCode, address, callback) {
	this.gslbRegionPoolEntry('DELETE', zone, fqdn, regionCode, address, {}, callback);
}

Dynect.prototype.gslbRegionPoolEntry = function (method, zone, fqdn, regionCode, address, data, callback)
{
	var path = '/GSLBRegionPoolEntry/' + zone + '/' + fqdn + '/' + regionCode + '/';
	var options = {};

	if (method !== 'POST') {
		path += address + '/';
	}

	if (method === 'POST' || method === 'PUT') {
		options.data = data;
	}

	this.session.execute(method, path, options, function (response) {
		if (callback) {
			callback(response);
		}
	});
}