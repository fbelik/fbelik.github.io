var sizeScale = 1.0;
var keyboardSizeScale = 1.0;

var boxOn = 0;
var waitEnter = false;
var updateSuggestion = true;
var won = false;
const lpad = 0;
const x0 = 50;
const dx = 50;
const y0 = 100;
const dy = 50;
const gap = 5;
const dxkey = 50;
const dykey = 50;


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

var alpha_value = 2.8624;

var fullDict = [];
var extendedDict = [];
var extendedDictState = "loading";
const EXTENDED_DICT_THRESHOLD = 1000;

var slider;
var output;
var button;
var solverMode;
var heuristicControls;
var gameStatus;
var suggestionHeading;
var suggestionList;
var remainingWords;
var useExtendedDict;
var extendedDictStatus;
var resetButton;

window.onload = function () {
    slider = document.getElementById("myRange");
    output = document.getElementById("sliderText");
    button = document.getElementById("sliderButton");
    solverMode = document.getElementById("solverMode");
    heuristicControls = document.getElementById("heuristicControls");
    gameStatus = document.getElementById("gameStatus");
    suggestionHeading = document.getElementById("suggestionHeading");
    suggestionList = document.getElementById("suggestionList");
    remainingWords = document.getElementById("remainingWords");
    useExtendedDict = document.getElementById("useExtendedDict");
    extendedDictStatus = document.getElementById("extendedDictStatus");
    resetButton = document.getElementById("resetButton");
    slider.value = Math.log2(alpha_value);
    output.innerHTML = Math.pow(2, slider.value);
    slider.oninput = function() {
        output.innerHTML = Math.pow(2, this.value);
        alpha_value = parseFloat(output.innerHTML);
    }
    button.onclick = function() {
        updateSuggestion = true;
    }
    solverMode.onchange = function() {
        heuristicControls.hidden = solverMode.value === "entropy";
        updateSuggestion = true;
    }
    useExtendedDict.onchange = function() {
        updateSuggestion = true;
    }
    resetButton.onclick = resetBoard;
    heuristicControls.hidden = solverMode.value === "entropy";
    readExtendedDict();
    updateSuggestion = true;
}

var cnv;
function setup() {
  // put setup code here
  updateLayoutScale();
  cnv = createCanvas(canvasWidth(), canvasHeight());
//   var x = (window.innerWidth - width) / 2;
//   var p = cnv.position();
//   cnv.position(x, p.y);
  cnv.parent('sketch-holder');
  frameRate(15);
}

function windowResized() {
    updateLayoutScale();
    resizeCanvas(canvasWidth(), canvasHeight());
}

function updateLayoutScale() {
    const viewport = viewportWidth();
    if (isCompactLayout()) {
        // The board uses most of a phone's width. The wider ten-key row spans
        // the canvas independently, giving its touch targets more room.
        sizeScale = Math.min(1.0, viewport / 400);
        const availableKeyboardWidth = viewport - 24;
        keyboardSizeScale = Math.min(1.0, availableKeyboardWidth / (dxkey * 10 + gap * 9));
    }
    else {
        sizeScale = Math.min(2.0, viewport / 1200);
        // Make the desktop keyboard a supporting element rather than the
        // dominant part of the canvas.
        keyboardSizeScale = sizeScale * 0.8;
    }
}

function canvasWidth() {
    if (isCompactLayout()) {
        return viewportWidth() - 20;
    }
    const keyboardRightEdge = keyboardLeftEdge() + (dxkey * 10 + gap * 9) * keyboardSizeScale;
    return Math.min(viewportWidth() - 20, keyboardRightEdge + 32);
}

function canvasHeight() {
    return keyboardTop() + (dykey * 3 + gap * 2) * keyboardSizeScale + 60 * sizeScale;
}

function keyboardTop() {
    return (y0 + (dy + gap) * 5 + y0) * sizeScale;
}

function keyboardLeftOffset() {
    return isCompactLayout() ? 0 : -20 * keyboardSizeScale;
}

function keyboardLeftEdge() {
    return isCompactLayout() ? 2 : lpad + x0 * sizeScale + keyboardLeftOffset();
}

