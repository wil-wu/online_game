window.addEventListener('DOMContentLoaded', () => {
    'use strict'

    let cellContainer = document.querySelector('.cell-container')
    let newGameBtn = document.querySelector('#new-game-btn')
    let width = document.querySelector('#width')
    let height = document.querySelector('#height')
    let timer = document.querySelector('#timer')
    let flags = document.querySelector('#flags')

    const gameState = new Proxy({
        isOver: false,
    }, {
        set(target, p, newValue) {
            if (target[p] !== newValue && newValue) {
                cellContainer.removeEventListener('contextmenu')
                cellContainer.removeEventListener('mouseup')
            }
            return true
        }
    })

    function initGame() {
        domutil.removeChildren(cellContainer)
    }

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
                    cell.dataset.i = i
                    cell.dataset.j = j
                    cell.dataset.state = 'hidden'
                    cellRow.append(cell)
                }
                cellContainer.append(cellRow)
            }
            operate(gameMap)
        }
    })

    // 游戏区域操作
    function operate(gameMap) {
        const [m, n] = [gameMap.length, gameMap[0].length]
        const isInvalid = (i, j) => i < 0 || j < 0 || i > m - 1 || j > n - 1

        // 递归点击
        const recursiveClick = (i, j, depth) => {
            if (isInvalid(i, j)) {
                return
            }
            if (depth > 0 && gameMap[i][j] === 9) { // 递归到有雷单元格跳过
                return
            }
            if (!singleClick(i, j)) { // 停止递归点击
                return
            }
            recursiveClick(i - 1, j, depth + 1)
            recursiveClick(i + 1, j, depth + 1)
            recursiveClick(i, j - 1, depth + 1)
            recursiveClick(i, j + 1, depth + 1)
            recursiveClick(i - 1, j - 1, depth + 1)
            recursiveClick(i - 1, j + 1, depth + 1)
            recursiveClick(i + 1, j - 1, depth + 1)
            recursiveClick(i + 1, j + 1, depth + 1)
        }

        // 单击
        const singleClick = (i, j) => {
            if (isInvalid(i, j)) {
                return false
            }
            let cell = cellContainer.children[i].children[j]
            if (cell.dataset.state !== 'hidden') {
                return false
            }
            cell.classList.replace('cell-hide', 'cell-show')
            cell.classList.add(`cell-${gameMap[i][j]}`)
            cell.dataset.state = 'shown'
            if (gameMap[i][j] === 9) {
                gameState.isOver = true
            }
            return gameMap[i][j] === 0;

        }

        // 快速点击
        const quickClick = (i, j) => {
            let cell = cellContainer.children[i].children[j]
            if (cell.dataset.state !== 'shown') {
                return
            }

            let flags = getAroundFlags(i, j)
            if (flags !== 0 && gameMap[i][j] === flags) {
                singleClick(i - 1, j)
                singleClick(i + 1, j)
                singleClick(i, j - 1)
                singleClick(i, j + 1)
                singleClick(i - 1, j - 1)
                singleClick(i - 1, j + 1)
                singleClick(i + 1, j - 1)
                singleClick(i + 1, j + 1)
            }
        }

        // 获取周围旗子数
        const getAroundFlags = (i, j) => {
            return isInvalid(i - 1, j) ? 0 : Number(cellContainer.children[i - 1].children[j].dataset.state === 'flagged')
            + isInvalid(i + 1, j) ? 0 : Number(cellContainer.children[i + 1].children[j].dataset.state === 'flagged')
            + isInvalid(i, j - 1) ? 0 : Number(cellContainer.children[i].children[j - 1].dataset.state === 'flagged')
            + isInvalid(i, j + 1) ? 0 : Number(cellContainer.children[i].children[j + 1].dataset.state === 'flagged')
            + isInvalid(i - 1, j - 1) ? 0 : Number(cellContainer.children[i - 1].children[j - 1].dataset.state === 'flagged')
            + isInvalid(i - 1, j + 1) ? 0 : Number(cellContainer.children[i - 1].children[j + 1].dataset.state === 'flagged')
            + isInvalid(i + 1, j - 1) ? 0 : Number(cellContainer.children[i + 1].children[j - 1].dataset.state === 'flagged')
            + isInvalid(i + 1, j + 1) ? 0 : Number(cellContainer.children[i + 1].children[j + 1].dataset.state === 'flagged')
        }

        // 插旗
        const plantFlag = (i, j) => {
            let cell = cellContainer.children[i].children[j]
            let state = cell.dataset.state
            if (state === 'hidden') {
                cell.classList.add('cell-10')
                cell.dataset.state = 'flagged'
            } else if (state === 'flagged') {
                cell.classList.remove('cell-10')
                cell.dataset.state = 'hidden'
            }
        }

        // 游戏区域禁止上下文菜单
        cellContainer.addEventListener('contextmenu', (evt) => {
            evt.preventDefault()
        })

        // 操作绑定
        cellContainer.addEventListener('mouseup', (evt) => {
            let cell = evt.target
            let [i, j] = [parseInt(cell.dataset.i), parseInt(cell.dataset.j)]

            switch (evt.button) {
                // 左键
                case 0:
                    recursiveClick(i, j, 0)
                    break;
                // 中键
                case 1:
                    quickClick(i, j)
                    break;
                // 右键
                case 2:
                    plantFlag(i, j)
                    break
            }
        })
    }
})