const path = require('path')
const inquirer = require('inquirer')
const PromptModuleAPI = require('./PromptModuleAPI')
const Creator = require('./Creator')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const executeCommand = require('./utils/executeCommand')

async function create(name, options) {
    const creator = new Creator()
    const promptModules = getPrompts()
    const promptAPI = new PromptModuleAPI(creator)
    promptModules.forEach(m => m(promptAPI))
    clearConsole()
    // const answers = await inquirer.prompt(creator.resolveFinalPrompts())
    // const preset = {
    //     plugins: {}
    // }

    // creator.promptCompleteCbs.forEach(cb => cb(answers, preset))
    const answers = { features: [ 'babel', 'router', 'vuex' ], historyMode: true }

    const pkg = {
        name,
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
    }
    
    const generator = new Generator(pkg, path.join(process.cwd(), name))
    answers.features.unshift('vue', 'webpack')
    answers.features.forEach(feature => {
        require(`./generator/${feature}`)(generator, answers)
    })

    generator.generate()
    // executeCommand('npm install', path.join(process.cwd(), name))
}

function getPrompts() {
    return [
        'babel',
        'router',
        'vuex',
    ].map(file => require(`./promptModules/${file}`))
}
module.exports = create