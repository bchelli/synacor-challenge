
var fs = require('fs');
var vm = require('./vm');



var DEBUG_LEVEL = 1;                      // 0 - Nothing
                                          // 1 - Operation + Params
                                          // 2 - Operation + Params + Registers
                                          // 3 - Operation + Params + Registers + Stack


// load the memory dump
var memory = [];
var chars  = [];
var data = fs.readFileSync(process.argv[2]);
for (var i = 0; i<data.length/2; i++) {
	memory[i] = data[i*2]+data[i*2+1]*256;
}
if (process.argv.length >= 4) {
	chars = fs.readFileSync(process.argv[3]);
}
vm.load(memory, chars);





// run the program
function pad(num, size) {
	var s = num+"";
	while (s.length < size) s = '0' + s;
	return s;
}
function run () {
	setTimeout(function () {
		var async = false;
		while (!async) {
			var position    = vm.getPosition();
			var instruction = vm.getInstruction();
			var params      = vm.getParams(instruction);
			if (DEBUG_LEVEL >= 1) {
				console.error(pad(position, 5) + '\t' + instruction.opcode + '\t' + params.join(','));
			}
			if (DEBUG_LEVEL >= 2) {
				console.error('     \tRegisters: [' + vm.getRegistersDump() + ']');
			}
			if (DEBUG_LEVEL >= 3) {
				console.error('     \tStack:     [' + vm.getStackDump()     + ']');
			}
			async = instruction.async;
			if (async) {
				params.push(run);
			}
			instruction.fn.apply(null, params);
		}
	}, 0);
}
run();



