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
                    let error = Object.values(res.data.data).map(value => value.join(', ')) .join(', ')
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
                    let error = Object.values(res.data.data).map(value => value.join(', ')) .join(', ')
                    alert.setType('alert-warning').setText(error).show()
                }
            })
        }
    }


    // 哈希路由监听
    window.addEventListener('hashchange', () => {
        location.hash === '#register' ? registerTab.show() : loginTab.show()
    })

    loginTab._element.addEventListener('click', () => location.hash = '#login')
    registerTab._element.addEventListener('click', () => location.hash = '#register')


    // 表单绑定
    forms.forEach((formEl) => {
        let btn = formEl.querySelector('button')

        btn.addEventListener('click', () => {
            if (!formEl.checkValidity()) {
                formEl.classList.add('was-validated')
            } else {
                let data = domutil.serializeForm(formEl)
                fnMap[formEl.dataset.action](data)
                formEl.classList.remove('was-validated')
            }
        })
    })
})