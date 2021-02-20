module.exports = (api) => {
    api.injectFeature({
        name: 'Linter / Formatter',
        value: 'linter',
        short: 'Linter',
        description: 'Check and enforce code quality with ESLint or Prettier',
        link: 'https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint',
        checked: true,
    })
  
    api.injectPrompt({
        name: 'lintOn',
        message: 'Pick additional lint features:',
        when: answers => answers.features.includes('linter'),
        type: 'checkbox',
        choices: [
            {
                name: 'Lint on save',
                value: 'save',
                checked: true,
            },
            {
                name: 'Lint and fix on commit',
                value: 'commit',
            },
        ],
    })
}
