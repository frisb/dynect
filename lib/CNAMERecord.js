var util = require('util');

var _Record = require('./Record');

function CNAMERecord(session) {
	_Record.call(this, session, 'CNAME');
}

util.inherits(CNAMERecord, _Record);
module.exports = ARecord;

CNAMERecord.prototype.validateDataItem = function (item) {
	_Record.prototype.validateDataItem.call(this, item);

	if (!item.rdata.cname) {
		throw new Error('data item rdata must contain cname');
	}
}