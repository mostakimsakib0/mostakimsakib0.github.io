// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('active');
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const icon = darkModeToggle.querySelector('i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Load Dark Mode Preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  const icon = darkModeToggle.querySelector('i');
  icon.classList.remove('fa-moon');
  icon.classList.add('fa-sun');
}

// GitHub Contributions Streak (Dynamic Update)
fetch('https://github-contributions-api.jogruber.de/v4/mostakimsakib0')
  .then(response => response.json())
  .then(data => {
    const streak = data.contributions.streak.current;
    const container = document.getElementById('streak-container');
    if (streak > 0) {
      container.innerHTML = `<i class="fas fa-fire"></i> ${streak}-day streak! 🔥`;
    } else {
      container.innerHTML = '<i class="fas fa-calendar"></i> Keep committing daily!';
    }
  })
  .catch(() => {
    document.getElementById('streak-container').innerHTML = '<i class="fas fa-exclamation-triangle"></i> Check GitHub for updates';
  });

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
    navMenu.classList.remove('active'); // Close mobile menu
  });
});
