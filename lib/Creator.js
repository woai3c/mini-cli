const { hasYarn } = require('./utils/env')
const isManualMode = answers => answers.preset === '__manual__'

const {
    defaults,
    loadOptions,
} = require('./utils/options')

class Creator {
    constructor() {
        this.injectedPrompts = []
        const { presetPrompt, featurePrompt } = this.getDefaultPrompts()
        this.presetPrompt = presetPrompt
        this.featurePrompt = featurePrompt
    }

    getFinalPrompts() {
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = (answers) => isManualMode(answers) && originalWhen(answers)
        })
    
        const prompts = [
            this.presetPrompt,
            this.featurePrompt,
            ...this.injectedPrompts,
            ...this.getOtherPrompts(),
        ]

        return prompts
    }

    getPresets() {
        const savedOptions = loadOptions()
        return { ...savedOptions.presets, ...defaults.presets }
    }
      
    getDefaultPrompts() {
        const presets = this.getPresets()
        const presetChoices = Object.entries(presets).map(([name, preset]) => {
            let displayName = name

            return {
                name: `${displayName} (${preset.features})`,
                value: name,
            }
        })

        const presetPrompt = {
            name: 'preset',
            type: 'list',
            message: `Please pick a preset:`,
            choices: [
                ...presetChoices,
                {
                    name: 'Manually select features',
                    value: '__manual__',
                },
            ],
        }

        const featurePrompt = {
            name: 'features',
            when: isManualMode,
            type: 'checkbox',
            message: 'Check the features needed for your project:',
            choices: [],
            pageSize: 10,
        }

        return {
            presetPrompt,
            featurePrompt,
        }
    }
      
    getOtherPrompts() {
        const otherPrompts = [
            {
                name: 'save',
                when: isManualMode,
                type: 'confirm',
                message: 'Save this as a preset for future projects?',
                default: false,
            },
            {
                name: 'saveName',
                when: answers => answers.save,
                type: 'input',
                message: 'Save preset as:',
            },
        ]
    
        const savedOptions = loadOptions()
        if (!savedOptions.packageManager && hasYarn) {
            const packageManagerChoices = []
    
            if (hasYarn()) {
                packageManagerChoices.push({
                    name: 'Use Yarn',
                    value: 'yarn',
                    short: 'Yarn',
                })
            }
    
            packageManagerChoices.push({
                name: 'Use NPM',
                value: 'npm',
                short: 'NPM',
            })
    
            otherPrompts.push({
                name: 'packageManager',
                type: 'list',
                message: 'Pick the package manager to use when installing dependencies:',
                choices: packageManagerChoices,
            })
        }
    
        return otherPrompts
    }
}

module.exports = Creator