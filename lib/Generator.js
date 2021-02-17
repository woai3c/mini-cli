const fs = require('fs-extra')
const path = require('path')
const ejs = require('ejs')
const sortObject = require('./utils/sortObject')
const normalizeFilePaths = require('./utils/normalizeFilePaths')
const { runTransformation } = require('vue-codemod')
const writeFileTree = require('./utils/writeFileTree')
const { isBinaryFileSync } = require('isbinaryfile')
const isString = val => typeof val === 'string'
const isFunction = val => typeof val === 'function'
const isObject = val => val && typeof val === 'object'
const replaceBlockRE = /<%# REPLACE %>([^]*?)<%# END_REPLACE %>/g
const ConfigTransform = require('./ConfigTransform')

const defaultConfigTransforms = {
    babel: new ConfigTransform({
        file: {
            js: ['babel.config.js']
        }
    }),
    postcss: new ConfigTransform({
        file: {
            js: ['postcss.config.js'],
            json: ['.postcssrc.json', '.postcssrc'],
            yaml: ['.postcssrc.yaml', '.postcssrc.yml']
        }
    }),
    eslintConfig: new ConfigTransform({
        file: {
            js: ['.eslintrc.js'],
            json: ['.eslintrc', '.eslintrc.json'],
            yaml: ['.eslintrc.yaml', '.eslintrc.yml']
        }
    }),
    jest: new ConfigTransform({
        file: {
            js: ['jest.config.js']
        }
    }),
    browserslist: new ConfigTransform({
        file: {
            lines: ['.browserslistrc']
        }
    })
}

const reservedConfigTransforms = {
    vue: new ConfigTransform({
        file: {
            js: ['vue.config.js']
        }
    })
}

const ensureEOL = str => {
    if (str.charAt(str.length - 1) !== '\n') {
        return str + '\n'
    }
    return str
}

class Generator {
    constructor (pkg, context) {
        this.pkg = pkg
        this.rootOptions = {}
        this.imports = {}
        this.files = {}
        this.entryFile = `src/main.js`
        this.fileMiddlewares = []
        this.context = context
        this.configTransforms = {}
    }

    extendPackage(fields, options = {}) {
        const pkg = this.pkg
        for (const key in fields) {
            const value = fields[key]
            const existing = pkg[key]
            if (isObject(value) && (key === 'dependencies' || key === 'devDependencies')) {
                pkg[key] = Object.assign(existing || {}, value)
            } else {
                pkg[key] = value
            }
        }
    }

    async generate() {
        this.extractConfigFiles()
        // wait for file resolve
        await this.resolveFiles()
        // set package.json
        this.sortPkg()
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // write/update file tree to disk
        await writeFileTree(this.context, this.files)
    }

    sortPkg() {
        // ensure package.json keys has readable order
        this.pkg.dependencies = sortObject(this.pkg.dependencies)
        this.pkg.devDependencies = sortObject(this.pkg.devDependencies)
        this.pkg.scripts = sortObject(this.pkg.scripts, [
            'serve',
            'build',
            'test:unit',
            'test:e2e',
            'lint',
            'deploy'
        ])

        this.pkg = sortObject(this.pkg, [
            'name',
            'version',
            'private',
            'description',
            'author',
            'scripts',
            'main',
            'module',
            'browser',
            'jsDelivr',
            'unpkg',
            'files',
            'dependencies',
            'devDependencies',
            'peerDependencies',
            'vue',
            'babel',
            'eslintConfig',
            'prettier',
            'postcss',
            'browserslist',
            'jest'
        ])
    }

