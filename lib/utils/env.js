const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

let _hasYarn
exports.hasYarn = () => {
    if (_hasYarn != null) {
        return _hasYarn
    }
    try {
        execSync('yarn --version', { stdio: 'ignore' })
        return (_hasYarn = true)
    } catch (e) {
        return (_hasYarn = false)
    }
}

exports.hasProjectYarn = (cwd) => {
    const lockFile = path.join(cwd, 'yarn.lock')
    const result = fs.existsSync(lockFile)
    return checkYarn(result)
}

function checkYarn(result) {
    if (result && !exports.hasYarn()) throw new Error(`The project seems to require yarn but it's not installed.`)
    return result
}

let _hasGit
exports.hasGit = () => {
    if (_hasGit != null) {
        return _hasGit
    }

    try {
        execSync('git --version', { stdio: 'ignore' })
        return (_hasGit = true)
    } catch (e) {
        return (_hasGit = false)
    }
}

exports.hasProjectGit = (cwd) => {
    let result
    try {
        execSync('git status', { stdio: 'ignore', cwd })
        result = true
    } catch (e) {
        result = false
    }

    return result
}

exports.hasProjectNpm = (cwd) => {
    const lockFile = path.join(cwd, 'package-lock.json')
    const result = fs.existsSync(lockFile)

    return result
}

// OS
exports.isWindows = process.platform === 'win32'
exports.isMacintosh = process.platform === 'darwin'
exports.isLinux = process.platform === 'linux'