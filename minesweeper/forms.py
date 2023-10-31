from flask_wtf import FlaskForm
from wtforms import StringField, IntegerField, FloatField
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


class RecordForm(FlaskForm):
    """
    游戏记录表单
    """
    playtime = FloatField('playtime', validators=[DataRequired()])
    remainder = IntegerField('remainder', validators=[DataRequired()])
    operation = StringField('process', validators=[DataRequired()])
    width = IntegerField('width', validators=[DataRequired(), NumberRange(10, 100)])
    height = IntegerField('height', validators=[DataRequired(), NumberRange(10, 100)])
    map = StringField('map', validators=[DataRequired()])
