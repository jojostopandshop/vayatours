/**
 *
 * Features:
 * - Desktop: open sidebars on hover, close after leaving button/menu/top-bar
 * - Mobile: toggle sidebars on click via existing inline onclick="toggleMenu('id')"
 * - Locks top-bar visible while any sidebar or search is open (uses body[data-sidebar-open]="true")
 * - Prevents auto-hide while sidebar is open; respects hover near top and scroll logic otherwise
 * - Menu button underline persists when menu is open
 * - Search open/close behavior
 * - Chat toggle/sendMessage helpers
 * - Hero image fade (skipped on europe.html)
 * - Mobile dropdown (toggleMenu2)
 *
 * Place this file in your site and ensure the CSS snippet (body[data-sidebar-open="true"] .top-bar) is present
 * as suggested earlier to force the top-bar visible when a sidebar is open.
 */

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
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/toggleMenu\(['"]([^'"]+)['"]\)/);
      
      if (match) {
        const sidebarId = match[1];
        const sidebar = document.getElementById(sidebarId);
        
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
    // ensure user can interact with it (optional; keep if you want items clickable)
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

    // Force top-bar visible & locked immediately
    lockTopBar();
  }

  function closeSidebarById(id) {
    const menu = document.getElementById(id);
    if (!menu) return;
    menu.classList.remove("open");
    menu.style.maxHeight = "0";

    // Delay slightly to avoid flicker when moving between menus.
    setTimeout(() => {
      if (!anySidebarOpen()) unlockTopBarIfAllowed();
      else lockTopBar();
    }, 160);
  }

  function closeAllSidebars() {
    sideBars.forEach((m) => {
      m.classList.remove("open");
      m.style.maxHeight = "0";
    });
    setTimeout(() => unlockTopBarIfAllowed(), 120);
  }

  // ToggleMenu (for inline onclick behavior - mobile)
  function toggleMenu(id) {
    if (isHoverable) return; // desktop uses hover; ignore clicks

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
  }
  // expose globally for inline onclick
  window.toggleMenu = toggleMenu;

  // Ensure side-bar-item respects data-height (optional)
  document.querySelectorAll(".side-bar-item").forEach((item) => {
    const height = item.dataset.height;
    if (height) item.style.height = height;
  });

  // Attach hover/click handlers to toggle buttons
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

      // Close if leaving button, menu, and top-bar
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

      // Prevent click toggling on desktop when inline onclick exists
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  } else {
    // Touch devices: allow click behaviour; stop propagation so document clicks don't immediately close it
    toggleButtons.forEach((btn) => btn.addEventListener("click", (e) => e.stopPropagation()));
  }

  // Top-bar enter/leave handling
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

  function updateTopBarState() {
    if (anySidebarOpen() || (searchContainer && searchContainer.classList.contains("expanded"))) {
      lockTopBar();
      if (searchContainer && searchContainer.classList.contains("expanded")) topBar.classList.add("expanded");
    } else {
      unlockTopBarIfAllowed();
    }
  }

  // Search behaviour
  if (searchBtn && searchContainer && searchInput && closeBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchContainer.classList.add("expanded");
      searchInput.style.display = "inline-block";
      searchInput.focus();

      closeAllSidebars();
      updateTopBarState();
    });

    closeBtn.addEventListener("click", () => {
      closeSearch();
      updateTopBarState();
    });

    searchInput.addEventListener("focus", () => {
      lockTopBar();
      topBar.classList.add("expanded");
    });

    searchInput.addEventListener("blur", () => {
      if (!searchContainer.classList.contains("expanded")) updateTopBarState();
    });
  }

  // Close search when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchContainer || !searchContainer.classList.contains("expanded")) return;
    if (searchContainer.contains(e.target) || (searchBtn && searchBtn.contains(e.target))) return;
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
      closeAllSidebars();
      closeSearch();
      updateTopBarState();
    }
  });

  // Scroll / mouse near top
  let lastScrollTop = 0;
  const hideThreshold = 1300; // how far down before it hides
  const showThreshold = 30; // how far up before showing again

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollingDown = scrollTop > lastScrollTop + 5; // small buffer
    const scrollingUp = scrollTop < lastScrollTop - 5;

    // If a sidebar is open or locked, never auto-hide
    if (sidebarLock || anySidebarOpen()) {
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
      return;
    }

    if (scrollingDown && scrollTop > hideThreshold) {
      if (topBar) {
        topBar.classList.add("hidden");
        topBar.classList.remove("visible", "expanded");
      }
    } else if (scrollingUp || scrollTop < showThreshold) {
      if (topBar) topBar.classList.remove("hidden");
      if (topBar) topBar.classList.add("visible");
    }

    if (scrollTop <= 5) {
      if (topBar) topBar.classList.remove("visible", "expanded");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });

  // Mousemove handler
  let hoverTimeout;
  document.addEventListener("mousemove", (e) => {
    if (sidebarLock || anySidebarOpen()) return;

    const overTopBar = topBar && topBar.contains(e.target);

    if (e.clientY <= threshold + 40 || overTopBar) {
      clearTimeout(hoverTimeout);
      if (topBar) topBar.classList.add("visible", "expanded");
    } else {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        if (!sidebarLock && !anySidebarOpen()) {
          if (topBar) topBar.classList.remove("expanded", "visible");
        }
      }, 400);
    }
  });

  // Initialize top-bar state
  updateTopBarState();

  // Chat helpers
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

  // Hero image fade (skip on europe.html)
  if (!window.location.pathname.includes("europe.html")) {
    const slides = document.querySelectorAll(".hero-carousel__item");
    if (slides.length > 0) {
      const total = slides.length;
      const fadeTime = 1000; // ms
      const pauseTime = 2500; // ms
      let index = 0;
      slides[0].classList.add("active");
      function nextSlide() {
        slides[index].classList.remove("active");
        index = (index + 1) % total;
        slides[index].classList.add("active");
      }
      setInterval(nextSlide, fadeTime + pauseTime);
    }
  }

  // Mobile dropdown toggle
  window.toggleMenu2 = function (event) {
    if (event && event.stopPropagation) event.stopPropagation();
    const menu = document.getElementById("dropdownMenu");
    const menuIcon = document.getElementById("menu-icon");
    if (!menu || !menuIcon) return;
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    menuIcon.src = isOpen ? "images/menu-svgrepo-com.svg" : "images/close-svgrepo-com.svg";
  };

  // Ensure mobile dropdown closes when clicking outside
  document.addEventListener("click", (e) => {
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
