(function () {
    'use strict'

    // dom操作相关工具
    window.domutil = {
        // 序列化表单
        serializeForm(form) {
            let data = {}
            form.querySelectorAll('input, select, textarea').forEach(function (el) {
                if (el.type === 'checkbox') {
                    data[el.name] = el.checked
                    return
                }
                if (el.type === 'radio') {
                    if (!el.checked) return
                }
                data[el.name] = el.value
            })
            return data
        },

        // 获取cookie
        getCookie(name) {
            let cookieValue = null
            if (document.cookie) {
                const cookies = document.cookie.split(';')
                for (const raw of cookies) {
                    const cookie = raw.trim()
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                        break
                    }
                }
            }
            return cookieValue
        },

        // 移除所有子元素
        removeChildren(el) {
            while (el.firstChild) el.removeChild(el.firstChild)
        },

        // 获取url参数
        getURLParam(key) {
            return new URLSearchParams(location.search).get(key)
        },

        // 格式化毫秒
        millisecondFormat(value) {
            return `${Math.floor(value / 1000)}.${value % 1000}s`
        }
    }

    // dom模板
    window.templates = {
        // 排行榜模板
        rankTemplate(data) {
            let view = ''
            if (!data.length) view += '<tr><td class="text-muted text-center" colspan="5">无数据</td></tr>'

            for (let i = 0; i < data.length; i++) {
                let datum = data[i]
                let html = `<tr>
                              <td>${i + 1}</td>
                              <td>${datum.user.username}</td>
                              <td>${datum.width} x ${datum.height}</td>
                              <td>${datum.remainder}</td>
                              <td>${domutil.millisecondFormat(datum.playtime)}</td>
                              <td>${new Date(datum.playdate + '+8').toLocaleString()}</td>
                            </tr>`
                view += html
            }
            return view
        },

        // 游戏记录模板
        historyTemplate(data) {
            let view = ''
            if (!data.length) view += '<tr><td class="text-muted text-center" colspan="3">无数据</td></tr>'

            for (const datum of data) {
                let html = `<tr data-id="${datum.record_id}">
                              <td>${datum.width} x ${datum.height}</td>
                              <td>${datum.remainder}</td>
                              <td>${domutil.millisecondFormat(datum.playtime)}</td>
                              <td>${new Date(datum.playdate + '+8').toLocaleString()}</td>
                            </tr>`
                view += html
            }
            return view
        },

        paginationTemplate(pages) {
            let view = ''
            view += `<li class="page-item"><a class="page-link" data-page="prev" href="javascript:void(0)">上一页</a></li>`
            for (let i = 0; i < pages; i++) {
                view += `<li class="page-item"><a class="page-link" data-page="${i + 1}" href="javascript:void(0)">${i + 1}</a></li>`
            }
            view += `<li class="page-item"><a class="page-link" data-page="next" href="javascript:void(0)">下一页</a></li>`
            return view
        }
    }

    // 携带csrf_token
    axios.defaults.headers.common['X-CSRFToken'] = domutil.getCookie('csrftoken')

    // axios 实例
    window.request = axios.create({
        baseURL: _config.baseURL,
        timeout: _config.timeout,
    })

    // 警告框
    mdb.Alert.prototype.config = {delay: 2000, type: 'alert-warning'}
    mdb.Alert.prototype.setType = function (type) {
        if (this.config.type !== type) {
            this._element.classList.remove(this.config.type)
            this._element.classList.add(type)
            this.config.type = type
        }
        return this
    }
    mdb.Alert.prototype.setIcon = function (icon) {
        this._element.querySelector('i').className = icon
        return this
    }
    mdb.Alert.prototype.setText = function (text) {
        this._element.querySelector('div').textContent = text
        return this
    }
    mdb.Alert.prototype.show = function () {
        if (!this._element.classList.contains('show')) {
            this._element.classList.remove('hide')
            this._element.classList.add('show')
            this._element.style.setProperty('top', '15%')
            setTimeout(function () {
                this.hide()
            }.bind(this), this.config.delay)
        }
    }
    mdb.Alert.prototype.hide = function () {
        this._element.classList.remove('show')
        this._element.classList.add('hide')
        this._element.style.setProperty('top', '-50%')
    }

    // 分页组件
    mdb.Pagination = class Pagination {
        _element
        _page
        _perPage
        _pages
        _callback
        _active
        _paginate
        _created

        // 监听page变化
        set page(val) {
            if (val < 1 || val > this._pages || val === this._page) return

            this._page = val
            let active = this._element.children[val]
            let prev = this._element.firstElementChild
            let next = this._element.lastElementChild

            if (val === 1) prev.classList.add('disabled')
            else prev.classList.remove('disabled')
            if (val === this._pages) next.classList.add('disabled')
            else next.classList.remove('disabled')

            if (this._active) this._active.classList.remove('active')
            active.classList.add('active')
            this._active = active
            this._callback(this._page, this._perPage)
        }

        get page() {
            return this._page
        }

        // 初始化组件
        init(selector, pager, callback) {
            if (this._created) return

            this._created = true
            this._page = pager.page
            this._perPage = pager.perPage
            this._pages = Math.min(pager.pages, Math.ceil(_config.maxTotal / pager.perPage))
            this._element = document.querySelector(selector)
            this._callback = callback
            this._paginate = (evt) => {
                let el = evt.target
                let page = el.dataset.page

                if (!page) return

                if (parseInt(page)) {
                    this.page = parseInt(page)
                } else {
                    this.page += page === 'prev' ? -1 : 1
                }
            }

            domutil.removeChildren(this._element)
            this._element.insertAdjacentHTML('beforeend', templates.paginationTemplate(this._pages))
            this._element.addEventListener('click', this._paginate)
        }

        // 回收组件
        dispose() {
            domutil.removeChildren(this._element)
            this._element.removeEventListener('click', this._paginate)
            this._created = false
            this._element = null
            this._callback = null
            this._paginate = null
            this._active = null
        }
    }

    // 扩展组件监听器
    for (const component of [mdb.Tab, mdb.Toast, mdb.Modal]) {
        component.prototype.on = function (type, handler, options = {}) {
            this._element.addEventListener(type, handler, options)
            return this
        }
        component.prototype.once = function (type, handler) {
            return this.on(type, handler, {once: true})
        }
        component.prototype.off = function (type, handler, options = {}) {
            this._element.removeEventListener(type, handler, options)
            return this
        }
    }

})()