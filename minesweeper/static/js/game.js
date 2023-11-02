window.addEventListener('DOMContentLoaded', () => {
    'use strict'

    let cellContainer = document.querySelector('.cell-container')
    let gameBtn = document.querySelector('#game-btn')
    let reviewBtn = document.querySelector('#review-btn')
    let timer = document.querySelector('#timer')
    let flags = document.querySelector('#flags')

    const alert = new mdb.Alert('#alert')

    const gameState = new Proxy({
        isReview: false,
        isOver: false,
        timer: null,
        flags: 0,
        current: 0,
        remainder: 0,
        width: 0,
        height: 0,
        map: [],
        operation: [],
    }, {
        set(target, p, newValue) {
            target[p] = newValue

            if (p === 'current') {
                timer.textContent = Math.floor(newValue / 1000)
            } else if (p === 'flags') {
                flags.textContent = newValue
            } else if (p === 'isOver' && newValue) {
                overGame()
            } else if (p === 'isReview') {
                gameBtn.disabled = newValue
                reviewBtn.disabled = newValue
            }
            return true
        }
    })

    // 重开游戏
    gameBtn.addEventListener('click', () => {
        setupGame()
        initGame()
    })

    // 回放游戏
    reviewBtn.addEventListener('click', () => {
        setupReview()
        reviewGame()
    })

    // 游戏区域禁止上下文菜单
    cellContainer.addEventListener('contextmenu', (evt) => {
        evt.preventDefault()
    })

    // 游戏初始化
    const setupGame = () => {
        let width = parseInt(document.querySelector('#width').value)
        let height = parseInt(document.querySelector('#height').value)
        width = width && width >= 10 && width <= 100 ? width : 20
        height = height && height >= 10 && height <= 100 ? height : 20

        // 获取地图
        request.get(_api.map, {params: {width, height}}).then((res) => {
            if (res.data.code === 200) {
                const gameMap = res.data.data
                const [m, n] = [gameMap.length, gameMap[0].length]
                createMapUI(gameMap, m, n)
                // 初始化配置
                gameState.isOver = false
                gameState.isReview = false
                gameState.width = m
                gameState.height = n
                gameState.map = gameMap
                gameState.operation = []
                gameState.flags = Math.floor(m * n * _config.mineRate)
                gameState.current = 0
                gameState.remainder = m * n - gameState.flags
            }
        })
    }

    // 回放初始化
    const setupReview = () => {
        let id = domutil.getURLParam('id')
        id = parseInt(id) ? id : -1

        request.get(`/api/history/${id}`).then((res) => {
            if (res.data.code === 200) {
                const record = res.data.data
                // 转换成二维数字数组
                const gameMap = record.map
                    .split(',')
                    .map(sub => sub.split('-'))
                    .map(sub => sub.map(item => parseInt(item)))
                const operation = record.operation
                    .split(',')
                    .map(sub => sub.split('-'))
                    .map(sub => sub.map(item => parseInt(item)))
                const [m, n] = [gameMap.length, gameMap[0].length]

                createMapUI(gameMap, m, n)
                // 初始化配置
                gameState.isReview = true
                gameState.isOver = false
                gameState.width = m
                gameState.height = n
                gameState.map = gameMap
                gameState.operation = operation
                gameState.flags = Math.floor(m * n * _config.mineRate)
                gameState.current = 0
                gameState.remainder = m * n - gameState.flags
            }
        })
    }

    // 初始化操作监听
    const initGame = () => {
        clearInterval(gameState.timer)
        cellContainer.removeEventListener('mouseup', startTimer)
        cellContainer.removeEventListener('mouseup', startPlay)

        cellContainer.addEventListener('mouseup', startTimer, {once: true})
        cellContainer.addEventListener('mouseup', startPlay)
    }

    // 移除操作监听，并提示信息
    const overGame = () => {
        clearInterval(gameState.timer)
        cellContainer.removeEventListener('mouseup', startTimer)
        cellContainer.removeEventListener('mouseup', startPlay)

        let [type, text] = gameState.remainder === 0 ? ['alert-success', '游戏成功'] : ['alert-warning', '游戏失败']
        alert.setType(type).setText(text).show()
        if (!gameState.isReview) saveGame()
    }

    // 保存游戏记录
    const saveGame = () => {
        request.post(_api.history, {
            playtime: gameState.current,
            remainder: gameState.remainder,
            width: gameState.width,
            height: gameState.height,
            map: gameState.map.map(value => value.join('-')).join(','),
            operation: gameState.operation.map(value => value.join('-')).join(','),
        })
    }

    // 回放游戏
    const reviewGame = () => {
        let index = 0
        clearInterval(gameState.timer)
        gameState.timer = setInterval(() => {
            gameState.current += 16
            let action = gameState.operation[index]
            if (gameState.current >= action[0]) {
                switch (action[3]) {
                    case 0:
                        recursiveClick(action[1], action[2])
                        break
                    case 1:
                        quickClick(action[1], action[2])
                        break
                    case 2:
                        rightClick(action[1], action[2])
                        break
                }
                index++
            }
        }, 16)
    }

    // 创建地图界面
    const createMapUI = (gameMap, m, n) => {
        domutil.removeChildren(cellContainer)
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
    }

    // 游戏区域操作
    const isInvalid = (i, j) => i < 0 || j < 0 || i > gameState.width - 1 || j > gameState.height - 1
    // 获取周围旗子
    const getFlag = (i, j) => isInvalid(i, j) ? 0 : Number(cellContainer.children[i].children[j].dataset.state === 'flagged')

    // 递归点击
    const recursiveClick = (i, j, depth = 0) => {
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
                gameState.operation.push([gameState.current, i, j, 0])
                recursiveClick(i, j)
                break;
            // 中键
            case 1:
                gameState.operation.push([gameState.current, i, j, 1])
                quickClick(i, j)
                break;
            // 右键
            case 2:
                gameState.operation.push([gameState.current, i, j, 2])
                rightClick(i, j)
                break
        }
    }

    // 回放或游玩
    if (domutil.getURLParam('id')) {
        setupReview()
        reviewGame()
    } else {
        setupGame()
        initGame()
    }
})