import './index.css';
import { TextArea, Button } from 'antd-mobile';
import { useEffect, useState } from 'react';

export default function PromptInput({ prompt, onSubmit, loading, imgLoading }) {
	const [value, setValue] = useState('');
	useEffect(() => {
		setValue(prompt);
	}, [prompt]);
	function handleBtnClick(type) {
		if (!loading && typeof onSubmit === 'function') onSubmit(value, type);
	}
	return (
		<div className="PromptInput">
			<TextArea
				value={value}
				onChange={setValue}
				className="PromptInput-ipt"
				placeholder='请输入问题'
				autoSize></TextArea>
			<Button loading={loading} onClick={() => handleBtnClick(1)} className='PromptInput-btn' color='primary'>提问</Button>
			<Button loading={imgLoading} onClick={() => handleBtnClick(2)} className='PromptInput-btn'>绘画</Button>
		</div>
	);
}