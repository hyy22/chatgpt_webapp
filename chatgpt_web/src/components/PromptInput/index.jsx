import './index.css';
import { TextArea, Button } from 'antd-mobile';
import { useState } from 'react';

export default function PromptInput({ onSubmit, loading }) {
	const [value, setValue] = useState('');
	function handleBtnClick() {
		if (!loading && typeof onSubmit === 'function') onSubmit(value);
		setValue('');
	}
	return (
		<div className="PromptInput">
			<TextArea
				value={value}
				onChange={setValue}
				className="PromptInput-ipt"
				placeholder='请输入问题'
				autoSize></TextArea>
			<Button loading={loading} onClick={handleBtnClick} className='PromptInput-btn' color='primary'>发送</Button>
		</div>
	);
}