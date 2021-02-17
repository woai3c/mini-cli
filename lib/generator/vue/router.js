module.exports = (generator, options) => {
    require('@vue/cli-plugin-router/generator')(generator, {
        historyMode: options.routerHistoryMode
    })
}
