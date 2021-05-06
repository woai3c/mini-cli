const fs = require('fs-extra')
const path = require('path')
const ejs = require('ejs')
const yaml = require('yaml-front-matter')
const resolve = require('resolve')
const { runTransformation } = require('vue-codemod')
const { isBinaryFileSync } = require('isbinaryfile')

const sortObject = require('./utils/sortObject')
const normalizeFilePaths = require('./utils/normalizeFilePaths')
const writeFileTree = require('./utils/writeFileTree')
const ConfigTransform = require('./ConfigTransform')
const isObject = (val) => val && typeof val === 'object'

const defaultConfigTransforms = {
    babel: new ConfigTransform({
        file: {
            js: ['babel.config.js'],
        },
    }),
    postcss: new ConfigTransform({
        file: {
            js: ['postcss.config.js'],
            json: ['.postcssrc.json', '.postcssrc'],
            yaml: ['.postcssrc.yaml', '.postcssrc.yml'],
        },
    }),
    eslintConfig: new ConfigTransform({
        file: {
            js: ['.eslintrc.js'],
            json: ['.eslintrc', '.eslintrc.json'],
            yaml: ['.eslintrc.yaml', '.eslintrc.yml'],
        },
    }),
    jest: new ConfigTransform({
        file: {
            js: ['jest.config.js'],
        },
    }),
    browserslist: new ConfigTransform({
        file: {
            lines: ['.browserslistrc'],
        },
    }),
}

const reservedConfigTransforms = {
    vue: new ConfigTransform({
        file: {
            js: ['vue.config.js'],
        },
    }),
}

const ensureEOL = str => {
    if (str.charAt(str.length - 1) !== '\n') {
        return str + '\n'
    }

    return str
}

class Generator {
    constructor(pkg, context, files = {}) {
        this.pkg = pkg
        this.rootOptions = {}
        this.imports = {}
        this.files = files
        this.entryFile = `src/main.js`
        this.fileMiddlewares = []
        this.context = context
        this.configTransforms = {}
    }

    extendPackage(fields) {
        const pkg = this.pkg
        for (const key in fields) {
            const value = fields[key]
            const existing = pkg[key]
            if (isObject(value) && (key === 'dependencies' || key === 'devDependencies' || key === 'scripts')) {
                pkg[key] = Object.assign(existing || {}, value)
            } else {
                pkg[key] = value
            }
        }
    }

    async generate() {
        // 从 package.json 中提取文件
        this.extractConfigFiles()
        // 解析文件内容
        await this.resolveFiles()
        // 将 package.json 中的字段排序
        this.sortPkg()
        this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
        // 将所有文件写入到用户要创建的目录
        await writeFileTree(this.context, this.files)
    }

