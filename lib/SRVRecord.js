var util = require('util');

var _Record = require('./_Record');

function SRVRecord(session) {
	_Record.call(this, session, 'SRV');
}

util.inherits(SRVRecord, _Record);
module.exports = SRVRecord;

SRVRecord.prototype.validateDataItem = function (item) {
	_Record.prototype.validateDataItem.call(this, item);

	if (!item.rdata.port) {
		throw new Error('data item rdata must contain port');
	}

	if (!item.rdata.priority) {
		throw new Error('data item rdata must contain priority');
	}

	if (!item.rdata.target) {
		throw new Error('data item rdata must contain target');
	}
	
	if (!item.rdata.weight) {
		throw new Error('data item rdata must contain weight');
	}
}