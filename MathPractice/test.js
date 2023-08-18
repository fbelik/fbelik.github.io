function setup() {
  // put setup code here
  var canvas = createCanvas(1000,430);
  // Allow canvas to be in middle of page
  canvas.parent('sketch-holder');
  noLoop();
}

var homeIds = ['form'];
var testIds = ['sketch-holder'];
var testbrs = [0,1,2,3,4,5,6,7];

var cards = [];
var entry = '';
var totalTime;
var current;
var working = [];
var complete = [];
var timeGiven;
var numCorrect = 0;
var type;
var numOfCards;
var low;
var high;

function submitValues() {
  var radios = document.getElementsByName('type');
  for (var i = 0, length = radios.length; i < length; i++) {
    if (radios[i].checked) {
      type = radios[i].value;
      break;
    }
  }
  numOfCards = document.getElementById('numCards').value;
  if (isNaN(numOfCards)) {
    numOfCards = 10;
  }
  low = parseInt(document.getElementById('low').value, 10);
  if (isNaN(low) || low < 0) {
    low = 0;
  }
  high = parseInt(document.getElementById('high').value, 10);
  if (isNaN(high) || high < low) {
    high = low + 12;
  }
  timeGiven = document.getElementById('time').value * 60;
  cards = [];
  if (type == 'add') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i + j,
        })
      }
    }
  }
  else if (type == 'subtract') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= i; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i - j,
        })
      }
    }
  }
  else if (type == 'multiply') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i * j,
        })
      }
    }
  }
  else {
    if (low == 0) {
      low += 1;
    }
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i * j,
          q2: j,
          a: i,
        })
      }
    }
  }
  entry = '';
  totalTime = new Date();
  working = [];
  complete = [];
  for (var i = 0; i < numOfCards; i++) {
    card = Math.floor(Math.random()*(cards.length-1));
    if (working.includes(cards[card])) {
      working.push(Object.assign({}, cards[card]));
    }
    else {
      working.push(cards[card]);
    }
  }
  current = 0;
  for (var i=0; i<homeIds.length; i++) {
    document.getElementById(homeIds[i]).style.display = "none";
  }
  for (var i=0; i<testIds.length; i++) {
    document.getElementById(testIds[i]).style.display = "block";
  }
  var cell = document.getElementsByTagName('br');
  var length = cell.length;
  for(var i = 0; i < length; i++) {
    if (testbrs.includes(i) == false) {
      cell[i].style.display = "none";
    }
  }
  loop();
}

function newValues() {
  for (var i=0; i<homeIds.length; i++) {
    document.getElementById(homeIds[i]).style.display = "block";
  }
  for (var i=0; i<testIds.length; i++) {
    document.getElementById(testIds[i]).style.display = "none";
  }
  var cell = document.getElementsByTagName('br');
  var length = cell.length;
  for(var i = 0; i < length; i++) {
    if (testbrs.includes(i) == false) {
      cell[i].style.display = "block";
    }
  }
  document.getElementById('afterTest').style.display = "none";
  numCorrect = 0;
  noLoop();
}

function repeatValues() {
  cards = [];
  if (type == 'add') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i + j,
        })
      }
    }
  }
  else if (type == 'subtract') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= i; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i - j,
        })
      }
    }
  }
  else if (type == 'multiply') {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i,
          q2: j,
          a: i * j,
        })
      }
    }
  }
  else {
    for (var i = low; i <= high; i++) {
      for (var j = low; j <= high; j++) {
        cards.push({
          q1: i * j,
          q2: j,
          a: i,
        })
      }
    }
  }
  entry = '';
  totalTime = new Date();
  working = [];
  complete = [];
  numCorrect = 0;
  for (var i = 0; i < numOfCards; i++) {
    card = Math.floor(Math.random()*(cards.length-1));
    if (working.includes(cards[card])) {
      working.push(Object.assign({}, cards[card]));
    }
    else {
      working.push(cards[card]);
    }
  }
  document.getElementById('afterTest').style.display = "none";
  loop();
}

function draw() {
  // put drawing code here
  background(66, 244, 191);
  fill(50);
  textSize(15);
  text('Completed: ' + complete.length, 25, height-50);
  text('To go: ' + working.length, 25, height-25);
  textSize(10);
  text(parseInt(timeGiven - ((new Date - totalTime)/1000),10), 25, height - 10);
  if (doneCondition() && working.length + complete.length > 0) {
    textSize(50);
    text('RESULTS:', width/2 - 100, height/2 - 50);
    text('Correct: ' + numCorrect, width/2-100, height/2);
    text('Incorrect: ' + (complete.length-numCorrect), width/2-100, height/2+50);
    text('Grade: ' + (100*numCorrect/(complete.length+working.length))+'%', width/2-100, height/2+100);
    noLoop();
  }
  else if (working.length + complete.length > 0)  {
    textSize(15);
    fill(50);
    textSize(40);
    if (type=='add') {
      text('+', 375, 272)
    }
    else if (type=='subtract') {
      text('-', 375, 272)
    }
    else if (type=='multiply') {
      text('*', 375, 272)
    }
    else {
      text('\xF7', 375, 272)
    }
    text(working[current].q1, (500 - ((working[current].q1.toString().length - 1) * 20)), 175);
    text(working[current].q2, (500 - ((working[current].q2.toString().length - 1) * 20)), 275);
    text('____________', 300, 315);
    text(entry, (500 - ((entry.length - 1) * 20)), 375);
  }
}

function doneCondition() {
  if (working.length == 0 || ((new Date - totalTime)/1000) >= timeGiven) {
    if (complete.length != 0) {
    document.getElementById('afterTest').style.display = "block";
    }
    return true;
  }
  return false;
}

function keyPressed() {
  if (keyCode === 49) {
    entry += '1'
  } else if (keyCode === 50) {
    entry += '2'
  } else if (keyCode === 51) {
    entry += '3'
  } else if (keyCode === 52) {
    entry += '4'
  } else if (keyCode === 53) {
    entry += '5'
  } else if (keyCode === 54) {
    entry += '6'
  } else if (keyCode === 55) {
    entry += '7'
  } else if (keyCode === 56) {
    entry += '8'
  } else if (keyCode === 57) {
    entry += '9'
  } else if (keyCode === 48) {
    entry += '0'
  } else if (keyCode === 8) { // BACKSPACE
    entry = entry.slice(0,-1);
  } else if (keyCode === 13) { // ENTER
    if (entry == working[current].a) { // Correct
      numCorrect += 1;
      complete.push(working[current]);
      working.splice(current, 1);
      entry = ''
    }
    else { // Incorrect
      complete.push(working[current]);
      working.splice(current, 1);
      entry = ''
    }
  }
}
