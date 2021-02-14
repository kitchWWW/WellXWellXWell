import * as THREE from '/three.js/build/three.module.js';

import {
	GUI
} from '/three.js/examples/jsm/libs/dat.gui.module.js';

import {
	GPUComputationRenderer
} from '/three.js/examples/jsm/misc/GPUComputationRenderer.js';
import {
	SimplexNoise
} from '/three.js/examples/jsm/math/SimplexNoise.js';

const TESTING = true




// Texture width for simulation
const WIDTH = 128;

// Water size in system units
const BOUNDS = 512;
const BOUNDS_HALF = BOUNDS * 0.5;
var SPEED = .01;

let container;
let cylinder;
let coinIsFalling;
let coinInHand = false;
let coinVelocity;
let COIN_HEIGHT = 250;
let coinDropSound;
let camera, scene, renderer;
let mouseMoved = false;
let leftEyeVisibile = false;
let rightEyeVisible = false;
const mouseCoords = new THREE.Vector2();
const leftEyeCoords = new THREE.Vector2();
const rightEyeCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let waterMesh;
let meshRay;
let gpuCompute;
let heightmapVariable;
let waterUniforms;
let smoothShader;
let readWaterLevelShader;
let readWaterLevelRenderTarget;
let readWaterLevelImage;
const waterNormal = new THREE.Vector3();

const NUM_SPHERES = 5;
const spheres = [];
let spheresEnabled = false;

const simplex = new SimplexNoise();

init();
animate();

function init() {

	container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
	camera.position.set(0, 400, 200);
	camera.lookAt(0, 0, 0);

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xf0f0f0 ); // UPDATED
	const sun = new THREE.DirectionalLight(0xFFFFFF, 1.0);
	sun.position.set(300, 400, 175);
	scene.add(sun);

	const sun2 = new THREE.DirectionalLight(0x40A040, 0.6);
	sun2.position.set(-100, 350, -200);
	scene.add(sun2);

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// stats = new Stats();
	// container.appendChild(stats.dom);

	container.style.touchAction = 'none';
	container.addEventListener('pointermove', onPointerMove);
	container.addEventListener('pointerdown', releaseCoin);


	// document.addEventListener('keydown', function(event) {

	// 	// W Pressed: Toggle wireframe
	// 	if (event.keyCode === 87) {

	// 		waterMesh.material.wireframe = !waterMesh.material.wireframe;
	// 		waterMesh.material.needsUpdate = true;

	// 	}

	// });

	window.addEventListener('resize', onWindowResize);


	// const gui = new GUI();

	const effectController = {
		mouseSize: 20.0,
		viscosity: 0.997,
		spheresEnabled: spheresEnabled
	};

	const valuesChanger = function() {

		heightmapVariable.material.uniforms["mouseSize"].value = effectController.mouseSize;
		heightmapVariable.material.uniforms["viscosityConstant"].value = effectController.viscosity;
		spheresEnabled = effectController.spheresEnabled;
		for (let i = 0; i < NUM_SPHERES; i++) {

			if (spheres[i]) {

				spheres[i].visible = spheresEnabled;

			}

		}

	};

	// gui.add( effectController, "mouseSize", 1.0, 100.0, 1.0 ).onChange( valuesChanger );
	// gui.add( effectController, "viscosity", 0.9, 0.999, 0.001 ).onChange( valuesChanger );
	// gui.add( effectController, "spheresEnabled", 0, 1, 1 ).onChange( valuesChanger );
	// const buttonSmooth = {
	// 	smoothWater: function () {

	// 		smoothWater();

	// 	}
	// };
	// gui.add( buttonSmooth, 'smoothWater' );


	initWater();

	createSpheres();

	valuesChanger();

}


