function FaceDetection({content}) {
	const context = React.useContext(app)

	const [faces, setFaces] = React.useState([])
	const [faceForms, setFaceForms] = React.useState([])
	const [faceBoxes, setFaceBoxes] = React.useState([])
	const [i, setI] = React.useState(0)
	const [reRender, setReRender] = React.useState(false)

	const [members, setMembers] = React.useState([])

	const [nullFaces, setNullFaces] = React.useState([])

	React.useEffect(() => {
		let keys = Object.keys(content.members)
		let tempMembers = []
		for (let x = 0; x < keys.length; x++) {
			let key = keys[x]
			tempMembers.push({value: key, text: content.members[key].name, group: content.members[key].group})
		}
		setMembers(tempMembers)
	}, [])

	React.useEffect(()=>{
		fetch("/api/getSavedFaces", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				photoID: content.photos[i].id,
			})
		}).then((response) => {
			return response.json()
		}).then((data) => {
			setFaces(data)
			setFaceForms([])
			setFaceBoxes([])
		})
	}, [i, reRender])

	function FaceForm({face, j, idStart="faceID", isNullFace=false}) {
		let k = i
		if (isNullFace) {
			k = content.photos.findIndex((el)=>{return el.id === face.photo_id})
		}
		const photoWidth = content.photos[k].width
		const photoHeight = content.photos[k].height
		const bgPosX = content.photos[i].width - face.w === 0 ? '0%' : `${face.x / (content.photos[i].width - face.w) * -100}%`;
		const bgPosY = content.photos[i].height - face.h === 0 ? '0%' : `${face.y / (content.photos[i].height - face.h) * -100}%`;

		let faceStyle = {
			position: "absolute",
			width: `${(photoWidth / face.w) * 100}%`,
			height: `${(photoHeight / face.h) * 100}%`,

			top: `-${(face.y / face.h) * 100}%`,
			left: `-${(face.x / face.w) * 100}%`,
		}
		
		function saveFace() {
			fetch("/api/setFaceMember", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					faceID: face.id,
					memberID: document.getElementById(`${idStart}${j}`).value,
				})
			})
		}

		function deleteFace() {
			fetch("/api/deleteFace", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					faceID: face.id,
				})
			}).then(() => {
				setReRender(!reRender)
			})
		}
		
		return (
			<div className="faceForm" style={{order: face.x}}>
				<div className="face">
					<img style={faceStyle} src={`/photo_new/${face.photo_id}`} alt="Cropped face"/>
				</div>
				<Select
					id={`${idStart}${j}`} placeholder={"Select Member"} create={false}
					setSelected={(v)=>{}} maxItems={1}
					selected={face.member_id || ""} options={members}
					optgroups={[{value: "cast", label: "Cast"}, {value: "crew", label: "Crew"}]}>
				</Select>
				<div className="buttons">
					<Input type={"button"} onClick={saveFace}><Icon>save</Icon></Input>
					<Input type={"button"} onClick={deleteFace}><Icon>delete</Icon></Input>
				</div>
			</div>
		)
	}

	function detectFaces(e, fullRes=false) {
		fetch(`/api/face_detection/analyse${fullRes ? "?fullRes=true" : ""}`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				photoID: content.photos[i].id,
			})
		}).then(()=>{
			setReRender(!reRender)
			// context.functions.refresh(false)
		})
	}

	React.useEffect(() => {
		let tempFaceForms = []
		let tempFaceBoxes = []
		let width = content.photos[i].width
		let height = content.photos[i].height
		for (let j=0; j<faces.length; j++) {
			tempFaceForms.push(
				<FaceForm key={j} j={j} idStart={"faceID"} face={faces[j]}></FaceForm>
			)
			tempFaceBoxes.push(
				<div key={`${i}_${j}`} className={"face_marker_outer"} style={
					{
						left: `${100*faces[j].x/width}%`,
						top: `${100*faces[j].y/height}%`
					}
				}
				>
					<div className="face_marker" style={
						{
							width: `${100*faces[j].w/width}%`,
							height: `${100*faces[j].h/height}%`
						}
					}>
					</div>
				</div>
			)
		}
		setFaceForms(tempFaceForms)
		setFaceBoxes(tempFaceBoxes)
	}, [faces])

	function prev() {
		// console.log(content.photos.length)
		// console.log((i - 1 + content.photos.length) % content.photos.length)
		setI((i - 1 + content.photos.length) % content.photos.length)
	}

	function next() {
		setI((i + 1) % content.photos.length)
	}

	function getNullFaces() {
		fetch("/api/getNullFaces", {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				showID: content.showID
			})
		}).then((response) => {
			return response.json()
		}).then((data) => {
			let tempNullFaces = []
			for (let x=0; x<data.length; x++) {
				tempNullFaces.push(<FaceForm key={x} idStart={"NullFaceID"} face={data[x]} j={x} isNullFace={true}></FaceForm>)
			}
			setNullFaces(tempNullFaces)
		})
	}

	return (
		<div className="faceDetection">
			<h2>Face Detection</h2>
			<h3>{i}/{content.photos.length}</h3>
			<div className="null faces">
				<details>
					<summary onClick={getNullFaces}>Null Faces</summary>
					{ nullFaces }
				</details>
			</div>
			<div className="buttons">
				<Input type={"button"} onClick={prev}>Prev</Input>
				<Input type={"button"} onClick={detectFaces}>Detect Faces</Input>
				<Input type={"button"} onClick={(e)=>{detectFaces(e, true)}}>Detect FullRes</Input>
				<Input type={"button"} onClick={next}>Next</Input>
			</div>
			<div className={`faces ${reRender}`}>
				{faceForms}
			</div>
			<div className="img">
				<img style={{width: "100%"}} id={"imageID"}
				     src={`/photo_new/${content.photos[i].id}`} alt={content.photos[i].filename}
				     width={content.photos[i].width} height={content.photos[i].height}
				></img>
				{faceBoxes}
			</div>
		</div>
	)
}