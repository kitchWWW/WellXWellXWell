import * as THREE from '/three.js/build/three.module.js';
import {
	Refractor
} from '/three.js/examples/jsm/objects/Refractor.js';
import {
	PointerLockControls
} from '/three.js/examples/jsm/controls/PointerLockControls.js';
import {
	WaterRefractionShader
} from '/three.js/examples/jsm/shaders/WaterRefractionShader.js';


let camera, scene, controls, skygeometry;
let video, videoImage, videoImageContext, videoTexture;
let clock, renderer, refractor;
let preludeVibes, preludeGlock1;
let allBricks, allVideoMat, allVideos, allSounds;
let listener;

const objects = [];

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

init();
animate();

function init() {
	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
	camera.position.y = 10;

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xafffff);
	scene.fog = new THREE.Fog(0xffafff, 100, 750);



	skygeometry = new THREE.SphereGeometry(500, 60, 40);
	// invert the geometry on the x-axis so that all of the faces point inward
	skygeometry.scale(-1, 1, 1);
	skygeometry.rotateX(20);

	const skytexture = new THREE.TextureLoader().load('/res/starmap_g8k.jpg');
	const skymat = new THREE.MeshBasicMaterial({
		map: skytexture
	});

	const skymesh = new THREE.Mesh(skygeometry, skymat);

	scene.add(skymesh);



	// const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
	// light.position.set( 0.5, 1, 0.75 );
	// scene.add( light );

	controls = new PointerLockControls(camera, document.body);

	const blocker = document.getElementById('blocker');
	const instructions = document.getElementById('instructions');

	instructions.addEventListener('click', function() {
		controls.lock();
		// preludeVibes.play();
		// preludeGlock1.play();

		// probs not have it restart each time, but we'll get there
		goScore()
	});

	controls.addEventListener('lock', function() {

		instructions.style.display = 'none';
		blocker.style.display = 'none';

	});

	controls.addEventListener('unlock', function() {

		blocker.style.display = 'block';
		instructions.style.display = '';

	});

	scene.add(controls.getObject());

	const onKeyDown = function(event) {

		switch (event.code) {

			case 'ArrowUp':
			case 'KeyW':
				moveForward = true;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true;
				break;

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true;
				break;

			case 'ArrowRight':
			case 'KeyD':
				moveRight = true;
				break;

			case 'Space':
				if (canJump === true) velocity.y += 950;
				canJump = false;
				break;

		}

	};

	const onKeyUp = function(event) {

		switch (event.code) {

			case 'ArrowUp':
			case 'KeyW':
				moveForward = false;
				break;

			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = false;
				break;

			case 'ArrowDown':
			case 'KeyS':
				moveBackward = false;
				break;

			case 'ArrowRight':
			case 'KeyD':
				moveRight = false;
				break;

		}

	};

	document.addEventListener('keydown', onKeyDown);
	document.addEventListener('keyup', onKeyUp);

	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

	// floor

	let floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
	floorGeometry.rotateX(-Math.PI / 2);

	const floorMaterial = new THREE.MeshBasicMaterial({
		color: 0x121218
	});

	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	scene.add(floor);


	// create an AudioListener and add it to the camera
	listener = new THREE.AudioListener();
	camera.add(listener);


	// // WORKING DO NOT DELETE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


	// // create the PositionalAudio object (passing in the listener)
	// const sound = new THREE.PositionalAudio( listener );

	// // load a sound and set it as the PositionalAudio object's buffer
	// const audioLoader = new THREE.AudioLoader();
	// audioLoader.load( '/res/music2.wav', function( buffer ) {
	// 	sound.setVolume(0);
	// 	sound.setBuffer( buffer );
	// 	sound.setLoop( true );
	// 	sound.setRefDistance(1);
	// 	sound.play();
	// });

	// // create an object for the sound to play from
	// const sphere = new THREE.CylinderGeometry( 2, 2, 1, 32);
	// const material = new THREE.MeshPhongMaterial( { color: 0x452A2A } );
	// const mesh = new THREE.Mesh( sphere, material );
	// scene.add( mesh );

	// // finally add the sound to the mesh
	// mesh.add( sound );
	// // END HERE DO NOT DELETE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!



	// create a global audio source
	const preludeGlock1 = new THREE.Audio(listener);

	// load a sound and set it as the Audio object's buffer
	const preludeGlock1Loader = new THREE.AudioLoader();
	preludeGlock1Loader.load('/res/pgv/perc/preludeGlock1.mp3', function(buffer) {
		preludeGlock1.setBuffer(buffer);
		preludeGlock1.setLoop(true);
		preludeGlock1.setVolume(0.1);
	});

	const preludeVibes = new THREE.Audio(listener);
	// load a sound and set it as the Audio object's buffer
	const preludeVibesLoader = new THREE.AudioLoader();
	preludeVibesLoader.load('/res/pgv/perc/preludeVibes.mp3', function(buffer) {
		preludeVibes.setBuffer(buffer);
		preludeVibes.setLoop(true);
		preludeVibes.setVolume(0.1);
	});



	var numberOfCoins = 30;
	var coins = []
	for (var c = 0; c < numberOfCoins; c++) {
		var goodToGo = false
		while (!goodToGo) {
			var coinx = Math.random() * 200 - 100
			var coiny = Math.random() * 200 - 100
			var distFromCenter = Math.sqrt((coinx * coinx + coiny * coiny))
			if (distFromCenter > 82 || distFromCenter < 2) {
				goodToGo = false
				continue;
			}
			for (c = 0; c < coins.length; c++) {
				if (Math.sqrt(Math.pow((coinx - coins[c].x), 2) + Math.pow((coiny - coins[c].y), 2)) < 2) {
					goodToGo = false
					continue;
				}
			}
			const coinGeo = new THREE.CylinderGeometry(2, 2, 1, 32);
			const coinMaterial = new THREE.MeshPhongMaterial({
				color: 0x452A2A
			});
			const coinMesh = new THREE.Mesh(coinGeo, coinMaterial);
			coinGeo.applyMatrix4(new THREE.Matrix4().makeTranslation(coinx, 0, coiny));
			scene.add(coinMesh);
			coins.push({
				x: coinx,
				y: coiny
			})
			goodToGo = true
		}

	}

	allVideos = {}
	allVideoMat = {}
	allSounds = {}

	var allPeeps = ['violin','viola','flute','clar','perc','piano']
	// number of videos prepped:
	var vids = 1
	for (var i = 1; i <=vids;i++) {
		for(var ins = 0; ins<allPeeps.length; ins++){
			var peep = allPeeps[ins]
			var vid = ""+peep+i;
			video = document.createElement( 'video' );
			video.id = vid
			video.type = ' video/ogg; codecs="theora, vorbis" ';
			video.src = "/res/vid/"+peep+"/v"+i+"_mute.mp4";
			video.load(); // must call after setting/changing source
			allVideos[vid] = video			
			const videoTexture = new THREE.VideoTexture(video);
			allVideoMat[vid] = new THREE.MeshBasicMaterial( {map: videoTexture, side: THREE.FrontSide, toneMapped: true} );

			const sound = new THREE.PositionalAudio(listener);
			// load a sound and set it as the PositionalAudio object's buffer
			const audioLoader = new THREE.AudioLoader();
			audioLoader.load( '/res/vid/'+peep+'/v'+i+'.mp3', function( buffer ) {
				sound.setVolume(1);
				sound.setBuffer( buffer );
				sound.setLoop(false);
				sound.setRefDistance(1);
			});
			allSounds[vid] = sound
		}
	}


	// THIS WORDS DO NOT DELETE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	// video = document.createElement( 'video' );
	// // video.id = 'video';
	// // video.type = ' video/ogg; codecs="theora, vorbis" ';
	// video.src = "../../res/playgroundVideos/violin/video_1_no_audio.mp4";
	// video.load(); // must call after setting/changing source

	// const videoTexture = new THREE.VideoTexture(video);
	// const videoMaterial =  new THREE.MeshBasicMaterial( {map: videoTexture, side: THREE.FrontSide, toneMapped: false} );

	// const geometry = new THREE.BoxGeometry( 10, 10, 10 );
	// const boxMaterial = videoMaterial
	// const cube = new THREE.Mesh( geometry, boxMaterial );
	// scene.add( cube );

	// geometry.applyMatrix4( new THREE.Matrix4().makeTranslation(40, 10, 2) );

	// END HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	const numberOfBricksPerRow = 15.0;
	const brickHeight = 25;

	allBricks = []

	for (var rowNumber = 0; rowNumber < 20; rowNumber++) {
		var bricksOnThisRow = []
		var rowOffset = Math.random() * (2 * Math.PI)
		for (var i = 0; i < numberOfBricksPerRow; i++) {
			const brickGeom = new THREE.BoxGeometry(50, brickHeight, 15);
			const thisBrickColor = Math.random() * .3 + .2
			const brickMaterial = new THREE.MeshPhongMaterial({
				color: new THREE.Color(thisBrickColor, thisBrickColor, thisBrickColor)
			});
			const brick = new THREE.Mesh(brickGeom, brickMaterial);
			const angleOfBrickFromCenter = rowOffset + (2 * Math.PI / numberOfBricksPerRow) * i
			brickGeom.rotateY(angleOfBrickFromCenter)
			brickGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(100 * Math.sin(angleOfBrickFromCenter), (brickHeight/2) + (brickHeight * rowNumber), 100 * Math.cos(angleOfBrickFromCenter)));
			scene.add(brick);
			bricksOnThisRow.push(brick)
		}
		allBricks.push(bricksOnThisRow)
	}



	const refractorGeometry = new THREE.PlaneGeometry(200, 200);

	refractor = new Refractor(refractorGeometry, {
		color: 0x999999,
		textureWidth: 1024,
		textureHeight: 1024,
		shader: WaterRefractionShader
	});

	refractor.position.set(0, brickHeight*2.9, 0);
	refractor.rotation.set(Math.PI / 2, 0, 0);

	scene.add(refractor);

	const dudvMap = new THREE.TextureLoader().load('/three.js/examples/textures/waterdudv.jpg', function() {

		animate();

	});

	dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;
	refractor.material.uniforms["tDudv"].value = dudvMap;

	// light

	const ambientLight = new THREE.AmbientLight(0x404040);
	scene.add(ambientLight);

	// const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
	// camera.add( pointLight );
	// scene.add( camera );

	// renderer

	renderer = new THREE.WebGLRenderer({
		antialias: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor(0x20252f);
	renderer.setPixelRatio(window.devicePixelRatio);
	document.body.appendChild(renderer.domElement);



	window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize(window.innerWidth, window.innerHeight);

}

function render() {
	// if ( video.readyState === video.HAVE_ENOUGH_DATA ) 
	// {
	// 	videoImageContext.drawImage( video, 0, 0 );
	// 	if ( videoTexture ) 
	// 		videoTexture.needsUpdate = true;
	// }
	// console.log("redering update")

	refractor.material.uniforms["time"].value += clock.getDelta();
	renderer.render(scene, camera);

}

var startedYet = false
var totalTimeSpent = 0

function waitGo(func, time){
	totalTimeSpent += time
	return setTimeout(func, totalTimeSpent* 1000);
}


function goScore(){
	if(startedYet){
		return
	}
	startedYet = true
	waitGo(function(){
		videoOnBrick(0,0,'piano',1)
		videoOnBrick(2,5,'perc',1)
		videoOnBrick(1,10,'violin',1)		
	}, .25);
	waitGo(function(){
		videoOnBrick(3,8,'clar',1)
	}, 15);
	waitGo(function(){
		videoOnBrick(1,2,'viola',1)
	}, 5);
	waitGo(function(){
		videoOnBrick(0,2,'flute',1)
	}, 8);
}

function videoOnBrick(row,no,insturment,vnumber) {
	console.log(allBricks)
	console.log(allVideos)
	console.log(allSounds)
	var vid = insturment+vnumber
	allBricks[row][no].material = allVideoMat[vid]
	allBricks[row][no].add(allSounds[vid])
	allVideos[vid].play()
	allSounds[vid].play()
	// // create an object for the sound to play from
	// const sphere = new THREE.CylinderGeometry( 2, 2, 1, 32);
	// const material = new THREE.MeshPhongMaterial( { color: 0x452A2A } );
	// const mesh = new THREE.Mesh( sphere, material );
	// scene.add( mesh );

	// // finally add the sound to the mesh
	// mesh.add( sound );
}

function animate() {

	requestAnimationFrame(animate);

	const time = performance.now();

	if (controls.isLocked === true) {

		const delta = (time - prevTime) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number(moveForward) - Number(moveBackward);
		direction.x = Number(moveRight) - Number(moveLeft);
		direction.normalize(); // this ensures consistent movements in all directions

		if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
		if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

		// don' go outside the well:
		var doThisMove = true;
		const currentx = controls.getObject().position.x
		const currentz = controls.getObject().position.z
		const distanceFromCenter = Math.sqrt((currentx * currentx + currentz * currentz))

		if (doThisMove) {
			controls.moveRight(-velocity.x * delta);
			controls.moveForward(-velocity.z * delta);
		}


		if (distanceFromCenter > 85) {
			const newx = controls.getObject().position.x
			const newz = controls.getObject().position.z
			const newDistanceFromCenter = Math.sqrt((newx * newx + newz * newz))
			if (newDistanceFromCenter > distanceFromCenter) {
				controls.moveRight(velocity.x * delta);
				controls.moveForward(velocity.z * delta);
			}
		}

		var skyrotateSpeed = 0.02;
		skygeometry.rotateZ(skyrotateSpeed * delta);


		controls.getObject().position.y += (velocity.y * delta); // new behavior

		if (controls.getObject().position.y < 10) {

			velocity.y = 0;
			controls.getObject().position.y = 10;

			canJump = true;

		}

	}

	prevTime = time;

	render();

}