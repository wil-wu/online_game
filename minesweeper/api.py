import random

from flask import Blueprint, request, url_for, redirect, session, g, current_app
from flask.views import MethodView
from sqlalchemy import desc
from werkzeug.security import check_password_hash, generate_password_hash

from minesweeper.forms import LoginForm, RegisterForm, SpecForm, RecordForm
from minesweeper.models import db, User, Record
from minesweeper.response import AjaxData
from minesweeper.decorators import login_required

bp = Blueprint('api', __name__, url_prefix='/api')


class APIView(MethodView):
    init_every_request = False
    decorators = [login_required]


class LoginAPI(MethodView):
    """
    登录验证
    """
    init_every_request = False

    def post(self) -> AjaxData:
        form = LoginForm()
        if not form.validate_on_submit():
            return AjaxData(400, '格式错误', form.errors)

        error = None
        username = form.data['username']
        password = form.data['password']
        user = User.query.filter_by(username=username).first()

        if user is None:
            error = {'username': ['用户名不存在']}

        elif not check_password_hash(user.password, password):
            error = {'password': ['密码错误']}

        if error is not None:
            return AjaxData(400, '登录失败', error)

        session['user_id'] = user.user_id
        return AjaxData(msg='登录成功')


class RegisterAPI(MethodView):
    """
    注册验证
    """
    init_every_request = False

    def post(self) -> AjaxData:
        form = RegisterForm()
        if not form.validate_on_submit():
            return AjaxData(400, '格式错误', form.errors)

        username = form.data['username']
        password = form.data['password']

        if User.query.filter_by(username=username).scalar():
            error = {'username': ['用户名已存在']}
            return AjaxData(400, '注册失败', error)

        user = User(username=username, password=generate_password_hash(password))
        db.session.add(user)
        db.session.commit()
        return AjaxData(msg='注册成功')


class LogoutAPI(MethodView):
    """
    退出登录
    """
    init_every_request = False

    def get(self):
        session.clear()
        return redirect(url_for('views.auth'))


class GameMapAPI(APIView):
    """
    游戏地图
    """
    def get(self) -> AjaxData:
        form = SpecForm(**request.args)
        if not form.validate():
            return AjaxData(400, '格式错误', form.errors)

        width = form.data['width']
        height = form.data['height']

        mine_idx = set()
        mine_count = int(width * height * current_app.config['MINE_RATE'])
        raw_map = [[0] * (width + 2) for _ in range(height + 2)]  # 将地图扩大一圈，计算周围雷数可避免边界情况
        rendered_map = [[0] * width for _ in range(height)]

        # 计算单元格周围地雷数
        def get_around_mines(r: int, c: int) -> int:
            # 上，下，左，右
            x = raw_map[r - 1][c] + raw_map[r + 1][c] + raw_map[r][c - 1] + raw_map[r][c + 1]
            # 左上，右上，左下，右下
            y = raw_map[r - 1][c - 1] + raw_map[r - 1][c + 1] + raw_map[r + 1][c - 1] + raw_map[r + 1][c + 1]
            return x + y

        # 随机填充地雷
        while mine_count > 0:
            idx = random.randrange(0, width * height)
            if idx not in mine_idx:
                row = idx // width + 1
                col = idx % width + 1
                raw_map[row][col] = 1
                mine_count -= 1
                mine_idx.add(idx)

        # 计算每个格子周围地雷数
        for i in range(height):
            for j in range(width):
                rendered_map[i][j] = get_around_mines(i + 1, j + 1) if raw_map[i + 1][j + 1] == 0 else 9

        return AjaxData(data=rendered_map)


class HistoryAPI(APIView):
    """
    游戏记录
    """
    def get(self) -> AjaxData:
        max_per_page = current_app.config['MAX_PER_PAGE']
        pagination = Record.query.filter_by(user_id=g.user.user_id).order_by(desc('playdate')).paginate(
            max_per_page=max_per_page,
            error_out=False
        )
        return AjaxData(data={'pages': pagination.pages, 'items': pagination.items})

    def post(self) -> AjaxData:
        form = RecordForm()
        if not form.validate_on_submit():
            return AjaxData(400, '格式错误', form.errors)

        data = form.data
        data.pop('csrf_token', None)
        record = Record(**data, user_id=g.user.user_id)
        db.session.add(record)
        db.session.commit()
        return AjaxData(msg='已保存游戏记录')


class SingleHistoryAPI(APIView):
    """
    游戏记录详情
    """
    def get(self, record_id) -> AjaxData:
        record = db.session.get(Record, record_id)
        if record is None:
            return AjaxData(400, '记录不存在')
        if record.user_id != g.user.user_id:
            return AjaxData(400, '无权限访问')
        return AjaxData(data=record)


class RankAPI(APIView):
    """
    游戏排行榜
    """
    def get(self) -> AjaxData:
        form = SpecForm(**request.args)
        if not form.validate():
            return AjaxData(400, '格式错误', form.errors)

        rank_limit = current_app.config['RANK_LIMIT']
        rank = Record.query.filter_by(**form.data).order_by('remainder', 'playtime').limit(rank_limit).all()
        return AjaxData(data=rank)


@bp.before_app_request
def before_request():
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = db.session.get(User, user_id)


bp.add_url_rule('/login', view_func=LoginAPI.as_view('login'))
bp.add_url_rule('/register', view_func=RegisterAPI.as_view('register'))
bp.add_url_rule('/logout', view_func=LogoutAPI.as_view('logout'))
bp.add_url_rule('/map', view_func=GameMapAPI.as_view('map'))
bp.add_url_rule('/history', view_func=HistoryAPI.as_view('history'))
bp.add_url_rule('/history/<int:record_id>', view_func=HistoryAPI.as_view('single_history'))
bp.add_url_rule('/rank', view_func=RankAPI.as_view('rank'))
