
var keypress = require('keypress');

var keypressCallback = null;
var chars = [];
var keyPosition = 0;
function onKeyPress (cb) {
	keypressCallback = function (ch) {
		process.stdout.write(ch);
		var c = ch.charCodeAt(0);
		cb(c === 13 ? 10 : c);
		keypressCallback = null;
	}
	if (keyPosition < chars.length) {
		keypressCallback(
			String.fromCharCode(chars[keyPosition++])
		);
	}
}
keypress(process.stdin);
process.stdin.on('keypress', function (ch, key) {
	if (keypressCallback && ch) {
		keypressCallback(ch);
	}
	if (key && key.ctrl && key.name == 'c') {
		process.stdin.pause();
	}
});
process.stdin.setRawMode(true);
process.stdin.resume();

module.exports = {
	load: function (data) {
		chars = data;
	},
	onKeyPress: onKeyPress
};
