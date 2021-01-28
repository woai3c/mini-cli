#!/usr/bin/env node
const program = require('commander')
const inquirer = require('inquirer')

program
    .version('0.1.0')
    .command('create <appName>')
    .description('create a new project powered by vue-cli-service')
    .option('-t, --title', 'title to use before name')
    .option('-d, --debug', 'display some debugging')
    .action((appName, options) => {
        console.log(appName, JSON.stringify(options))
        inquirer
            .prompt([
                /* Pass your questions in here */
                'test'
            ])
            .then(answers => {
                // Use user feedback for... whatever!!
            })
            .catch(error => {
                if(error.isTtyError) {
                // Prompt couldn't be rendered in the current environment
                } else {
                // Something else went wrong
                }
            })
    })



program.parse()