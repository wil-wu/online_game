FROM python:3.9-slim
ENV PYTHONUNBUFFERED 1

WORKDIR /usr/src/app
COPY requirements.txt ./
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --no-cache-dir --trusted-host pypi.tuna.tsinghua.edu.cn
COPY . .
RUN flask --app minesweeper db upgrade

VOLUME /instance
