// import { Icon } from "./icon"

// const dims = [...imageDims]
const lazyLoadDistance = 5
const gallery = document.getElementById('gallery')

if (gallery) {
	const root = ReactDOM.createRoot(gallery)
	root.render(<Gallery imageLinks={galleryImages}/>)
}


function Gallery({imageLinks, faces={}, type="images"}) {
	const [showFaces, setShowFaces] = React.useState(false)
	const images = []

	for (let i = 0; i <imageLinks.length; i++) {
		let classname = "img-hidden"
		let load = false
		let shown = false
		if (i === 0) {
			classname = ""
			shown = true
		}
		if (i < 0 + lazyLoadDistance || i > imageLinks.length - 0 - lazyLoadDistance){
			load = true
		}
		if (type === "images"){
			images.push(<Image faces={faces[imageLinks[i].id]} src={imageLinks[i].src} showFaces={showFaces} shown={shown} width={imageLinks[i].width} height={imageLinks[i].height} key={i} i={i} alt={"Test"} className={classname} load={load} inGallery={true}></Image>)
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

			tagsCopy[oldNum] = <Image {...tagsCopy[oldNum].props} showFaces={showFaces} key={oldNum} className={"img-hidden"} shown={false}></Image>
			tagsCopy[newNum] = <Image {...tagsCopy[newNum].props} showFaces={showFaces} key={newNum} className={""} shown={true}></Image>
			tagsCopy[loadNum] = <Image {...tagsCopy[loadNum].props} showFaces={showFaces} key={loadNum} load={true}></Image>
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

	function toggleFaces() {
		console.log(!showFaces, "toggle faces")
		setShowFaces(!showFaces)
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
					<div className={`gallery-images ${showFaces ? "faces" : ""}`} key={"gallery-images"}
					     ref={imagesRef}
					     onTouchStart={(event) => handleTouchStart(event)}
					     onTouchMove={(event) => handleZoom(event)}
					     onTouchEnd={(event) => handleTouchEnd(event)}
					>
						{ imageTags }
					</div>
					<div className={"gallery-controls"}>
						<div className="arrow faces" onClick={toggleFaces}><Icon>{showFaces ? "face_retouching_off" : "face"}</Icon></div>
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

function Image({src, alt, className, i, load=true, shown=true, showFaces=false, width, height, inGallery=false, title="", faces=[]}) {
	let elemSrc = ""

	const [faceMarkers, setFaceMarkers] = React.useState([])
	const markersRef = React.useRef([]);

	if (load) {
		elemSrc = src
	}

    React.useEffect(() => {
       markersRef.current = markersRef.current.slice(0, faces.length);
    }, [faces]);

	React.useEffect(() => {
		if(faces.length > 0){
			let markers = []
			for (let i = 0; i < faces.length; i++) {
				markers.push(
					<div key={i} ref={el => markersRef.current[i] = el} className={"face_marker_outer"} style={
						{
							left: `${100 * faces[i].x / width}%`,
							top: `${100 * faces[i].y / height}%`
						}
					}
					>
						<div className="face_marker" style={
							{
								width: `${100 * faces[i].w / width}%`,
								height: `${100 * faces[i].h / height}%`
							}
						}>

						</div>
						<div className="name" style={
							{
								left: `${(100 * faces[i].w / width) / 2}%`,
								top: "0px"
							}
						}>
							<span>{faces[i].name}</span>
						</div>
					</div>
				)
			}
			setFaceMarkers(markers)
		}
	}, [])

	React.useLayoutEffect(() => {
		if (shown) {
			console.log("shown")
		}
		if (showFaces) {
			console.log("showFaces")
		}
	    if (faces.length > 0 && markersRef.current.length > 0 && shown && showFaces) {
	        // Get all name elements with their face data
	        const nameElementsWithData = markersRef.current.map(marker => {
	            const nameEl = marker?.querySelector('.name');
	            const nameText = nameEl?.querySelector('span')?.textContent;
	            return nameEl ? {
	                element: nameEl,
	                name: nameText,
	                rect: nameEl.getBoundingClientRect()
	            } : null;
	        }).filter(Boolean);

	        // Check for overlaps
	        const overlaps = [];
	        nameElementsWithData.forEach((item1, index) => {
				console.log(item1.rect)
	            nameElementsWithData.forEach((item2, otherIndex) => {
	                if (index < otherIndex) { // Check each pair only once
	                    const rect1 = item1.rect;
	                    const rect2 = item2.rect;

	                    if (!(rect1.right < rect2.left ||
	                        rect1.left > rect2.right ||
	                        rect1.bottom < rect2.top ||
	                        rect1.top > rect2.bottom)) {

	                        overlaps.push({
	                            name1: item1.name,
		                        element1: item1.element,
		                        rect1: item1.rect,
	                            name2: item2.name,
		                        element2: item2.element,
		                        rect2: item2.rect,
	                        });
	                    }
	                }
	            });
	        });

	        // Log overlapping pairs
	        if (overlaps.length > 0) {
	            console.log('Overlapping name labels detected:');
	            overlaps.forEach(pair => {
	                console.log(`- "${pair.name1}" overlaps with "${pair.name2}"`);
					if (pair.rect1.top > pair.rect2.top) {
						pair.element1.style.top = pair.rect2.height - Math.abs(pair.rect2.top - pair.rect1.top) + 2 + pair.element1.style.top
					} else {
						pair.element2.style.top = pair.rect1.height - Math.abs(pair.rect1.top - pair.rect2.top) + 2 + pair.element2.style.top
					}
	            });
	        }
	    }
	}, [shown, showFaces]);


	if (inGallery){
		return (
			<div key={"div" + i} style={{aspectRatio: width/height}}>
				<div className={`img ${className}`} style={{aspectRatio: width/height}}>
					<img src={elemSrc} width={width} height={height} alt={alt} key={i}></img>
					<div className="face_markers" style={{aspectRatio: width/height}}>{faceMarkers}</div>
				</div>
			</div>
		)
	} else {
		return (
			<img src={elemSrc} width={width} height={height} alt={alt} key={i}
			     className={className} title={title}>
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