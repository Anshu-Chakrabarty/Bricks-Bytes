(function () {
  document.documentElement.classList.add("js");
  var page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach(function (link) {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
  });

  var header = document.querySelector("[data-header]");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  var solidHeader = document.body.dataset.header === "solid";
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", solidHeader || window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        document.body.classList.remove("nav-open");
      });
    });
  }

  document.querySelectorAll("[data-slider]").forEach(initHero);
  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
  initForm();

  function initHero(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    if (!slides.length) return;
    var index = 0;
    var timer = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function go(next) {
      slides[index].classList.remove("is-active");
      index = (next + slides.length) % slides.length;
      slides[index].classList.add("is-active");
    }

    function play() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { go(index + 1); }, 3000);
    }

    root.querySelector("[data-prev]").addEventListener("click", function () { go(index - 1); play(); });
    root.querySelector("[data-next]").addEventListener("click", function () { go(index + 1); play(); });

    var startX = 0;
    root.addEventListener("touchstart", function (event) {
      startX = event.changedTouches[0].clientX;
    }, { passive: true });
    root.addEventListener("touchend", function (event) {
      var delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) < 40) return;
      go(index + (delta < 0 ? 1 : -1));
      play();
    }, { passive: true });

    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", play);
    root.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    });

    slides[0].classList.add("is-active");
    go(0);
    play();
  }

  function initCarousel(root) {
    var row = root.querySelector(".work-row");
    var prev = root.querySelector("[data-car-prev]");
    var next = root.querySelector("[data-car-next]");
    if (!row || !prev || !next) return;
    var timer = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function amount() {
      var card = row.querySelector(".work-card");
      return card ? card.getBoundingClientRect().width + 16 : 360;
    }
    function shift(dir) {
      var max = row.scrollWidth - row.clientWidth - 8;
      if (dir > 0 && row.scrollLeft >= max) row.scrollTo({ left: 0, behavior: "smooth" });
      else if (dir < 0 && row.scrollLeft <= 8) row.scrollTo({ left: max, behavior: "smooth" });
      else row.scrollBy({ left: dir * amount(), behavior: "smooth" });
    }
    function play() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { shift(1); }, 3000);
    }
    prev.addEventListener("click", function () { shift(-1); play(); });
    next.addEventListener("click", function () { shift(1); play(); });
    root.addEventListener("mouseenter", function () { clearInterval(timer); });
    root.addEventListener("mouseleave", play);
    root.addEventListener("focusin", function () { clearInterval(timer); });
    root.addEventListener("focusout", play);
    play();
  }

  function initForm() {
    var form = document.getElementById("enquiry");
    if (!form) return;
    var card = document.getElementById("form-card");
    var receipt = document.getElementById("receipt");
    var output = document.getElementById("receipt-body");
    var email = document.body.dataset.email || "";

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (form.company_website && form.company_website.value) return;
      var data = new FormData(form);
      var errors = validate(form, data);
      form.querySelectorAll(".field-error").forEach(function (node) { node.textContent = ""; });
      form.querySelectorAll("[aria-invalid]").forEach(function (node) { node.removeAttribute("aria-invalid"); });
      if (Object.keys(errors).length) {
        Object.keys(errors).forEach(function (key) {
          var slot = form.querySelector('[data-error="' + key + '"]');
          var field = form.querySelector('[name="' + key + '"]');
          if (slot) slot.textContent = errors[key];
          if (field) field.setAttribute("aria-invalid", "true");
        });
        var first = form.querySelector("[aria-invalid='true']");
        if (first) first.focus();
        return;
      }

      var interests = data.getAll("interest");
      var training = data.getAll("training");
      var lines = [
        "Bricks & Bytes Consulting — new enquiry",
        "",
        "Name: " + data.get("name"),
        "Company: " + data.get("company"),
        "Work email: " + data.get("email"),
        "Phone / WhatsApp: " + (data.get("phone") || "—"),
        "Country: " + (data.get("country") || "—"),
        "",
        "Interested in: " + (interests.length ? interests.join(", ") : "—"),
        "Training requirement: " + (training.length ? training.join(", ") : "—"),
        "",
        "Requirement:",
        data.get("requirement"),
        "",
        "Approximate learners: " + (data.get("learners") || "—"),
        "Current LMS: " + (data.get("lms") || "—"),
        "Looking to start: " + (data.get("start") || "—")
      ];
      var body = lines.join("\n");
      if (output) output.textContent = body;
      if (card) card.classList.add("is-hidden");
      if (receipt) {
        receipt.classList.add("is-on");
        receipt.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      var mail = document.getElementById("mail-link");
      if (mail) {
        mail.href = "mailto:" + email + "?subject=" + encodeURIComponent("Learning enquiry from " + data.get("company")) + "&body=" + encodeURIComponent(body);
      }
    });

    var copyBtn = document.getElementById("copy-enquiry");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var text = output ? output.textContent : "";
        if (navigator.clipboard && text) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = "Copied";
          });
        }
      });
    }
  }

  function validate(form, data) {
    var errors = {};
    var name = String(data.get("name") || "").trim();
    var company = String(data.get("company") || "").trim();
    var email = String(data.get("email") || "").trim();
    var requirement = String(data.get("requirement") || "").trim();
    if (!name) errors.name = "Enter your name.";
    if (!company) errors.company = "Enter your company or organization.";
    if (!email) errors.email = "Enter your work email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid work email.";
    if (!requirement) errors.requirement = "Tell us a little about the requirement.";
    return errors;
  }
})();
