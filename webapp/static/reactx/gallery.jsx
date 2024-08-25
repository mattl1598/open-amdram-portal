// import { Icon } from "./icon"

// const dims = [...imageDims]
const lazyLoadDistance = 5
const gallery = document.getElementById('gallery')

if (gallery) {
	const root = ReactDOM.createRoot(gallery)
	root.render(<Gallery imageLinks={galleryImages}/>)
}


function Gallery({imageLinks, type="images"}) {
	const images = []

	for (let i = 0; i <imageLinks.length; i++) {
		let classname = "img-hidden"
		let load = false
		if (i === 0) {
			classname = ""
		}
		if (i < 0 + lazyLoadDistance || i > imageLinks.length - 0 - lazyLoadDistance){
			load = true
		}
		if (type === "images"){
			images.push(<Image src={imageLinks[i][0]} width={imageLinks[i][1]} height={imageLinks[i][2]} key={i} i={i} alt={"Test"} className={classname} load={load} inGallery={true}></Image>)
		} else if (type === "videos") {
			images.push(<Video src={imageLinks[i][0]} key={i} className={classname} i={i} inGallery={true}></Video>)
		}
	}

	const [imgNum, setImgNum] = React.useState(0)
	const [imageTags, setImageTags] = React.useState(images)
	const [fullscreen, setFullscreen] = React.useState(false)
	const galleryRef = React.createRef()
	const imagesRef = React.createRef()

	let swipeTouchStartX, swipeTouchStartY, swipeTouchStartT
	let pinchTouchStartAX, pinchTouchStartAY, pinchTouchStartBX, pinchTouchStartBY, tempZoom, tempOffsetX, tempOffsetY
	let currentZoom = 1
	let currentOffsetX = 0
	let currentOffsetY = 0

	React.useEffect(() => {
		if (galleryRef && fullscreen) {
			galleryRef.current.focus()
		}
	}, [galleryRef, fullscreen])

	// const max_dims =

	function changeImage(incr) {
		if (imageTags.length > 1) {
			let oldNum = wrapImgNum(imgNum)
			let newNum = wrapImgNum(imgNum + incr)
			let loadNum = wrapImgNum(imgNum + incr*lazyLoadDistance)
			let tagsCopy = [...imageTags]

			tagsCopy[oldNum] = <Image {...tagsCopy[oldNum].props} key={oldNum} className={"img-hidden"}></Image>
			tagsCopy[newNum] = <Image {...tagsCopy[newNum].props} key={newNum} className={""}></Image>
			tagsCopy[loadNum] = <Image {...tagsCopy[loadNum].props} key={loadNum} load={true}></Image>
			setImgNum(newNum)
			setImageTags([...tagsCopy])

			currentZoom = 1
			currentOffsetX = 0
			currentOffsetY = 0
			imagesRef.current.style.transform = `scale(${currentZoom}) translate(${Math.trunc(currentOffsetX)}px, ${Math.trunc(currentOffsetY)}px)`
		}
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
		if (fullscreen) {
			document.exitFullscreen().then()
		} else {
			document.body.requestFullscreen().then()
		}
	}

	function handleKeyPress(event) {
		let keyMap = {ArrowLeft: -1, ArrowRight: 1}
		if (Object.keys(keyMap).includes(event.key)) {
			changeImage(keyMap[event.key])
		}
	}

	function handleTouchStart(e) {
		if (e.touches.length === 1) {
			swipeTouchStartX = e.touches[0].pageX
			swipeTouchStartY = e.touches[0].pageY
			swipeTouchStartT = e.timeStamp
		} else if (e.touches.length === 2) {
			[swipeTouchStartX, swipeTouchStartY, swipeTouchStartT] = [undefined, undefined, undefined]

			pinchTouchStartAX = e.touches[0].pageX
			pinchTouchStartAY = e.touches[0].pageY
			pinchTouchStartBX = e.touches[1].pageX
			pinchTouchStartBY = e.touches[1].pageY
		}
	}

	function handleTouchEnd(e) {
		if (swipeTouchStartX && swipeTouchStartY && swipeTouchStartT) {
			let changeX = e.changedTouches[0].pageX - swipeTouchStartX
			let changeY = e.changedTouches[0].pageY - swipeTouchStartY
			let changeT = e.timeStamp - swipeTouchStartT

			let direction = changeX / Math.abs(changeX)
			let swipeFraction = Math.abs(changeX) / e.view.innerWidth
			if (swipeFraction/changeT > 0.001) {
				changeImage(direction * -1)
			}
		}
		[swipeTouchStartX, swipeTouchStartY, swipeTouchStartT] = [undefined, undefined, undefined]
		currentZoom = tempZoom
		currentOffsetX = tempOffsetX
		currentOffsetY = tempOffsetY
	}

	function handleZoom(e) {
		if (e.touches.length === 2){
			// calculate zoom
			let startZoomDistance = Math.sqrt((pinchTouchStartAX - pinchTouchStartBX)**2 + (pinchTouchStartAY - pinchTouchStartBY)**2)
			let nowZoomDistance = Math.sqrt((e.touches[0].pageX - e.touches[1].pageX)**2 + (e.touches[0].pageY - e.touches[1].pageY)**2)
			tempZoom = currentZoom * nowZoomDistance/startZoomDistance

			// calculate position
			tempOffsetX = (((e.touches[0].pageX - pinchTouchStartAX + e.touches[1].pageX - pinchTouchStartBX) / 4) + currentOffsetX)
			tempOffsetY = (((e.touches[0].pageY - pinchTouchStartAY + e.touches[1].pageY - pinchTouchStartBY) / 4) + currentOffsetY)

			// imagesRef.current.style.transform = `scale(${tempZoom})`
			imagesRef.current.style.transform = `scale(${tempZoom}) translate(${Math.trunc(tempOffsetX)}px, ${Math.trunc(tempOffsetY)}px)`
		}
	}
	if (type === "images") {
		return (
			<React.Fragment>
				<div
					ref={galleryRef}
				     tabIndex={-1}
				     className={"gallery-container " + ["", "fullscreen"][fullscreen*1]}
				     onKeyUpCapture={(e) => handleKeyPress(e)}
				>
					<div className="gallery-images" key={"gallery-images"}
					     ref={imagesRef}
					     onTouchStart={(event) => handleTouchStart(event)}
					     onTouchMove={(event) => handleZoom(event)}
					     onTouchEnd={(event) => handleTouchEnd(event)}
					>
						{ imageTags }
					</div>
					<div className={"gallery-controls"}>
						<div className="arrow" key={"gallery-arrow1"} onClick={() => changeImage(-1)}>{"<"}</div>
						<div className="counter" key={"gallery-counter"}><span>{imgNum + 1}</span><span>/{imageTags.length}</span></div>
						<div className="arrow" key={"gallery-arrow2"} onClick={() => changeImage(1)}>></div>
						<div className="arrow fullscreen" key={"gallery-fullscreen"} onClick={toggleFullscreen}>
							<Icon icon={["fullscreen", "fullscreen_exit"][fullscreen * 1]}></Icon>
						</div>
					</div>
				</div>
				<p className={"mobile-instructions"}>Pinch to zoom and pan, swipe to navigate between images.</p>
			</React.Fragment>
		)
	} else if (type === "videos") {
		return (
			<React.Fragment>
				<div
					ref={galleryRef}
					tabIndex={-1}
					className={"gallery-container " + ["", "fullscreen"][fullscreen * 1]}
					onKeyUpCapture={(e) => handleKeyPress(e)}
				>
					<div className="gallery-images" key={"gallery-images"}
					     ref={imagesRef}
					>
						{imageTags}
					</div>
					<div className={"gallery-controls"}>
						<div className="arrow" key={"gallery-arrow1"} onClick={() => changeImage(-1)}>{"<"}</div>
						<div className="counter" key={"gallery-counter"}>
							<span>{imgNum + 1}</span><span>/{imageTags.length}</span></div>
						<div className="arrow" key={"gallery-arrow2"} onClick={() => changeImage(1)}>></div>
						<div className="arrow fullscreen" key={"gallery-fullscreen"} onClick={toggleFullscreen}>
							<Icon icon={["fullscreen", "fullscreen_exit"][fullscreen * 1]}></Icon>
						</div>
					</div>
				</div>
			</React.Fragment>
		)
	}
}

