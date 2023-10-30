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

})()