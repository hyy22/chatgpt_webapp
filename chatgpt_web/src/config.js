const config = {
	// base url
	// eslint-disable-next-line no-undef
	baseUrl: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '/api',
	// 缓存前缀
	cachePrefix: '__chatgpt_web__',
};

export default config;