const stripAnsi = require('strip-ansi')
const execa = require('execa')
const { hasProjectYarn } = require('./utils/env')
const executeCommand = require('./utils/executeCommand')
const { log } = require('./utils/logger')
const registries = require('./utils/registries')
const shouldUseTaobao = require('./utils/shouldUseTaobao')

const PACKAGE_MANAGER_CONFIG = {
    npm: {
        install: ['install'],
    },
    yarn: {
        install: [],
    },
}

class PackageManager {
    constructor(context, packageManager) {
        this.context = context
        this._registries = {}

        if (packageManager) {
            this.bin = packageManager
        } else if (context) {
            if (hasProjectYarn(context)) {
                this.bin = 'yarn'
            } else {
                this.bin = 'npm'
            }
        }
    }

    // Any command that implemented registry-related feature should support
    // `-r` / `--registry` option
    async setRegistry() {
        const cacheKey = ''
        if (this._registries[cacheKey]) {
            return this._registries[cacheKey]
        }

        let registry
        if (await shouldUseTaobao(this.bin)) {
            registry = registries.taobao
        } else {
            try {
                if (!registry || registry === 'undefined') {
                    registry = (await execa(this.bin, ['config', 'get', 'registry'])).stdout
                }
            } catch (e) {
                // Yarn 2 uses `npmRegistryServer` instead of `registry`
                registry = (await execa(this.bin, ['config', 'get', 'npmRegistryServer'])).stdout
            }
        }

        this._registries[cacheKey] = stripAnsi(registry).trim()
        return this._registries[cacheKey]
    }

    async runCommand(command, args) {
        const prevNodeEnv = process.env.NODE_ENV
        // In the use case of Vue CLI, when installing dependencies,
        // the `NODE_ENV` environment variable does no good;
        // it only confuses users by skipping dev deps (when set to `production`).
        delete process.env.NODE_ENV

        const registry = await this.setRegistry()
        await executeCommand(
            this.bin,
            [
                ...PACKAGE_MANAGER_CONFIG[this.bin][command],
                ...(args || []),
                '--registry',
                registry, // 设定临时注册源
            ],
            this.context,
        )

        if (prevNodeEnv) {
            process.env.NODE_ENV = prevNodeEnv
        }
    }

    async install() {
        log('\n正在下载依赖...\n')
        return await this.runCommand('install')
    }
}

module.exports = PackageManager