function initWater() {

	const materialColor = 0x0090F0;

	const geometry = new THREE.PlaneGeometry(BOUNDS, BOUNDS, WIDTH - 1, WIDTH - 1);

	// material: make a THREE.ShaderMaterial clone of THREE.MeshPhongMaterial, with customized vertex shader
	const material = new THREE.ShaderMaterial({
		uniforms: THREE.UniformsUtils.merge([
			THREE.ShaderLib['phong'].uniforms, {
				"heightmap": {
					value: null
				}
			}
		]),
		vertexShader: document.getElementById('waterVertexShader').textContent,
		fragmentShader: THREE.ShaderChunk['meshphong_frag']

	});

	material.lights = true;

	// Material attributes from THREE.MeshPhongMaterial
	material.color = new THREE.Color(materialColor);
	material.specular = new THREE.Color(0x111111);
	material.shininess = 50;

	// Sets the uniforms with the material values
	material.uniforms["diffuse"].value = material.color;
	material.uniforms["specular"].value = material.specular;
	material.uniforms["shininess"].value = Math.max(material.shininess, 1e-4);
	material.uniforms["opacity"].value = material.opacity;

	// Defines
	material.defines.WIDTH = WIDTH.toFixed(1);
	material.defines.BOUNDS = BOUNDS.toFixed(1);

	waterUniforms = material.uniforms;

	waterMesh = new THREE.Mesh(geometry, material);
	waterMesh.rotation.x = -Math.PI / 2;
	waterMesh.matrixAutoUpdate = false;
	waterMesh.updateMatrix();

	scene.add(waterMesh);

	const brickTexture = new THREE.TextureLoader().load( "res/tile2.jpg" );
	const coinTexture = new THREE.TextureLoader().load( "res/bron.jpg" );
	// const starTexture = new THREE.TextureLoader().load( "res/stars.jpg" );



	for(var i = 0; i < 8; i++){
		const bottomBox = new THREE.BoxGeometry( 86, 86, 86 );
		const bottomMat = new THREE.MeshBasicMaterial( {map: brickTexture} );
		const bottomCube = new THREE.Mesh( bottomBox, bottomMat );
		scene.add( bottomCube );
		bottomCube.position.set(-256-43 + (86 * i), 0,256+43);
	}
	for(var i = 0; i < 8; i++){
		const bottomBox = new THREE.BoxGeometry( 86, 86, 86 );
		const bottomMat = new THREE.MeshBasicMaterial( {map: brickTexture} );
		const bottomCube = new THREE.Mesh( bottomBox, bottomMat );
		scene.add( bottomCube );
		bottomCube.position.set(-256-43 + (86 * i), 0,-1*(256+43));
	}
	for(var i = 0; i < 6; i++){
		const bottomBox = new THREE.BoxGeometry( 86, 86, 86 );
		const bottomMat = new THREE.MeshBasicMaterial( {map: brickTexture} );
		const bottomCube = new THREE.Mesh( bottomBox, bottomMat );
		scene.add( bottomCube );
		bottomCube.position.set(-1*(256+43), 0,-256+43 + (86 * i));
	}
	for(var i = 0; i < 6; i++){
		const bottomBox = new THREE.BoxGeometry( 86, 86, 86 );
		const bottomMat = new THREE.MeshBasicMaterial( {map: brickTexture} );
		const bottomCube = new THREE.Mesh( bottomBox, bottomMat );
		scene.add( bottomCube );
		bottomCube.position.set(1*(256+47), 0,-256+43 + (86 * i));
	}

	const loader = new THREE.TextureLoader();
	const bgTexture = loader.load('res/stars.jpg');
	scene.background = bgTexture;
	// var floorgeometry = new THREE.PlaneGeometry(BOUNDS*5, BOUNDS*5);

	// const florMat = new THREE.MeshBasicMaterial( {map: starTexture} );
	// const floorMesh = new THREE.Mesh( floorgeometry, florMat );
	// scene.add( floorMesh );
	// floorMesh.rotation.x = -Math.PI / 2;
	// floorMesh.position.set(0, -20,0);
	
	// const leftBox = new THREE.BoxGeometry( 100, 100, 100 );
	// const leftMat = new THREE.MeshBasicMaterial( {map: brickTexture} );
	// const leftCube = new THREE.Mesh( leftBox, leftMat );
	// scene.add( leftCube );
	// leftCube.position.set(-256-50, 0,0);

	// const rightboxgeometry = new THREE.BoxGeometry( 100, 100, 100 );
	// const rightboxmaterial = new THREE.MeshBasicMaterial( {map: brickTexture} );
	// const rightcube = new THREE.Mesh( rightboxgeometry, rightboxmaterial );
	// scene.add( rightcube );
	// rightcube.position.set(256+50, 0, 0);

	// const topboxgeometry = new THREE.BoxGeometry( 512, 100, 100 );
	// const topboxmaterial = new THREE.MeshBasicMaterial( {map: brickTexture} );
	// const topcube = new THREE.Mesh( topboxgeometry, topboxmaterial );
	// scene.add( topcube );
	// topcube.position.set(0, 0,-256-50);



	const coingeometry = new THREE.CylinderGeometry( 10, 10, 3, 32 );
	const coinmaterial = new THREE.MeshBasicMaterial( {map: coinTexture} );
	cylinder = new THREE.Mesh( coingeometry, coinmaterial );
	scene.add( cylinder );
	cylinder.position.set(10000, 10000,10000);


	// THREE.Mesh just for mouse raycasting
	const geometryRay = new THREE.PlaneGeometry(BOUNDS, BOUNDS, 1, 1);
	meshRay = new THREE.Mesh(geometryRay, new THREE.MeshBasicMaterial({
		color: 0xFFFFFF,
		visible: false
	}));
	meshRay.rotation.x = -Math.PI / 2;
	meshRay.matrixAutoUpdate = false;
	meshRay.updateMatrix();
	scene.add(meshRay);


	// Creates the gpu computation class and sets it up

	gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

	if (isSafari()) {

		gpuCompute.setDataType(THREE.HalfFloatType);

	}

	const heightmap0 = gpuCompute.createTexture();

	fillTexture(heightmap0);

	heightmapVariable = gpuCompute.addVariable("heightmap", document.getElementById('heightmapFragmentShader').textContent, heightmap0);

	gpuCompute.setVariableDependencies(heightmapVariable, [heightmapVariable]);

	heightmapVariable.material.uniforms["mousePos"] = {
		value: new THREE.Vector2(10000, 10000)
	};
	heightmapVariable.material.uniforms["coinPos"] = {
		value: new THREE.Vector2(10000, 10000)
	};
	heightmapVariable.material.uniforms["leftEyePos"] = {
		value: new THREE.Vector2(10000, 10000)
	};
	heightmapVariable.material.uniforms["rightEyePos"] = {
		value: new THREE.Vector2(10000, 10000)
	};
	heightmapVariable.material.uniforms["mouseSize"] = {
		value: 20.0
	};
	heightmapVariable.material.uniforms["viscosityConstant"] = {
		value: 0.98
	};
	heightmapVariable.material.uniforms["heightCompensation"] = {
		value: 0
	};
	heightmapVariable.material.defines.BOUNDS = BOUNDS.toFixed(1);

	const error = gpuCompute.init();
	if (error !== null) {

		console.error(error);

	}

	// Create compute shader to smooth the water surface and velocity
	smoothShader = gpuCompute.createShaderMaterial(document.getElementById('smoothFragmentShader').textContent, {
		smoothTexture: {
			value: null
		}
	});

	// Create compute shader to read water level
	readWaterLevelShader = gpuCompute.createShaderMaterial(document.getElementById('readWaterLevelFragmentShader').textContent, {
		point1: {
			value: new THREE.Vector2()
		},
		levelTexture: {
			value: null
		}
	});
	readWaterLevelShader.defines.WIDTH = WIDTH.toFixed(1);
	readWaterLevelShader.defines.BOUNDS = BOUNDS.toFixed(1);

	// Create a 4x1 pixel image and a render target (Uint8, 4 channels, 1 byte per channel) to read water height and orientation
	readWaterLevelImage = new Uint8Array(4 * 1 * 4);

	readWaterLevelRenderTarget = new THREE.WebGLRenderTarget(4, 1, {
		wrapS: THREE.ClampToEdgeWrapping,
		wrapT: THREE.ClampToEdgeWrapping,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
		format: THREE.RGBAFormat,
		type: THREE.UnsignedByteType,
		depthBuffer: false
	});

}

