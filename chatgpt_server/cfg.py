import os

# access token
access_token = os.getenv("CHATGPT_ACCESS_TOKEN", "")
# 会话周期
check_period = int(os.getenv("CHATGPT_CHECK_PERIOD", 86400))
# 最多提问次数
max_times = int(os.getenv("CHATGPT_MAX_TIMES", 50))
