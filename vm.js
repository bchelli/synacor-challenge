
var keyboard = require('./keyboard');




// const
var MAX_VAL     = 32768;





// memory
var memory    = [];                       //   - memory with 15-bit address space storing 16-bit values
var registers = [0, 0, 0, 0, 0, 0, 0, 0]; //   - eight registers
var stack     = [];                       //   - an unbounded stack which holds individual 16-bit values
var position  = 0;





// helpers
function val (v) {
	return ((v % MAX_VAL) + MAX_VAL) % MAX_VAL;
}
function getVal (v) {
	return (v<MAX_VAL ? v : registers[v%MAX_VAL]) || 0;
}
function setVal (p, v) {
	var mem = p<MAX_VAL ? memory : registers;
	mem[p%MAX_VAL] = v || 0;
}
function readMemory () {
	return memory[position++];
}





// instructions
var instructions = [
	{   // 0x0000  - stop execution and terminate the program
		opcode: 'halt', nbParams: 0, async: false,
		fn: function () {process.exit()}
	},
	{   // 0x0001  - set register <a> to the value of <b>
		opcode: 'set', nbParams: 2, async: false,
		fn: function (a, b) {setVal(a, getVal(b))}
	},
	{   // 0x0002  - push <a> onto the stack
		opcode: 'push', nbParams: 1, async: false,
		fn: function (a) {stack.push(getVal(a))}
	},
	{   // 0x0003  - remove the top element from the stack and write it into <a>; empty stack = error
		opcode: 'pop', nbParams: 1, async: false,
		fn: function (a) {if(!stack.length) throw new Error(); else setVal(a, getVal(stack.pop()))}
	},
	{   // 0x0004  - set <a> to 1 if <b> is equal to <c>; set it to 0 otherwise
		opcode: 'eq', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, getVal(b) === getVal(c) ? 1 : 0)}
	},
	{   // 0x0005  - set <a> to 1 if <b> is greater than <c>; set it to 0 otherwise
		opcode: 'gt', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, getVal(b) > getVal(c) ? 1 : 0)}
	},
	{   // 0x0006  - jump to <a>
		opcode: 'jmp', nbParams: 1, async: false,
		fn: function (a) {position = getVal(a)}
	},
	{   // 0x0007  - if <a> is nonzero, jump to <b>
		opcode: 'jt', nbParams: 2, async: false,
		fn: function (a, b) {if(getVal(a)!==0){position = getVal(b)}}
	},
	{   // 0x0008  - if <a> is zero, jump to <b>
		opcode: 'jf', nbParams: 2, async: false,
		fn: function (a, b) {if(getVal(a)===0){position = getVal(b)}}
	},
	{   // 0x0009  - assign into <a> the sum of <b> and <c> (modulo 32768)
		opcode: 'add', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, val(getVal(b)+getVal(c)))}
	},
	{   // 0x000A  - store into <a> the product of <b> and <c> (modulo 32768)
		opcode: 'mult', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, val(getVal(b)*getVal(c)))}
	},
	{   // 0x000B  - store into <a> the remainder of <b> divided by <c>
		opcode: 'mod', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, val(getVal(b)%getVal(c)))}
	},
	{   // 0x000C  - stores into <a> the bitwise and of <b> and <c>
		opcode: 'and', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, val(getVal(b)&getVal(c)))}
	},
	{   // 0x000D  - stores into <a> the bitwise or of <b> and <c>
		opcode: 'or', nbParams: 3, async: false,
		fn: function (a, b, c) {setVal(a, val(getVal(b)|getVal(c)))}
	},
	{   // 0x000E  - stores 15-bit bitwise inverse of <b> in <a>
		opcode: 'not', nbParams: 2, async: false,
		fn: function (a, b) {setVal(a, val((MAX_VAL-1)^getVal(b)))}
	},
	{   // 0x000F  - read memory at address <b> and write it to <a>
		opcode: 'rmem', nbParams: 2, async: false,
		fn: function (a, b) {setVal(a, memory[getVal(b)])}
	},
	{   // 0x0010  - write the value from <b> into memory at address <a>
		opcode: 'wmem', nbParams: 2, async: false,
		fn: function (a, b) {memory[getVal(a)] = getVal(b)}
	},
	{   // 0x0011  - write the address of the next instruction to the stack and jump to <a>
		opcode: 'call', nbParams: 1, async: false,
		fn: function (a) {stack.push(position); position = getVal(a)}
	},
	{   // 0x0012  - remove the top element from the stack and jump to it; empty stack = halt
		opcode: 'ret', nbParams: 0, async: false,
		fn: function () {if(!stack.length) process.exit(); position = getVal(stack.pop())}
	},
	{   // 0x0013  - write the character represented by ascii code <a> to the terminal
		opcode: 'out', nbParams: 1, async: false,
		fn: function (a) {process.stdout.write(String.fromCharCode(getVal(a)))}
	},
	{   // 0x0014  - read a character from the terminal and write its ascii code to <a>; it can be assumed that once input starts, it will continue until a newline is encountered; this means that you can safely read whole lines from the keyboard and trust that they will be fully read
		opcode: 'in', nbParams: 1, async: true,
		fn:  function (a, run) {keyboard.onKeyPress(function (v) {setVal(a, v); run();})}
	},
	{   // 0x0015  - no operation
		opcode: 'noop', nbParams: 0, async: false,
		fn: function () {}
	},
];





// public API
module.exports = {
	setMemory: function (mem) {
		memory = mem;
	},
	setKeyboard: function (keys) {
		keyboard.setKeyboard(keys);
	},
	setRegisters: function (v) {
		registers = [v, v, v, v, v, v, v, v];
	},
	getPosition: function () {
		return position;
	},
	getMemory: function () {
		return memory;
	},
	getInstruction: function () {
		return instructions[readMemory()];
	},
	getParams: function (instruction) {
		var params = [];
		while (params.length < instruction.nbParams) {
			params.push(readMemory());
		}
		return params;
	},
	getRegistersDump: function () {
		return registers.join(',');
	},
	getStackDump: function () {
		return stack.join(',');
	},
}
