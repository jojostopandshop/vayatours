// Complete updated site.js
// - Desktop: open sidebars on hover, prevent click toggles on desktop
// - Mobile: keep click toggles (existing inline onclick calls)
// - Top-bar is locked/visible while any sidebar or search is open
// - Prevents top-bar auto-hide while hovering the top-bar or while a sidebar is open
// - Menu button underline persists when menu is open
// - Includes search, chat, hero-carousel2 slide, and mobile dropdown behavior

document.addEventListener("DOMContentLoaded", () => {
  const topBar = document.querySelector(".top-bar");
  const sideBars = document.querySelectorAll(".side-bar-item");
  const searchContainer = document.querySelector(".search-container");
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const searchInput = document.querySelector(".search-input");
  const threshold = 50; // distance from top to trigger bar on mousemove

  // Detect hover-capable desktops
  const isHoverable = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Explicit lock flag to avoid timing/race issues
  let sidebarLock = false;

  // Utilities
  function anySidebarOpen() {
    return !!document.querySelector(".side-bar-item.open");
  }

  function setBodySidebarAttr(val) {
    if (val) document.body.setAttribute("data-sidebar-open", "true");
    else document.body.removeAttribute("data-sidebar-open");
  }

  // Update menu button underlines based on sidebar state
  function updateMenuButtonUnderlines() {
    document.querySelectorAll('.top-bar button').forEach(btn => {
      // Get the sidebar ID from the button's onclick attribute
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/toggleMenu\(['"]([^'"]+)['"]\)/);
      
      if (match) {
        const sidebarId = match[1];
        const sidebar = document.getElementById(sidebarId);
        
        // Add menu-open class if its sidebar is open, remove otherwise
        if (sidebar && sidebar.classList.contains('open')) {
          btn.classList.add('menu-open');
        } else {
          btn.classList.remove('menu-open');
        }
      }
    });
  }

  // Top-bar helpers
  function lockTopBar() {
    if (!topBar) return;
    sidebarLock = true;
    topBar.classList.remove("hidden");
    topBar.classList.add("visible", "locked");
    topBar.style.pointerEvents = "auto";
    setBodySidebarAttr(true);
    updateMenuButtonUnderlines();
  }

  function unlockTopBarIfAllowed() {
    if (!topBar) return;
    const searchOpen = searchContainer && searchContainer.classList.contains("expanded");
    if (!anySidebarOpen() && !searchOpen) {
      sidebarLock = false;
      topBar.classList.remove("locked", "expanded");
      if (window.scrollY <= 5) topBar.classList.remove("visible");
      setBodySidebarAttr(false);
    } else {
      // keep locked if something else is open
      sidebarLock = true;
      topBar.classList.add("visible", "locked");
      setBodySidebarAttr(true);
    }
    updateMenuButtonUnderlines();
  }

  // Search helpers
  function closeSearch() {
    if (!searchContainer) return;
    searchContainer.classList.remove("expanded");
    if (searchInput) {
      searchInput.value = "";
      searchInput.style.display = "none";
    }
    if (topBar) topBar.classList.remove("expanded");
  }

  // Sidebar open/close helpers
  function openSidebarById(id) {
    const menus = document.querySelectorAll(".side-bar-item");
    if (searchContainer && searchContainer.classList.contains("expanded")) closeSearch();

    menus.forEach((menu) => {
      if (menu.id === id) {
        const targetHeight = menu.dataset.height || "450px";
        menu.classList.add("open");
        menu.style.maxHeight = targetHeight;
      } else {
        menu.classList.remove("open");
        menu.style.maxHeight = "0";
      }
    });

    lockTopBar();
    updateTopBarState();
  }

  function closeSidebarById(id) {
    const menu = document.getElementById(id);
    if (!menu) return;
    menu.classList.remove("open");
    menu.style.maxHeight = "0";

    setTimeout(() => {
      if (!anySidebarOpen()) unlockTopBarIfAllowed();
      else lockTopBar();
      updateTopBarState();
    }, 160);
  }

  function closeAllSidebars() {
    sideBars.forEach((m) => {
      m.classList.remove("open");
      m.style.maxHeight = "0";
    });
    setTimeout(() => unlockTopBarIfAllowed(), 120);
  }

  // Original toggleMenu preserved for mobile click usage.
  function toggleMenu(id) {
    if (isHoverable) {
      // On desktop we use hover; ignore clicks (we still prevent immediate close via stopPropagation elsewhere)
      return;
    }

    const menus = document.querySelectorAll(".side-bar-item");

    if (searchContainer && searchContainer.classList.contains("expanded")) closeSearch();

    let opened = false;
    menus.forEach((menu) => {
      if (menu.id === id) {
        const isOpen = menu.classList.toggle("open");
        opened = isOpen;
        menu.style.maxHeight = isOpen ? (menu.dataset.height || "450px") : "0";
      } else {
        menu.classList.remove("open");
        menu.style.maxHeight = "0";
      }
    });

    if (opened) lockTopBar();
    else unlockTopBarIfAllowed();

    updateTopBarState();
  }
  // Expose for inline onclick
  window.toggleMenu = toggleMenu;

  // Respect data-height attribute for CSS height if provided
  document.querySelectorAll(".side-bar-item").forEach((item) => {
    const height = item.dataset.height;
    if (height) item.style.height = height;
  });

  // Attach handlers to toggle buttons
  const toggleButtons = Array.from(document.querySelectorAll("[onclick^='toggleMenu']"));

  if (isHoverable) {
    toggleButtons.forEach((btn) => {
      const onclick = btn.getAttribute("onclick") || "";
      const match = onclick.match(/toggleMenu\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      const targetId = match[1];
      const menu = document.getElementById(targetId);
      if (!menu) return;

      // Open on entering the button
      btn.addEventListener("mouseenter", () => openSidebarById(targetId));

      // Keep open while hovering the menu
      menu.addEventListener("mouseenter", () => {
        menu.classList.add("open");
        menu.style.maxHeight = menu.dataset.height || "450px";
        lockTopBar();
      });

      // When leaving button/menu/top-bar close after short delay unless hovering top-bar
      const leaveHandler = () => {
        setTimeout(() => {
          const isOverBtn = btn.matches(":hover");
          const isOverMenu = menu.matches(":hover");
          const isOverTopBar = topBar && topBar.matches(":hover");
          if (!isOverBtn && !isOverMenu && !isOverTopBar) {
            closeSidebarById(targetId);
          } else {
            if (isOverTopBar) lockTopBar();
          }
        }, 180);
      };

      btn.addEventListener("mouseleave", leaveHandler);
      menu.addEventListener("mouseleave", leaveHandler);

      // Prevent click from toggling on desktop (inline onclick present)
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  } else {
    // Touch devices: keep click behavior and stop propagation to avoid immediate closure
    toggleButtons.forEach((btn) => btn.addEventListener("click", (e) => e.stopPropagation()));
  }

  // -----------------------------
  // Top-bar visibility logic
  // -----------------------------
  function updateTopBarState() {
    const sidebarOpen = anySidebarOpen();
    const searchOpen = searchContainer && searchContainer.classList.contains("expanded");

    if (sidebarOpen || searchOpen) {
      lockTopBar();
      if (searchOpen) topBar.classList.add("expanded");
    } else {
      unlockTopBarIfAllowed();
    }
  }

  // -----------------------------
  // Search behavior
  // -----------------------------
  if (searchBtn && searchContainer && searchInput && closeBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchContainer.classList.add("expanded");
      searchInput.style.display = "inline-block";
      searchInput.focus();

      // Close any open sidebars
      closeAllSidebars();

      updateTopBarState();
    });

    closeBtn.addEventListener("click", () => {
      closeSearch();
      updateTopBarState();
    });

    searchInput.addEventListener("focus", () => {
      lockTopBar();
      topBar && topBar.classList.add("expanded");
    });

    searchInput.addEventListener("blur", () => {
      if (!searchContainer.classList.contains("expanded")) {
        updateTopBarState();
      }
    });
  }

  // Close search if clicking outside
  document.addEventListener("click", function (e) {
    if (!searchContainer || !searchContainer.classList.contains("expanded")) return;

    if (searchContainer.contains(e.target) || (searchBtn && searchBtn.contains(e.target))) {
      return;
    }

    closeSearch();
    updateTopBarState();
  });

  // Close sidebar/search when clicking outside
  document.addEventListener("click", (e) => {
    const clickedInsideSidebar = [...sideBars].some((menu) => menu.contains(e.target));
    const clickedInsideSearch = searchContainer && searchContainer.contains(e.target);
    const clickedTopBar = topBar && topBar.contains(e.target);
    const clickedToggle = e.target.closest("[onclick^='toggleMenu']");

    if (!clickedInsideSidebar && !clickedInsideSearch && !clickedTopBar && !clickedToggle) {
      // Close sidebars
      closeAllSidebars();
      // Close search
      closeSearch();
      updateTopBarState();
    }
  });

  // -----------------------------
  // Scroll / mouse near top
  // -----------------------------
  let lastScrollTop = 0;
  const hideThreshold = 1300; // how far down before it hides
  const showThreshold = 30; // how far up before showing again

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollingDown = scrollTop > lastScrollTop + 5; // small buffer
    const scrollingUp = scrollTop < lastScrollTop - 5;

    // If a sidebar is open or topBar is locked, never auto-hide
    if (sidebarLock || anySidebarOpen()) {
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      return;
    }

    if (scrollingDown && scrollTop > hideThreshold) {
      topBar && topBar.classList.add("hidden");
      topBar && topBar.classList.remove("visible", "expanded");
    } else if (scrollingUp || scrollTop < showThreshold) {
      topBar && topBar.classList.remove("hidden");
      topBar && topBar.classList.add("visible");
    }

    if (scrollTop <= 5) {
      topBar && topBar.classList.remove("visible", "expanded");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });

  // Ensure hovering the topBar keeps it visible
  if (topBar) {
    topBar.addEventListener("mouseenter", () => {
      topBar.classList.add("visible", "expanded");
      if (anySidebarOpen()) lockTopBar();
    });

    topBar.addEventListener("mouseleave", () => {
      if (anySidebarOpen()) {
        lockTopBar();
        return;
      }
      setTimeout(() => {
        if (!anySidebarOpen() && !topBar.classList.contains("locked")) {
          topBar.classList.remove("expanded", "visible");
        }
      }, 200);
    });
  }

  // Mousemove handler (show when near top)
  let hoverTimeout;
  document.addEventListener("mousemove", (e) => {
    if (sidebarLock || anySidebarOpen()) return;

    const overTopBar = topBar && topBar.contains(e.target);

    if (e.clientY <= threshold + 40 || overTopBar) {
      clearTimeout(hoverTimeout);
      topBar && topBar.classList.add("visible", "expanded");
    } else {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        if (!sidebarLock && !anySidebarOpen()) {
          topBar && topBar.classList.remove("expanded", "visible");
        }
      }, 400);
    }
  });

  // Initialize top-bar state
  updateTopBarState();

  // -----------------------------
  // Chat with us
  // -----------------------------
  window.toggleChat = function () {
    const chatBox = document.getElementById("chatBox");
    const notif = document.getElementById("notif");
    if (!chatBox) return;
    chatBox.style.display = chatBox.style.display === "flex" ? "none" : "flex";
    if (chatBox.style.display === "flex" && notif) notif.style.display = "none";
  };

  window.sendMessage = function () {
    const input = document.getElementById("chatInput");
    const body = document.getElementById("chatBody");
    if (!input || !body) return;
    if (input.value.trim() !== "") {
      let msg = document.createElement("div");
      msg.className = "chat-message user";
      msg.innerText = input.value;
      body.appendChild(msg);
      input.value = "";
      body.scrollTop = body.scrollHeight;
    }
  };

  // -----------------------------
  // Images - slide (hero-carousel2)
  // -----------------------------
  (function initHeroCarousel2() {
    const list = document.querySelector(".hero-carousel2__list");
    const slides = document.querySelectorAll(".hero-carousel2__item");
    if (!list || slides.length === 0) return;

    const total = slides.length;
    const slideTime = 1500; // ms
    const pauseTime = 2500; // ms
    let index = 0;

    // ensure CSS transition initially set
    list.style.transition = `transform ${slideTime / 1000}s ease-in-out`;
    list.style.transform = `translateX(0px)`;

    function nextSlide() {
      index++;

      if (index >= total) {
        // jump back to start seamlessly
        list.style.transition = "none";
        list.style.transform = "translateX(0px)";
        index = 1;

        // allow the browser to reflow then animate to index 1
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            list.style.transition = `transform ${slideTime / 1000}s ease-in-out`;
            list.style.transform = `translateX(-${index * window.innerWidth}px)`;
          });
        });
      } else {
        list.style.transition = `transform ${slideTime / 1000}s ease-in-out`;
        list.style.transform = `translateX(-${index * window.innerWidth}px)`;
      }
    }

    const intervalId = setInterval(nextSlide, pauseTime + slideTime);

    // adjust on resize so slide width stays correct
    window.addEventListener("resize", () => {
      list.style.transition = "none";
      list.style.transform = `translateX(-${index * window.innerWidth}px)`;
    });

    // expose interval id in case needed later
    list.__carouselIntervalId = intervalId;
  })();

  // -----------------------------
  // Mobile - Section (toggleMenu2)
  // -----------------------------
  window.toggleMenu2 = function (event) {
    if (event && event.stopPropagation) event.stopPropagation(); // prevent immediate close

    const menu = document.getElementById("dropdownMenu");
    const menuIcon = document.getElementById("menu-icon");
    if (!menu || !menuIcon) return;
    const isOpen = menu.style.display === "block";

    menu.style.display = isOpen ? "none" : "block";
    menuIcon.src = isOpen ? "images/menu-svgrepo-com.svg" : "images/close-svgrepo-com.svg";
  };

  // Close when clicking outside (mobile & desktop) for dropdownMenu
  document.addEventListener("click", function (e) {
    const menu = document.getElementById("dropdownMenu");
    const icon = document.getElementById("menu-icon");
    if (!menu || !icon) return;
    if (!menu.contains(e.target) && !icon.contains(e.target)) {
      menu.style.display = "none";
      icon.src = "images/menu-svgrepo-com.svg";
    }
  });
});


