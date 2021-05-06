module.exports = function sortObject(obj, keyOrder, dontSortByUnicode) {
    if (!obj) return
    const res = {}
    // 先按照 keyOrder 将 obj 排序
    if (keyOrder) {
        keyOrder.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                res[key] = obj[key]
                delete obj[key]
            }
        })
    }

    // 将剩下的 key 用系统提供的 sort() 方法排序
    const keys = Object.keys(obj)

    !dontSortByUnicode && keys.sort()
    keys.forEach(key => {
        res[key] = obj[key]
    })

    return res
}