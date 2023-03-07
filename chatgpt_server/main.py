import json
from cfg import check_period, max_times, openai_key
from flask import Flask, Response, stream_with_context, request
from flask_cors import CORS
from time import time
import openai

app = Flask(__name__)
CORS(app, supports_credentials=True)

# 初始化chatGPT
openai.api_key = openai_key
# 缓存did对应会话信息 上次提问时间 周期内总提问次数
cache_dict = {}


# 路由
@app.route("/ask", methods=["POST"])
def ask():
    prompt = request.json.get("prompt", "")
    did = request.json.get("did", "")
    messages = request.json.get("messages", [])
    # 参数校验
    if prompt == "" or did == "":
        return show_error_stream("参数错误")
    # 额度检测
    try:
        check_quota(did)
    except Exception as err:
        print(err)
        return show_error_stream(err)
    return build_stream_response(answer, prompt=prompt, messages=messages)


# 图片生成 http请求
@app.route("/imagen", methods=["POST"])
def imagen():
    def format_resp(o, code=0):
        return json.dumps({"code": code, "data": o if code == 0 else None, "message": o if code < 0 else "success"}, ensure_ascii=False)
    prompt = request.json.get("prompt", "")
    did = request.json.get("did", "")
    # 参数校验
    if prompt == "" or did == "":
        return format_resp("参数错误", -1)
    # 额度检测
    try:
        check_quota(did)
    except Exception as err:
        print(err)
        return format_resp(err, -1)
    resp = openai.Image.create(
        prompt=prompt,
        n=1,
        size="512x512",
        response_format="b64_json"
    )
    # print(f"resp:{resp}")
    return format_resp(resp)


# 问答
def answer(prompt, messages=None):
    if messages is None:
        messages = []
    try:
        for data in openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                *messages,
                {"role": "user", "content": prompt}
            ],
            stream=True
        ):
            row = data["choices"][0]
            if "content" in row["delta"]:
                msg = json.dumps({"text": row["delta"]["content"]}, ensure_ascii=False)
                yield f"data:{msg}\n\n"
            if row["finish_reason"] == "stop":
                yield "event:done\n"
                yield "data:\n\n"
            elif row["finish_reason"] is not None:
                print('finish_reason', row["finish_reason"])
                yield "event:fail\n"
                yield "data:ChatGPT服务内部故障\n\n"
    except Exception as err:
        print(err)
        yield "event:fail\n"
        yield f"data:{err}\n\n"


# 构造sse响应
def build_stream_response(generate_fn, **kwargs):
    response = Response(stream_with_context(generate_fn(**kwargs)), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache, no-transform"
    response.headers["X-Accel-Buffering"] = "no"
    response.headers["Connection"] = "keep-alive"
    return response


# 显示错误
def show_error_stream(msg):
    def build_error_generate():
        yield f"event:fail\n"
        yield f"data:{msg}\n\n"
    return build_stream_response(build_error_generate)


# 格式化时间描述
def format_times(t):
    y = t
    d = y // 86400  # 天
    if d > 0:
        return f"{d}天"
    y = t - (d * 86400)
    h = y // 3600  # 时
    if h > 0:
        return f"{h}小时"
    y = y - (h * 3600)
    m = y // 60  # 分
    if m > 0:
        return f"{m}分钟"
    y = y - (m * 60)
    s = int(y)  # 秒
    return f"{s}秒"


# 额度检测
def check_quota(did):
    now = time()
    # print(f"now:{now}")
    # 没有会话过，添加初始值
    if did not in cache_dict:
        cache_dict[did] = {
            "last_conversation_time": now,
            "prompt_times": 0
        }
    last_conversation_time = cache_dict[did]["last_conversation_time"]
    prompt_times = cache_dict[did]["prompt_times"]
    # 仍在会话周期
    if last_conversation_time + check_period > now:
        # 超额
        if prompt_times >= max_times:
            # 检测时间格式化
            period_fmt = format_times(check_period)
            raise Exception(f"超额了～每{period_fmt}只能提问{max_times}次，请{period_fmt}后再来吧~")
        else:
            cache_dict[did]["last_conversation_time"] = now
            cache_dict[did]["prompt_times"] += 1
    # 超出会话周期
    else:
        cache_dict[did]["last_conversation_time"] = now
        cache_dict[did]["prompt_times"] = 1
