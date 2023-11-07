import pytest


@pytest.mark.parametrize('path', (
    '/game',
    '/record',
))
def test_login_required_views(client, path):
    """
    测试需要登录访问的页面
    """
    response = client.get(path)
    # 未登录重定向到验证页面
    assert response.headers['Location'] == '/auth'


@pytest.mark.parametrize('path', (
    '/auth',
    '/game',
    '/record',
))
def test_views_and_csrf_token(client, auth, path):
    """
    测试模板响应和cookie中包含csrftoken
    """
    auth.login()

    response = client.get(path)
    cookie = response.headers.get('Set-Cookie')
    assert response.status_code == 200
    assert cookie is not None
    assert 'csrftoken' in cookie