    async resolveFiles() {
        const files = this.files
        for (const middleware of this.fileMiddlewares) {
            await middleware(files, ejs.render)
        }

        // normalize file paths on windows
        // all paths are converted to use / instead of \
        normalizeFilePaths(files)

        // handle imports and root option injections
        Object.keys(files).forEach(file => {
            let imports = this.imports[file]
            imports = imports instanceof Set ? Array.from(imports) : imports
            if (imports && imports.length > 0) {
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectImports'),
                    { imports }
                )
            }

            let injections = this.rootOptions[file]
            injections = injections instanceof Set ? Array.from(injections) : injections
            if (injections && injections.length > 0) {
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectOptions'),
                    { injections }
                )
            }
        })
    }

    extractConfigFiles(extractAll, checkExisting) {
        const configTransforms = Object.assign({},
            defaultConfigTransforms,
            this.configTransforms,
            reservedConfigTransforms
        )

        const extract = key => {
            if (configTransforms[key] &&this.pkg[key]) {
                const value = this.pkg[key]
                const configTransform = configTransforms[key]
                const res = configTransform.transform(
                    value,
                    checkExisting,
                    this.files,
                    this.context
                )
                const { content, filename } = res
                this.files[filename] = ensureEOL(content)
                delete this.pkg[key]
            }
        }

        if (extractAll) {
            for (const key in this.pkg) {
                extract(key)
            }
        } else {
            if (!process.env.VUE_CLI_TEST) {
                // by default, always extract vue.config.js
                extract('vue')
            }
            // always extract babel.config.js as this is the only way to apply
            // project-wide configuration even to dependencies.
            // TODO: this can be removed when Babel supports root: true in package.json
            extract('babel')
        }
    }

    render(source, additionalData = {}, ejsOptions = {}) {
        const baseDir = extractCallDir()
        source = path.resolve(baseDir, source)
        this._injectFileMiddleware(async (files) => {
            const data = this._resolveData(additionalData)
            const globby = require('globby')
            const _files = await globby(['**/*'], { cwd: source, dot: true })
            for (const rawPath of _files) {
                const sourcePath = path.resolve(source, rawPath)
                const content = this.renderFile(sourcePath, data, ejsOptions)
                // only set file if it's not all whitespace, or is a Buffer (binary files)
                if (Buffer.isBuffer(content) || /[^\s]/.test(content)) {
                    files[rawPath] = content
                }
            }
        })
    }

    _injectFileMiddleware(middleware) {
        this.fileMiddlewares.push(middleware)
    }

    _resolveData(additionalData) {
        return Object.assign({
            options: this.options,
            rootOptions: this.rootOptions,
            plugins: this.pluginsData
        }, additionalData)
    }

    renderFile(name, data, ejsOptions) {
        if (isBinaryFileSync(name)) {
            return fs.readFileSync(name) // return buffer
        }

        const template = fs.readFileSync(name, 'utf-8')

        // custom template inheritance via yaml front matter.
        // ---
        // extend: 'source-file'
        // replace: !!js/regexp /some-regex/
        // OR
        // replace:
        //   - !!js/regexp /foo/
        //   - !!js/regexp /bar/
        // ---
        const yaml = require('yaml-front-matter')
        const parsed = yaml.loadFront(template)
        const content = parsed.__content
        const finalTemplate = content.trim() + `\n`

        return ejs.render(finalTemplate, data, ejsOptions)
    }

    /**
     * Add import statements to a file.
     */
    injectImports(file, imports) {
        const _imports = (
            this.imports[file] ||
            (this.imports[file] = new Set())
        )
            ; (Array.isArray(imports) ? imports : [imports]).forEach(imp => {
                _imports.add(imp)
            })
    }

    /**
     * Add options to the root Vue instance (detected by `new Vue`).
     */
    injectRootOptions(file, options) {
        const _options = (
            this.rootOptions[file] ||
            (this.rootOptions[file] = new Set())
        )
            ; (Array.isArray(options) ? options : [options]).forEach(opt => {
                _options.add(opt)
            })
    }
}

function extractCallDir() {
    // extract api.render() callsite file location using error stack
    const obj = {}
    Error.captureStackTrace(obj)
    const callSite = obj.stack.split('\n')[3]

    // the regexp for the stack when called inside a named function
    const namedStackRegExp = /\s\((.*):\d+:\d+\)$/
    // the regexp for the stack when called inside an anonymous
    const anonymousStackRegExp = /at (.*):\d+:\d+$/

    let matchResult = callSite.match(namedStackRegExp)
    if (!matchResult) {
        matchResult = callSite.match(anonymousStackRegExp)
    }

    const fileName = matchResult[1]
    return path.dirname(fileName)
}

module.exports = Generator