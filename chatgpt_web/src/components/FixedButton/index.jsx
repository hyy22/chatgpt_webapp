import './index.css';
import { DeleteOutline } from 'antd-mobile-icons';
import { Dialog } from 'antd-mobile';

export default function FixedButton({ onClear }) {
	function handleClear() {
		Dialog.confirm({
			title: '确认',
			content: '确定清空会话记录？',
			onConfirm: () => {
				if (typeof onClear === 'function') onClear();
			}
		});
	}
	return (
		<div className='FixedButton'>
			<div className="clear-btn">
				<DeleteOutline onClick={handleClear} fontSize={24}  />
			</div>
		</div>  
	);
}