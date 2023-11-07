import pytest

from minesweeper.models import db, Record


def test_gen_game_map(app, client, auth):
    """
    扫雷地图接口测试
    """
    auth.login()

    response = client.get('/api/map')
    game_map = response.json['data']
    # 地图宽高默认值
    width = height = 10
    expect_count = int(width * height * app.config['MINE_RATE'])
    actual_count = 0

    assert game_map is not None
    assert len(game_map) == height and len(game_map[0]) == width

    # 测试地雷数量符合预期
    for i in range(height):
        for j in range(width):
            actual_count += game_map[i][j] == 9

    assert actual_count == expect_count


@pytest.mark.parametrize(('width', 'height', 'message'), (
    (9, 10, '格式错误'),
    (10, 9, '格式错误'),
    (101, 10, '格式错误'),
    (10, 101, '格式错误'),
    ('一', 10, '格式错误'),
    (10, '一', '格式错误'),
))
def test_game_map_validate_input(client, auth, width, height, message):
    """
    游戏规格参数合法性测试
    """
    auth.login()

    response = client.get(f'/api/map?width={width}&height={height}')
    assert response.json['msg'] == message


def test_game_history(app, client, auth):
    """
    游戏记录接口测试
    """
    auth.login()

    response = client.get('/api/history')
    data = response.json['data']
    assert data['pages'] is not None
    assert data['items'] is not None
    assert len(data['items']) <= app.config['MAX_PER_PAGE']

    response = client.post('/api/history', json={
        'playtime': 3,
        'remainder': 3,
        'operation': '3',
        'width': 10,
        'height': 10,
        'map': '3',
    })
    assert response.json['msg'] == '已保存游戏记录'

    with app.app_context():
        record = db.session.get(Record, 3)
        assert record is not None
        assert record.user_id == 1


@pytest.mark.parametrize(('playtime', 'remainder', 'operation', 'width', 'height', 'game_map', 'message'), (
    ('一', 1, '1', 10, 10, '1', '格式错误'),
    (1, '一', '1', 10, 10, '1', '格式错误'),
    (1, 1, None, 10, 10, '1', '格式错误'),
    (1, 1, '1', '一', 10, '1', '格式错误'),
    (1, 1, '1', 10, '一', '1', '格式错误'),
    (1, 1, '1', 10, 10, None, '格式错误'),
))
def test_game_history_validate_input(client, auth, playtime, remainder, operation, width, height, game_map, message):
    """
    游戏记录参数合法性测试
    """
    auth.login()

    response = client.post('/api/history', json={
        'playtime': playtime,
        'remainder': remainder,
        'operation': operation,
        'width': width,
        'height': height,
        'map': game_map,
    })
    assert response.json['msg'] == message


def test_single_history(client, auth):
    """
    游戏记录详情接口测试
    """
    auth.login()

    # 访问他人游戏记录
    response = client.get('/api/history/2')
    assert response.json['msg'] == '无权限访问'
    assert response.json['data'] is None

    # 访问不存在的记录
    response = client.get('/api/history/1145114')
    assert response.json['msg'] == '记录不存在'
    assert response.json['data'] is None

    # 访问自己存在的记录
    response = client.get('/api/history/1')
    assert response.json['data'] is not None


def test_game_rank(app, client, auth):
    """
    游戏排行榜接口测试
    """
    auth.login()

    response = client.get('/api/rank')
    data = response.json['data']
    assert data is not None
    assert len(data) <= app.config['RANK_LIMIT']


@pytest.mark.parametrize('path', (
    '/api/map',
    '/api/rank',
    '/api/history',
    '/api/history/1',
))
def test_login_required_api(client, path):
    """
    测试需要登录访问的接口
    """
    response = client.get(path)
    # 未登录重定向到验证页面
    assert response.headers['Location'] == '/auth'
