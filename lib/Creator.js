class Creator {
    constructor() {
        this.featurePrompt = {
            name: 'features',
            message: 'Check the features needed for your project:',
            pageSize: 10,
            type: 'checkbox',
            choices: [],
        }

        this.injectedPrompts = []
        this.promptCompleteCbs = []
    }

    resolveFinalPrompts() {
        // patch generator-injected prompts to only show in manual mode
        this.injectedPrompts.forEach(prompt => {
            const originalWhen = prompt.when || (() => true)
            prompt.when = answers => {
                return originalWhen(answers)
            }
        })
    
        const prompts = [
            this.featurePrompt,
            ...this.injectedPrompts,
        ]
    
        return prompts
    }
}

module.exports = Creator