function isSafari() {
	return !!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i);

}

function fillTexture(texture) {

	const waterMaxHeight = 10;

	function noise(x, y) {

		let multR = waterMaxHeight;
		let mult = 0.025;
		let r = 0;
		for (let i = 0; i < 15; i++) {

			r += multR * simplex.noise(x * mult, y * mult);
			multR *= 0.53 + 0.025 * i;
			mult *= 1.25;

		}

		return r;

	}

	const pixels = texture.image.data;

	let p = 0;
	for (let j = 0; j < WIDTH; j++) {

		for (let i = 0; i < WIDTH; i++) {

			const x = i * 128 / WIDTH;
			const y = j * 128 / WIDTH;

			pixels[p + 0] = noise(x, y);
			pixels[p + 1] = pixels[p + 0];
			pixels[p + 2] = 0;
			pixels[p + 3] = 1;

			p += 4;

		}

	}

}

function smoothWater() {

	const currentRenderTarget = gpuCompute.getCurrentRenderTarget(heightmapVariable);
	const alternateRenderTarget = gpuCompute.getAlternateRenderTarget(heightmapVariable);

	for (let i = 0; i < 10; i++) {

		smoothShader.uniforms["smoothTexture"].value = currentRenderTarget.texture;
		gpuCompute.doRenderTarget(smoothShader, alternateRenderTarget);

		smoothShader.uniforms["smoothTexture"].value = alternateRenderTarget.texture;
		gpuCompute.doRenderTarget(smoothShader, currentRenderTarget);

	}

}

