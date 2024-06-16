const md = new remarkable.Remarkable('full')

function Markdown({className="", content}) {
	return (
		<div className={className} dangerouslySetInnerHTML={{__html: md.render(content)}}></div>
	)
}