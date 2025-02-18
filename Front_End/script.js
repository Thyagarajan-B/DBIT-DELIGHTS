console.log("JavaScript started....");
window.onload = () => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
    });
};

const hamburgerMenu = document.getElementById('hamburgerMenu');
const closeMenu = document.getElementById('closeMenu');
const navLinks = document.getElementById('menu');

hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.add('active');
    closeMenu.style.display = 'block';
    hamburgerMenu.style.display = 'none';
});

closeMenu.addEventListener('click', () => {
    navLinks.classList.remove('active');
    closeMenu.style.display = 'none';
    hamburgerMenu.style.display = 'flex';
});
