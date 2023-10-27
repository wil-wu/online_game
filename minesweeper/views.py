from flask import Blueprint, Response, render_template
from flask_wtf.csrf import generate_csrf

from minesweeper.decorators import login_required


bp = Blueprint('views', __name__)


@bp.route('/auth')
def auth():
    return render_template('auth.html')


@bp.route('/game')
@login_required
def game():
    return render_template('game.html')


@bp.route('/record')
@login_required
def record():
    return render_template('record.html')


@bp.after_request
def after_request(response: Response) -> Response:
    csrf_token = generate_csrf()
    response.set_cookie('csrftoken', csrf_token)
    return response
