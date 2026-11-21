(function () {
  "use strict";

  const DATA = window.MR_CHIPS_DATA;

  if (!DATA) {
    console.error("Mr Chips menu data failed to load.");
    return;
  }

  const ALL_ITEMS = DATA.menu.concat(DATA.drinks);

  const state = {
    activeFoodCategory: "chips_combos",
    activeDrinkCategory: "slush",
    cart: [],
    lastFocused: null,
    toastTimer: null
  };

  const el = {
    promoCard: document.getElementById("promoCard"),
    cartBtn: document.getElementById("cartBtn"),
    mobileCartBtn: document.getElementById("mobileCartBtn"),
    mobileOrderBtn: document.getElementById("mobileOrderBtn"),
    heroOrderBtn: document.getElementById("heroOrderBtn"),
    cartOverlay: document.getElementById("cartOverlay"),
    cartPanel: document.getElementById("cartPanel"),
    cartClose: document.getElementById("cartClose"),
    cartItems: document.getElementById("cartItems"),
    cartEmpty: document.getElementById("cartEmpty"),
    cartFooter: document.getElementById("cartFooter"),
    cartTotal: document.getElementById("cartTotal"),
    cartBadge: document.getElementById("cartBadge"),
    mobileCartBadge: document.getElementById("mobileCartBadge"),
    orderWhatsAppBtn: document.getElementById("orderWhatsAppBtn"),
    customerName: document.getElementById("customerName"),
    pickupTime: document.getElementById("pickupTime"),
    themeToggle: document.getElementById("themeToggle"),
    themeUse: document.getElementById("themeIconUse"),
    navToggle: document.getElementById("navToggle"),
    navMenu: document.getElementById("navMenu"),
    statusDot: document.getElementById("statusDot"),
    backToTop: document.getElementById("backToTop"),
    mapLink: document.getElementById("mapLink"),
    siteNotice: document.getElementById("siteNotice"),
    siteNoticeText: document.getElementById("siteNoticeText"),
    tickerToggle: document.getElementById("tickerToggle"),
    toast: document.getElementById("toast"),
    year: document.getElementById("year"),
    metaTheme: document.getElementById("metaTheme")
  };

  function safe(name, fn) {
    try {
      fn();
    } catch (error) {
      console.error("Mr Chips " + name + " failed:", error);
    }
  }

  function getItem(id) {
    return ALL_ITEMS.find(function (item) { return item.id === id; });
  }

  function formatRand(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "R0";
    return "R" + amount.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  }

  function createEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function loadCart() {
    let parsed;
    try {
      const raw = localStorage.getItem("mrchips-cart");
      parsed = raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.warn("Mr Chips cart could not be read:", error);
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(function (entry) {
        return entry && getItem(entry.id) && Number.isInteger(entry.qty) && entry.qty > 0 && entry.qty <= 50;
      })
      .map(function (entry) {
        return { id: entry.id, qty: entry.qty };
      });
  }

  function saveCart() {
    try {
      localStorage.setItem("mrchips-cart", JSON.stringify(state.cart));
    } catch (error) {
      console.warn("Mr Chips cart could not be saved:", error);
    }
  }

  function getCartCount() {
    return state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getCartTotal() {
    return state.cart.reduce(function (sum, item) {
      const data = getItem(item.id);
      return sum + (data ? data.price * item.qty : 0);
    }, 0);
  }

  function showToast(message) {
    if (!el.toast) return;
    el.toast.textContent = message;
    el.toast.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      el.toast.hidden = true;
    }, 2600);
  }

  function addToCart(id, amount) {
    const data = getItem(id);
    if (!data) return;
    const qty = Math.max(1, Math.min(50, Number(amount) || 1));
    const existing = state.cart.find(function (item) { return item.id === id; });
    if (existing) existing.qty = Math.min(50, existing.qty + qty);
    else state.cart.push({ id: id, qty: qty });
    saveCart();
    renderCart();
    showToast("Added " + data.name + " to your order");
  }

  function changeQty(id, delta) {
    const item = state.cart.find(function (entry) { return entry.id === id; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0 || item.qty > 50) {
      state.cart = state.cart.filter(function (entry) { return entry.id !== id; });
    }
    saveCart();
    renderCart();
  }

  function renderMenu() {
    DATA.menu.forEach(function (item) {
      const card = document.querySelector('[data-menu-id="' + item.id + '"]');
      if (!card) return;
      const name = card.querySelector(".menu-card__name");
      const tag = card.querySelector(".menu-card__category");
      const price = card.querySelector(".menu-card__price");
      const button = card.querySelector("[data-add-id]");
      if (name) name.textContent = item.name;
      if (tag) tag.textContent = item.tag;
      if (price) price.textContent = formatRand(item.price);
      if (button) {
        button.setAttribute("data-add-id", item.id);
        button.setAttribute("aria-label", "Add " + item.name + " to order");
      }
    });
  }

  function renderDrinks() {
    DATA.drinks.forEach(function (item) {
      const card = document.querySelector('[data-drink-id="' + item.id + '"]');
      if (!card) return;
      const name = card.querySelector("h3");
      const price = card.querySelector(".drink-card__price");
      const button = card.querySelector("[data-add-id]");
      if (name) {
        if (item.category === "slush" || item.category === "slush_crush") {
          const parts = item.category === "slush"
            ? ["Slush", "Puppie", item.name.replace("Slush Puppie ", "")]
            : ["Slush", "Puppie Crush", item.name.replace("Slush Puppie Crush ", "")];
          name.textContent = "";
          name.setAttribute("aria-label", item.name);
          parts.forEach(function (part, index) {
            const span = createEl("span", "drink-card__line" + (index === 2 ? " drink-card__size" : ""), part);
            name.appendChild(span);
          });
        } else {
          name.textContent = item.name;
        }
      }
      if (price) price.textContent = formatRand(item.price);
      if (button) {
        button.setAttribute("data-add-id", item.id);
        button.setAttribute("aria-label", "Add " + item.name + " to order");
      }
    });
  }

  function setActiveCategory(group, category) {
    const isMenu = group === "menu";
    const tabs = document.querySelectorAll(isMenu ? ".menu__tab" : ".drinks__tab");
    const cards = document.querySelectorAll(isMenu ? ".menu-card[data-category]" : ".drink-card[data-category]");
    let activeId = "";

    tabs.forEach(function (tab) {
      const active = tab.getAttribute("data-category") === category || tab.getAttribute("data-drink-cat") === category;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.tabIndex = active ? 0 : -1;
      if (active) activeId = tab.id;
    });

    cards.forEach(function (card) {
      card.hidden = card.getAttribute("data-category") !== category;
    });

    if (isMenu && el.promoCard) el.promoCard.hidden = false;
    const panel = document.getElementById(isMenu ? "menuPanel" : "drinksPanel");
    if (panel && activeId) panel.setAttribute("aria-labelledby", activeId);

    if (isMenu) state.activeFoodCategory = category;
    else state.activeDrinkCategory = category;
  }

  function initTabs(group) {
    const isMenu = group === "menu";
    const tabs = Array.from(document.querySelectorAll(isMenu ? ".menu__tab" : ".drinks__tab"));
    if (!tabs.length) return;
    const key = function (tab) { return tab.getAttribute("data-category") || tab.getAttribute("data-drink-cat"); };

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        setActiveCategory(group, key(tab));
      });
      tab.addEventListener("keydown", function (event) {
        let target = index;
        if (event.key === "ArrowRight") target = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") target = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[target].focus();
        setActiveCategory(group, key(tabs[target]));
      });
    });

    const initial = tabs.find(function (tab) { return tab.classList.contains("active"); }) || tabs[0];
    setActiveCategory(group, key(initial));
  }

  function renderCart() {
    const count = getCartCount();
    [el.cartBadge, el.mobileCartBadge].forEach(function (badge) {
      if (!badge) return;
      badge.hidden = count === 0;
      badge.textContent = String(count);
    });

    const mobileLabel = document.getElementById("mobileCartLabel");
    if (mobileLabel) mobileLabel.textContent = count ? "Cart " + formatRand(getCartTotal()) : "Cart";
    document.querySelectorAll(".menu-card__btn[data-add-id], .drink-card [data-add-id]").forEach(function (btn) {
      const inCart = state.cart.find(function (entry) { return entry.id === btn.getAttribute("data-add-id"); });
      let tag = btn.querySelector(".add-count");
      if (!inCart) { if (tag) tag.remove(); return; }
      if (!tag) { tag = createEl("span", "add-count"); btn.appendChild(tag); }
      tag.textContent = "· " + inCart.qty + " in order";
    });

    if (!el.cartItems || !el.cartEmpty || !el.cartFooter) return;

    el.cartItems.textContent = "";
    if (!state.cart.length) {
      el.cartItems.hidden = true;
      el.cartEmpty.hidden = false;
      el.cartFooter.hidden = true;
      return;
    }

    el.cartEmpty.hidden = true;
    el.cartItems.hidden = false;
    el.cartFooter.hidden = false;

    const fragment = document.createDocumentFragment();
    state.cart.forEach(function (entry) {
      const data = getItem(entry.id);
      if (!data) return;
      const row = createEl("div", "cart-item");
      const top = createEl("div", "cart-item__top");
      const bottom = createEl("div", "cart-item__bottom");
      const name = createEl("div", "cart-item__name", data.name + (data.unit ? " (" + data.unit + ")" : ""));
      const price = createEl("div", "cart-item__price", formatRand(data.price * entry.qty));
      const each = createEl("span", "", formatRand(data.price) + " each");
      const qty = createEl("div", "cart-item__qty");
      const minus = createEl("button", "", "−");
      const plus = createEl("button", "", "+");
      const amount = createEl("strong", "", entry.qty);

      minus.type = "button";
      plus.type = "button";
      minus.setAttribute("aria-label", "Decrease " + data.name);
      plus.setAttribute("aria-label", "Increase " + data.name);
      minus.setAttribute("data-qty-change", entry.id);
      plus.setAttribute("data-qty-change", entry.id);
      minus.setAttribute("data-delta", "-1");
      plus.setAttribute("data-delta", "1");

      qty.appendChild(minus);
      qty.appendChild(amount);
      qty.appendChild(plus);
      top.appendChild(name);
      top.appendChild(price);
      bottom.appendChild(each);
      bottom.appendChild(qty);
      row.appendChild(top);
      row.appendChild(bottom);
      fragment.appendChild(row);
    });
    el.cartItems.appendChild(fragment);
    if (el.cartTotal) el.cartTotal.textContent = formatRand(getCartTotal());
  }

  function getZonedParts(date) {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: DATA.hours.timezone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const parts = {};
    formatter.formatToParts(date).forEach(function (part) { parts[part.type] = part.value; });
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      day: dayMap[parts.weekday],
      year: Number(parts.year),
      month: Number(parts.month),
      date: Number(parts.day),
      minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute)
    };
  }

  function windowsFor(day) {
    return DATA.hours.windows[day] || [];
  }

  function dateForOffset(current, offset) {
    return new Date(Date.UTC(current.year, current.month - 1, current.date + offset, 12));
  }

  function dateAtMinutes(parts, minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return new Date(Date.UTC(parts.year, parts.month - 1, parts.date, hour, minute) - 120 * 60000);
  }

  function formatTime(minutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
  }

  function isOpenNow() {
    const now = getZonedParts(new Date());
    return windowsFor(now.day).some(function (windowRange) {
      return now.minutes >= windowRange[0] && now.minutes < windowRange[1];
    });
  }

  function getNextOpening() {
    const current = getZonedParts(new Date());
    for (let offset = 0; offset < 14; offset += 1) {
      const parts = getZonedParts(dateForOffset(current, offset));
      const windows = windowsFor(parts.day);
      for (let index = 0; index < windows.length; index += 1) {
        const start = windows[index][0];
        if (offset === 0 && start <= current.minutes) continue;
        return dateAtMinutes(parts, start);
      }
    }
    return null;
  }

  function updateOpenStatus() {
    const open = isOpenNow();
    let text = open ? "Open now" : "Closed";
    if (!open) {
      const next = getNextOpening();
      if (next) {
        const formatter = new Intl.DateTimeFormat("en-ZA", {
          timeZone: DATA.hours.timezone,
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
        text += " · opens " + formatter.format(next);
      }
    }
    if (el.statusDot) el.statusDot.className = "status-dot " + (open ? "is-open" : "is-closed");
    document.querySelectorAll("[data-status-text]").forEach(function (node) { node.textContent = text; });
  }

  function ceilTo30(minutes) {
    return Math.ceil(minutes / 30) * 30;
  }

  function initPickupSlots() {
    if (!el.pickupTime) return;
    const current = getZonedParts(new Date());
    const slots = [];
    for (let offset = 0; offset < 7 && slots.length < 12; offset += 1) {
      const parts = getZonedParts(dateForOffset(current, offset));
      windowsFor(parts.day).forEach(function (windowRange) {
        let start = windowRange[0];
        if (offset === 0) start = Math.max(start, ceilTo30(current.minutes + 30));
        for (let time = start; time + 30 <= windowRange[1] && slots.length < 12; time += 30) {
          const dayLabel = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : getDayName(parts.day);
          slots.push({ label: dayLabel + " " + formatTime(time), value: dayLabel + " " + formatTime(time) });
        }
      });
    }

    el.pickupTime.textContent = "";
    const placeholder = createEl("option", "", "Choose a pickup time");
    placeholder.value = "";
    el.pickupTime.appendChild(placeholder);
    if (!slots.length) {
      const none = createEl("option", "", "Call to arrange pickup");
      none.value = "Call to arrange pickup";
      el.pickupTime.appendChild(none);
      return;
    }
    slots.forEach(function (slot) {
      const option = createEl("option", "", slot.label);
      option.value = slot.value;
      el.pickupTime.appendChild(option);
    });
  }

  function getDayName(day) {
    const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return names[day] || "";
  }

  function buildWhatsAppMessage() {
    const lines = ["Hi " + DATA.config.businessName + "! I'd like to place an order:"];
    if (state.cart.length) {
      state.cart.forEach(function (entry) {
        const data = getItem(entry.id);
        if (!data) return;
        lines.push("- " + entry.qty + " x " + data.name + " (" + formatRand(data.price * entry.qty) + ")");
      });
      lines.push("");
      lines.push("Total: " + formatRand(getCartTotal()));
    } else {
      lines.push("");
      lines.push("(Please tell me what you'd like to order.)");
    }
    lines.push("");
    lines.push("Order type: Pickup");
    lines.push("Name: " + (el.customerName && el.customerName.value.trim() ? el.customerName.value.trim() : "___"));
    lines.push("Pickup time: " + (el.pickupTime && el.pickupTime.value ? el.pickupTime.value : "To be confirmed"));
    return encodeURIComponent(lines.join("\n"));
  }

  function sendOrder() {
    if (!state.cart.length) {
      openCart(true);
      showToast("Add items to your order first");
      return;
    }
    if (!el.pickupTime || !el.pickupTime.value) {
      openCart(true);
      if (el.pickupTime) el.pickupTime.focus();
      showToast("Choose a pickup time first");
      return;
    }
    if (!isOpenNow() && !window.confirm("The shop is currently closed. Send the order request anyway?")) return;
    window.open("https://wa.me/" + DATA.config.whatsappNumber + "?text=" + buildWhatsAppMessage(), "_blank", "noopener");
  }

  function focusableNodes() {
    if (!el.cartPanel) return [];
    return Array.from(el.cartPanel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter(function (node) { return !node.hidden && node.offsetParent !== null; });
  }

  function openCart(open) {
    if (!el.cartOverlay) return;
    if (open) {
      state.lastFocused = document.activeElement;
      el.cartOverlay.hidden = false;
      const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
      document.body.style.paddingRight = scrollbar + "px";
      document.body.style.overflow = "hidden";
      const nodes = focusableNodes();
      if (nodes.length) nodes[0].focus();
    } else {
      if (el.cartOverlay.hidden) return;
      el.cartOverlay.hidden = true;
      document.body.style.paddingRight = "";
      document.body.style.overflow = "";
      if (state.lastFocused && typeof state.lastFocused.focus === "function") state.lastFocused.focus();
    }
  }

  function trapCartFocus(event) {
    if (event.key !== "Tab" || !el.cartOverlay || el.cartOverlay.hidden) return;
    const nodes = focusableNodes();
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function updateThemeChrome(theme) {
    const dark = theme === "dark";
    if (el.themeUse) el.themeUse.setAttribute("href", dark ? "#icon-sun" : "#icon-moon");
    if (el.themeToggle) el.themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    if (el.metaTheme) el.metaTheme.setAttribute("content", dark ? "#0d1626" : "#fffaf0");
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("mrchips-theme", theme);
    } catch (error) {
      console.warn("Mr Chips theme could not be saved:", error);
    }
    updateThemeChrome(theme);
  }

  function initTheme() {
    updateThemeChrome(document.documentElement.getAttribute("data-theme") || "light");
  }

  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (node) { node.classList.add("is-visible"); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    nodes.forEach(function (node) { observer.observe(node); });
  }

  function initEvents() {
    document.body.addEventListener("click", function (event) {
      const addBtn = event.target.closest("[data-add-id]");
      if (addBtn) {
        addToCart(addBtn.getAttribute("data-add-id"), 1);
        return;
      }
      const qtyBtn = event.target.closest("[data-qty-change]");
      if (qtyBtn) changeQty(qtyBtn.getAttribute("data-qty-change"), Number(qtyBtn.getAttribute("data-delta")));
    });

    [el.cartBtn, el.mobileCartBtn].forEach(function (button) {
      if (button) button.addEventListener("click", function () { openCart(true); });
    });
    if (el.cartClose) el.cartClose.addEventListener("click", function () { openCart(false); });
    if (el.cartOverlay) el.cartOverlay.addEventListener("click", function (event) {
      if (event.target === el.cartOverlay) openCart(false);
    });

    [el.mobileOrderBtn, el.heroOrderBtn].forEach(function (button) {
      if (button) button.addEventListener("click", function () { openCart(true); });
    });
    if (el.orderWhatsAppBtn) el.orderWhatsAppBtn.addEventListener("click", sendOrder);

    if (el.themeToggle) el.themeToggle.addEventListener("click", function () {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      setTheme(current === "dark" ? "light" : "dark");
    });

    function closeNav(returnFocus) {
      if (!el.navMenu || !el.navMenu.classList.contains("is-open")) return;
      el.navMenu.classList.remove("is-open");
      if (el.navToggle) {
        el.navToggle.setAttribute("aria-expanded", "false");
        if (returnFocus) el.navToggle.focus();
      }
    }

    if (el.navToggle && el.navMenu) el.navToggle.addEventListener("click", function () {
      const open = el.navMenu.classList.toggle("is-open");
      el.navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        const first = el.navMenu.querySelector(".nav__link");
        if (first) first.focus();
      }
    });

    document.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        closeNav(false);
      });
    });

    document.addEventListener("click", function (event) {
      if (!el.navMenu || !el.navMenu.classList.contains("is-open")) return;
      if (el.navMenu.contains(event.target) || (el.navToggle && el.navToggle.contains(event.target))) return;
      closeNav(false);
    });

    function trapNavFocus(event) {
      if (event.key !== "Tab" || !el.navMenu || !el.navMenu.classList.contains("is-open")) return;
      const nodes = [el.navToggle].concat(Array.from(el.navMenu.querySelectorAll("a[href], button:not([disabled])")))
        .filter(function (node) { return node && node.offsetParent !== null; });
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        if (el.cartOverlay && !el.cartOverlay.hidden) { openCart(false); return; }
        closeNav(true);
        return;
      }
      trapCartFocus(event);
      trapNavFocus(event);
    });

    if (el.tickerToggle) el.tickerToggle.addEventListener("click", function () {
      const paused = document.body.classList.toggle("ticker-paused");
      el.tickerToggle.setAttribute("aria-pressed", paused ? "true" : "false");
      el.tickerToggle.setAttribute("aria-label", paused ? "Resume specials ticker" : "Pause specials ticker");
      el.tickerToggle.querySelector("use").setAttribute("href", paused ? "#icon-play" : "#icon-pause");
    });

    if (el.backToTop) el.backToTop.addEventListener("click", function () {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  function initScroll() {
    if (!el.backToTop) return;
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        el.backToTop.classList.toggle("is-visible", window.scrollY > 500);
        ticking = false;
      });
    });
  }

  function initNotice() {
    const notice = DATA.config.notice;
    if (!notice || !notice.active || !notice.text) return;
    if (notice.until && Date.now() > new Date(notice.until).getTime()) return;
    if (el.siteNoticeText) el.siteNoticeText.textContent = notice.text;
    if (el.siteNotice) el.siteNotice.hidden = false;
  }

  function initLinks() {
    const mapUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(DATA.config.mapsQuery);
    if (el.mapLink) el.mapLink.href = mapUrl;
    const footerMapLink = document.getElementById("footerMapLink");
    if (footerMapLink) footerMapLink.href = mapUrl;
    if (el.year) el.year.textContent = String(new Date().getFullYear());
    document.querySelectorAll("[data-wa-link]").forEach(function (link) {
      link.href = DATA.config.whatsappUrl;
    });
    document.querySelectorAll("[data-wa-updates]").forEach(function (link) {
      const text = "Hi " + DATA.config.businessName + ", please add me to your specials updates. Reply STOP to opt out.";
      link.href = DATA.config.whatsappUrl + "?text=" + encodeURIComponent(text);
    });
  }

  function init() {
    document.documentElement.classList.add("js");
    safe("data", function () {
      renderMenu();
      renderDrinks();
      state.cart = loadCart();
      renderCart();
      initTabs("menu");
      initTabs("drinks");
      initPickupSlots();
    });
    safe("theme", initTheme);
    safe("status", updateOpenStatus);
    setInterval(updateOpenStatus, 60000);
    safe("events", initEvents);
    safe("scroll", initScroll);
    safe("reveal", initReveal);
    safe("notice", initNotice);
    safe("links", initLinks);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
