import cache from './cache';

// 生成首位不为0的15位随机数
function createDeviceId() {
	const deviceId = Math.ceil(Math.random() * 9) + Math.random().toString().slice(2, 16);
	// 写入本地
	cache.set('did', deviceId);
	return deviceId;
}

// 获取did
export function getDeviceId() {
	// 如果本地不存在did，则重新生成 did
	return cache.get('did') || createDeviceId();
}