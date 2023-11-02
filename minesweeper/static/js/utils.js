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
        }
    }

    // dom模板
    window.templates = {
        // 排行榜模板
        rankTemplate(data) {
            let view = ''
            for (const datum of data) {
                let html = `<li class="list-group-item d-flex justify-content-between align-items-start">
                              <div class="ms-2 me-auto">
                                <div class="fw-bold">${datum.user.username}</div>
                                <div class="small text-muted">${datum.width} x ${datum.height}</div>
                              </div>
                              <span class="badge badge-primary rounded-pill">${datum.playtime}</span>
                            </li>`
                view += html
            }
            return view
        },

        // 游戏记录模板
        historyTemplate(data) {
            let view = ''
            for (const datum of data) {
                let html = `<li class="list-group-item d-flex justify-content-between align-items-center" data-id="${datum.record_id}">
                              <div>${datum.width} x ${datum.height}</div>
                              <span class="badge badge-primary rounded-pill">${datum.playtime}</span>
                            </li>`
                view += html
            }
            return view
        },

        paginationTemplate(pages) {
            let view = ''
            view += `<li class="page-item"><a class="page-link" data-page="prev" href="javascript:void(0)">上一页</a></li>`
            for (let i = 0; i < pages; i++) {
                view += view += `<li class="page-item"><a class="page-link" data-page="${i + 1}" href="javascript:void(0)">${i + 1}</a></li>`
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
        _callback
        _active

        constructor(selector) {
            this._element = document.querySelector(selector)
        }

        // 监听当前页变化
        set _page(val) {
            let page = parseInt(val)
            if (page && page > 0 && this._page !== val) {
                this._page = page
                this._callback(this._page, this._perPage)
            }
        }

        // 初始化组件
        init(pages, callback) {
            this._callback = callback

            domutil.removeChildren(this._element)
            this._element.insertAdjacentHTML('beforeend', templates.paginationTemplate(pages))
            this._element.addEventListener('click', (evt) => {
                let page = evt.target.dataset.page
                if (!page) return

                if (page === 'prev') {
                    this._page -= 1
                } else if (page === 'next') {
                    this._page += 1
                } else {
                    this._page = parseInt(page)
                }
            })
        }

        // 回收组件
        dispose() {
            domutil.removeChildren(this._element)
            this._element = null
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