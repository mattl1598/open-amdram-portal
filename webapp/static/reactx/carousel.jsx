function Carousel5({photos, showTitle}) {
	const [currentOffset, setCurrentOffset] = React.useState(0)
	let count = 5
	let photoElems = []

	for (let i=0; i<photos.length; i++) {
		photoElems.push(
			<div className={"react-carousel-item"}
			     data-position={`${((i+currentOffset) % count)+1}`}
			     style={{gridArea: `${String.fromCharCode(64+((i+currentOffset) % count)+1)}`}}
			>
				<img id={`photo${i+currentOffset}`} src={photos[i]} alt={`Photo from ${showTitle}`}/>
			</div>
		)
	}

	function handleTransitionEnd() {
		setCurrentOffset(currentOffset + 1)
	}

	return (
		<div className={"react-carousel"}>
			<div className={`react-carousel-inner transition${["A", "B"][currentOffset % 2]}`}
			     onAnimationEnd={handleTransitionEnd}>
				{photoElems}
			</div>
		</div>
	)
}