import pytest
from flask import session, g

from minesweeper.models import User


def test_login(client, auth):
    """
    登录接口测试
    """
    # 正确用户名和密码
    response = auth.login()
    assert response.json['msg'] == '登录成功'

    # 保存user_id到session
    with client:
        client.get('/')
        assert session['user_id'] == 1
        assert g.user.username == 'test1'


@pytest.mark.parametrize(('username', 'password', 'message'), (
    ('test', '', '格式错误'),
    ('', 'password', '格式错误'),
    ('test', 't', '格式错误'),
    ('t', 'password', '格式错误'),
    ('testtesttesttesttesttest', 'password', '格式错误'),
    ('test', 'passwordpasswordpassword', '格式错误'),
    ('test1145114', 'password', '登录失败'),
    ('test1', 'password1145114', '登录失败'),
))
def test_login_validate_input(auth, username, password, message):
    """
    登录参数合法性测试
    """
    response = auth.login(username, password)
    assert message == response.json['msg']


def test_register(app, auth):
    """
    注册接口测试
    """
    response = auth.register('test3', 'password', 'password')
    assert response.json['msg'] == '注册成功'

    with app.app_context():
        assert User.query.filter_by(username='test3').scalar() is not None


@pytest.mark.parametrize(('username', 'password', 'confirm', 'message'), (
    ('test3', 'password1', 'password2', '格式错误'),
    ('test1', 'password', 'password', '注册失败'),
))
def test_register_validate_input(auth, username, password, confirm, message):
    """
    注册参数合法性测试
    """
    response = auth.register(username, password, confirm)
    assert response.json['msg'] == message


def test_logout(auth, client):
    """
    测试登出
    """
    with client:
        auth.login()
        response = auth.logout()
        assert response.headers['Location'] == '/auth'
        assert session.get('user_id') is None
