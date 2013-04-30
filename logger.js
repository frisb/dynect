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
