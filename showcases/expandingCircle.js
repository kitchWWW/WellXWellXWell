// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
var actualWindowWidth
var actualWindowHeight
var canPlayPitches = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);
  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
  actualWindowWidth = windowWidth
  actualWindowHeight = windowHeight
}

pitchesToPlay = [['d3','e3'],['d3','e3','g3'],['e3','g3','a3'],['g3','a3','c4'],['a3','c4','e4'],['c4','e4','g4'],['e4','g4','a4'],['g4','a4','c5'],['a4','c5','d5'],['c5','d5','e5'],['d5','e5']]

textToShow = ['loading...','click to start audio','running!']
textToShowIndex = 0
function modelReady() {
  if(textToShowIndex == 0){
    textToShowIndex+=1
  }
}


function draw() {
  clear();

  // image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  // drawSkeleton();
  
  strokeWeight(10);
  for(var i = 0; i < currentlyExpandingCircles.length; i++){
    dat = currentlyExpandingCircles[i]
    fill('rgba(0%,0%,0%,0)')
    stroke('rgba('+dat.color+','+((dat.maxSize-dat.rad)/dat.maxSize) +')');
    circle(dat.x, dat.y, dat.rad);
    dat.rad = dat.rad+1
    currentlyExpandingCircles[i] = dat
    if (dat.rad >= dat.maxSize){
      currentlyExpandingCircles.splice(i, 1);
      i--
    }
  }
  fill(100, 100, 100);
  strokeWeight(0);
  textSize(32);
  // print(textToShow[textToShowIndex])
  text(textToShow[textToShowIndex], 20, 40);
}

function skeleScaleX(x){
  // return windowWidth - ((x/2.0) + (windowWidth/4))
  return windowWidth - x
}
function skeleScaleY(y){
  // return (y/2.0)
  return y
}

var wnose = {x:0,y:0}
var wleftWrist = {x:0,y:0}
var wrightWrist = {x:0,y:0}

scalingFactor = .9
// A function to draw ellipses over the detected keypoints
var lastTimeAddedCircle = (new Date()).getTime()
var howLongToWait = 100 + (Math.random() * 100)
function drawKeypoints()  {
  // Loop through all the poses detected
  var rightNow = (new Date()).getTime()
  if(rightNow - lastTimeAddedCircle < howLongToWait){
    return;
  }
  howLongToWait = 100 + (Math.random() * 100)
  lastTimeAddedCircle = rightNow
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    if(pose.nose.confidence > 0.5){
      // wnose.x = wnose.x * scalingFactor + (pose.nose.x * (1-scalingFactor))
      // wnose.y = wnose.y * scalingFactor + (pose.nose.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.nose.x),skeleScaleY(pose.nose.y),"100%,0%,100%",300)
      playPitch(0,skeleScaleX(pose.nose.x),skeleScaleY(pose.nose.y));
    }
    if(pose.leftWrist.confidence > 0.3){
      // wleftWrist.x = wleftWrist.x * scalingFactor + (pose.leftWrist.x * (1-scalingFactor))
      // wleftWrist.y = wleftWrist.y * scalingFactor + (pose.leftWrist.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.leftWrist.x),skeleScaleY(pose.leftWrist.y),"90%,40%,100%",100)
      playPitch(1,skeleScaleX(pose.leftWrist.x),skeleScaleY(pose.leftWrist.y));
    }
    if(pose.rightWrist.confidence > 0.3){
      // wrightWrist.x = wrightWrist.x * scalingFactor + (pose.rightWrist.x * (1-scalingFactor))
      // wrightWrist.y = wrightWrist.y * scalingFactor + (pose.rightWrist.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.rightWrist.x),skeleScaleY(pose.rightWrist.y),"90%,40%,100%",100)
      playPitch(2,skeleScaleX(pose.rightWrist.x),skeleScaleY(pose.rightWrist.y));
    }

    // for (let j = 0; j < pose.keypoints.length; j++) {
    //   // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    //   let keypoint = pose.keypoints[j];
    //   // Only draw an ellipse is the pose probability is bigger than 0.2
    //   if (keypoint.score > 0.5) {
    //     // fill(255, 0, 0);
    //     // noStroke();
    //     // ellipse(skeleScaleX(keypoint.position.x), skeleScaleY(keypoint.position.y), 10, 10);
    //   }
    // }
  }
}


function playPitch(chan,x,y,){
  if(!canPlayPitches){
    return;
  }
  var whichPitch = Math.round(((height - y) / height) * (fileNames.length-1))
  print(fileNames)
  print(whichPitch)
  print(fileNames[whichPitch])
  print(audioFiles)
  audioFiles[fileNames[whichPitch]].play()
}



function windowfunction(){
  if(textToShowIndex == 0){
    return;
  }
  if(textToShowIndex == 1){
    textToShowIndex += 1
    canPlayPitches = true
  }
}
window.onclick = windowfunction;




// // A function to draw the skeletons
// function drawSkeleton() {
//   // Loop through all the skeletons detected
//   for (let i = 0; i < poses.length; i++) {
//     let skeleton = poses[i].skeleton;
//     // For every skeleton, loop through all body connections
//     for (let j = 0; j < skeleton.length; j++) {
//       let partA = skeleton[j][0];
//       let partB = skeleton[j][1];
//       stroke(255, 0, 0);
//       line(skeleScaleX(partA.position.x), skeleScaleY(partA.position.y), skeleScaleX(partB.position.x), skeleScaleY(partB.position.y));
//     }
//   }
// }


var currentlyExpandingCircles = []
var maxVariation = 30
function drawExpandingCircle(x,y,color,maxSize){
  x+= (-maxVariation / 2) + (Math.random() * maxVariation)
  y+= (-maxVariation / 2) + (Math.random() * maxVariation)
  currentlyExpandingCircles.push({x:x,y:y,rad:5, color:color, maxSize:maxSize})
}


function makeSmallCircle(){
  drawExpandingCircle(Math.random() * windowWidth, Math.random() * windowHeight, "90%,90%,90%",400)
  setTimeout(makeSmallCircle, 400);
}

setTimeout(makeSmallCircle, 2000);




var fileNames = ['d3','e3','g3','a3','c4','e4','g4','a4','c5','d5','e5']
var audioFiles = {}
for(var i = 0; i < fileNames.length; i++){

  var audioFile = new Pizzicato.Sound('/res/piano/'+fileNames[i]+'.mp3', function() {
      // Sound loaded!
    });
  audioFiles[fileNames[i]] = audioFile
}











function windowResized() {
   resizeCanvas(windowWidth, windowHeight);
}