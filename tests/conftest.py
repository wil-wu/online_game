import pytest
from flask.testing import FlaskClient, TestResponse
from werkzeug.security import generate_password_hash

from minesweeper import create_app
from minesweeper.models import db, User, Record


@pytest.fixture
def app():
    app = create_app('test')
    with app.app_context():
        db.create_all()
        # 添加测试数据
        user1 = User(username='test1', password=generate_password_hash('test1'))
        user2 = User(username='test2', password=generate_password_hash('test2'))
        db.session.add_all((user1, user2))
        db.session.commit()
        record1 = Record(playtime=1, remainder=1, operation='1', width=1, height=1, map='1', user_id=user1.user_id)
        record2 = Record(playtime=2, remainder=2, operation='2', width=2, height=2, map='2', user_id=user2.user_id)
        db.session.add_all((record1, record2))
        db.session.commit()

    yield app

    db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def runner(app):
    return app.test_cli_runner()


@pytest.fixture
def auth(client):
    return AuthActions(client)


class AuthActions:
    """
    验证动作
    """
    def __init__(self, client: FlaskClient):
        self._client = client

    def login(self, username: str = 'test1', password: str = generate_password_hash('test1')) -> TestResponse:
        return self._client.post('/api/login', json={
            'username': username,
            'password': password,
        })

    def register(self, username: str, password: str, confirm: str) -> TestResponse:
        return self._client.post('/api/register', json={
            'username': username,
            'password': password,
            'confirm': confirm
        })