function viewportWidth() {
    return document.documentElement.clientWidth;
}

function isCompactLayout() {
    return window.matchMedia("(max-width: 800px)").matches;
}

function keyboardKeyX(row, column) {
    const rowIndent = row > 0 ? dxkey * 0.5 * keyboardSizeScale : 0;
    return keyboardLeftEdge() + rowIndent + (dxkey + gap) * column * keyboardSizeScale;
}

function keyboardKeyY(row) {
    return keyboardTop() + (dykey + gap) * row * keyboardSizeScale;
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

function rank_guesses(guess_bank, answer_bank, N, strategy) {
    // Generate a list of words with their associated scores
    const guess_scores = [];
    for (let i=0; i<guess_bank.length; i++) {
        const word = guess_bank[i];
        guess_scores.push([word,word_score(word,answer_bank)]);
    }
    // Sort scores per strategy
    function sortby(a,b) {
        return b[1][0]*strategy[0] + b[1][1]*strategy[1] - a[1][0]*strategy[0] - a[1][1]*strategy[1];
    }
    guess_scores.sort(sortby);
    const res = guess_scores.slice(0, Math.min(N, guess_bank.length));
    return res;
}

// Return the feedback a guess would receive if `answer` were the solution.
// Encoding grey, yellow, and green as 0, 1, and 2 respectively makes each
// possible feedback result a convenient key for an entropy bucket.
function feedback_pattern(guess, answer) {
    const feedback = [0, 0, 0, 0, 0];
    const remainingLetters = {};

    // Greens are assigned first. This is important for words with repeated
    // letters: only unmatched answer letters can subsequently become yellow.
    for (let i = 0; i < 5; i++) {
        if (guess[i] === answer[i]) {
            feedback[i] = 2;
        }
        else {
            remainingLetters[answer[i]] = (remainingLetters[answer[i]] || 0) + 1;
        }
    }

    for (let i = 0; i < 5; i++) {
        if (feedback[i] === 0 && remainingLetters[guess[i]] > 0) {
            feedback[i] = 1;
            remainingLetters[guess[i]] -= 1;
        }
    }
    return feedback.join('');
}

function entropy_score(guess, answer_bank) {
    const patternCounts = {};

    for (let i = 0; i < answer_bank.length; i++) {
        const pattern = feedback_pattern(guess, answer_bank[i]);
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    let entropy = 0;
    for (const pattern in patternCounts) {
        const probability = patternCounts[pattern] / answer_bank.length;
        entropy -= probability * Math.log2(probability);
    }
    return entropy;
}

function rank_entropy_guesses(guess_bank, answer_bank, N) {
    const guessScores = [];
    for (let i = 0; i < guess_bank.length; i++) {
        const word = guess_bank[i];
        guessScores.push([word, entropy_score(word, answer_bank)]);
    }
    guessScores.sort(function(a, b) {
        return b[1] - a[1];
    });
    return guessScores.slice(0, Math.min(N, guess_bank.length));
}

function readDict() {
    fullDict = [];
    var txtFile = new XMLHttpRequest();
    txtFile.open("GET", "https://raw.githubusercontent.com/fbelik/Wordle/main/wordledict.csv", true);
    txtFile.onreadystatechange = function() {
        fullDict = txtFile.responseText
            .split(/,\n|\n/)
            .slice(1)
            .filter(word => word.length === 5);
    };
    txtFile.send();
}

function readExtendedDict() {
    var txtFile = new XMLHttpRequest();
    // txtFile.open("GET", "extendeddict.csv", true);
    txtFile.open("GET", "https://raw.githubusercontent.com/fbelik/Wordle/main/extendeddict.csv", true);
    txtFile.onreadystatechange = function() {
        if (txtFile.readyState === 4) {
            if (txtFile.status === 200) {
                extendedDict = txtFile.responseText
                    .split(/\r?\n/)
                    .map(word => word.trim().toLowerCase())
                    .filter(word => /^[a-z]{5}$/.test(word));
                extendedDictState = extendedDict.length > 0 ? "ready" : "error";
            }
            else {
                extendedDictState = "error";
            }
            updateSuggestion = true;
        }
    };
    txtFile.onerror = function() {
        extendedDictState = "error";
        updateSuggestion = true;
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
                if (word[i] == other_word[i] || checkOthers) {
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

function displayRankedGuesses(rankedGuesses, mode, dictionaryLabel) {
    suggestionList.replaceChildren();
    suggestionHeading.textContent = mode === "entropy"
        ? "Top 20 by Shannon entropy"
        : "Top 20 by expected greens/yellows";
    if (dictionaryLabel) {
        suggestionHeading.textContent += ` (${dictionaryLabel})`;
    }

    for (let i = 0; i < rankedGuesses.length; i++) {
        const listItem = document.createElement("li");
        const word = rankedGuesses[i][0].toUpperCase();
        if (mode === "entropy") {
            listItem.textContent = `${word} — ${rankedGuesses[i][1].toFixed(3)} bits`;
        }
        else {
            const score = rankedGuesses[i][1];
            listItem.textContent = `${word} — ${score[0].toFixed(3)} greens, ${score[1].toFixed(3)} yellows`;
        }
        suggestionList.appendChild(listItem);
    }
}

function updateExtendedDictionaryControl(completedGuesses, extendedCandidates) {
    useExtendedDict.checked = useExtendedDict.checked && extendedCandidates.length <= EXTENDED_DICT_THRESHOLD;

    if (extendedDictState === "error") {
        useExtendedDict.checked = false;
        useExtendedDict.disabled = true;
        extendedDictStatus.textContent = `Expanded dictionary could not be loaded.`;
    }
    else if (completedGuesses === 0) {
        useExtendedDict.checked = false;
        useExtendedDict.disabled = true;
        extendedDictStatus.textContent = `Expanded dictionary becomes available after the first completed guess.`;
    }
    else if (extendedDictState === "loading") {
        useExtendedDict.checked = false;
        useExtendedDict.disabled = true;
        extendedDictStatus.textContent = `Loading expanded dictionary…`;
    }
    else if (extendedCandidates.length === 0) {
        useExtendedDict.checked = false;
        useExtendedDict.disabled = true;
        extendedDictStatus.textContent = `No expanded candidates match the entered feedback.`;
    }
    else if (extendedCandidates.length > EXTENDED_DICT_THRESHOLD) {
        useExtendedDict.checked = false;
        useExtendedDict.disabled = true;
        extendedDictStatus.textContent = `${extendedCandidates.length} expanded candidates remain. Available at ${EXTENDED_DICT_THRESHOLD} or fewer.`;
    }
    else {
        useExtendedDict.disabled = false;
        extendedDictStatus.textContent = `${extendedCandidates.length} expanded candidates remain. You can now switch dictionaries.`;
    }
}

function updateSuggestions() {
    var word_dict = fullDict;
    var guess = 1;
    won = false;
    const colOn = floor(boxOn / 5);
    for (var i=0; i<colOn; i++) {
        const word = chars[i].join('').toLowerCase();
        const res = states[i];
        if (res[0] == 2 && res[1] == 2 && res[2] == 2 && res[3] == 2 && res[4] == 2) {
            won = true;
        }
        word_dict = remove_from_list(word,res,word_dict);
        guess += 1;
	}
	if (!won) {
		const completedGuessCount = guess - 1;
		let extendedCandidates = [];
		if (completedGuessCount > 0 && extendedDict.length > 0) {
			extendedCandidates = extendedDict;
			for (var i=0; i<completedGuessCount; i++) {
				extendedCandidates = remove_from_list(chars[i].join('').toLowerCase(), states[i], extendedCandidates);
            }
        }
		updateExtendedDictionaryControl(completedGuessCount, extendedCandidates);
		const usingExtendedDictionary = extendedDictState === "ready"
			&& !useExtendedDict.disabled
			&& useExtendedDict.checked
			&& extendedCandidates.length > 0;
		const activeDictionary = usingExtendedDictionary ? extendedCandidates : word_dict;
		const dictionaryLabel = usingExtendedDictionary ? "expanded dictionary" : "original dictionary";
		const completedGuesses = [];
		for (var i=0; i<guess-1; i++) {
			completedGuesses.push(`Guess ${i+1}: ${chars[i].join('')}`);
        }
		gameStatus.textContent = `${completedGuesses.join("\n")}${completedGuesses.length ? "\n" : ""}You are on guess ${guess}.`;
		if (solverMode.value === "entropy") {
			displayRankedGuesses(rank_entropy_guesses(activeDictionary, activeDictionary, 20), "entropy", dictionaryLabel);
		}
		else {
			displayRankedGuesses(rank_guesses(activeDictionary, activeDictionary, 20, [alpha_value, 1]), "heuristic", dictionaryLabel);
		}
		remainingWords.textContent = `${activeDictionary.length} possible words remaining.`;
    }
    else {
        gameStatus.textContent = `Won in ${guess - 1} guesses!`;
        suggestionHeading.textContent = "Suggestions";
        suggestionList.replaceChildren();
        remainingWords.textContent = "";
    }
}

var keyboardKeys = [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['→','Z','X','C','V','B','N','M','←']];

function virtualKeyCode(key) {
    if (key === '→') {
        return 13; // Enter
    }
    if (key === '←') {
        return 8; // Backspace
    }
    return key.charCodeAt(0);
}

function resetBoard() {
    for (var i = 0; i < 6; i++) {
        for (var j = 0; j < 5; j++) {
            chars[i][j] = "";
            states[i][j] = 0;
        }
    }
    boxOn = 0;
    waitEnter = false;
    updateSuggestion = true;
    won = false;
}

function draw() {
  // put drawing code
  background(25, 25, 25);
  textSize(25 * sizeScale);
  fill(240,237,215);
  textAlign(CENTER, BASELINE);
  //text('Wordle Bot', lpad + (x0 + (dx + gap) * 2 + dx / 2) * sizeScale, 50 * sizeScale);
  text('Wordle Bot', lpad + (x0 + (dx + gap) * 2 + dx / 2) * sizeScale, 50 * sizeScale);
  textAlign(LEFT, BASELINE);
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
  // Draw keyboard
  //   textSize(18 * sizeScale);
  textSize(25 * keyboardSizeScale);
  for (var i=0; i<3; i++) {
    var j = 0;
    for (var j=0; j<keyboardKeys[i].length; j++) {
        fill(200,200,200);
        rect(keyboardKeyX(i, j), keyboardKeyY(i), dxkey * keyboardSizeScale, dykey * keyboardSizeScale);
        fill(0,0,0);
        text(keyboardKeys[i][j], keyboardKeyX(i, j) + 18 * keyboardSizeScale, keyboardKeyY(i) + 35 * keyboardSizeScale);
    }
  }
  if (fullDict.length == 0) {
    readDict();
  }
  if (updateSuggestion && fullDict.length > 0) {
    updateSuggestion = false;
    updateSuggestions();
  }
}

function myKeyPressed(keyCode) {
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
    else if (keyCode === 8|| keyCode == 60) { // BACKSPACE
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
    else if (keyCode === 13 || keyCode == 45 && !won) { // ENTER
        if (boxOn % 5 == 0 && boxOn != 0) {
            waitEnter = false;
            updateSuggestion = true;
        }
    }
    else if (keyCode == 46) { // DELETE
        resetBoard();
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

function keyPressed() {
    myKeyPressed(keyCode);
}

function mouseReleased() {
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
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < keyboardKeys[i].length; j++) {
                if (mouseX >= keyboardKeyX(i, j) && mouseX <= keyboardKeyX(i, j) + dxkey * keyboardSizeScale && mouseY >= keyboardKeyY(i) && mouseY <= keyboardKeyY(i) + dykey * keyboardSizeScale) {
                    // dispatchEvent(new KeyboardEvent('keypress', {'key': keyboardKeys[i][j]}));
                    myKeyPressed(virtualKeyCode(keyboardKeys[i][j]));
                    break;
                }
            }
        }
    }
}
