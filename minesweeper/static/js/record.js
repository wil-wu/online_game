window.addEventListener('DOMContentLoaded', () => {
    'use strict'

    let rankTab = new mdb.Tab('#rank-tab')
    let historyTab = new mdb.Tab('#history-tab')

    let rankContainer = document.querySelector('#rank-container')
    let historyContainer = document.querySelector('#history-container')

    let widthEl = document.querySelector('#width')
    let heightEl = document.querySelector('#height')

    const pager = new mdb.Pagination()

    // 查看回放
    const goReview = (evt) => {
        let id = evt.target.dataset.id
        if (id) location.href = _urls.game + `?id=${id}`
    }

    // 填充排行榜数据
    const fillRank = () => {
        let width = parseInt(document.querySelector('#width').value)
        let height = parseInt(document.querySelector('#height').value)
        width = width && width >= 10 && width <= 100 ? width : 20
        height = height && height >= 10 && height <= 100 ? height : 20

        request.get(_api.rank, {params: {width, height}}).then((res) => {
            if (res.data.code === 200) {
                domutil.removeChildren(rankContainer)
                rankContainer.insertAdjacentHTML('beforeend', templates.rankTemplate(res.data.data))
            }
        })
    }

    // 填充游戏记录数据
    const fillHistory = (page, perPage) => {
        request.get(_api.history, {params: {'page': page, 'per_page': perPage}}).then((res) => {
            let data = res.data.data.items
            domutil.removeChildren(historyContainer)
            historyContainer.insertAdjacentHTML('beforeend', templates.historyTemplate(data))
        })
    }

    // 初始化排行榜界面
    const initRank = () => {
        fillRank()
        widthEl.addEventListener('change', fillRank)
        heightEl.addEventListener('change', fillRank)
    }

    // 初始化游戏记录界面
    const initHistory = () => {
        request.get(_api.history, {params: {'page': _config.page, 'per_page': _config.perPage}}).then((res) => {
            let pagination = res.data.data
            pager.init('#pager', pagination.pages, fillHistory)
            domutil.removeChildren(historyContainer)
            historyContainer.addEventListener('click', goReview)
            historyContainer.insertAdjacentHTML('beforeend', templates.historyTemplate(pagination.items))
        })
    }

    // 移除排行榜界面监听
    const destroyRank = () => {
        widthEl.removeEventListener('change', fillRank)
        heightEl.removeEventListener('change', fillRank)
    }

    // 移除游戏记录界面监听
    const destroyHistory = () => {
        pager.dispose()
        historyContainer.removeEventListener('click', goReview)
    }

    const tabShow = () => location.hash === '#history' ? historyTab.show() : rankTab.show()

    // 哈希路由监听
    window.addEventListener('hashchange', tabShow)

    // tab变化监听
    rankTab.on('show.mdb.tab', initRank)
        .on('hide.mdb.tab', destroyRank)
        .on('click', () => location.hash = '#rank')
    historyTab.on('show.mdb.tab', initHistory)
        .on('hide.mdb.tab', destroyHistory)
        .on('click', () => location.hash = '#history')

    tabShow()
})