function createSpheres() {

	const sphereTemplate = new THREE.Mesh(new THREE.SphereGeometry(4, 24, 12), new THREE.MeshPhongMaterial({
		color: 0xFFFF00
	}));

	for (let i = 0; i < NUM_SPHERES; i++) {

		let sphere = sphereTemplate;
		if (i < NUM_SPHERES - 1) {

			sphere = sphereTemplate.clone();

		}

		sphere.position.x = (Math.random() - 0.5) * BOUNDS * 0.7;
		sphere.position.z = (Math.random() - 0.5) * BOUNDS * 0.7;

		sphere.userData.velocity = new THREE.Vector3();

		scene.add(sphere);

		spheres[i] = sphere;

	}

}

function sphereDynamics() {

	const currentRenderTarget = gpuCompute.getCurrentRenderTarget(heightmapVariable);

	readWaterLevelShader.uniforms["levelTexture"].value = currentRenderTarget.texture;

	for (let i = 0; i < NUM_SPHERES; i++) {

		const sphere = spheres[i];

		if (sphere) {

			// Read water level and orientation
			const u = 0.5 * sphere.position.x / BOUNDS_HALF + 0.5;
			const v = 1 - (0.5 * sphere.position.z / BOUNDS_HALF + 0.5);
			readWaterLevelShader.uniforms["point1"].value.set(u, v);
			gpuCompute.doRenderTarget(readWaterLevelShader, readWaterLevelRenderTarget);

			renderer.readRenderTargetPixels(readWaterLevelRenderTarget, 0, 0, 4, 1, readWaterLevelImage);
			const pixels = new Float32Array(readWaterLevelImage.buffer);

			// Get orientation
			waterNormal.set(pixels[1], 0, -pixels[2]);

			const pos = sphere.position;

			// Set height
			pos.y = pixels[0];

			// Move sphere
			waterNormal.multiplyScalar(0.1);
			sphere.userData.velocity.add(waterNormal);
			sphere.userData.velocity.multiplyScalar(0.998);
			pos.add(sphere.userData.velocity);

			if (pos.x < -BOUNDS_HALF) {

				pos.x = -BOUNDS_HALF + 0.001;
				sphere.userData.velocity.x *= -0.3;

			} else if (pos.x > BOUNDS_HALF) {

				pos.x = BOUNDS_HALF - 0.001;
				sphere.userData.velocity.x *= -0.3;

			}

			if (pos.z < -BOUNDS_HALF) {

				pos.z = -BOUNDS_HALF + 0.001;
				sphere.userData.velocity.z *= -0.3;

			} else if (pos.z > BOUNDS_HALF) {

				pos.z = BOUNDS_HALF - 0.001;
				sphere.userData.velocity.z *= -0.3;

			}

		}

	}

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);

}

