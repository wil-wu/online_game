(function () {
    'use strict'

    // 基础配置
    window._config = {
        baseURL: 'http://127.0.0.1:5000/',
        timeout: 5000,
        page: 1,
        size: 5,
        selfPageSize: 100,
        mineRate: 0.2,
    }

    // html模板地址
    window._urls = {
        auth: '/auth',
        game: '/game',
        record: '/record',
    }

    // 接口地址
    window._api = {
        login: '/api/login',
        register: '/api/register',
        map: '/api/map',
        record: '/api/record',
    }
})()