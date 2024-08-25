// TODO LIST
// TODO: refresh page on error unless recently refreshed.

function getID(a) {
	for(var b=65521,c=1,d=0,e=0,f;f=a.charCodeAt(e++);d=(d+c)%b)c=(c+f)%b;return(d<<16)|c
}

const md = new remarkable.Remarkable('full')

md.inline.ruler.enable([
	'footnote_inline',
	'ins',
	'mark',
	'sub',
	'sup'
])

function MarkdownMedia({i, src, alt, title}) {
	if (RegExp("/video/").test(src)) {
		return (
			<Video i={i} src={src} alt={alt} title={title}></Video>
		)
	} else {
		return (
			<Image i={i} src={src} alt={alt} title={title}></Image>
		)
	}
}

function preRenderMD(array=[]) {
	let output = []
	let openRegex = RegExp("(.*)_open$")
	let closeRegex = RegExp("(.*)_close$")
	let skipTo = 0
	for (let i = 0; i < array.length; i++) {
		if (i >= skipTo) {
			let item = array[i]
			let level = item.level
			let open_match = openRegex.exec(item.type)
			let copy = {...item}
			delete copy["level"]
			delete copy["lines"]
			delete copy["type"]
			delete copy["tight"]
			delete copy["children"]
			if (open_match) {
				for (let j = i + 1; j < array.length; j++) {
					let close_match = closeRegex.exec(array[j].type)
					if (close_match && open_match[1] === close_match[1] && array[j].level === level) {
						skipTo = j+1
						output.push({
							type: open_match[1],
							children: preRenderMD(array.slice(i + 1, j)),
							...copy
						})
						break
					}
				}
			} else if (item.type === "inline") {
				output.push(...preRenderMD(item.children))
			} else {
				if (item.children) {
					output.push({
						type: item.type,
						...copy,
						children: preRenderMD(item.children)
					})
				} else {
					output.push({
						type: item.type,
						...copy
					})
				}
			}
		}
	}

	return output
}

function codeCopy(codeId) {
	navigator.clipboard.writeText(document.getElementById(codeId).innerText)
}

function renderMD(array=[]) {
	let output = []
	let checked_box = RegExp("^\\[[xX]\\]")
	let unchecked_box = RegExp("^(\\[\\]|\\[ \\])")
	const tagTranslations = {
		paragraph: "p",
		ordered_list: "ol",
		bullet_list: "ul",
		list_item: "li",
		link: "a"
	}
	for (let i = 0; i < array.length; i++) {
		let item = array[i]
		let tag = item.type
		let props = {...item}
		props.className = props.class
		delete props["class"]
		delete props["type"]
		delete props["children"]
		if (item.type === "heading") {
			tag = "h" + item.hLevel
			delete props["hLevel"]
		} else if (item.type === "text") {
			output.push(item.content)
			tag = ""
		} else if (item.type === "list_item") {
			if (item.children[0].type === "paragraph" && item.children[0].children[0].type === "text") {
				if (item.children[0].children[0].content.match(checked_box)) {
					item.children[0].class = "task_list_item"
					item.children[0].children[0].content = item.children[0].children[0].content.replace(checked_box, "")
					item.children[0].children.unshift({type: "checkbox", checked: true})
				} else if (item.children[0].children[0].content.match(unchecked_box)) {
					item.children[0].class = "task_list_item"
					item.children[0].children[0].content = item.children[0].children[0].content.replace(unchecked_box, "")
					item.children[0].children.unshift({type: "checkbox", checked: false})
				}
			}
		} else if (item.type === "checkbox") {
			tag = ""
			output.push(<input className={"task_list_checkbox"} type="checkbox" disabled defaultChecked={item.checked}/>)
		} else if (item.type === "image") {
			tag = ""
			output.push(<MarkdownMedia i={item.src} src={item.src} alt={item.alt} title={item.title}></MarkdownMedia>)
		} else if (item.type === "code" || item.type === "fence") {
			tag = ""
			if (item.block || item.type === "fence") {
				let codeId = getID(String(item.content))
				output.push(
					<pre key={`${codeId}_pre`}>
						<div className={"code_header"}>
							<span className={"code_language"}>{item.params}</span>
							<span className="copy_button" onClick={()=>{codeCopy(codeId)}}>
								<span className={"copy"}>📋 Copy</span>
								<span className={"copied"}>Copied!</span>
							</span>
						</div>
						<code key={codeId} id={codeId}>{item.content}</code>
					</pre>
				)
			} else {
				output.push(<code key={`output_${output.length}_${String(item.content).slice(0,10)}`}>{item.content}</code>)
			}
		} else if (item.type === "footnote_ref") {
			tag = ""
			let id
			if (!item.subId) {
				id = `ref-${item.id+1}`
			} else {
				id = `ref-${item.id+1}-${item.subId+1}`
			}
			output.push(
				<sup key={`footref_${item.id+1}`} id={id}>
					<a href={`#footnote-${item.id+1}`} key={`#footnote-${item.id+1}`}>{item.id + 1}</a>
				</sup>
			)
		} else if (item.type === "footnote_block") {
			tag = ""
			output.push(
				<section className={"footnotes"} key={"#footnote-block"}>
					<h3>Footnotes</h3>
					<ol>
						{renderMD(item.children)}
					</ol>
				</section>
			)
		} else if (item.type === "footnote") {
			tag = ""
			let id
			if (!item.subId) {
				id = `footnote-${item.id+1}`
			} else {
				id = `footnote-${item.id+1}-${item.subId+1}`
			}
			output.push(
				<li key={id} id={id}>
					<div className="marker"></div>
					<div className="content">
						{renderMD(item.children)}
					</div>
				</li>
			)
		} else if (item.type === "footnote_anchor") {
			tag = ""
			let dest
			let label
			let sup = []
			if (!item.subId) {
				dest = `#ref-${item.id+1}`
				label = `Back to reference ${item.id+1}`
			} else {
				dest = `#ref-${item.id+1}-${item.subId+1}`
				label = `Back to reference ${item.id+1}-${item.subId+1}`
				sup.push(<sup key={`${dest}_sup`}>{item.subId+1}</sup>)
			}
			output.push(
				<a href={dest} key={dest} aria-label={label}>↩{sup}</a>
			)
		} else if (item.type === "hardbreak" || item.type === "softbreak") {
			tag = ""
			output.push(" ")
		}
		if (Object.keys(tagTranslations).includes(item.type)) {
			tag = tagTranslations[item.type]
		}

		if (tag !== "") {
			output.push(React.createElement(
				tag,
				{...props, key: `output_${output.length}_${String(item.content).slice(0,10)}`},
				...renderMD(item.children)
			))
		}
	}
	return output
}

function Markdown({className="", content}) {
	let parsed = md.parse(content, {})
	let preRendered = preRenderMD(parsed)
	let rendered = renderMD(preRendered)
	return (
		<div className={`markdown ${className}`}>
			{rendered}
		</div>
	)
}