var sizeScale = 1.0;

var boxOn = 0;
var waitEnter = false;
var updateSuggestion = true;
var won = false;
const lpad = 20;
const x0 = 50;
const dx = 50;
const y0 = 100;
const dy = 50;
const gap = 5;


const chars = [];
const states = [];
for (var i=0; i<6; i++) {
    chars.push([]);
    states.push([]);
    for (var j=0; j<5; j++) {
        chars[i].push("");
        states[i].push(0);
    }
}

var suggestions = "";
var alpha_value = 2.8624;

var fullDict = [];

var slider;
var output;
var button;

window.onload = function () {
    slider = document.getElementById("myRange");
    output = document.getElementById("sliderText");
    button = document.getElementById("sliderButton");
    slider.value = Math.log2(alpha_value);
    output.innerHTML = Math.pow(2, slider.value);
    slider.oninput = function() {
        output.innerHTML = Math.pow(2, this.value);
        alpha_value = parseFloat(output.innerHTML);
    }
    button.onclick = function() {
        updateSuggestion = true;
    }
    updateSuggestion = true;
}

function setup() {
  // put setup code here
  sizeScale = Math.min(2.0, 1.0 * (windowWidth / 1200));
  var cnv = createCanvas(windowWidth-20, (y0 + (dy+gap)*6 + dy) * sizeScale);
//   var x = (windowWidth - width) / 2;
//   var p = cnv.position();
//   cnv.position(x, p.y);
  cnv.parent('sketch-holder');
  frameRate(15);
}

function windowResized() {
    sizeScale = Math.min(2.0, 1.0 * (windowWidth / 1200));
    resizeCanvas(windowWidth-20, (y0 + (dy+gap)*6 + dy) * sizeScale);
}

function word_score(word,word_bank) {
    // score[1] is expected greens, score[2] is expected yellows
    const score = [0,0];
    for (let m=0; m<word_bank.length; m++) {
        const other_word = word_bank[m];
        const yel_offset_dict = new Array(26);
        for (let j=0; j<26; j++) {
            yel_offset_dict[j] = 0;
        }
        for (let i=0; i<5; i++) {
            const char_idx = word.charCodeAt(i) - 97;
            if (other_word[i] == word[i]) {
                score[0]+=1;
            }
            else if (other_word.slice(yel_offset_dict[char_idx],5).indexOf(word[i]) != -1) {
                const idx_found = other_word.slice(yel_offset_dict[char_idx],5).indexOf(word[i]) + yel_offset_dict[char_idx];
                if (word[idx_found] != other_word[idx_found]) {
                    score[1]+=1;
                    yel_offset_dict[char_idx] = idx_found + 1;
                }
                else if (other_word.slice(idx_found+1,5).indexOf(word[i]) != -1) {
                    score[1]+=1;
                    yel_offset_dict[char_idx] = other_word.slice(idx_found+1,5).indexOf(word[i]) + idx_found + 1;
                }
            }
        }
    }
    score[0] /= word_bank.length;
    score[1] /= word_bank.length;
    return score;
}

function rank_guesses(word_bank,N,strategy) {
    // Generate a list of words with their associated scores
    const guess_scores = [];
    for (let i=0; i<word_bank.length; i++) {
        const word = word_bank[i];
        guess_scores.push([word,word_score(word,word_bank)]);
    }
    // Sort scores per strategy
    function sortby(a,b) {
        return b[1][0]*strategy[0] + b[1][1]*strategy[1] - a[1][0]*strategy[0] - a[1][1]*strategy[1];
    }
    guess_scores.sort(sortby);
    const res = guess_scores.slice(0, Math.min(N, word_bank.length));
    return res;
}

function readDict() {
    fullDict = [];
    var txtFile = new XMLHttpRequest();
    txtFile.open("GET", "https://raw.githubusercontent.com/fbelik/Wordle/main/wordledict.csv", true);
    txtFile.onreadystatechange = function() {
        fullDict = txtFile.responseText.split(/,\n|\n/).slice(1);
    };
    txtFile.send();
}

