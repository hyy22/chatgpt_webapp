import json
from revChatGPT.V1 import Chatbot
from cfg import access_token, check_period, max_times
from flask import Flask, Response, stream_with_context, request
from flask_cors import CORS
from time import time

app = Flask(__name__)
CORS(app, supports_credentials=True)

# 初始化chatGPT
chatbot = Chatbot(config={
    "access_token": access_token,
})
# 缓存did对应会话信息
cache_dict = {}


# 路由
@app.route("/ask")
def ask():
    prompt = request.args.get("prompt", "")
    did = request.args.get("did", "")
    # 参数校验
    if prompt == "" or did == "":
        return show_error("参数错误")
    # 额度检测
    try:
        check_quota(did)
    except Exception as err:
        print(err)
        return show_error(err)
    # 上下文对话
    conversation_id = cache_dict[did]["last_conversation_id"]
    parent_id = cache_dict[did]["last_parent_id"]
    response = Response(
        stream_with_context(
            answer(
                did=did,
                prompt=prompt,
                last_conversation_id=conversation_id,
                last_parent_id=parent_id
            )
        ),
        mimetype="text/event-stream"
    )
    response.headers["Cache-Control"] = "no-cache, no-transform"
    response.headers["X-Accel-Buffering"] = "no"
    response.headers["Connection"] = "keep-alive"
    return response


# 问答
def answer(prompt, did, last_conversation_id, last_parent_id):
    try:
        for data in chatbot.ask(prompt, last_conversation_id, last_parent_id):
            cache_dict[did]["last_conversation_id"] = data["conversation_id"]
            cache_dict[did]["last_parent_id"] = data["parent_id"]
            yield f"event:message\n"
            yield f"data:{json.dumps(data, ensure_ascii=False)}\r\n"
            yield "\n\n"
        # print("完成！！！！！")
        yield f"event:done\n"
        yield f"data: \n\n"
    except Exception as err:
        yield f"event:fail\n"
        yield f"data:{err}\r\n"
        yield "\n\n"


# 显示错误
def show_error(msg):
    def build_msg():
        yield f"event:fail\n"
        yield f"data:{msg}\r\n"
        yield "\n\n"
    response = Response(stream_with_context(build_msg()), mimetype="text/event-stream")
    response.headers["Cache-Control"] = "no-cache, no-transform"
    response.headers["X-Accel-Buffering"] = "no"
    response.headers["Connection"] = "keep-alive"
    return response


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
            "last_conversation_id": None,
            "last_parent_id": None,
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
        cache_dict[did]["last_conversation_id"] = None
        cache_dict[did]["last_parent_id"] = None
        cache_dict[did]["last_conversation_time"] = now
        cache_dict[did]["prompt_times"] = 1
