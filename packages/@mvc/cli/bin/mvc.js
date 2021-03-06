#!/usr/bin/env node
const program = require('commander')
const create = require('../lib/create')
const add = require('../lib/add')

program
.version('0.1.0')
.command('create <name>')
.description('create a new project')
.action(name => { 
    create(name)
})

program
.command('add <name>')
.description('add a plugin')
.action(name => { 
    add(name)
})

program.parse()