function setLeftEye(x, y) {
	leftEyeCoords.set(-(x / 320.0) + 1, -(y / 240.0) + 1);
	leftEyeVisibile = true
}
function setRightEye(x, y) {
	rightEyeCoords.set(-(x / 320.0) + 1, -(y / 240.0) + 1);
	rightEyeVisible = true
}

function releaseCoin(event){
	coinIsFalling = true
	coinInHand = false
	coinVelocity = 0;
}

function onPointerMove(event){
	if(coinInHand){
		cylinder.position.set((event.clientX / renderer.domElement.clientWidth) *300 - 150, COIN_HEIGHT, (event.clientY / renderer.domElement.clientHeight) *300 - 150);
	}
}

// function onPointerMove(event) {

// 	if (event.isPrimary === false) return;

// 	setMouseCoords();

// }

function animate() {
	requestAnimationFrame(animate);
	render();
}


function render() {

	// Set uniforms: mouse interaction
	const uniforms = heightmapVariable.material.uniforms;

	if(leftEyeVisibile){
		raycaster.setFromCamera(leftEyeCoords, camera);
		let intersects = raycaster.intersectObject(meshRay);
		if (intersects.length > 0) {
			const point = intersects[0].point;
			uniforms["leftEyePos"].value.set(point.x, point.z);
		} else {
			uniforms["leftEyePos"].value.set(10000, 10000);
		}
		leftEyeVisibile = false
	}

	if(rightEyeVisible){
		raycaster.setFromCamera(rightEyeCoords, camera);
		let intersects = raycaster.intersectObject(meshRay);
		if (intersects.length > 0) {
			const point = intersects[0].point;
			uniforms["rightEyePos"].value.set(point.x, point.z);
		} else {
			uniforms["rightEyePos"].value.set(10000, 10000);
		}
		rightEyeVisible = false		
	}


	cylinder.rotation.x -= SPEED * 2;
    cylinder.rotation.y -= SPEED;
    cylinder.rotation.z -= SPEED * 3;
	uniforms["coinPos"].value.set(10000, 10000);
    if(coinIsFalling){
    	coinVelocity += 1
    	cylinder.position.y -= coinVelocity
    	if(cylinder.position.y < 0){
    		// make it look like the water is bouncy
			uniforms["coinPos"].value.set(cylinder.position.x, cylinder.position.z);
    	}
    	if(cylinder.position.y < -100){
    		coinIsFalling = false
    		coinDropSound.stop()
    		coinDropSound.play()
    		coinVelocity = 0
    		setTimeout(function(){
    			displayContentModal()
    		}, TESTING ? 10 : 3000);
    	}
    }


	// Do the gpu computation
	gpuCompute.compute();

	// Get compute output in custom uniform
	waterUniforms["heightmap"].value = gpuCompute.getCurrentRenderTarget(heightmapVariable).texture;

	// Render
	renderer.render(scene, camera);

}

















// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet using p5.js
=== */
/* eslint-disable */

