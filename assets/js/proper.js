(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;
  var header = document.querySelector(".site-header");
  var menuBtn = document.querySelector(".menu-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  var lenis = null;
  var activeModal = null;
  var lastFocused = null;
  var scrollQueued = false;

  /* ---------- smooth scroll ---------- */

  if (window.Lenis && !reduced && window.innerWidth > 900) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    var raf = function (time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ---------- header ---------- */

  var darkZones = Array.prototype.slice.call(document.querySelectorAll('[data-header="dark"]'));

  function updateHeader() {
    var line = 64;
    var overDark = body.classList.contains("menu-open");
    if (!overDark) {
      overDark = darkZones.some(function (zone) {
        var rect = zone.getBoundingClientRect();
        return rect.top <= line && rect.bottom >= line;
      });
    }
    header.classList.toggle("is-dark", overDark);
    header.classList.toggle("is-scrolled", window.scrollY > 24 || body.classList.contains("menu-open"));
    scrollQueued = false;
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      updateHeader();
      var orb = document.querySelector(".hero__orb-y");
      if (orb && !reduced && window.scrollY < window.innerHeight * 1.4) {
        orb.style.transform = "translateY(" + Math.min(window.scrollY * 0.06, 46) + "px)";
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---------- reveal ---------- */

  var revealEls = document.querySelectorAll(".reveal, .mask-reveal");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach(function (el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  /* ---------- mobile menu ---------- */

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    body.classList.toggle("is-locked", open && !activeModal);
    if (lenis) {
      if (open) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }
    updateHeader();
  }

  menuBtn.addEventListener("click", function () {
    setMenu(!body.classList.contains("menu-open"));
  });

  /* ---------- anchors ---------- */

  function scrollToTarget(target) {
    var top = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY - 40;
    if (lenis) {
      lenis.scrollTo(target === document.body ? 0 : top, { duration: 1.2 });
    } else {
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      var target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      if (body.classList.contains("menu-open")) setMenu(false);
      scrollToTarget(hash === "#top" ? document.body : target);
    });
  });

  document.querySelectorAll("[data-to-top]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      scrollToTarget(document.body);
    });
  });

  /* ---------- modals ---------- */

  var focusSelector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function showModal(modal) {
    if (activeModal && activeModal !== modal) {
      activeModal.classList.remove("is-open");
      activeModal.setAttribute("aria-hidden", "true");
    } else if (!activeModal) {
      lastFocused = document.activeElement;
    }
    activeModal = modal;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    body.classList.add("is-locked");
    if (lenis) lenis.stop();
    window.setTimeout(function () {
      var first = modal.querySelector(".modal__close");
      if (first) first.focus();
    }, 60);
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (activeModal === modal) activeModal = null;
    if (!activeModal && !body.classList.contains("menu-open")) {
      body.classList.remove("is-locked");
      if (lenis) lenis.start();
    }
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus({ preventScroll: true });
    }
  }

  document.querySelectorAll("[data-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      hideModal(el.closest(".modal"));
    });
  });

  document.addEventListener("keydown", function (event) {
    if (!activeModal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      hideModal(activeModal);
      return;
    }
    if (event.key !== "Tab") return;
    var focusables = Array.prototype.slice
      .call(activeModal.querySelectorAll(focusSelector))
      .filter(function (el) {
        return el.offsetParent !== null || el === document.activeElement;
      });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("menu-open") && !activeModal) {
      setMenu(false);
    }
  });

  /* ---------- work data ---------- */

  var WORKS = {
    web: {
      title: "브랜드 웹사이트",
      cat: "Web Design",
      img: "assets/images/proper/work-web.png",
      alt: "브랜드 웹사이트 디자인 예시",
      desc: "브랜드가 처음 마주하는 화면. 사용자 중심의 편안한 디자인과 명확한 정보 구조로 브랜드 경험을 완성합니다.",
      scope: "기획 · UI/UX · 퍼블리싱",
      deliverables: "브랜드 웹사이트, 반응형 UI"
    },
    package: {
      title: "패키지 디자인",
      cat: "Package Design",
      img: "assets/images/proper/work-package.png",
      alt: "패키지 디자인 예시",
      desc: "패키지 디자인은 제품의 첫인상을 결정하고 구매를 유도합니다. 구조와 그래픽, 인쇄 후가공까지 함께 설계합니다.",
      scope: "구조 · 그래픽 · 목업",
      deliverables: "패키지 시스템, 인쇄 사양"
    },
    igfeed: {
      title: "SNS 콘텐츠",
      cat: "IG Feed Design",
      img: "assets/images/proper/work-igfeed.png",
      alt: "SNS 피드 디자인 예시",
      desc: "브랜드의 첫인상을 만드는 비주얼 콘텐츠. 일관된 톤과 포맷으로 피드를 하나의 매거진처럼 운영합니다.",
      scope: "콘텐츠 기획 · 촬영 · 디자인",
      deliverables: "피드 템플릿, 콘텐츠 세트"
    },
    flyer: {
      title: "인쇄물 디자인",
      cat: "Flyer Design",
      img: "assets/images/proper/work-flyer.png",
      alt: "인쇄물 디자인 예시",
      desc: "오프라인에서 손에 쥐는 경험까지. 인쇄 매체의 물성과 정보 구조를 함께 디자인합니다.",
      scope: "편집 · 인쇄 · 후가공",
      deliverables: "브로슈어, 리플릿, 명함"
    }
  };

  var workModal = document.getElementById("work-modal");
  var workImg = document.getElementById("work-modal-img");
  var workTitle = document.getElementById("work-modal-title");
  var workCat = document.getElementById("work-modal-cat");
  var workDesc = document.getElementById("work-modal-desc");
  var workScope = document.getElementById("work-modal-scope");
  var workDeliverables = document.getElementById("work-modal-deliverables");

  function openWork(id) {
    var work = WORKS[id];
    if (!work) return;
    workImg.src = work.img;
    workImg.alt = work.alt;
    workTitle.textContent = work.title;
    workCat.textContent = work.cat;
    workDesc.textContent = work.desc;
    workScope.textContent = work.scope;
    workDeliverables.textContent = work.deliverables;
    showModal(workModal);
  }

  /* ---------- portfolio preview ---------- */

  var rows = Array.prototype.slice.call(document.querySelectorAll(".portfolio__row"));
  var previews = Array.prototype.slice.call(document.querySelectorAll("[data-preview]"));
  var capCat = document.querySelector("[data-cap-cat]");
  var capIdx = document.querySelector("[data-cap-idx]");

  function activateWork(row) {
    var id = row.getAttribute("data-work");
    rows.forEach(function (r) {
      r.classList.toggle("is-active", r === row);
    });
    previews.forEach(function (img) {
      img.classList.toggle("is-shown", img.getAttribute("data-preview") === id);
    });
    var index = rows.indexOf(row) + 1;
    capCat.textContent = row.querySelector("em").textContent;
    capIdx.textContent = (index < 10 ? "0" + index : index) + " / " + (rows.length < 10 ? "0" + rows.length : rows.length);
  }

  rows.forEach(function (row) {
    row.addEventListener("mouseenter", function () {
      activateWork(row);
    });
    row.addEventListener("focus", function () {
      activateWork(row);
    });
    row.addEventListener("click", function () {
      activateWork(row);
      openWork(row.getAttribute("data-work"));
    });
  });

  /* ---------- inquiry ---------- */

  var inquiryModal = document.getElementById("inquiry-modal");
  var inquiryForm = document.getElementById("inquiry-form");
  var inquirySuccess = document.getElementById("inquiry-success");
  var mailtoLink = document.getElementById("mailto-link");

  function setError(key, message) {
    var field = key === "service" ? null : inquiryForm.elements[key];
    if (field) field.setAttribute("aria-invalid", message ? "true" : "false");
    var slot = document.querySelector('[data-error-for="' + key + '"]');
    if (slot) slot.textContent = message || "";
  }

  function clearErrors() {
    ["name", "phone", "email", "service", "message"].forEach(function (key) {
      setError(key, "");
    });
  }

  function validate() {
    var firstInvalid = null;
    var data = inquiryForm.elements;

    var name = data.name.value.trim();
    if (name.length < 2) {
      setError("name", "성함을 2자 이상 입력해 주세요.");
      firstInvalid = firstInvalid || data.name;
    }

    var phone = data.phone.value.replace(/[^0-9]/g, "");
    if (phone.length < 9) {
      setError("phone", "연락 가능한 번호를 입력해 주세요.");
      firstInvalid = firstInvalid || data.phone;
    }

    var email = data.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("email", "이메일 주소를 확인해 주세요.");
      firstInvalid = firstInvalid || data.email;
    }

    var services = Array.prototype.slice
      .call(inquiryForm.querySelectorAll('input[name="service"]:checked'))
      .map(function (input) {
        return input.value;
      });
    if (!services.length) {
      setError("service", "관심 서비스를 하나 이상 선택해 주세요.");
      firstInvalid = firstInvalid || inquiryForm.querySelector('input[name="service"]');
    }

    var message = data.message.value.trim();
    if (message.length < 10) {
      setError("message", "프로젝트 내용을 10자 이상 적어주세요.");
      firstInvalid = firstInvalid || data.message;
    }

    return { firstInvalid: firstInvalid, services: services };
  }

  function resetInquiry() {
    inquiryForm.reset();
    inquiryForm.style.display = "";
    inquirySuccess.classList.remove("is-on");
    clearErrors();
  }

  document.querySelectorAll("[data-open-inquiry]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (inquirySuccess.classList.contains("is-on")) resetInquiry();
      showModal(inquiryModal);
    });
  });

  inquiryForm.addEventListener("input", function (event) {
    if (event.target.name) setError(event.target.name, "");
  });

  inquiryForm.addEventListener("change", function (event) {
    if (event.target.name) setError(event.target.name, "");
  });

  inquiryForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();
    var result = validate();
    if (result.firstInvalid) {
      result.firstInvalid.focus();
      return;
    }

    var data = inquiryForm.elements;
    var company = data.company.value.trim();
    var name = data.name.value.trim();
    var subject = "[프로젝트 문의] " + (company || name);
    var lines = [
      "회사 / 브랜드: " + (company || "-"),
      "담당자: " + name,
      "연락처: " + data.phone.value.trim(),
      "이메일: " + data.email.value.trim(),
      "관심 서비스: " + result.services.join(", "),
      "예산: " + (data.budget.value || "-"),
      "",
      "프로젝트 내용",
      data.message.value.trim()
    ];
    mailtoLink.href =
      "mailto:wepropercompany@gmail.com?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(lines.join("\n"));

    inquiryForm.style.display = "none";
    inquirySuccess.classList.add("is-on");
    var panel = inquiryModal.querySelector(".modal__panel");
    if (panel) panel.scrollTop = 0;
  });

  /* ---------- articles ---------- */

  var ARTICLES = {
    search: {
      cat: "Search AD",
      title: "검색광고, 노출보다 구조가 먼저입니다",
      img: "assets/images/proper/work-search.png",
      alt: "네이버 검색광고 예시",
      body: [
        "검색광고는 키워드를 사는 일이 아니라, 고객의 질문을 설계하는 일입니다. 어떤 단어로 검색하고, 어떤 문장에서 멈추는지. 프로퍼컴퍼니는 키워드와 소재, 랜딩페이지를 하나의 흐름으로 보고 운영합니다.",
        "노출과 클릭, 그 다음의 전환까지. ROAS 관점에서 숫자를 확인하고 다음 실험을 정합니다. 잘 만든 구조는 예산이 바뀌어도 흔들리지 않습니다."
      ]
    },
    brand: {
      cat: "Brand Consulting",
      title: "브랜드는 모든 접점에서 같은 얼굴이어야 합니다",
      img: "assets/images/proper/work-web.png",
      alt: "브랜드 웹사이트 디자인 예시",
      body: [
        "브랜드는 로고 하나로 완성되지 않습니다. 웹사이트, 광고 소재, 패키지, 명함, 매장의 안내판까지 같은 얼굴로 말할 때 비로소 기억됩니다.",
        "3C Vision—Creative, Cooperative, Credible—은 그 일관성의 출발점입니다. 브랜드의 언어와 태도를 먼저 정하고, 모든 접점에 같은 규칙으로 옮깁니다."
      ]
    },
    sns: {
      cat: "SNS AD",
      title: "SNS는 매일의 브랜드 얼굴입니다",
      img: "assets/images/proper/work-igfeed.png",
      alt: "SNS 피드 디자인 예시",
      body: [
        "SNS는 브랜드가 매일 말을 거는 자리입니다. 피드의 톤과 포맷이 흔들리면 광고도 설득력을 잃습니다. 프로퍼컴퍼니는 기획과 촬영, 디자인을 한 흐름으로 묶어 피드를 하나의 매거진처럼 운영합니다.",
        "실시간 반응을 보고 다음 콘텐츠를 정합니다. 좋은 피드는 한 장의 이미지가 아니라, 쌓여서 만들어지는 브랜드의 인상입니다."
      ]
    },
    package: {
      cat: "Package Design",
      title: "패키지는 매대 위의 첫인사입니다",
      img: "assets/images/proper/work-package.png",
      alt: "패키지 디자인 예시",
      body: [
        "패키지는 제품의 첫인상을 결정합니다. 매대에서 손이 먼저 가는 면과 색, 활자까지. 프로퍼 디자인은 인쇄 후가공과 물성까지 확인하며 패키지를 완성합니다.",
        "좋은 패키지는 예쁜 상자가 아니라, 제품이 스스로 말하게 만드는 구조입니다. 정보의 우선순위를 정하고 브랜드의 톤을 표면에 새깁니다."
      ]
    }
  };

  var articleModal = document.getElementById("article-modal");
  var articleCat = document.getElementById("article-cat");
  var articleTitle = document.getElementById("article-title");
  var articleImg = document.getElementById("article-img");
  var articleBody = document.getElementById("article-body");

  document.querySelectorAll("[data-article]").forEach(function (row) {
    row.addEventListener("click", function () {
      var article = ARTICLES[row.getAttribute("data-article")];
      if (!article) return;
      articleCat.textContent = article.cat;
      articleTitle.textContent = article.title;
      articleImg.src = article.img;
      articleImg.alt = article.alt;
      articleBody.innerHTML = "";
      article.body.forEach(function (paragraph) {
        var p = document.createElement("p");
        p.textContent = paragraph;
        articleBody.appendChild(p);
      });
      showModal(articleModal);
    });
  });

  /* ---------- copy kakao ---------- */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  document.querySelectorAll("[data-copy-kakao]").forEach(function (btn) {
    var timer = null;
    btn.addEventListener("click", function () {
      copyText("@propercompany").then(function () {
        var status = btn.querySelector(".copy-status");
        if (!status) return;
        status.classList.add("is-on");
        window.clearTimeout(timer);
        timer = window.setTimeout(function () {
          status.classList.remove("is-on");
        }, 1600);
      });
    });
  });

  /* ---------- boot ---------- */

  updateHeader();
  window.addEventListener("load", updateHeader);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      body.classList.add("is-ready");
    });
  });
})();
