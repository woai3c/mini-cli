const fs = require('fs')
const path = require('path')

module.exports = function getPackage(context) {
    const packagePath = path.join(context, 'package.json')

    let packageJson
    try {
        packageJson = fs.readFileSync(packagePath, 'utf-8')
    } catch (err) {
        throw new Error(`The package.json file at '${context}' does not exist`)
    }

    try {
        packageJson = JSON.parse(packageJson)
    } catch (err) {
        throw new Error('The package.json is malformed')
    }

    return packageJson
}