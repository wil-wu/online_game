import secrets


class BaseConfig:
    SECRET_KEY = secrets.token_hex()
    INSTANCE_RELATIVE_CONFIG = True
    MINE_RATE = 0.2


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'


config = {
    'default': DevelopmentConfig,
    'development': DevelopmentConfig,
    'test': TestConfig,
}
