import { useState } from 'react';
import config from '../config';

export default function useRequest() {
	const [loading, setLoading] = useState(false);
	const [isFinish, setFinish] = useState(false);
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	async function fetchFn({ url, params, method = 'POST' }) {
		if (loading) return;
		setFinish(false);
		setLoading(true);
		url = url.startsWith('http') ? url : `${config.baseUrl}${url}`;
		let resp;
		try {
			let postData = '';
			let paramString = (new URLSearchParams(params)).toString();
			if (method.toUpperCase() === 'GET') {
				url += (url.indexOf('?') > -1 ? '&' : '?') + paramString;
			} else {
				postData = paramString;
			}
			resp = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: postData,
			}).then(response => response.json());
			setData(resp);
		} catch (e) {
			setError(e);
			return;
		} finally {
			setLoading(false);
			setFinish(true);
		}
	}
	return {
		fetchFn,
		loading,
		isFinish,
		data,
		error
	};
}