// Grab elements, create settings, etc.
var video = document.getElementById("video");
// var canvas = document.getElementById("canvas");
// var ctx = canvas.getContext("2d");
// document.getElementById("canvas").style.visibility = "hidden";

// The detected positions will be inside an array
let poses = [];


function startCameraUsage(){
	console.log("starting camera!!!")
		// Create a webcam capture
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
	  navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
	    video.srcObject = stream;
	    video.play();
	  });
	}

	drawCameraIntoCanvas()
}


// A function to draw the video and poses into the canvas.
// This function is independent of the result of posenet
// This way the video will not seem slow if poseNet
// is not detecting a position
function drawCameraIntoCanvas() {
  // Draw the video element into the canvas
  // ctx.drawImage(video, 0, 0, 640, 480);
  // We can call both functions to draw all keypoints and the skeletons
  // drawKeypoints();
  drawSkeleton();
  window.requestAnimationFrame(drawCameraIntoCanvas);
}
// Loop over the drawCameraIntoCanvas function
drawCameraIntoCanvas();

// Create a new poseNet method with a single detection
const poseNet = ml5.poseNet(video, modelReady);
poseNet.on("pose", gotPoses);

// A function that gets called every time there's an update from the model
function gotPoses(results) {
  poses = results;
}

function modelReady() {
  console.log("model ready");
  poseNet.multiPose(video);
}

// // A function to draw ellipses over the detected keypoints
// function drawKeypoints() {
//   // Loop through all the poses detected
//   for (let i = 0; i < poses.length; i += 1) {
//     // For each pose detected, loop through all the keypoints
//     for (let j = 0; j < poses[i].pose.keypoints.length; j += 1) {
//       let keypoint = poses[i].pose.keypoints[j];
//       // Only draw an ellipse is the pose probability is bigger than 0.2
//       if (keypoint.score > 0.2) {
//         ctx.beginPath();
//         ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
//         ctx.stroke();
//       }
//     }
//   }
// }

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  // console.log(poses)
if(poses.length > 0){
  // console.log(poses[0].pose)
  // camera size is 640
  setLeftEye(poses[0].pose.leftEye.x, poses[0].pose.leftEye.y);
  setRightEye(poses[0].pose.rightEye.x, poses[0].pose.rightEye.y);

}
  // for (let i = 0; i < poses.length; i += 1) {
  //   // For every skeleton, loop through all body connections
  //   for (let j = 0; j < poses[i].skeleton.length; j += 1) {
  //     let partA = poses[i].skeleton[j][0];
  //     let partB = poses[i].skeleton[j][1];
  //     ctx.beginPath();
  //     ctx.moveTo(partA.position.x, partA.position.y);
  //     ctx.lineTo(partB.position.x, partB.position.y);
  //     ctx.stroke();
  //   }
  // }
}


// Get the modal
var modal = document.getElementById("myModal");
var modalContent = document.getElementById("modalContent");
var followUpModal = document.getElementById("followUpChooseApp");

// Get the button that opens the modal
var useBoth = document.getElementById("useBoth");
var useLaptop = document.getElementById("useLaptop");
var useInsta = document.getElementById("useInsta");

var useInstagram = document.getElementById("useInstagram");
var useFacebook = document.getElementById("useFacebook");

var contentModal1 = document.getElementById("myContentModal1");
var contentModal2 = document.getElementById("myContentModal2");
var contentModal3 = document.getElementById("myContentModal3");
var contentModal4 = document.getElementById("myContentModal4");
var contentModal5 = document.getElementById("myContentModal5");
var contentModal6 = document.getElementById("myContentModal6");



// Get the <span> element that closes the modal
// var mySpan = document.getElementsByClassName("close")[0];

// When the user clicks the button, open the modal 
setTimeout(function(){
  modal.style.display = "block";
}, TESTING ? 10: 3000);

