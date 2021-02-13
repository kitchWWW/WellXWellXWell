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

function modelReady() {
  // select('#status').html('Model Loaded');
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
      console.log(wnose);
      // wnose.x = wnose.x * scalingFactor + (pose.nose.x * (1-scalingFactor))
      // wnose.y = wnose.y * scalingFactor + (pose.nose.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.nose.x),skeleScaleY(pose.nose.y),"100%,0%,100%",300)
    }
    if(pose.leftWrist.confidence > 0.5){
      // wleftWrist.x = wleftWrist.x * scalingFactor + (pose.leftWrist.x * (1-scalingFactor))
      // wleftWrist.y = wleftWrist.y * scalingFactor + (pose.leftWrist.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.leftWrist.x),skeleScaleY(pose.leftWrist.y),"100%,40%,100%",100)
    }
    if(pose.rightWrist.confidence > 0.5){
      // wrightWrist.x = wrightWrist.x * scalingFactor + (pose.rightWrist.x * (1-scalingFactor))
      // wrightWrist.y = wrightWrist.y * scalingFactor + (pose.rightWrist.y * (1-scalingFactor))
      drawExpandingCircle(skeleScaleX(pose.rightWrist.x),skeleScaleY(pose.rightWrist.y),"100%,40%,100%",100)
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








function windowResized() {
   resizeCanvas(windowWidth, windowHeight);
}