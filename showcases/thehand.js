function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

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
  drawWords();
}

function modelReady() {
  console.log("Model ready!");
}

function draw() {
  noStroke()
  fill('rgba(107,190,253,1)')
  rect(0, 0, width, height-20);
  drawWords();
  drawRain();
  drawClouds();
  drawBackgrounds();
  getNewPositions();
  updateFilters();
}

var rainSize = 5;

textThings = ["click to start audio...","started!","ready to go",""]
currentText = 0
function drawWords(){
  fill('rgba(355,255,255,1)')
  textSize(32);
  text(textThings[currentText], 30, 30);
}

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
var xLocHistory = []
var yLocHistory = []
function getNewPositions() {
  var allXs = []
  var allYs = []
  for (let i = 0; i < predictions.length; i += 1) {
    const prediction = predictions[i];
    for (let j = 0; j < prediction.landmarks.length; j += 1) {
      const keypoint = prediction.landmarks[j];
      var x = scaleX(keypoint[0])
      var y = scaleY(keypoint[1])
      allXs.push(x)
      allYs.push(y)
      clouds.push({x:x, y:y, age:0})
      rain.push({x:x, y:y})
    }
  }
  var xSum = allXs.reduce(function(a, b){
        return a + b;
    }, 0);
  var ySum = allYs.reduce(function(a, b){
        return a + b;
    }, 0);
  if(allXs.length >0){
    xLocHistory.push(xSum/allXs.length)
    yLocHistory.push(ySum/allYs.length)
  }
}

function updateFilters(){
  if(xLocHistory.length < 1){
    return;
  }
  while(xLocHistory.length >100){
    xLocHistory.splice(0,1)
  }
  while(yLocHistory.length >100){
    yLocHistory.splice(0,1)
  }
  var xSum = xLocHistory.reduce(function(a, b){
        return a + b;
    }, 0);
  var ySum = yLocHistory.reduce(function(a, b){
        return a + b;
    }, 0);
  var xSmoothed = (xSum / xLocHistory.length)
  var ySmoothed = (ySum / yLocHistory.length)
  var targetFreq = Math.pow(2, (xSmoothed / width)*14)+100
  print(targetFreq)
  highPassFilter.frequency = targetFreq
  lowPassFilter.frequency = targetFreq
  var targetVolume = ((height - ySmoothed) / height)
  fileToPlay.volume = .13 * targetVolume
}



var fileToPlay = new Pizzicato.Sound({ 
      source: 'file',
      options: {
        path: '/res/Cwav.mp3',
        loop: true,
        volume: .05,
        }
    }, function() {
  });

function windowfunction(){
  if(currentText == 0){
    currentText += 1
  }
  fileToPlay.play()
}
var highPassFilter = new Pizzicato.Effects.HighPassFilter({
    frequency: 300,
    peak: 10
});
var lowPassFilter = new Pizzicato.Effects.LowPassFilter({
    frequency: 500,
    peak: 10
});
fileToPlay.addEffect(highPassFilter);
fileToPlay.addEffect(lowPassFilter);

window.onclick = windowfunction;
