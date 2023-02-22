import './index.css';
import 'github-markdown-css';

export default function QaList({ list = [] }) {
	return (
		<div className="QaList">
			{
				list.map((v, i) => (
					<div className="QaItem" key={i}>
						<div className="qaItem-q">Q: {v.q}</div>
						<div className="qaItem-a">
							<div className="markdown-body" dangerouslySetInnerHTML={{
								__html: v.a
							}}></div>
						</div>
					</div>
				))
			}
		</div>
	);
}