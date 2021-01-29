#!/usr/bin/env node
const program = require('commander')
const inquirer = require('inquirer')

program
    .version('0.1.0')
    .command('create <appName>')
    .description('create a new project powered by vue-cli-service')
    .option('-t, --title', 'title to use before name')
    .option('-d, --debug', 'display some debugging')
    .action(async (appName, options) => {
        console.log(appName, JSON.stringify(options))
        const res = await inquirer.prompt([{
            name: 'features',
            type: 'checkbox',
            message: '请选择要使用的功能',
            choices: [
                { 'name': 'eslint', value: 'eslint' },
                { 'name': 'babel', value: 'babel' },
                { 'name': 'TypeScript', value: 'ts' },
                { 'name': 'vueRouter', value: 'router' },
                { 'name': 'vuex', value: 'vuex' },
                { 'name': 'cssPreprocessor', value: 'css' },
                { 'name': 'unitTest', value: 'unit' },
            ]
        }])

        console.log(JSON.stringify(res))
    })



program.parse()