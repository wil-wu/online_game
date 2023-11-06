import pytest


def test_auth_view(client):
    """
    验证视图测试
    """


def test_game_view(client, auth):
    """
    游戏视图测试
    """


def test_record_view(client, auth):
    """
    记录视图测试
    """


@pytest.mark.parametrize('path', (
    '/auth',
    '/game',
))
def test_login_required_views(client, path):
    """
    测试需要登录访问的页面
    """
    response = client.get(path)
    # 未登录重定向到验证页面
    assert response.request.path == '/auth'


@pytest.mark.parametrize('path', (
    '/auth',
    '/game',
    '/record',
))
def test_csrf_token(client, auth, path):
    """
    测试cookie写入csrftoken
    """
    auth.login()

    response = client.get(path)
    cookie = response.headers.get('cookie')
    assert cookie is not None
    assert 'csrftoken' in cookie
