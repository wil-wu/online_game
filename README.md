# 扫雷
扫雷web实现，支持排行榜，个人记录，游戏回放
### 本地运行
创建虚拟环境
```
> python -m venv venv
```
激活虚拟环境
```
> ./venv/scripts/activate
```
安装依赖
```
> pip install -r requirements
```
数据库迁移
```
> flask --app minesweeper db upgrade
```
启动本地服务
```
> flask --app minesweeper run --debug
```