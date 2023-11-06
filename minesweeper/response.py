from typing import Optional
from typing import Union


class AjaxData(dict):
    """
    自定义响应结构
    :param code: 状态码
    :param msg: 返回信息
    :param data: 返回数据
    """
    def __init__(self, code: int = 200, msg: str = '', data: Optional[Union[dict, list]] = None):
        super().__init__(code=code, msg=msg, data=data)
