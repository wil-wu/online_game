window.addEventListener('DOMContentLoaded', () => {
    'use strict'

    let alert = new mdb.Alert('#alert')
    let loginTab = new mdb.Tab('#login-tab')
    let registerTab = new mdb.Tab('#register-tab')

    let forms = document.querySelectorAll('form')

    let fnMap = {
        login: (data) => {
            request.post(_api.login, data).then((res) => {
                if (res.data.code === 200) {
                    location.href = _urls.game
                } else {
                    let error = Object.values(res.data.data).map(value => value.join(', ')).join(', ')
                    alert.setType('alert-warning').setText(error).show()
                }
            })
        },
        register: (data) => {
            request.post(_api.register, data).then((res) => {
                if (res.data.code === 200) {
                    location.hash = '#login'
                    alert.setType('alert-success').setText(res.data.msg).show()
                } else {
                    let error = Object.values(res.data.data).map(value => value.join(', ')).join(', ')
                    alert.setType('alert-warning').setText(error).show()
                }
            })
        }
    }

    const tabShow = () => location.hash === '#register' ? registerTab.show() : loginTab.show()

    // 哈希路由监听
    window.addEventListener('hashchange', tabShow)

    loginTab.on('click', () => location.hash = '#login')
    registerTab.on('click', () => location.hash = '#register')

    tabShow()

    // 表单绑定
    forms.forEach((form) => {
        form.addEventListener('submit', (evt) => {
            evt.preventDefault()

            if (!form.checkValidity()) {
                form.classList.add('was-validated')
            } else {
                let data = domutil.serializeForm(form)
                fnMap[form.dataset.action](data)
                form.classList.remove('was-validated')
            }
        })
    })
})