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
const writeFileTree = require('./utils/writeFileTree')

async function create(name) {
    const targetDir = path.join(process.cwd(), name)
    // 如果目标目录已存在，询问是覆盖还是合并
    if (fs.existsSync(targetDir)) {
        // 清空控制台
        clearConsole()
        
        const { action } = await inquirer.prompt([
            {
                name: 'action',
                type: 'list',
                message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
                choices: [
                    { name: 'Overwrite', value: 'overwrite' },
                    { name: 'Merge', value: 'merge' },
                ],
            },
        ])

        if (action === 'overwrite') {
            console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
            await fs.remove(targetDir)
        }
    }

    const creator = new Creator()
    // 获取各个模块的交互提示语
    const promptModules = getPromptModules()
    const promptAPI = new PromptModuleAPI(creator)
    promptModules.forEach(m => m(promptAPI))

    // 清空控制台
    clearConsole()

    // 弹出交互提示语并获取用户的选择
    const answers = await inquirer.prompt(creator.getFinalPrompts())
    if (answers.preset !== '__manual__') {
        const preset = creator.getPresets()[answers.preset]
        Object.keys(preset).forEach(key => {
            answers[key] = preset[key]
        })
    }

    if (answers.packageManager) {
        saveOptions({
            packageManager: answers.packageManager,
        })
    }

    if (answers.save && answers.saveName && savePreset(answers.saveName, answers)) {
        log()
        log(`Preset ${chalk.yellow(answers.saveName)} saved in ${chalk.yellow(rcPath)}`)
    }

    const pm = new PackageManager(targetDir, answers.packageManager)

    // package.json 文件内容
    const pkg = {
        name,
        version: '0.1.0',
        dependencies: {},
        devDependencies: {},
    }
    
    const generator = new Generator(pkg, targetDir)
    // 填入 cli-service 必选项，无需用户选择
    answers.features.unshift('service')
    answers.features.forEach(feature => {
        if (feature !== 'service') {
            pkg.devDependencies[`mvc-cli-plugin-${feature}`] = '~1.0.0'
        } else {
            pkg.devDependencies['mvc-cli-service'] = '~1.0.0'
        }
    })

    await writeFileTree(targetDir, {
        'package.json': JSON.stringify(pkg, null, 2),
    })

    await pm.install()

    // 根据用户选择的选项加载相应的模块，在 package.json 写入对应的依赖项
    // 并且将对应的 template 模块渲染
    answers.features.forEach(feature => {
        if (feature !== 'service') {
            require(`mvc-cli-plugin-${feature}/generator`)(generator, answers)
        } else {
            require(`mvc-cli-service/generator`)(generator, answers)
        }
    })

    await generator.generate()

    // 下载依赖
    await pm.install()
    log('\n依赖下载完成! 执行下列命令开始开发：\n')
    log(`cd ${name}`)
    log(`${pm.bin === 'npm'? 'npm run' : 'yarn'} serve`)
}

function getPromptModules() {
    return [
        'babel',
        'router',
        'vuex',
        'linter',
    ].map(file => require(`./promptModules/${file}`))
}

module.exports = create