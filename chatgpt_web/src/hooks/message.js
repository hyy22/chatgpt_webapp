import { useEffect, useState } from 'react';
import { Toast } from 'antd-mobile';
import config from '../config';
import { getDeviceId } from '../utils/device';

export default function useMessage(prompt = '', onDone, onFail) {
	const [loading, setLoading] = useState(false);
	const [answer, setAnswer] = useState('');
	useEffect(() => {
		if (loading || !prompt.trim()) return;
		setLoading(true);
		setAnswer('');
		ask({
			prompt,
			onData: data => {
				setAnswer(data);
			},
			onDone: data => {
				setLoading(false);
				if (typeof onDone === 'function') onDone(data);
			},
			onFail: e => {
				setLoading(false);
				if (typeof onDone === 'function') onFail(e);
			}
		});
	}, [prompt]);
	return {
		loading,
		answer
	};
}

// 提问
function ask({ prompt, onData, onDone, onFail }) {
	let resp = '';
	const sse = new EventSource(`${config.sseBaseUrl}/ask?prompt=${encodeURIComponent(prompt)}&did=${getDeviceId()}`, { withCredentials: true });
	const handleMessage = e => {
		try {
			resp = JSON.parse(e.data).message;
		} catch (e) {
			resp = e.data;
		}
		if (typeof onData === 'function') onData(resp);
	};
	const handleDone = () => {
		// 如果拿不到响应就直接抛错
		if (!resp) return handleFail();
		sse.close();
		if (typeof onDone === 'function') onDone(resp);
	};
	const handleFail = e => {
		Toast.show(e?.data || '未知错误，请稍后重试');
		sse.close();
		if (typeof onFail === 'function') onFail(e?.data);
	};
	sse.addEventListener('message', handleMessage);
	sse.addEventListener('done', handleDone);
	sse.addEventListener('fail', handleFail);
	sse.addEventListener('error', handleFail);
	return function() {
		sse.removeEventListener('message', handleMessage);
		sse.removeEventListener('done', handleDone);
		sse.removeEventListener('fail', handleFail);
		sse.removeEventListener('error', handleFail);
	};
}