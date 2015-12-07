
var fs = require('fs');
var vm = require('./vm');
var program = require('commander');





var DEBUG_LEVEL = 0;                      // 0 - Nothing
                                          // 1 - Operation + Params
                                          // 2 - Operation + Params + Registers
                                          // 3 - Operation + Params + Registers + Stack



// command line interpreter
program
	.version('0.0.1');



program
	.command('disasm <binary_file>')
	.action(function (binary_file) {
		loadMemory(binary_file);
		disasembler();
	});


program
	.command('run <binary_file>')
	.option('-l, --log <level>', 'Set log level')
	.option('-d, --dump <file>', 'Dump memory after 5s of execution')
	.option('-k, --keyboard <file>', 'Add a keyboard file')
	.option('-r, --registers <initial_value>', 'Set the initial value of the 8 registers')
	.action(function (binary_file, options) {

		loadMemory(binary_file);

		if (options.keyboard) {
			loadKeyboard(options.keyboard);
		}

		if (options.dump) {
			dump(options.dump);
		}

		if (options.log) {
			DEBUG_LEVEL = +options.log;
		}

		if (options.registers) {
			vm.setRegisters(+options.registers);
		}

		run ();

	});

program.parse(process.argv);




// load the memory dump
function loadMemory (file) {
	var memory = [];
	var data = fs.readFileSync(file);
	for (var i = 0; i<data.length/2; i++) {
		memory[i] = data[i*2]+data[i*2+1]*256;
	}
	vm.setMemory(memory);
}




// load the keyboard solution
function loadKeyboard (file) {
	var chars = fs.readFileSync(file);
	vm.setKeyboard(chars);
}




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





// dump current memory program
function dump (file) {
	setTimeout (function () {
		var mem = vm.getMemory();
		var data = [];
		for (var i = 0; i<mem.length; i++) {
			data[i*2]   = memory[i] % 256;
			data[i*2+1] = (memory[i] - data[i*2]) / 256;
		}
		fs.writeFileSync(file, new Buffer(data));
		process.exit();
	}, 5000);
}





// disasembler
function disasembler () {
	var mem = vm.getMemory();
	var position = 0;
	while (position < mem.length) {
		position    = vm.getPosition();
		var instruction = vm.getInstruction();
		if (instruction) {
			var params      = vm.getParams(instruction);
			console.log(pad(position, 5) + '\t' + instruction.opcode + '\t' + params.join(','));
		} else {
			console.log(pad(position, 5) + '\tUNKN\t' + pad(mem[position], 5));
		}
	}
	process.exit();
}
