from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField
from wtforms.validators import DataRequired, NumberRange, Length, EqualTo


class LoginForm(FlaskForm):
    """
    登录表单
    """
    username = StringField('username', validators=[DataRequired(), Length(3, 20)])
    password = StringField('password', validators=[DataRequired(), Length(6, 20)])


class RegisterForm(LoginForm):
    """
    注册表单
    """
    confirm = StringField('confirm', validators=[EqualTo('password')])


class SpecForm(FlaskForm):
    """
    游戏规格参数
    """
    class Meta:
        csrf = False

    width = IntegerField('width', validators=[NumberRange(10, 100)], default=10)
    height = IntegerField('height', validators=[NumberRange(10, 100)], default=10)
