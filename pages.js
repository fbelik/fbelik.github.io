const pageNames = ["home", "research", "teaching"];

const buttons = pageNames.map((_, i) =>
    document.getElementById(`page${i}button`)
);

const pages = pageNames.map((_, i) =>
    document.getElementById(`page${i}`)
);

function showPage(pageName) {
    let activeIndex = pageNames.indexOf(pageName);

    if (activeIndex === -1) {
        activeIndex = 0;
    }

    pages.forEach((page, index) => {
        page.style.display = index === activeIndex ? "block" : "none";

        if (index === activeIndex) {
            buttons[index].setAttribute("aria-current", "page");
        } else {
            buttons[index].removeAttribute("aria-current");
        }
    });
}

buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
        window.location.hash = pageNames[index];
    });
});

window.addEventListener("hashchange", () => {
    showPage(window.location.hash.slice(1));
});

const initialPage = window.location.hash.slice(1);

if (pageNames.includes(initialPage)) {
    showPage(initialPage);
} else {
    history.replaceState(null, "", "#home");
    showPage("home");
}