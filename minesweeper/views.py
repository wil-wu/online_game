from flask import Blueprint, Response, render_template
from flask.views import MethodView
from flask_wtf.csrf import generate_csrf

from minesweeper.decorators import login_required

bp = Blueprint('views', __name__)


class AuthView(MethodView):
    """
    登录/注册视图
    """
    init_every_request = False

    def get(self):
        return render_template('auth.html')


class GameView(MethodView):
    """
    游戏视图
    """
    init_every_request = False
    decorators = [login_required]

    def get(self):
        return render_template('game.html')


class RecordView(MethodView):
    """
    游戏记录视图
    """
    init_every_request = False
    decorators = [login_required]

    def get(self):
        return render_template('record.html')


@bp.after_request
def after_request(response: Response) -> Response:
    csrf_token = generate_csrf()
    response.set_cookie('csrftoken', csrf_token)
    return response


bp.add_url_rule('/auth', view_func=AuthView.as_view('auth'))
bp.add_url_rule('/game', view_func=GameView.as_view('game'))
bp.add_url_rule('/record', view_func=RecordView.as_view('record'))