function Image({src, alt, className, i, load=true, width, height, inGallery=false, title=""}) {
	let elemSrc = ""

	function refreshImage(e) {
		if (load && !e.target.src.includes("?refresh")) {
			e.target.src = e.target.src + "?refresh"
		}
	}

	if (load) {
		elemSrc = src
	}

	if (inGallery){
		return (
			<div key={"div" + i}>
				<img src={elemSrc} width={width} height={height} alt={alt} key={i} className={className}
				     onError={refreshImage}></img>
			</div>
		)
	} else {
		return (
			<img src={elemSrc} width={width} height={height} alt={alt} key={i}
			     className={className} onError={refreshImage} title={title}>
			</img>
		)
	}

}

function Video({src, className, i, alt="", inGallery=false}) {
	function refreshVideo(e) {
		if (!e.target.src.includes("?refresh")) {
			e.target.src = e.target.src + "?refresh"
		}
	}
	if (inGallery) {
		return (
			<div key={"div" + i}>
				<video width={"100%"} alt={alt} controls className={className} onError={refreshVideo}>
					<source src={src} type={"video/mp4"}></source>
				</video>
			</div>
		)
	} else {
		return (
			<video key={i} width={"100%"} alt={alt} controls className={className} onError={refreshVideo}>
				<source src={src} type={"video/mp4"}></source>
			</video>
		)
	}
}
