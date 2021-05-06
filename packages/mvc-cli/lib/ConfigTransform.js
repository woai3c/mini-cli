const transforms = require('./utils/configTransforms')

class ConfigTransform {
    constructor(options) {
        this.fileDescriptor = options.file
    }

    transform(value, context) {
        let file

        if (!file) {
            file = this.getDefaultFile()
        }

        const { type, filename } = file
        const transform = transforms[type]
        let source

        const content = transform.write({
            source,
            filename,
            context,
            value,
        })

        return {
            filename,
            content,
        }
    }

    getDefaultFile() {
        const [type] = Object.keys(this.fileDescriptor)
        const [filename] = this.fileDescriptor[type]
        return { type, filename }
    }
}

module.exports = ConfigTransform
