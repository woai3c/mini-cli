module.exports = class PromptModuleAPI {
    constructor(creator) {
        this.creator = creator
    }

    injectFeature(feature) {
        this.creator.featurePrompt.choices.push(feature)
    }

    injectPrompt(prompt) {
        this.creator.injectedPrompts.push(prompt)
    }
}
