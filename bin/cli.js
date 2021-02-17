#!/usr/bin/env node
const program = require('commander')
const create = require('../lib/create')

program
    .version('0.1.0')
    .command('create <name>')
    .description('create a new project powered by vue-cli-service')
    .option('-t, --title', 'title to use before name')
    .option('-d, --debug', 'display some debugging')
    .action((name, options) => { 
        create(name, options)
    })

program.parse()