var events = require('events');
var https = require('https');
var util = require('util');

var Logger = require('./logger.js');

function Dynect(customer, username, password, keepalive) {
	events.EventEmitter.call(this);
	var self = this;

	this.logger = new Logger('Dynect');
	this.connected = false;
	this.session = new Session(customer, username, password);
	this.timer_id = '';

	this.session.on('opened', function (token) {
		self.connected = true;
		self.emit('connected', token);

		if (keepalive) {
			self.timer_id = setInterval(function () {
				self.session.keepAlive();
			}, keepalive);
		}

		self.logger.info('connected', { token: token, keepAlive: keepalive });
	});

	function onClosed() {
		self.connected = false;
		self.emit('disconnected');

		if (keepalive && self.timer_id != '') {
			clearInterval(self.timer_id);
			self.timer_id = '';
		}

		self.logger.info('disconnected');
	}

	this.session.on('closed', onClosed);

	this.session.on('error', function () {
		if (self.connected) {
			onClosed();
			self.session.open();
		}
	});
}

util.inherits(Dynect, events.EventEmitter);
module.exports = Dynect;

Dynect.prototype.connect = function () {
	this.session.open();
}

Dynect.prototype.disconnect = function () {
	this.session.close();
}

Dynect.prototype.publishZone = function (zone, callback) {
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

Dynect.prototype.getRecordSet = function (type, zone, fqdn, callback) {
	this.record(type, 'GET', zone, fqdn, null, {}, callback);

	//{'status': 'success', 
	//'data': ['/REST/ARecord/example.com/www.example.com/13179845'], 
	//'job_id': 8301511, 
	//'msgs': [{'INFO': 'detail: Found 1 record', 'SOURCE': 'BLL', 'ERR_CD': null, 'LVL': 'INFO'}]}
}

Dynect.prototype.getRecord = function (type, zone, fqdn, recordId, callback) {
	this.record(type, 'GET', zone, fqdn, recordId, {}, callback);

	//{'status': 'success', 
	//'data': {
	//'zone': 'example.com', 
	//'ttl': 30, 
	//'fqdn': 'www.example.com', 
	//'record_type': 'A', 
	//'rdata': {'address': '12.13.14.15'}, 
	//'record_id': 13179845 
	//}, 
	//'job_id': 8307490, 
	//'msgs': [{'INFO': 'get: Found the record', 'SOURCE': 'API-B', 'ERR_CD': null, 'LVL': 'INFO'}]}
}

Dynect.prototype.addRecord = function (type, zone, fqdn, rdata, ttl, callback) {
	this.record(type, 'POST', zone, fqdn, null, {
		rdata: rdata,
		ttl: ttl
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

Dynect.prototype.editRecords = function (type, zone, fqdn, records, callback) {
	this.record(type, 'PUT', zone, fqdn, recordId, records, callback);
}

Dynect.prototype.editRecord = function (type, zone, fqdn, recordId, rdata, ttl, callback) {
	this.record(type, 'PUT', zone, fqdn, recordId, {
		rdata: rdata,
		ttl: ttl
	}, callback);
}

Dynect.prototype.removeRecord = function (type, zone, fqdn, recordId, callback) {
	this.record(type, 'DELETE', zone, fqdn, recordId, {}, callback);
}

Dynect.prototype.record = function (type, method, zone, fqdn, recordId, data, callback) {
	var path = '/' + type + 'Record/' + zone + '/' + fqdn + '/';
	var options = {};

	if (recordId !== null) {
		path += recordId + '/';
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