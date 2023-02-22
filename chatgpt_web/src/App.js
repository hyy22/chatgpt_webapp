import './App.css';
import QaList from './components/QaList';
import PromptInput from './components/PromptInput';
import QaEmpty from './components/QaEmpty';
import { createRef, useEffect, useState } from 'react';
import { initDB, findAllRows, insertRows } from './utils/indexeddb';
import useMessage from './hooks/message';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

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
					return '<pre class="hljs"><code>' +
                 hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                 '</code></pre>';
				// eslint-disable-next-line no-empty
				} catch (e) {}
			}
			return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
		}
	});
	return md.render(s);
}

function App() {
	const [qaList, setQaList] = useState([]);
	const [prompt, setPrompt] = useState('');
	const { loading, answer } = useMessage(prompt, (val) => {
		const row = { q: prompt, a: parseMD(val), id: Date.now() };
		qaList.unshift(row);
		setQaList(qaList);
		insertQaRow(row);
	});
	const ref = createRef();
	// 提问
	function handleQaSubmit(val) {
		setPrompt(val);
		ref.current.scrollTop = 0;
	}
	// 获取历史数据
	async function fetchChatHistory() {
		if (!db) db = await openDB();
		const rows = await findAllRows(db, 'qaList');
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
	
	return (
		<div className="App">
			<div className="QaWrapper" ref={ref}>
				{/* 回复中的qa */}
				{
					loading && !!answer && <QaList list={[{ q: prompt, a: answer }]} />
				}
				{/* 之前存在qa */}
				{
					qaList.length > 0 && <QaList list={qaList} loading={loading} />
				}
				{/* 空状态 */}
				{
					qaList.length === 0 && !loading && <QaEmpty />
				}
			</div>
			{/* 提问框 */}
			<PromptInput loading={loading} onSubmit={handleQaSubmit}></PromptInput>
		</div>
	);
}

export default App;