useBoth.onclick = function(){ startFollowup(true,true)}
useLaptop.onclick = function(){ startUsing(true,false)}
useInsta.onclick = function(){ startFollowup(false,true)}
document.getElementById("startOver").onclick = startOver
document.getElementById("returnToWell1").onclick = returnToWell1
document.getElementById("returnToWell2").onclick = returnToWell2
document.getElementById("returnToWell3").onclick = returnToWell3
document.getElementById("returnToWell4").onclick = returnToWell4
document.getElementById("returnToWell5").onclick = returnToWell5
document.getElementById("returnToWell6").onclick = returnToWell6


function dismissModal(){
}

function changeSrcTo(suffix){
	document.getElementById("spaceman_qr").src="/codes/spaceman_"+suffix+".png";
	document.getElementById("unicorn_qr").src="/codes/unicorn_"+suffix+".png";
	document.getElementById("community_qr").src="/codes/community_"+suffix+".png";
	document.getElementById("vocal_qr").src="/codes/vocal_"+suffix+".png";
}

var effectsToShow = []

function startFollowup(laptop, insta){
	modal.style.display = "none";
	followUpModal.style.display = "block"
	useInstagram.onclick = function(){
		followUpModal.style.display = "none"
		changeSrcTo("insta");
		startUsing(laptop,insta);
	}
	useFacebook.onclick = function(){
		followUpModal.style.display = "none"
		changeSrcTo("fb")
		startUsing(laptop,insta)
	}
}

function startUsing(laptop, insta) {
	if(laptop){
		startCameraUsage()
	}
	modal.style.display = "none";
	document.getElementById("info").style.display="block";
 	coinInHand = true;
 	if(laptop && insta){
 		effectsToShow = [contentModal1, contentModal3, contentModal2,contentModal4, contentModal5,contentModal6]
 	}else if(laptop){
 		effectsToShow = [contentModal3, contentModal6]
 	}else{
 		effectsToShow = [contentModal1, contentModal2,contentModal4, contentModal5]
 	}
 	startBasicAudio()
}
function startOver(){
	document.getElementById("thanksforcoming").style.display = "none";
 	coinInHand = false;
 	shouldShowEndMessage = false;
 	indexIntoShow = 0;
	modal.style.display = "block";
}


var indexIntoShow = 0;
var shouldShowEndMessage = false

function displayContentModal(){
	document.getElementById("info").style.display="none";
	effectsToShow[indexIntoShow].style.display = "block";
	indexIntoShow += 1;
	if(indexIntoShow >= effectsToShow.length){
		shouldShowEndMessage = true
	}
}

function displayEndMessage(){
	document.getElementById("thanksforcoming").style.display = "block";
}

function returnToWell1(){
	document.getElementById("info").style.display="block";
	contentModal1.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}

function returnToWell2(){
	document.getElementById("info").style.display="block";
	contentModal2.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}
function returnToWell3(){
	document.getElementById("info").style.display="block";
	contentModal3.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}

function returnToWell4(){
	document.getElementById("info").style.display="block";
	contentModal4.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}

function returnToWell5(){
	document.getElementById("info").style.display="block";
	contentModal5.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}

function returnToWell6(){
	document.getElementById("info").style.display="block";
	contentModal6.style.display="none"
	if(shouldShowEndMessage){
		displayEndMessage()
		return
	}
	setTimeout(function(){
		coinInHand = true
	}, TESTING ? 10 : 2000);
}




var useLowBuzz = true
function startBasicAudio(){
	console.log("playing audio!")
	var fileToPlay = new Pizzicato.Sound({ 
    	source: 'file',
    	options: {
    		path: '/res/longmixdown3.mp3',
    		loop: true,
    		volume: .05,
    		}
    }, function() {
		fileToPlay.play()
	});
}

coinDropSound = new Pizzicato.Sound({ 
	source: 'file',
	options: {
		path: '/res/coinDropSound.mp3',
		volume: .2,
		}
}, function() {
});


