    // 按照下面的顺序对 package.json 中的 key 进行排序
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
            'deploy',
        ])

        this.pkg = sortObject(this.pkg, [
            'name',
            'version',
            'private',
            'description',
            'author',
            'scripts',
            'husky',
            'lint-staged',
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
            'jest',
        ])
    }

    // 使用 ejs 解析 lib\generator\xx\template 中的文件
    async resolveFiles() {
        const files = this.files
        for (const middleware of this.fileMiddlewares) {
            await middleware(files, ejs.render)
        }

        // normalize file paths on windows
        // all paths are converted to use / instead of \
        // 将反斜杠 \ 转换为正斜杠 /
        normalizeFilePaths(files)

        // 处理 import 语句的导入和 new Vue() 选项的注入
        // vue-codemod 库，对代码进行解析得到 AST，再将 import 语句和根选项注入
        Object.keys(files).forEach(file => {
            let imports = this.imports[file]
            imports = imports instanceof Set ? Array.from(imports) : imports
            if (imports && imports.length > 0) {
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectImports'),
                    { imports },
                )
            }

            let injections = this.rootOptions[file]
            injections = injections instanceof Set ? Array.from(injections) : injections
            if (injections && injections.length > 0) {
                files[file] = runTransformation(
                    { path: file, source: files[file] },
                    require('./utils/codemods/injectOptions'),
                    { injections },
                )
            }
        })
    }

    // 将 package.json 中的配置提取出来，生成单独的文件
    // 例如将 package.json 中的
    // babel: {
    //     presets: ['@babel/preset-env']
    // },
    // 提取出来变成 babel.config.js 文件
    extractConfigFiles() {
        const configTransforms = {
            ...defaultConfigTransforms,
            ...this.configTransforms,
            ...reservedConfigTransforms,
        }

        const extract = (key) => {
            if (configTransforms[key] && this.pkg[key]) {
                const value = this.pkg[key]
                const configTransform = configTransforms[key]
                const res = configTransform.transform(
                    value,
                    this.files,
                    this.context,
                )

                const { content, filename } = res
                // 如果文件不是以 \n 结尾，则补上 \n
                this.files[filename] = ensureEOL(content)
                delete this.pkg[key]
            }
        }

        extract('vue')
        extract('babel')
    }

    render(source, additionalData = {}, ejsOptions = {}) {
        // 获取调用 generator.render() 函数的文件的父目录路径 
        const baseDir = extractCallDir()
        source = path.resolve(baseDir, source)
        this._injectFileMiddleware(async (files) => {
            const data = this._resolveData(additionalData)
            // https://github.com/sindresorhus/globby
            const globby = require('globby')
            // 读取目录中所有的文件
            const _files = await globby(['**/*'], { cwd: source, dot: true })
            for (const rawPath of _files) {
                const sourcePath = path.resolve(source, rawPath)
                // 解析文件内容
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

    // 合并选项
    _resolveData(additionalData) {
        return { 
            options: this.options,
            rootOptions: this.rootOptions,
            ...additionalData,
        }
    }

    renderFile(name, data, ejsOptions) {
        // 如果是二进制文件，直接将读取结果返回
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
        const parsed = yaml.loadFront(template)
        const content = parsed.__content
        let finalTemplate = content.trim() + `\n`

        if (parsed.when) {
            finalTemplate = (
                `<%_ if (${parsed.when}) { _%>`
                + finalTemplate
              + `<%_ } _%>`
            )
        
            // use ejs.render to test the conditional expression
            // if evaluated to falsy value, return early to avoid extra cost for extend expression
            const result = ejs.render(finalTemplate, data, ejsOptions)
            if (!result) {
                return ''
            }
        }

        const replaceBlockRE = /<%# REPLACE %>([^]*?)<%# END_REPLACE %>/g
        if (parsed.extend) {
            let extendPath
            if (parsed.extend.startsWith(':')) {
                // 用户项目根目录
                extendPath = path.join(process.cwd(), parsed.extend.slice(1))
            } else {
                extendPath = path.isAbsolute(parsed.extend)
                    ? parsed.extend
                    : resolve.sync(parsed.extend, { basedir: path.dirname(name) })
            }

            finalTemplate = fs.readFileSync(extendPath, 'utf-8')
            if (parsed.replace) {
                if (Array.isArray(parsed.replace)) {
                    const replaceMatch = content.match(replaceBlockRE)
                    if (replaceMatch) {
                        const replaces = replaceMatch.map(m => {
                            if (parsed.keepSpace) {
                                return m.replace(replaceBlockRE, '$1')
                            } 

                            return m.replace(replaceBlockRE, '$1').trim()
                        })

                        parsed.replace.forEach((r, i) => {
                            finalTemplate = finalTemplate.replace(r, replaces[i])
                        })
                    }
                } else if (parsed.keepSpace) {
                    finalTemplate = finalTemplate.replace(parsed.replace, content)
                } else {
                    finalTemplate = finalTemplate.replace(parsed.replace, content.trim())
                }
            }
        }
        
        return ejs.render(finalTemplate, data, ejsOptions)
    }

    /**
     * Add import statements to a file.
     */
    injectImports(file, imports) {
        const _imports = (
            this.imports[file]
            || (this.imports[file] = new Set())
        );
        (Array.isArray(imports) ? imports : [imports]).forEach(imp => {
            _imports.add(imp)
        })
    }

    /**
     * Add options to the root Vue instance (detected by `new Vue`).
     */
    injectRootOptions(file, options) {
        const _options = (
            this.rootOptions[file]
            || (this.rootOptions[file] = new Set())
        );
        (Array.isArray(options) ? options : [options]).forEach(opt => {
            _options.add(opt)
        })
    }
}

// http://blog.shaochuancs.com/about-error-capturestacktrace/
// 获取调用栈信息
function extractCallDir() {
    const obj = {}
    Error.captureStackTrace(obj)
    // 在 lib\generator\xx 等各个模块中 调用 generator.render()
    // 将会排在调用栈中的第四个，也就是 obj.stack.split('\n')[3]
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
    // 获取对应文件的目录
    return path.dirname(fileName)
}

module.exports = Generator