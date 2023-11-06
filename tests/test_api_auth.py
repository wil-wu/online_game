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
    ('test1', '', '格式错误'),
    ('', 'test1', '格式错误'),
    ('test1', 't', '格式错误'),
    ('t', 'test1', '格式错误'),
    ('testtesttesttesttesttest', 'test1', '格式错误'),
    ('test1', 'testtesttesttesttesttest', '格式错误'),
    ('test1', 'tes', '登录失败'),
    ('tes', 'test1', '登录失败'),
))
def test_login_validate_input(auth, username, password, message):
    """
    登录参数合法性测试
    """
    response = auth.login(username, password)
    assert message == response.json['msg']


def test_register(auth):
    """
    注册接口测试
    """
    response = auth.register('test3', 'test3', 'test3')
    assert response.json['msg'] == '注册成功'
    assert User.query.filter_by(username='test3').first() is not None


@pytest.mark.parametrize(('username', 'password', 'confirm', 'message'), (
    ('test3', 'test3', 'test', '格式错误'),
    ('test1', 'test3', 'test3', '注册失败'),
))
def test_register_validate_input(auth, username, password, confirm, message):
    """
    注册参数合法性测试
    """
    response = auth.register(username, password, confirm)
    assert response.json['msg'] == message