function remove_from_list(word,res,word_list) {
    const new_list = [];
    for (var m=0; m<word_list.length; m++) {
        const other_word = word_list[m];
        var keep = true
        const check = [];
        for (var i=0; i<26; i++) {
            check.push([0,1,2,3,4]);
        }
        // Check for greens
        for (var i=0; i<5; i++) {
            const char_idx = word.charCodeAt(i) - 97;
            if (res[i] == 2) {
                if (other_word[i] != word[i]) {
                    keep = false;
                    break;
                }
                // No longer check that index for yellows/greys
                const idx = check[char_idx].indexOf(i);
                if (idx != -1) {
                    check[char_idx].splice(idx, 1);
                }
                // deleteat!(check[char_idx], findall(x->x==i,check[char_idx]))
            }
        }
        if (!keep)
            continue

        // Check for yellows 
        for (var i=0; i<5; i++) {
            const char_idx = word.charCodeAt(i) - 97;
            if (res[i] == 1) {
                var checkOthers = false;
                for (var j=0; j<check[char_idx].length; j++) {
                    if (word[i] == other_word[check[char_idx][j]]) {
                        checkOthers = true;
                    }
                }
                if (other_word[i] == word[i] || !checkOthers) {
                    keep = false;
                    break;
                }
                // No longer check that index for yellows/greys
                var other_idx = 0;
                while (true) {
                    if (other_idx == 5 || (check[char_idx].indexOf(other_idx) != -1 && other_word[other_idx] == word[i])) {
                        break;
                    }
                    other_idx+=1;
                }
                const idx = check[char_idx].indexOf(other_idx);
                if (idx != -1) {
                    check[char_idx].splice(idx, 1);
                }
                // deleteat!(check[char_idx], findall(x->x==other_idx,check[char_idx]))
            }
        }
        if (!keep)
            continue;
        
        // Check for greys
        for (var i=0; i<5; i++) {
            const char_idx = word.charCodeAt(i) - 97;
            if (res[i] == 0) {
                var checkOthers = false;
                for (var j=0; j<check[char_idx].length; j++) {
                    if (word[i] == other_word[check[char_idx][j]]) {
                        checkOthers = true;
                    }
                }
                if (checkOthers) {
                    keep = false;
                    break;
                }
            }
        }
        if (keep) {
            new_list.push(other_word);
        }
    }
    return new_list
}

function updateSuggestions() {
    suggestions = "";
    var word_dict = fullDict;
    var guess = 1;
    won = false;
    const colOn = floor(boxOn / 5);
    for (var i=0; i<colOn; i++) {
        const word = chars[i].join('').toLowerCase();
        const res = states[i];
        if (res[0] == 2 && res[1] == 2 && res[2] == 2 && res[3] == 2 && res[4] == 2) {
            suggestions = `Won in ${guess} guesses!\n`;
            won = true;
        }
        word_dict = remove_from_list(word,res,word_dict);
        guess += 1;
    }
	if (!won) {
		for (var i=0; i<guess-1; i++) {
			suggestions = suggestions + `Guess ${i+1}: ${chars[i].join('')}\n`;
        }
		suggestions = suggestions + `You are on guess ${guess}\n`;
		rg = rank_guesses(word_dict,5,[alpha_value,1]);
		suggestions = suggestions + `The top guesses with given strategy are:\n`;
		for (var j=0; j<rg.length; j++) {
			suggestions = suggestions + `   ${rg[j][0].toUpperCase()} with ${rg[j][1][0].toFixed(3)} greens, ${rg[j][1][1].toFixed(3)} yellows expected\n`;
        }
		suggestions = suggestions + `There are ${word_dict.length} possible words remaining\n`;
    }
}

