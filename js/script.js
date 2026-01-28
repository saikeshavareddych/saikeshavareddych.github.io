/* ===============================
   TERMINAL TYPING EFFECT
================================ */

const typingElement = document.getElementById("typing");

if (typingElement) {
  const text = "Sai Keshava — DevOps Engineer | AWS | Kubernetes | CI/CD";
  let index = 0;

  function typeEffect() {
    if (index < text.length) {
      typingElement.textContent += text.charAt(index);
      index++;
      setTimeout(typeEffect, 60);
    }
  }

  typeEffect();
}

/* ===============================
   ACTIVE NAVBAR LINK
================================ */

const navLinks = document.querySelectorAll(".nav-links a");
const currentPage = window.location.pathname.split("/").pop();

navLinks.forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});

/* ===============================
   SMOOTH SCROLLING
================================ */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document
      .querySelector(this.getAttribute("href"))
      .scrollIntoView({ behavior: "smooth" });
  });
});

/* ===============================
   SCROLL REVEAL (SUBTLE)
================================ */

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".card, section").forEach(el => {
  observer.observe(el);
});

/* ===============================
   DEV MODE LOG
================================ */

console.log("🚀 DevOps Portfolio Loaded Successfully");
