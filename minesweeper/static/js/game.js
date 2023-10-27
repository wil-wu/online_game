window.addEventListener('DOMContentLoaded', () => {
    let cellContainer = document.querySelector('#cell-container')

    // 获取地图
    request.get(_api.map).then((res) => {
        if (res.data.code === 200) {
            const gameMap = res.data.data

            for (let i = 0; i < gameMap.length; i++) {
                let cellRow = document.createElement('div')
                cellRow.className = 'd-flex'
                for (let j = 0; j < gameMap[i].length; j++) {
                    let cell = document.createElement('i')
                    cell.className = 'cell cell-hide fa-solid'
                    cell.dataset.state = 'cover'
                    cell.dataset.r = i
                    cell.dataset.c = j
                    cellRow.append(cell)
                }
                cellContainer.append(cellRow)
            }
            operate(gameMap)
        }
    })

    // 游戏区域操作
    function operate(gameMap) {
        // 游戏区域禁止上下文菜单
        cellContainer.addEventListener('contextmenu', (evt) => {
            evt.preventDefault()
        })

        // 操作绑定
        cellContainer.addEventListener('mouseup', (evt) => {
            let cell = evt.target
            let [r, c, state] = [cell.dataset.r, cell.dataset.c, cell.dataset.state]

        })
    }
})