function draw() {
  // put drawing code
  background(25, 25, 25);
  textSize(25 * sizeScale);
  fill(240,237,215);
  text('Wordle Bot', lpad + 120 * sizeScale, 50 * sizeScale);
  // Draw rectangles
  for (var i=0; i<6; i++) {
    for (var j=0; j<5; j++) {
        if (states[i][j] == 0) {
            fill(25, 25, 25);
        }
        else if (states[i][j] == 1) {
            fill(172,157,78);
        }
        else {
            fill(100,137,137);
        }
        rect(lpad + (x0 + (dx+gap)*j) * sizeScale, (y0 + (dy+gap)*i) * sizeScale, dx * sizeScale, dy * sizeScale);
        fill(240,237,215);
        text(chars[i][j], lpad + (18 + x0 + (dx+gap)*j) * sizeScale, (35 + y0 + (dy+gap)*i) * sizeScale);
    }
  }
  if (fullDict.length == 0) {
    readDict();
  }
  if (updateSuggestion && fullDict.length > 0 && suggestions != "LOADING") {
    suggestions = "LOADING";
  }
  else if (updateSuggestion && fullDict.length > 0) {
    suggestions = "LOADING";
    textSize(20 * sizeScale);
    fill(240,237,215);
    text(suggestions, lpad + 350 * sizeScale, 50 * sizeScale);
    updateSuggestion = false;
    updateSuggestions();
  }
  textSize(20 * sizeScale);
  fill(240,237,215);
  text(suggestions, lpad + 350 * sizeScale, 110 * sizeScale);
}

function keyPressed() {
    if (keyCode >= 65 && keyCode <= 90 && !won) { // Letter
        if (boxOn <= 29 && !waitEnter) {
            const i = floor(boxOn/5);
            const j = boxOn % 5;
            chars[i][j] = String.fromCharCode(keyCode);
            boxOn+=1;
            if (boxOn % 5 == 0) { // Must hit enter to go to next row
                waitEnter = true;
            }
        }
    }
    else if (keyCode === 8) { // BACKSPACE
        if (boxOn >= 1) {
            if (boxOn % 5 == 0 && waitEnter == false) {
                waitEnter = false;
                updateSuggestion = true;
            }
            else if (boxOn % 5 == 0 && waitEnter) {
                waitEnter = false;
            }
            boxOn-=1;
            const i = floor(boxOn/5);
            const j = boxOn % 5;
            chars[i][j] = "";
            states[i][j] = 0;
            won = false;
        }
    }
    else if (keyCode === 13 && !won) { // ENTER
        if (boxOn % 5 == 0 && boxOn != 0) {
            waitEnter = false;
            updateSuggestion = true;
        }
    }
    else if (keyCode == 46) { // DELETE
        for (var i=0; i<6; i++) {
            for (var j=0; j<5; j++) {
                chars[i][j] = "";
                states[i][j] = 0;
            }
        }
        boxOn = 0;
        waitEnter = false;
        updateSuggestion = true;
        won = false;
    }
    else if (keyCode >= 49 && keyCode <= 53 && !won) { // 1-5
        var i = floor(boxOn/5);
        if (boxOn % 5 == 0 && waitEnter) {
            i -= 1;
        }
        j = keyCode - 49;
        if (chars[i][j] != "") {
            // Change color
            states[i][j] = (states[i][j] + 1) % 3;
        }
    }
}

function mousePressed() {
    if (!won) {
        for (var i=0; i<6; i++) {
            for (var j=0; j<5; j++) {
                if (mouseX >= lpad + (x0 + (dx+gap)*j)*sizeScale && mouseX <= lpad + (x0 + (dx+gap)*j + dx)*sizeScale && mouseY >= (y0 + (dy+gap)*i)*sizeScale && mouseY <= (y0 + (dy+gap)*i + dy)*sizeScale) {
                    if ((floor(boxOn / 5) == i || (floor(boxOn / 5) == i+1 && boxOn % 5 == 0 && waitEnter)) && chars[i][j] != "") { // Right column and nonempty
                        // Change color
                        states[i][j] = (states[i][j] + 1) % 3;
                    }
                    break;
                }
            }
        }
    }
}