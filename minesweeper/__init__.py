from typing import Optional

from flask import Flask
from flask_migrate import Migrate
from flask_wtf import CSRFProtect

from minesweeper.config import config
from minesweeper.models import db
from minesweeper import views
from minesweeper import api


def create_app(env: Optional[str] = None):
    app = Flask(__name__)
    conf_obj = config.get(env, config['default'])

    app.config.from_object(conf_obj)

    app.register_blueprint(views.bp)
    app.register_blueprint(api.bp)
    app.add_url_rule('/', endpoint='views.game')

    db.init_app(app)
    Migrate(app, db)
    CSRFProtect(app)

    return app
