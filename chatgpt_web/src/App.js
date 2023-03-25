import './App.css';
import QaItem from './components/QaItem';
import PromptInput from './components/PromptInput';
import QaEmpty from './components/QaEmpty';
import FixedButton from './components/FixedButton';
import { createRef, useEffect, useState } from 'react';
import { initDB, findAllRows, insertRows, clearRows } from './utils/indexeddb';
import useMessage from './hooks/message';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css';
import ClipboardJS from 'clipboard';
import useRequest from './hooks/request';
import { getDeviceId } from './utils/device';
import { Toast } from 'antd-mobile';
import config from './config';

let db;
const DB_NAME = 'chat_gpt_web';
const STORE_NAME = 'qaList';

// 初始化db并返回引用
function openDB() {
	return initDB(DB_NAME, [{ storeName: STORE_NAME, keyPath: 'id' }]);
}

// 解析markdown
function parseMD(s) {
	const md = new MarkdownIt({
		html: true,
		linkify: true,
		typographer: true,
		highlight: function (str, lang) {
			if (lang && hljs.getLanguage(lang)) {
				try {
					return '<pre class="hljs"><div class="code-wrapper"><button class="copy-btn">复制</button></div><code>' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
				// eslint-disable-next-line no-empty
				} catch (e) {}
			}
			return '<pre class="hljs"><div class="code-wrapper"><button class="copy-btn">复制</button></div><code>' + md.utils.escapeHtml(str) + '</code></pre>';
		}
	});
	return md.render(s);
}

/**
 * 初始化复制功能
 */
function copy() {
	new ClipboardJS('.copy-btn', {
		text: trigger => {
			return trigger.closest('.hljs').querySelector('code').innerText;
		}
	});
	// clipboard.destroy();
}
copy();

function App() {
	// 问题列表
	const [qaList, setQaList] = useState([]);
	// 当前提问内容
	const [prompt, setPrompt] = useState('');
	// 提问hook
	const { loading, isFinish: isFinishMessage, answer, error: messageError, fetchPrompt } = useMessage();
	// watch
	useEffect(() => {
		if (!isFinishMessage) return;
		// console.log('messageError', messageError);
		if (!messageError) {
			const row = { q: prompt, a: parseMD(answer), type: 'TEXT', id: Date.now() };
			insertQaRow(row);
			qaList.unshift(row);
			// 清空选择
			qaList.forEach(v => v.isCheck = false);
			setQaList(qaList);
			// 清空提问内容
			setPrompt('');
		}
	}, [isFinishMessage]);
	// http请求hook
	const { fetchFn, loading: requestLoading, isFinish: isFinishRequest, data, error: requestError } = useRequest();
	useEffect(() => {
		if (!isFinishRequest) return;
		if (requestError) {
			Toast.show(requestError?.message || requestError);
			return;
		}
		const { b64_json } = data?.data?.data?.[0] || {};
		const row = { q: prompt, a: `<img src="data:image/png;base64,${b64_json}" loading="lazy" />`, type: 'IMAGE', id: Date.now() };
		qaList.unshift(row);
		setQaList(qaList);
		insertQaRow(row);
		// 清空提问内容
		setPrompt('');
	}, [isFinishRequest]);
	const ref = createRef();
	// 提问
	function handleQaSubmit(val, type = 1) {
		setPrompt(val);
		// 文本
		if (type === 1) {
			let textQaList = qaList.filter(v => v.type === 'TEXT').reverse();
			let textQaCheckList = textQaList.filter(v => v.isCheck); // 被勾选的qa
			const messages = (textQaCheckList.length ? textQaCheckList : textQaList.slice(-(Math.min(config.maxMessage, textQaList.length)))).reduce((prev, cur) => {
				const { q, a } = cur;
				prev.push({ role: 'user', content: q });
				prev.push({ role: 'assistant', content: textQaCheckList.length || !config.maxMessageLength  ? a : a.slice(0, config.maxMessageLength) });
				return prev;
			}, []);
			fetchPrompt(val, messages);
		}
		// 绘画
		if (type === 2) {
			fetchFn({ url: '/imagen', params: { prompt: val, did: getDeviceId() }});
		}
		ref.current.scrollTop = 0;
	}
	// 获取历史数据
	async function fetchChatHistory() {
		if (!db) db = await openDB();
		const rows = await findAllRows(db, STORE_NAME);
		rows.forEach(v => v.isCheck = false);
		setQaList(rows.reverse());
	}
	// 添加记录
	async function insertQaRow(row) {
		if (!db) db = await openDB();
		insertRows(db, STORE_NAME, [row]);
	}
	useEffect(() => {
		fetchChatHistory();
	}, []);
	// 清空会话
	async function clearHistoryRows() {
		setQaList([]);
		if (!db) db = await openDB();
		clearRows(db, STORE_NAME);
	}

	return (
		<>
			<div className="App">
				<div className="QaWrapper" ref={ref}>
					{/* 回复中的qa */}
					{
						loading && !!answer && <QaItem item={{ q: prompt, a: parseMD(answer) }} />
					}
					{/* 之前存在qa */}
					{
						qaList.length > 0 && qaList.map(qa => (
							<QaItem item={qa} key={qa.id} onCheckChange={val => {
								qa.isCheck = val;
								setQaList([...qaList]);
							}} />
						))
					}
					{/* 空状态 */}
					{
						qaList.length === 0 && !loading && <QaEmpty />
					}
				</div>
				{/* 提问框 */}
				<PromptInput prompt={prompt} loading={loading} imgLoading={requestLoading} onSubmit={handleQaSubmit}></PromptInput>
			</div>
			{qaList.length > 0 && <FixedButton onClear={clearHistoryRows} />}
		</>
	);
}

export default App;
