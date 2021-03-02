// https://github.com/facebook/jscodeshift
// 对代码进行解析得到 AST，再将参数 imports 中的语句插入
module.exports = function injectImports(fileInfo, api, { imports }) {
    const j = api.jscodeshift
    const root = j(fileInfo.source)

    const toImportAST = i => j(`${i}\n`).nodes()[0].program.body[0]
    const toImportHash = node => JSON.stringify({
        specifiers: node.specifiers.map(s => s.local.name),
        source: node.source.raw,
    })

    const declarations = root.find(j.ImportDeclaration)
    const importSet = new Set(declarations.nodes().map(toImportHash))
    const nonDuplicates = node => !importSet.has(toImportHash(node))

    const importASTNodes = imports.map(toImportAST).filter(nonDuplicates)

    if (declarations.length) {
        declarations
        .at(-1)
        // a tricky way to avoid blank line after the previous import
        .forEach(({ node }) => delete node.loc)
        .insertAfter(importASTNodes)
    } else {
        // no pre-existing import declarations
        root.get().node.program.body.unshift(...importASTNodes)
    }

    return root.toSource()
}
