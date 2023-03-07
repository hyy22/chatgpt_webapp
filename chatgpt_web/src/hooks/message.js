import { useState } from 'react';
import { Toast } from 'antd-mobile';
import config from '../config';
import { getDeviceId } from '../utils/device';
import fetchSSE from '../utils/fetchSSE';

export default function useMessage() {
	// 加载状态
	const [loading, setLoading] = useState(false);
	// 是否完成
	const [isFinish, setFinish] = useState(false);
	// 回答
	const [answer, setAnswer] = useState('');
	// 错误
	const [error, setError] = useState();
	// 加载方法
	async function fetchPrompt(prompt, messages = []) {
		if (loading) return;
		// 重置
		setError(null);
		setFinish(false);
		setLoading(true);
		setAnswer('');
		ask({
			prompt,
			messages,
			onData: data => {
				setAnswer(data);
			},
			onDone: () => {
				setLoading(false);
				setFinish(true);
			},
			onFail: e => {
				setError(e);
				setLoading(false);
				setFinish(true);
			}
		});
	}
	return {
		loading,
		isFinish,
		answer,
		error,
		fetchPrompt,
	};
}

// 提问
function ask({ prompt, messages = [], onData, onDone, onFail }) {
	let resp = '';
	const handleMessage = payload => {
		resp += payload.text;
		if (typeof onData === 'function') onData(resp);
	};
	const handleFail = payload => {
		const errorMsg = payload || '未知错误，请稍后重试';
		Toast.show(errorMsg);
		if (typeof onFail === 'function') onFail(errorMsg);
	};
	const handleDone = () => {
		// 如果拿不到响应就直接抛错
		if (!resp) return handleFail();
		if (typeof onDone === 'function') onDone(resp);
	};
	fetchSSE({
		url: `${config.baseUrl}/ask`,
		data: {
			prompt,
			did: getDeviceId(),
			messages,
		},
		onEvent({ type, payload }) {
			if (type === 'fail') {
				handleFail(payload);
			} else if (type === 'message') {
				handleMessage(payload);
			} else if (type === 'done') {
				handleDone();
			}
		}
	});
}