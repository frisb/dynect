var util = require('util');

var _Record = require('./_Record');

function ARecord(session) {
	_Record.call(this, session, 'A');
}

util.inherits(ARecord, _Record);
module.exports = ARecord;

ARecord.prototype.validateDataItem = function (item) {
	_Record.prototype.validateDataItem.call(this, item);

	if (!item.rdata.address) {
		throw new Error('data item rdata must contain address');
	}
}