// ============================================
// MENU FUNCTIONS
// ============================================

function openMainMenu() {
  document.getElementById("mainMenu").classList.add("active");
  document.getElementById("searchBoxM").classList.add("hide");
}

function closeMenus() {
  document.getElementById("mainMenu").classList.remove("active");
  document.getElementById("europeMenu").classList.remove("active");
  document.getElementById("searchBoxM").classList.remove("hide");
}

function openTravelStylesMenu() {
  document.getElementById("travelStylesMenu").classList.add("active");
  document.getElementById("searchBoxM").classList.add("hide");
}

function closeTravelStylesMenu() {
  document.getElementById("travelStylesMenu").classList.remove("active");
  document.getElementById("searchBoxM").classList.remove("hide");
}

function openDealsMenu() {
  document.getElementById("dealsMenu").classList.add("active");
  document.getElementById("searchBoxM").classList.add("hide");
}

function closeDealsMenu() {
  document.getElementById("dealsMenu").classList.remove("active");
  document.getElementById("searchBoxM").classList.remove("hide");
}

function openAboutMenu() {
  document.getElementById("aboutMenu").classList.add("active");
  document.getElementById("searchBoxM").classList.add("hide");
}

function closeAboutMenu() {
  document.getElementById("aboutMenu").classList.remove("active");
  document.getElementById("searchBoxM").classList.remove("hide");
}

