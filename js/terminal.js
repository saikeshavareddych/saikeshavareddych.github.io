/* =========================================================================
   The hero terminal. Boots once, then hands the prompt over to the visitor.
   This is the one place the site spends its motion budget.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.getElementById("term");
  if (!root) return;

  var out = root.querySelector(".term__out");
  var form = root.querySelector(".term__form");
  var input = root.querySelector(".term__in");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var history = [];
  var histIdx = -1;

  var BUILDS = [
    ["landing-zone", "Multi-cloud landing zone", "projects/multi-cloud-landing-zone.html"],
    ["devsecops", "AWS DevSecOps pipeline", "projects/aws-devsecops-pipeline.html"],
    ["aks", "Azure DevOps to AKS platform", "projects/azure-devops-aks-platform.html"],
    ["observability", "Observability and SLO platform", "projects/observability-slo-platform.html"],
    ["hackathon", "Hackathon platform, 48 hours", "projects/hackathon-platform-48h.html"]
  ];

  /* --- output ---------------------------------------------------------- */
  function write(text, cls) {
    var line = document.createElement("div");
    line.className = "term__line" + (cls ? " " + cls : "");
    line.textContent = text === undefined ? "" : text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
    return line;
  }

  function writeHTML(html, cls) {
    var line = document.createElement("div");
    line.className = "term__line" + (cls ? " " + cls : "");
    line.innerHTML = html;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
    return line;
  }

  function writeAll(rows) {
    rows.forEach(function (r) {
      if (typeof r === "string") write(r);
      else write(r[0], r[1]);
    });
  }

  /* pad for column alignment without tabs */
  function pad(s, n) {
    s = String(s);
    while (s.length < n) s += " ";
    return s;
  }

  /* --- commands -------------------------------------------------------- */
  var COMMANDS = {
    help: function () {
      write("Available commands", "is-sig");
      write("");
      [
        ["whoami", "who you are talking to"],
        ["skills", "what I work with, by depth"],
        ["clouds", "AWS and Azure split"],
        ["builds", "the five reference architectures"],
        ["open <n>", "open build n, e.g. open 3"],
        ["certs", "certification status"],
        ["resume", "view or download the resume"],
        ["contact", "how to reach me"],
        ["experience", "where I have worked"],
        ["education", "degrees"],
        ["clear", "clear this screen"]
      ].forEach(function (c) {
        write("  " + pad(c[0], 12) + c[1]);
      });
    },

    whoami: function () {
      writeAll([
        ["Sai Keshava Reddy Chinthala", "is-sig"],
        "Azure DevOps Engineer at Nexiotron India Pvt Ltd.",
        "",
        ["Hyderabad, India. Open to remote and to relocation.", "is-dim"],
        ["In DevOps since September 2023.", "is-dim"],
        "",
        "Two years of AWS DevOps at Atya Technologies, now on Azure",
        "at Nexiotron. I build the path a commit takes to production:",
        "pipelines, infrastructure as code, and the monitoring that",
        "tells you which layer actually broke."
      ]);
    },

    experience: function () {
      writeAll([
        ["Nexiotron India Pvt Ltd", "is-sig"],
        "  Azure DevOps Engineer          Nov 2025 - present",
        "  Azure architectures, Terraform, Azure Pipelines, Docker",
        "",
        ["Atya Technologies Pvt. Ltd.", "is-sig"],
        "  AWS DevOps Engineer            Sep 2023 - Sep 2025",
        "  40% faster deploys (Jenkins + GitHub Actions)",
        "  25% lower monthly cloud spend (EC2 right-sizing)",
        "  60% less manual setup (Terraform)",
        "  30% better app performance (Nginx reverse proxy)",
        "",
        ["Full detail: /resume.html", "is-dim"]
      ]);
    },

    education: function () {
      writeAll([
        "B.Tech, Electrical and Electronics Engineering",
        ["  Kamala Institute of Technology and Science   2020 - 2023", "is-dim"],
        "",
        "Diploma, Electrical and Electronics Engineering",
        ["  Jyothishmati Institute of Technology         2017 - 2020", "is-dim"]
      ]);
    },

    skills: function () {
      var groups = [
        ["Cloud", "AWS (EC2, S3, VPC, RDS, IAM, CloudWatch) and Azure"],
        ["IaC", "Terraform - modules, remote state, reproducible environments"],
        ["CI/CD", "Jenkins, GitHub Actions, Azure Pipelines, Ansible"],
        ["Containers", "Docker, Kubernetes, registries and image hygiene"],
        ["Monitoring", "Prometheus, Grafana, CloudWatch Logs, Sentry, Uptime Robot"],
        ["Networking", "Nginx, reverse proxying, SSL/TLS, firewalls, IAM policy"],
        ["Systems", "Linux (Ubuntu, CentOS), Bash, Git, Python"]
      ];
      groups.forEach(function (g) {
        writeHTML('<span class="is-sig">' + pad(g[0], 14) + "</span>" + g[1]);
      });
      write("");
      write("Full breakdown with depth ratings: /resume.html", "is-dim");
    },

    clouds: function () {
      writeAll([
        ["AWS", "is-sig"],
        "  EC2, S3, VPC, RDS, IAM, CloudWatch, Elastic Beanstalk,",
        "  CodePipeline and CodeDeploy. Two years of it, daily.",
        "",
        ["Azure", "is-str"],
        "  Highly available architectures, Azure Pipelines and Azure",
        "  DevOps, Terraform-provisioned. What I do now.",
        "",
        ["I have shipped on both. That is the whole pitch.", "is-dim"]
      ]);
    },

    builds: function () {
      write("Five self-directed reference architectures.", "is-sig");
      write("Built on my own time, not client work. For shipped work,", "is-dim");
      write("run 'experience'.", "is-dim");
      write("");
      BUILDS.forEach(function (b, i) {
        writeHTML("  " + pad("[" + (i + 1) + "]", 6) + '<a href="' + b[2] + '">' + b[1] + "</a>");
      });
      write("");
      write("Try: open 5", "is-dim");
    },

    open: function (arg) {
      var n = parseInt(arg, 10);
      if (!n || n < 1 || n > BUILDS.length) {
        write("open: expected a build number between 1 and " + BUILDS.length, "is-alert");
        write("Run 'builds' to list them.", "is-dim");
        return;
      }
      var b = BUILDS[n - 1];
      write("Opening " + b[1] + "...", "is-ok");
      setTimeout(function () { window.location.href = b[2]; }, 380);
    },

    certs: function () {
      writeAll([
        ["No certifications held yet. Four in preparation:", "is-sig"],
        "",
        "  AWS Certified Solutions Architect - Associate",
        "  Microsoft AZ-400  DevOps Engineer Expert",
        "  HashiCorp Terraform Associate",
        "  CKA  Certified Kubernetes Administrator",
        "",
        ["Listed as in-progress on purpose. I would rather you", "is-dim"],
        ["read an honest status than a padded one.", "is-dim"]
      ]);
    },

    resume: function () {
      writeHTML('Resume: <a href="resume.html">resume.html</a> - view inline or download.');
    },

    contact: function () {
      writeHTML('  email     <a href="mailto:saikeshavareddych@gmail.com">saikeshavareddych@gmail.com</a>');
      writeHTML('  phone     <a href="tel:+917729066003">+91 77290 66003</a>');
      writeHTML('  linkedin  <a href="https://www.linkedin.com/in/saikeshavareddy/" target="_blank" rel="noopener">linkedin.com/in/saikeshavareddy</a>');
      writeHTML('  github    <a href="https://github.com/saikeshavareddych" target="_blank" rel="noopener">github.com/saikeshavareddych</a>');
      write("");
      write("Open to remote roles and to relocating.", "is-ok");
    },

    clear: function () {
      out.innerHTML = "";
    },

    sudo: function (arg) {
      if (/hire/i.test(arg || "")) {
        write("Permission granted.", "is-ok");
        writeHTML('Next step: <a href="mailto:saikeshavareddych@gmail.com?subject=Role%20discussion">send me a role</a>.');
        return;
      }
      write("saikeshava is not in the sudoers file. This incident has been logged.", "is-alert");
      write("(It has not. There is no backend. It is a static site.)", "is-dim");
    },

    exit: function () {
      write("There is no exit. Only the scroll below.", "is-dim");
    }
  };

  var ALIASES = { ls: "builds", projects: "builds", "?": "help", man: "help", cat: "builds", cd: "exit", pwd: "whoami", about: "whoami", work: "experience", jobs: "experience", exp: "experience", edu: "education", hire: "contact", email: "contact", phone: "contact" };

  function run(raw) {
    var line = raw.trim();
    writeHTML('<span class="is-sig">visitor@saikeshava:~$</span> ' + escapeHTML(line));
    if (!line) return;

    history.unshift(line);
    histIdx = -1;

    var parts = line.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts.slice(1).join(" ");

    if (ALIASES[cmd]) cmd = ALIASES[cmd];

    if (COMMANDS[cmd]) {
      COMMANDS[cmd](arg);
    } else {
      write("command not found: " + cmd, "is-alert");
      write("Type 'help' for the list.", "is-dim");
    }
    write("");
  }

  function escapeHTML(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* --- boot ------------------------------------------------------------ */
  var BOOT = [
    ["$ whoami", null],
    ["sai keshava reddy chinthala - azure devops engineer", "is-sig"],
    ["", null],
    ["$ terraform workspace list", null],
    ["  aws-prod      ok", "is-ok"],
    ["  azure-prod    ok", "is-ok"],
    ["", null],
    ["$ history --since 2023-09", null],
    ["  atya technologies   aws devops    2 years", "is-ok"],
    ["  nexiotron           azure devops  current", "is-ok"],
    ["", null],
    ["This terminal is real. Type a command - start with 'help'.", "is-dim"],
    ["", null]
  ];

  function boot(done) {
    if (reduced) {
      BOOT.forEach(function (l) { write(l[0], l[1]); });
      done();
      return;
    }
    var i = 0;
    (function next() {
      if (i >= BOOT.length) { done(); return; }
      var row = BOOT[i++];
      if (!row[0]) { write("", row[1]); setTimeout(next, 40); return; }
      var el = write("", row[1]);
      var c = 0;
      (function type() {
        if (c <= row[0].length) {
          el.textContent = row[0].slice(0, c++);
          out.scrollTop = out.scrollHeight;
          setTimeout(type, 11);
        } else {
          setTimeout(next, 90);
        }
      })();
    })();
  }

  /* --- wire up --------------------------------------------------------- */
  form.hidden = true;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (histIdx < history.length - 1) input.value = history[++histIdx];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx > 0) input.value = history[--histIdx];
      else { histIdx = -1; input.value = ""; }
    }
  });

  /* clicking anywhere in the shell focuses the prompt, like a real one */
  root.addEventListener("click", function (e) {
    if (e.target.tagName === "A") return;
    if (window.getSelection().toString()) return;
    input.focus();
  });

  /* Boot only once the hero is actually looked at */
  var started = false;
  function start() {
    if (started) return;
    started = true;
    boot(function () {
      form.hidden = false;
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { start(); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(root);
  } else {
    start();
  }
})();
