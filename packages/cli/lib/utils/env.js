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