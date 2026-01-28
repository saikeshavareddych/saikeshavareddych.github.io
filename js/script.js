// Terminal typing
const text = "Sai Keshava — DevOps Engineer | AWS | CI/CD | Kubernetes";
let i = 0;
const target = document.getElementById("typing");

function type() {
  if (target && i < text.length) {
    target.textContent += text.charAt(i);
    i++;
    setTimeout(type, 60);
  }
}
type();

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
    }
  });
});

document.querySelectorAll(".card, section").forEach(el => {
  observer.observe(el);
});

console.log("🚀 Landing page loaded");
