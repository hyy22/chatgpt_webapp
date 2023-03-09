const config = {
	// base url
	// eslint-disable-next-line no-undef
	baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '/api',
	// 缓存前缀
	cachePrefix: '__chatgpt_web__',
	// 提供给chatgpt的最大对话次数，用来理解上下文，越大越准确，但是消耗tokens也越多，有可能会超出token限制
	maxMessage: 2,
	// 提供给chatgpt的每个消息最大长度
	maxMessageLength: 200,
};

export default config;