module.exports = [
    {
        name: 'config',
        type: 'list',
        message: `Pick an ESLint config:`,
        choices: [
            {
                name: 'ESLint + Airbnb config',
                value: 'airbnb',
                short: 'Airbnb',
            },
            {
                name: 'ESLint + Standard config',
                value: 'standard',
                short: 'Standard',
            },
        ],
    },
    {
        name: 'lintOn',
        type: 'checkbox',
        message: 'Pick additional lint features:',
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
    },
]