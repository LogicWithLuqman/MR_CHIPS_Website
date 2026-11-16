/* Mr Chips 2026 - main script */
(function () {
  "use strict";

  const BUSINESS_NAME = "Mr Chips";
  const WA_NUMBER = "27798238095";
  const MAPS_QUERY = "65 Cassim Street, Mohadin, Potchefstroom, South Africa";

  const MENU = {
    chips_combos: [
      { name: "Small Chips", desc: "Crispy portion, freshly fried.", price: 25, tag: "Chips" },
      { name: "Large Chips", desc: "Bigger portion for sharing or a bigger appetite.", price: 45, tag: "Chips" },
      { name: "Extra-large Chips", desc: "Our largest chips portion.", price: 65, tag: "Chips" },
      { name: "Vienna and Chips", desc: "Vienna served with chips.", price: 38, tag: "Combo" },
      { name: "2 Viennas and Small Chips", desc: "Two viennas with small chips.", price: 50, tag: "Combo" },
      { name: "Small Russian and Small Chips", desc: "Small russian with small chips.", price: 45, tag: "Combo" },
      { name: "Large Russian and Large Chips", desc: "Large russian with large chips.", price: 75, tag: "Combo" },
      { name: "4 Viennas and Large Chips", desc: "Four viennas with large chips.", price: 98, tag: "Combo" }
    ],
    meals_rolls: [
      { name: "Hot Dog Special", desc: "Hot dog special.", price: 35, tag: "Special" },
      { name: "Russian Roll Special", desc: "Russian roll special.", price: 40, tag: "Special" },
      { name: "T-bone Steak and Chips", desc: "T-bone steak served with chips.", price: 95, tag: "Meal" }
    ],
    chicken: [
      { name: "Quarter Chicken & Chips", desc: "Flame-style chicken quarter with chips.", price: 60, tag: "Best Seller" },
      { name: "Half Chicken & Chips", desc: "Half chicken served with a generous portion of chips.", price: 90, tag: "Big Meal" },
      { name: "Chicken Tikka (per 100g)", desc: "Tender spiced chicken tikka sold by weight.", price: 20, tag: "Spiced" }
    ]
  };

  const DRINKS = {
    slush: [
      { name: "Slush Puppie Small", price: 15 },
      { name: "Slush Puppie Medium", price: 25 },
      { name: "Slush Puppie Large", price: 30 }
    ],
    slush_crush: [
      { name: "Slush Puppy Crush Small", price: 25 },
      { name: "Slush Puppy Crush Medium", price: 35 },
      { name: "Slush Puppy Crush Large", price: 45 }
    ],
    icecream: [
      { name: "Ice Cream Cone", price: 10 },
      { name: "Ice Cream Cup", price: 15 }
    ]
  };

  const state = {
    activeCategory: "chips_combos",
    activeDrinkCategory: "slush",
    cart: []
  };

  const el = {
    menuGrid: document.getElementById("menuGrid"),
    promoCard: document.getElementById("promoCard"),
    drinksContent: document.getElementById("drinksContent"),
    cartBtn: document.getElementById("cartBtn"),
    mobileCartBtn: document.getElementById("mobileCartBtn"),
    mobileOrderBtn: document.getElementById("mobileOrderBtn"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartClose: document.getElementById("cartClose"),
    cartItems: document.getElementById("cartItems"),
    cartEmpty: document.getElementById("cartEmpty"),
    cartFooter: document.getElementById("cartFooter"),
    cartTotal: document.getElementById("cartTotal"),
    cartBadge: document.getElementById("cartBadge"),
    mobileCartBadge: document.getElementById("mobileCartBadge"),
    orderWhatsAppBtn: document.getElementById("orderWhatsAppBtn"),
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),
    statusBtn: document.getElementById("statusBtn"),
    statusDot: document.getElementById("statusDot"),
    statusText: document.getElementById("statusText"),
    backToTop: document.getElementById("backToTop"),
    mapContainer: document.getElementById("mapContainer"),
    newsletterForm: document.getElementById("newsletterForm")
  };

  function formatRand(n) {
    return "R" + Number(n).toFixed(0);
  }

  function getCartCount() {
    return state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getCartTotal() {
    return state.cart.reduce(function (sum, item) { return sum + (item.price * item.qty); }, 0);
  }

  function saveCart() {
    try { localStorage.setItem("mrchips-cart", JSON.stringify(state.cart)); } catch (e) {}
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem("mrchips-cart");
      state.cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.cart = [];
    }
  }

  function addToCart(name, price) {
    const existing = state.cart.find(function (i) { return i.name === name; });
    if (existing) existing.qty += 1;
    else state.cart.push({ name: name, price: price, qty: 1 });
    saveCart();
    renderCart();
  }

  function changeQty(name, delta) {
    const item = state.cart.find(function (i) { return i.name === name; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter(function (i) { return i.name !== name; });
    saveCart();
    renderCart();
  }

  function renderMenu() {
    const items = MENU[state.activeCategory] || [];
    el.menuGrid.innerHTML = items.map(function (item) {
      return (
        '<article class="menu-card">' +
          '<div><span class="menu-card__category">' + item.tag + '</span>' +
          '<h3 class="menu-card__name">' + item.name + '</h3>' +
          '<p class="menu-card__desc">' + item.desc + '</p></div>' +
          '<div class="menu-card__price">' + formatRand(item.price) + '</div>' +
          '<button class="btn btn--primary btn--full menu-card__btn" type="button" data-add-item="' +
          item.name.replace(/"/g, "&quot;") + '" data-add-price="' + item.price + '">' +
          '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add to order</button>' +
        '</article>'
      );
    }).join("");

    if (el.promoCard) el.promoCard.hidden = state.activeCategory !== "combos";
  }

  function renderDrinks() {
    const items = DRINKS[state.activeDrinkCategory] || [];
    el.drinksContent.innerHTML = items.map(function (item) {
      return (
        '<div class="drink-card">' +
          '<h3>' + item.name + '</h3>' +
          '<p><strong>' + formatRand(item.price) + '</strong></p>' +
          '<button class="btn btn--outline btn--full" type="button" data-add-item="' +
          item.name.replace(/"/g, "&quot;") + '" data-add-price="' + item.price + '" style="margin-top:0.75rem;">' +
          'Add</button>' +
        '</div>'
      );
    }).join("");
  }

  function renderCart() {
    const count = getCartCount();
    [el.cartBadge, el.mobileCartBadge].forEach(function (badge) {
      if (!badge) return;
      badge.hidden = count === 0;
      badge.textContent = String(count);
    });

    if (!state.cart.length) {
      el.cartItems.hidden = true;
      el.cartEmpty.hidden = false;
      el.cartFooter.hidden = true;
      el.cartItems.innerHTML = "";
      return;
    }

    el.cartEmpty.hidden = true;
    el.cartItems.hidden = false;
    el.cartFooter.hidden = false;

    el.cartItems.innerHTML = state.cart.map(function (item) {
      return (
        '<div class="cart-item">' +
          '<div class="cart-item__top">' +
            '<div class="cart-item__name">' + item.name + '</div>' +
            '<div class="cart-item__price">' + formatRand(item.price * item.qty) + '</div>' +
          '</div>' +
          '<div class="cart-item__bottom">' +
            '<span>' + formatRand(item.price) + ' each</span>' +
            '<div class="cart-item__qty">' +
              '<button type="button" aria-label="Decrease ' + item.name + '" data-qty-change="' + item.name.replace(/"/g, "&quot;") + '" data-delta="-1">−</button>' +
              '<strong>' + item.qty + '</strong>' +
              '<button type="button" aria-label="Increase ' + item.name + '" data-qty-change="' + item.name.replace(/"/g, "&quot;") + '" data-delta="1">+</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");

    el.cartTotal.textContent = formatRand(getCartTotal());
  }

  function buildWhatsAppMessage() {
    const lines = ["Hi " + BUSINESS_NAME + "! I'd like to place an order:"];
    if (state.cart.length) {
      state.cart.forEach(function (item) {
        lines.push("- " + item.qty + "x " + item.name + " (" + formatRand(item.price * item.qty) + ")");
      });
      lines.push("");
      lines.push("Total: " + formatRand(getCartTotal()));
    } else {
      lines.push("");
      lines.push("(Please tell me what you'd like to order.)");
    }
    lines.push("");
    lines.push("Name: ___");
    lines.push("Pickup time: ___");
    return encodeURIComponent(lines.join("\n"));
  }

  function openCart(open) {
    if (!el.cartOverlay) return;
    el.cartOverlay.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("mrchips-theme", theme); } catch (e) {}
    if (el.themeIcon) {
      el.themeIcon.className = theme === "dark" ? "fa-regular fa-sun" : "fa-regular fa-moon";
    }
  }

  function initTheme() {
    let theme = "light";
    try {
      const saved = localStorage.getItem("mrchips-theme");
      if (saved === "dark" || saved === "light") theme = saved;
      else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
    } catch (e) {}
    setTheme(theme);
  }

  function isOpenNow() {
    const now = new Date();
    const day = now.getDay(); // 0 Sun
    const minutes = now.getHours() * 60 + now.getMinutes();
    const windowsByDay = {
      0: [],
      1: [[600, 1110]],
      2: [[600, 1110]],
      3: [[600, 1110]],
      4: [[600, 1110]],
      5: [[600, 750], [840, 1140]],
      6: [[600, 1140]]
    };
    const windows = windowsByDay[day] || [];
    return windows.some(function (w) { return minutes >= w[0] && minutes <= w[1]; });
  }

  function updateOpenStatus() {
    const open = isOpenNow();
    if (el.statusDot) el.statusDot.className = "status-dot " + (open ? "is-open" : "is-closed");
    if (el.statusText) el.statusText.textContent = open ? "Open now" : "Closed";
    if (el.statusBtn) el.statusBtn.disabled = true;
  }

  function initMap() {
    if (!el.mapContainer) return;
    const src = "https://www.google.com/maps?q=" + encodeURIComponent(MAPS_QUERY) + "&output=embed";
    el.mapContainer.innerHTML = '<iframe title="Mr Chips map location" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + src + '"></iframe>';
  }

  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-visible"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function initEvents() {
    document.querySelectorAll(".menu__tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".menu__tab").forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        state.activeCategory = btn.getAttribute("data-category") || "combos";
        renderMenu();
      });
    });

    document.querySelectorAll(".drinks__tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".drinks__tab").forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        state.activeDrinkCategory = btn.getAttribute("data-drink-cat") || "slush";
        renderDrinks();
      });
    });

    document.body.addEventListener("click", function (e) {
      const addBtn = e.target.closest("[data-add-item]");
      if (addBtn) {
        addToCart(addBtn.getAttribute("data-add-item"), Number(addBtn.getAttribute("data-add-price")));
        return;
      }
      const qtyBtn = e.target.closest("[data-qty-change]");
      if (qtyBtn) {
        changeQty(qtyBtn.getAttribute("data-qty-change"), Number(qtyBtn.getAttribute("data-delta")));
      }
    });

    if (el.cartBtn) el.cartBtn.addEventListener("click", function () { openCart(true); });
    if (el.mobileCartBtn) el.mobileCartBtn.addEventListener("click", function () { openCart(true); });
    if (el.cartClose) el.cartClose.addEventListener("click", function () { openCart(false); });
    if (el.cartOverlay) el.cartOverlay.addEventListener("click", function (e) {
      if (e.target === el.cartOverlay) openCart(false);
    });

    if (el.orderWhatsAppBtn) el.orderWhatsAppBtn.addEventListener("click", function () {
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + buildWhatsAppMessage(), "_blank", "noopener");
    });
    if (el.mobileOrderBtn) el.mobileOrderBtn.addEventListener("click", function () {
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + buildWhatsAppMessage(), "_blank", "noopener");
    });

    if (el.themeToggle) el.themeToggle.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(current === "dark" ? "light" : "dark");
    });

    if (el.navToggle && el.navMenu) el.navToggle.addEventListener("click", function () {
      const isOpen = el.navMenu.classList.toggle("is-open");
      el.navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        if (el.navMenu) el.navMenu.classList.remove("is-open");
        if (el.navToggle) el.navToggle.setAttribute("aria-expanded", "false");
      });
    });

    window.addEventListener("scroll", function () {
      if (!el.backToTop) return;
      el.backToTop.classList.toggle("is-visible", window.scrollY > 500);
    });
    if (el.backToTop) el.backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") openCart(false);
    });

    if (el.newsletterForm) el.newsletterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const input = document.getElementById("newsletterEmail");
      alert("Thanks! We'll keep " + (input && input.value ? input.value : "you") + " updated.");
      el.newsletterForm.reset();
    });
  }

  function init() {
    loadCart();
    initTheme();
    renderMenu();
    renderDrinks();
    renderCart();
    updateOpenStatus();
    setInterval(updateOpenStatus, 60000);
    initMap();
    initReveal();
    initEvents();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();