// ============================================
// REGION MENU FUNCTIONS
// ============================================

function openEuropeMenu() {
  document.getElementById("europeMenu").classList.add("active");
}

function closeEuropeMenu() {
  document.getElementById("europeMenu").classList.remove("active");
}

function openMexicoMenu() {
  document.getElementById("mexicoMenu").classList.add("active");
}

function closeMexicoMenu() {
  document.getElementById("mexicoMenu").classList.remove("active");
}

function openUsCanadaMenu() {
  document.getElementById("uscanadaMenu").classList.add("active");
}

function closeUsCanadaMenu() {
  document.getElementById("uscanadaMenu").classList.remove("active");
}

function openLatinamericaMenu() {
  document.getElementById("latinamericaManu").classList.add("active");
}

function closeLatinamericaMenu() {
  document.getElementById("latinamericaManu").classList.remove("active");
}

function openAsiaMenu() {
  document.getElementById("asiaMenu").classList.add("active");
}

function closeAsiaMenu() {
  document.getElementById("asiaMenu").classList.remove("active");
}

function openAfricaMenu() {
  document.getElementById("africaMenu").classList.add("active");
}

function closeAfricaMenu() {
  document.getElementById("africaMenu").classList.remove("active");
}

function openMiddleastMenu() {
  document.getElementById("middleastMenu").classList.add("active");
}

function closeMiddleastMenu() {
  document.getElementById("middleastMenu").classList.remove("active");
}

function openPolarMenu() {
  document.getElementById("PolarMenu").classList.add("active");
}

function closePolarMenu() {
  document.getElementById("PolarMenu").classList.remove("active");
}
