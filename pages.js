const pageNames = ["home", "research", "teaching"];
const sectionPages = {
    mor: "research",
    fluids: "research",
    caratheodory: "research",
    saps34: "research",
    mcmicm: "research",
    pass: "research",
    twitter: "research",
    coursenotes: "teaching"
};

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

function showRoute(route) {
    const pageName = pageNames.includes(route) ? route : sectionPages[route];
    showPage(pageName || "home");

    window.setTimeout(() => {
        if (sectionPages[route]) {
            document.getElementById(route)?.scrollIntoView({
                behavior: "auto",
                block: "start",
                inline: "nearest"
            });
        } else {
            window.scrollTo(0, 0);
        }
    }, 50);
}

buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
        const pageName = pageNames[index];

        if (window.location.hash === `#${pageName}`) {
            showRoute(pageName);
        } else {
            window.location.hash = pageName;
        }
    });
});

window.addEventListener("hashchange", () => {
    showRoute(window.location.hash.slice(1));
});

const initialRoute = window.location.hash.slice(1);

if (pageNames.includes(initialRoute) || sectionPages[initialRoute]) {
    showRoute(initialRoute);
} else {
    history.replaceState(null, "", "#home");
    showRoute("home");
}
