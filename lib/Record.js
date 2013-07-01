var async = require('async');

function Record(session, type, model) {
	this.session = session;

	if (type) {
		this.type = type;
	}

	this._model = model;
}

module.exports = Record;

Record.prototype.get = function (options, callback) {
	var self = this;

	this.query('GET', options, function (response) {
		if (!options.record_id && response.data.length > 0) {
			// multiple records to get

			async.mapSeries(response.data,
				function (uri, callback) {
					var uriParts = uri.split('/');
					options.record_id = uriParts[uriParts.length - 1];

					self.get(options, function (r) {
						callback(null, r);
					});
				},
				function (err, results) {
					if (err == null) {
						callback(results);
					}
					else {
						throw new Error(err);
					}
				});
		}
		else {
			callback(response);
		}
	});
}

Record.prototype.add = function (options, callback) {
	this.query('POST', options, callback);
}

Record.prototype.edit = function (options, callback) {
	this.query('PUT', options, callback);
}

Record.prototype.delete = function (options, callback) {
	this.query('DELETE', options, callback);
}

Record.prototype.query = function (method, options, callback) {
	this.validateQuery(method, options);

	var path = '/' + this.type + 'Record/' + options.zone + '/';

	if (options.fqdn) {
		path += options.fqdn + '/';

		if ((method == 'GET' || method == 'DELETE') && options.record_id) {
			path += options.record_id + '/';
		}
	}

	this.session.execute(method, path, {
		data: options.data
	}, function (response) {
		if (callback) {
			callback(response);
		}
	});
}

Record.prototype.validateQuery = function (method, options) {
	this.type = this.type || options.type;

	if (!this.type) {
		throw new Error('type not specified for ' + method);
	}

	if (!options.zone) {
		throw new Error('zone not specified for ' + method);
	}

	switch (method) {
		case 'DELETE': {
			if (!options.record_id) {
				throw new Error('record_id not specified for ' + method);
			}

			break;
		}

		case 'POST':
		case 'PUT': {
			if (!options.data) {
				throw new Error('data not specified for ' + method);
			}

			if (typeof (options.data) == 'Array') {
				if (options.data.length == 0) {
					for (var i = 0; i < options.data.length; i++) {
						this.validateDataItem(options.data[i]);
					}
				}
			}
			else {
				this.validateDataItem(options.data);
			}

			break;
		}
	}
}

Record.prototype.validateDataItem = function(item) {
	if (!item.ttl) {
		throw new Error('data item must contain ttl');
	}

	if (!item.rdata) {
		throw new Error('data item must contain rdata');
	}

	if (this._model) {
		for (var i = 0; i < this._model.length; i++) {
			var arg = this._model[i];

			if (!item.rdata[arg]) {
				throw new Error('data item rdata must contain ' + arg);
			}
		}
	}
}