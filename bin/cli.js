#!/usr/bin/env node
const program = require('commander')

program
  .option('-c, --cheese <type>', 'add the specified type of cheese', 'blue');

program.parse();

console.log(`cheese: ${program.opts().cheese}`);
console.log(options, process.argv)