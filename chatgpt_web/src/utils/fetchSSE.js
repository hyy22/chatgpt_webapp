function parseJSON(o) {
	try {
		o = JSON.parse(o);
	} catch (e) { /* empty */ }
	return o;
}

export default function fetchSSE({ url, data, onEvent }) {
	fetch(url, {
		method: 'POST',
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json',
		}
	}).then(response => {
		let decoder = new TextDecoder();
		const reader = response.body.getReader();
		let lastEvent = 'message';
		async function parseSSEResponse() {
			const { value, done } = await reader.read();
			if (done) return;
			const lines = decoder.decode(value).trim().split('\n');
			lines.forEach(line => {
				// 数据
				if (line.startsWith('data:')) {
					if (typeof onEvent === 'function') {
						let data = line.replace(/data:\s*?/, '');
						onEvent.call(null, { type: lastEvent, payload: parseJSON(data) });
					}
				} else if (line.startsWith('event:')) {
					lastEvent = line.replace(/event:\s*?/, '');
				}
			});
			parseSSEResponse();
		}
		parseSSEResponse();
	});
}
