function setup() {
  // put setup code here
  var canvas = createCanvas(1000,430);
  // Allow canvas to be in middle of page
  canvas.parent('sketch-holder');
}

var cards = [];

for (var i = 0; i < 13; i++) {
  for (var j = 0; j < 13; j++) {
    cards.push({
      q1: i,
      q2: j,
      a: i + j,
      status: 'a'
    })
  }
}

var entry = '';
var time = new Date();

var working = [];
var complete = [];
var numOfCards = 10;
var timeGiven = 4.5;
var s1 = 0;
var s2 = 0;
var s3 = 0;
var correction;
var a;
var prev;

for (var i = 0; i < numOfCards; i++) {
  card = Math.floor(Math.random()*(cards.length-1));
  if (working.includes(cards[card])) {
    working.push(Object.assign({}, cards[card]));
  }
  else {
    working.push(cards[card]);
  }
}

var current = Math.floor(Math.random()* (working.length-1));

function submitValues() {
  var selectedNum = document.getElementById('numCards').value;
  numOfCards = parseInt(selectedNum, 10);
  if (isNaN(numOfCards) || numOfCards < 0) {
    numOfCards = 10;
  }
  var low = parseInt(document.getElementById('low').value, 10);
  if (isNaN(low) || low < 0) {
    low = 0;
  }
  var high = parseInt(document.getElementById('high').value, 10);
  if (isNaN(high) || high < low) {
    high = low + 12;
  }
  timeGiven = document.getElementById('time').value / 100;
  cards = [];
  for (var i = low; i <= high; i++) {
    for (var j = low; j <= high; j++) {
      cards.push({
        q1: i,
        q2: j,
        a: i + j,
        status: 'a'
      })
    }
  }
  working = [];
  complete = [];
  entry = ''
  for (var i = 0; i < numOfCards; i++) {
    card = Math.floor(Math.random()*(cards.length-1));
    if (working.includes(cards[card])) {
      working.push(Object.assign({}, cards[card]));
    }
    else {
      working.push(cards[card]);
    }
  }
  current = Math.floor(Math.random()* (working.length-1));
  time = new Date();
  loop();
}

function draw() {
  // put drawing code here
  background(255, 77, 77);
  textSize(25);
  fill(50);
  text('Addition Practice', 400, 50);
  textSize(15);
  s1 = 0;
  s2 = 0;
  s3 = complete.length
  for (var i = 0; i < working.length; i++) {
    if (working[i].status == 'a') {
      s1 += 1;
    }
    else {
      s2 += 1;
    }
  }
  text('To learn: ' + s1, 25, 75);
  text('Got once: ' + s2, 25, 100);
  text('Done: ' + s3, 25, 125);
  if (winCondition()) {
    textSize(75);
    fill(256, 0, 0);
    text('YOU WIN!', 325, 200);
    noLoop();
  }
  else {
    textSize(15);
    fill(50);
    textSize(40);
    text('+', 375, 272)
    text(working[current].q1, (500 - ((working[current].q1.toString().length - 1) * 20)), 175);
    text(working[current].q2, (500 - ((working[current].q2.toString().length - 1) * 20)), 275);
    text('____________', 300, 315);
    text(entry, (500 - ((entry.length - 1) * 20)), 375);
    if (new Date() - a < 1000 && correction == true) {
      entry = 'ALMOST: ' + (working[current].a);
    }
    else if (correction == true) {
      entry = '';
      correction = false;
    }
  }
}

function winCondition() {
  if (complete.length == numOfCards) {
    return true
  }
  return false
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
      elapsed = new Date() - time;
      if (working[current].status == 'a' && elapsed < timeGiven*1000) {
        working[current].status = 'b';
      }
      else if (working[current].status == 'b' && elapsed < timeGiven*1000) {
        complete.push(working[current]);
        working.splice(current, 1);
      }
      prev = current;
      current = Math.floor(Math.random()* (working.length-1));
      if (current == prev) {
        current -= 1;
      }
      if (current == -1) {
        current = working.length - 1;
      }
      entry = ''
      time = new Date();
    }
    else {
      correction = true;
      a = new Date();
      time = new Date();
    }
  }
}
