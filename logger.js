var winston = require('winston');

module.exports = function (category) {
	var config = {
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
	};

	var logger = new (winston.Logger)({
		transports: [
		  new (winston.transports.Console)({
		  	colorize: true,
		 	handleExceptions: true,
		  	timestamp: false
		  })
		],
		levels: config.levels,
		colors: config.colors
	});

	logger.exitOnError = false;

	return {
		info: function (text, metadata) {
			this.log('info', text, metadata);
		},

		debug: function (text, metadata) {
			this.log('debug', text, metadata);
		},

		warn: function (text, metadata) {
			this.log('warn', text, metadata);
		},

		error: function (text, metadata) {
			this.log('error', text, metadata);
		},

		log: function (level, text, metadata) {
			text = new Date().toStarDate() + ' [' + category + ' ' + text + ']';

			if (metadata) {
				var mtext;

				if (typeof (metadata) != 'string') {
					mtext = JSON.stringify(metadata);
				}
				else {
					mtext = metadata;
				}

				text = text + ' ' + mtext;
			}

			logger.log(level, text);
		}
	};
}

Date.prototype.toStarDate = function () {
	return this.toDateStr('/') + ' ' + this.toTimeStr();
}

Date.prototype.toDateStr = function (delimiter) {
	if (!delimiter) {
		delimiter = '.';
	}

	return this.getFullYear() + delimiter + pad(this.getMonth() + 1) + delimiter + pad(this.getDate());
}

Date.prototype.toTimeStr = function (delimiter) {
	if (!delimiter) {
		delimiter = ':';
	}

	var millisec = this.getMilliseconds();

	if (millisec < 100) {
		millisec = '0' + pad(millisec);
	}

	return pad(this.getHours()) + delimiter + pad(this.getMinutes()) + delimiter + pad(this.getSeconds()) + delimiter + '' + millisec;
}

function pad(num, len) {
	if (typeof (num) != 'string') {
		num = '' + num;
	}

	if (!len) {
		len = 2;
	}

	if (num.length >= len) {
		return num;
	}

	var padding = '';

	for (var i = 0; i < len - num.length; i++) {
		padding += '0';
	}

	return padding + num;
}
