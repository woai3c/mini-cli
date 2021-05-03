---
extend: ':./build/base.config.js'
keepSpace: true
replace:
  - !!js/regexp /\s*rules:\s?\[\s*\{/
---
<%# REPLACE %>
        rules: [
            {
                enforce: 'pre',
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                exclude: /node_modules/
            },
            {
<%# END_REPLACE %>