let handpose;
let video;
let predictions = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);
  console.log(width)
  console.log(height)

  handpose = ml5.handpose(video, modelReady);

  // This sets up an event that fills the global variable "predictions"
  // with an array every time new hand poses are detected
  handpose.on("predict", results => {
    predictions = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();
  fill('rgba(107,190,253,1)')
  rect(0, 0, width, height-20);
  fill('rgba(77,55,33,1)')
  rect(0, height-20, width, 20);
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  noStroke()
  fill('rgba(107,190,253,1)')
  rect(0, 0, width, height-20);
  drawRain();
  drawClouds();
  drawBackgrounds();
  getNewPositions();
}

var rainSize = 5;
function drawRain(){
  fill('rgba(0,0,253,0.1)')
  for(var i = 0; i < rain.length; i ++){
    ellipse(rain[i].x, rain[i].y , rainSize, rainSize);
    rain[i].y += 10;
    if(rain[i].y > windowHeight){
      greenBumps[Math.round(rain[i].x / 5.0)] = true
      rain.splice(i,1)
      i--;
    }
  }
}
function drawClouds(){
  fill('rgba(255,255,255,.1)')
  for(var i = 0; i < clouds.length; i ++){
    ellipse(clouds[i].x, clouds[i].y , cloudSize, cloudSize);
    clouds[i].age+=1
    if(clouds[i].age > 15){
      clouds.splice(i,1)
      i--;
    }
  }
}

function drawBackgrounds(){
  fill('rgba(77,55,33,1)')
  rect(0, height-20, width, 20);
  fill('rgba(0,255,0,1)')
  print(greenBumps)
  var keys = Object.keys(greenBumps)
  for(i = 0; i < keys.length; i++){
    rect(keys[i]*5, height-20, 5, 20);
  }
}

function scaleX(x){
  return width - ((x/640.0) * width)
}
function scaleY(y){
  return ((y/480.0) * height)
}

var cloudSize = 90
var rain = []
var clouds = []
var greenBumps = {}
function getNewPositions() {
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      clouds.push({x:scaleX(keypoint[0]), y:scaleY(keypoint[1]), age:0})
      rain.push({x:scaleX(keypoint[0]), y:scaleY(keypoint[1]) })
    }
  }
}
