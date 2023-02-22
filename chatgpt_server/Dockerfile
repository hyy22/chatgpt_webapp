FROM python:3.9.16-buster
WORKDIR /server
COPY . .
RUN pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
CMD ["gunicorn", "-w", "4", "-t", "0", "-b", "0.0.0.0:9000", "main:app"]