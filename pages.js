const bts = [];
const pgs = [];
for (var i=0; i<3; i++) {
    bts.push(document.getElementById(`page${i}button`));
    pgs.push(document.getElementById(`page${i}`));
}

for (var i=0; i<3; i++) {
    const btn = bts[i];
    const thisi = i;
    btn.addEventListener("click", function(){
        for (var j=0; j<3; j++) {
            pgs[j].style.display = "none";   
        }
        pgs[thisi].style.display = "inline";
    });
}