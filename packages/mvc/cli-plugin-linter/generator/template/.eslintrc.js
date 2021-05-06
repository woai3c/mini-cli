module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2019,
        parser: 'babel-eslint',
    },
    env: {
        browser: true,
        node: true,
    },
    extends: [
        'plugin:vue/essential',
        <%_ if (hasAirbnb) { _%>
        'airbnb-base',
        <%_ } else { _%>
        'standard',
        <%_ } _%>
    ],
    rules: {
        'no-console': 'off',
        'array-element-newline': ['error', 'consistent'],
        indent: ['error', 4, { MemberExpression: 0, SwitchCase: 1 }],
        quotes: ['error', 'single', { allowTemplateLiterals: true }],
        'linebreak-style': 'off',
        semi: ['error', 'never'],
        'comma-dangle': 'off',
        'import/no-unresolved': 'off',
        'eol-last': 'off',
    },
}
