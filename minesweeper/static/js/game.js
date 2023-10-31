window.addEventListener('DOMContentLoaded', () => {
    'use strict'

    let cellContainer = document.querySelector('.cell-container')
    let newGameBtn = document.querySelector('#new-game-btn')
    let timer = document.querySelector('#timer')
    let flags = document.querySelector('#flags')

    const alert = new mdb.Alert('#alert')

    const gameState = new Proxy({
        isOver: false,
        timer: null,
        flags: 0,
        current: 0,
        remainder: 0,
        operation: [],
        map: [],
    }, {
        set(target, p, newValue) {
            target[p] = newValue

            if (p === 'current') {
                timer.textContent = Math.floor(newValue / 1000)
            } else if (p === 'flags') {
                flags.textContent = newValue
            } else if (p === 'isOver' && newValue) {
                overGame()
            }
            return true
        }
    })

    // 重开游戏
    newGameBtn.addEventListener('click', () => {
        setup()
        initGame()
    })

    // 游戏区域禁止上下文菜单
    cellContainer.addEventListener('contextmenu', (evt) => {
        evt.preventDefault()
    })

    // 游戏初始化
    const setup = () => {
        domutil.removeChildren(cellContainer)
        let width = document.querySelector('#width').value
        let height = document.querySelector('#height').value
        width = Number(width) ? width : 10
        height = Number(height) ? height : 10

        // 获取地图
        request.get(_api.map, {params: {width, height}}).then((res) => {
            if (res.data.code === 200) {
                const gameMap = res.data.data
                const [m, n] = [gameMap.length, gameMap[0].length]

                for (let i = 0; i < m; i++) {
                    let cellRow = document.createElement('div')
                    cellRow.className = 'd-flex'
                    for (let j = 0; j < n; j++) {
                        let cell = document.createElement('i')
                        cell.className = 'cell cell-hide fa-solid'
                        cell.dataset.i = i
                        cell.dataset.j = j
                        cell.dataset.state = 'hidden'
                        cellRow.append(cell)
                    }
                    cellContainer.append(cellRow)
                }
                // 初始化配置
                clearInterval(gameState.timer)
                gameState.m = m
                gameState.n = n
                gameState.map = gameMap
                gameState.isOver = false
                gameState.current = 0
                gameState.flags = Math.floor(m * n * _config.mineRate)
                gameState.remainder = m * n - gameState.flags
            }
        })
    }

    // 初始化操作监听
    const initGame = () => {
        cellContainer.addEventListener('mouseup', startTimer, {once: true})
        cellContainer.addEventListener('mouseup', startPlay)
    }

    // 移除操作监听，并提示信息
    const overGame = () => {
        cellContainer.removeEventListener('mouseup', startTimer)
        cellContainer.removeEventListener('mouseup', startPlay)

        let [type, text] = gameState.remainder === 0 ? ['alert-success', '游戏成功'] : ['alert-warning', '游戏失败']
        alert.setType(type).setText(text).show()
        clearInterval(gameState.timer)
    }

    // 游戏区域操作
    const isInvalid = (i, j) => i < 0 || j < 0 || i > gameState.m - 1 || j > gameState.n - 1
    // 获取周围旗子
    const getFlag = (i, j) => isInvalid(i, j) ? 0 : Number(cellContainer.children[i].children[j].dataset.state === 'flagged')

    // 递归点击
    const recursiveClick = (i, j, depth) => {
        if (isInvalid(i, j)) {
            return
        }
        if (depth > 0 && gameState.map[i][j] === 9) { // 递归到有雷单元格跳过
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

    // 快速点击
    const quickClick = (i, j) => {
        let cell = cellContainer.children[i].children[j]
        if (cell.dataset.state !== 'shown') {
            return
        }

        let flags = getAroundFlags(i, j)
        if (flags !== 0 && gameState.map[i][j] === flags) {
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
        cell.classList.add(`cell-${gameState.map[i][j]}`)
        cell.dataset.state = 'shown'
        if (gameState.map[i][j] === 9) {
            gameState.isOver = true
            return false
        }
        gameState.remainder -= 1
        if (gameState.remainder === 0) {
            gameState.isOver = true
        }
        return gameState.map[i][j] === 0;
    }

    // 获取周围旗子数
    const getAroundFlags = (i, j) => {
        return getFlag(i - 1, j)
            + getFlag(i + 1, j)
            + getFlag(i, j - 1)
            + getFlag(i, j + 1)
            + getFlag(i - 1, j - 1)
            + getFlag(i - 1, j + 1)
            + getFlag(i + 1, j - 1)
            + getFlag(i + 1, j + 1)
    }

    // 插旗
    const rightClick = (i, j) => {
        if (gameState.flags === 0) {
            return
        }
        let cell = cellContainer.children[i].children[j]
        let state = cell.dataset.state
        if (state === 'hidden') {
            cell.classList.add('cell-10')
            cell.dataset.state = 'flagged'
            gameState.flags -= 1
        } else if (state === 'flagged') {
            cell.classList.remove('cell-10')
            cell.dataset.state = 'hidden'
            gameState.flags += 1
        }
    }


    // 开启计时器
    const startTimer = () => {
        gameState.timer = setInterval(() => gameState.current += 16, 16)
    }

    // 游戏操作监听
    const startPlay = (evt) => {
        let cell = evt.target
        let [i, j] = [parseInt(cell.dataset.i), parseInt(cell.dataset.j)]

        switch (evt.button) {
            // 左键
            case 0:
                gameState.operation.push([gameState.current, i, j, 'leftClick'])
                recursiveClick(i, j, 0)
                break;
            // 中键
            case 1:
                gameState.operation.push([gameState.current, i, j, 'midClick'])
                quickClick(i, j)
                break;
            // 右键
            case 2:
                gameState.operation.push([gameState.current, i, j, 'rightClick'])
                rightClick(i, j)
                break
        }
    }

    setup()
    initGame()
})