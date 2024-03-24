// import { Icon } from "./icon"

// const dims = [...imageDims]
const lazyLoadDistance = 5
const root = ReactDOM.createRoot(document.getElementById('gallery'))
root.render(<Gallery/>)

const images = []
for (let i = 0; i <galleryImages.length; i++) {
	let classname = "img-hidden"
	let load = false
	if (i === 0) {
		classname = ""
	}
	if (i < 0 + lazyLoadDistance || i > galleryImages.length - 0 - lazyLoadDistance){
		load = true
		console.log(i)
	}
	images.push(<Image src={galleryImages[i][0]} width={galleryImages[i][1]} height={galleryImages[i][2]} key={i} i={i} alt={"Test"} className={classname} load={load}></Image>)
}

function Gallery() {
	const [imgNum, setImgNum] = React.useState(0)
	const [imageTags, setImageTags] = React.useState(images)
	const [fullscreen, setFullscreen] = React.useState(false)


	// const max_dims =

	function changeImage(incr) {
		let oldNum = wrapImgNum(imgNum)
		let newNum = wrapImgNum(imgNum + incr)
		let loadNum = wrapImgNum(imgNum + incr*lazyLoadDistance)
		let tagsCopy = [...imageTags]

		tagsCopy[oldNum] = <Image {...tagsCopy[oldNum].props} key={oldNum} className={"img-hidden"}></Image>
		tagsCopy[newNum] = <Image {...tagsCopy[newNum].props} key={newNum} className={""}></Image>
		tagsCopy[loadNum] = <Image {...tagsCopy[loadNum].props} key={loadNum} load={true}></Image>
		setImgNum(newNum)
		setImageTags([...tagsCopy])
	}

	function wrapImgNum(i) {
		if (i < 0) {
			return wrapImgNum(imageTags.length + i)
		} else {
			return i % imageTags.length
		}
	}

	function toggleFullscreen() {
		setFullscreen(!fullscreen)
	}

	return (
		<div className={"gallery-container " + ["", "fullscreen"][fullscreen*1]}>
			<div className="gallery-images" key={"gallery-images"}>
				{ imageTags }
			</div>
			<div className={"gallery-controls"}>
				<div className="arrow" key={"gallery-arrow1"} onClick={() => changeImage(-1)}>{"<"}</div>
				<div className="counter" key={"gallery-counter"}>{imgNum + 1}/{imageTags.length}</div>
				<div className="arrow" key={"gallery-arrow2"} onClick={() => changeImage(1)}>></div>
				<div className="arrow fullscreen" key={"gallery-fullscreen"} onClick={toggleFullscreen}>
					<Icon icon={["fullscreen", "fullscreen_exit"][fullscreen * 1]}></Icon>
				</div>
			</div>
		</div>
	)
}

function Image({src, alt, className, i, load, width, height}) {
	let elemSrc = ""

	function refreshImage(e) {
		if (load && !e.target.src.includes("?refresh")) {
			e.target.src = e.target.src + "?refresh"
		}
	}

	if (load) {
		elemSrc = src
	}

	return (
		<div key={"div" + i}>
			<img src={elemSrc} width={width} height={height} alt={alt} key={i} className={className}
			     onError={refreshImage}></img>
		</div>
	)
}