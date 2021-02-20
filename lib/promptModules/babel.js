module.exports = (api) => {
    api.injectFeature({
        name: 'Babel',
        value: 'babel',
        short: 'Babel',
        description: 'Transpile modern JavaScript to older versions (for compatibility)',
        link: 'https://babeljs.io/',
        checked: true,
    })
}
