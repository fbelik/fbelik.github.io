const themeSelect = document.getElementById('theme-select');
const setTheme = theme => {
    document.documentElement.className = theme;
    themeSelect.value = theme;
    localStorage.setItem('theme', theme);
}
const getTheme = () => {
    const theme = localStorage.getItem('theme');
    theme && setTheme(theme);
    return theme;
}

getTheme();
themeSelect.addEventListener('change', function() {
  setTheme(this.value);
});