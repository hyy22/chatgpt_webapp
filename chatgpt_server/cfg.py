import os

# 会话周期
check_period = int(os.getenv("CHATGPT_CHECK_PERIOD", 86400))
# 最多提问次数
max_times = int(os.getenv("CHATGPT_MAX_TIMES", 50))
# openai key
openai_key = os.getenv("OPENAI_KEY", "")
