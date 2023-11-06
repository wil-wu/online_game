import secrets


class BaseConfig:
    SECRET_KEY = secrets.token_hex()
    INSTANCE_RELATIVE_CONFIG = True
    MINE_RATE = 0.2
    RANK_LIMIT = 5
    MAX_PER_PAGE = 10


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'


class TestConfig(BaseConfig):
    TESTING = True
    WTF_CSRF_ENABLED = False
    WTF_CSRF_CHECK_DEFAULT = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


config = {
    'default': DevelopmentConfig,
    'development': DevelopmentConfig,
    'test': TestConfig,
}
