import './index.css';
import 'github-markdown-css';
import { Checkbox } from 'antd-mobile';
import { SmileFill, SmileOutline } from 'antd-mobile-icons';

export default function QaItem({ item, onCheckChange }) {
	return (
		<div className="QaItem">
			<div className="qaItem-q">
				<div className="qaItem-q--text">
					{
						item.type === 'TEXT' ? 
							<Checkbox
								checked={item.isCheck}
								icon={
									checked =>
										checked ? (
											<SmileFill style={{ color: 'var(--adm-color-primary)' }} />
										) : (
											<SmileOutline style={{ color: 'var(--adm-color-weak)' }} />
										)
								}
								onChange={val => onCheckChange(val)}>
								<span>{item.q}</span>
							</Checkbox> :
							<span>{item.q}</span>
					}
				</div>
			</div>
			<div className="qaItem-a">
				<div className="markdown-body" dangerouslySetInnerHTML={{
					__html: item.a
				}}></div>
			</div>
		</div>
	);
}