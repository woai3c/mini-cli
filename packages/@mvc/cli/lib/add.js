const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
const inquirer = require('inquirer')
const PromptModuleAPI = require('./PromptModuleAPI')
const Creator = require('./Creator')
const Generator = require('./Generator')
const clearConsole = require('./utils/clearConsole')
const { savePreset, rcPath } = require('./utils/options')
const { log } = require('./utils/logger')
const { saveOptions } = require('./utils/options')
const PackageManager = require('./PackageManager')
const getPackage = require('./utils/getPackage')

async function add(name) {
    const targetDir = process.cwd()
    const pkg = getPackage(targetDir)
    // 清空控制台
    clearConsole()

    // 弹出交互提示语并获取用户的选择
    const creator = new Creator()
    // 获取各个模块的交互提示语
    const promptModules = getPromptModules()
    const promptAPI = new PromptModuleAPI(creator)
    promptModules.forEach(m => m(promptAPI))

    const answers = await inquirer.prompt(creator.getFinalPrompts(name))
    const generator = new Generator(pkg, targetDir)
    const pm = new PackageManager(targetDir, answers.packageManager)
    require(`@mvc/cli-plugin-${name}/generator`)(generator, answers)

    await generator.generate()
    // 下载依赖
    await pm.install()
}

function getPromptModules(name) {
    let arr
    if (name) {
        arr = [name]
    } else {
        arr = [
            'babel',
            'router',
            'vuex',
            'linter',
        ]
    }

    return arr.map(file => require(`./promptModules/${file}`))
}

module.exports = add