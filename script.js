/**
 *
 * Features:
 * - Desktop: open sidebars on hover, close after leaving button/menu/top-bar
 * - Mobile: toggle sidebars on click via existing inline onclick="toggleMenu('id')"
 * - Locks top-bar visible while any sidebar or search is open (uses body[data-sidebar-open]="true")
 * - Prevents auto-hide while sidebar is open; respects hover near top and scroll logic otherwise
 * - Search open/close behavior
 * - Chat toggle/sendMessage helpers
 * - Hero image fade (skipped on europe.html)
 * - Mobile dropdown (toggleMenu2)
 * - Menu button underline persists when menu is open
 *
 * Place this file in your site and ensure the CSS snippet (body[data-sidebar-open="true"] .top-bar) is present
 * as suggested earlier to force the top-bar visible when a sidebar is open.
 */

document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // ALL CODE RUNS HERE - SINGLE DOMContentLoaded
  // ============================================

  const topBar = document.querySelector(".top-bar");
  const sideBars = document.querySelectorAll(".side-bar-item");
  const searchContainer = document.querySelector(".search-container");
  const searchBtn = document.querySelector(".search-btn");
  const closeBtn = document.querySelector(".close-btn");
  const searchInput = document.querySelector(".search-input");
  const threshold = 50;

  const isHoverable = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let sidebarLock = false;

  function anySidebarOpen() {
    return !!document.querySelector(".side-bar-item.open");
  }

  function setBodySidebarAttr(val) {
    if (val) document.body.setAttribute("data-sidebar-open", "true");
    else document.body.removeAttribute("data-sidebar-open");
  }

  function getButtonForSidebar(sidebarId) {
    return document.querySelector(`[onclick*="toggleMenu('${sidebarId}')"],[onclick*='toggleMenu("${sidebarId}")']`);
  }

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
      sidebarLock = true;
      topBar.classList.add("visible", "locked");
      setBodySidebarAttr(true);
    }
    updateMenuButtonUnderlines();
  }

  function closeSearch() {
    if (!searchContainer) return;
    searchContainer.classList.remove("expanded");
    if (searchInput) {
      searchInput.value = "";
      searchInput.style.display = "none";
    }
    if (topBar) topBar.classList.remove("expanded");
  }

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
  }

  function closeSidebarById(id) {
    const menu = document.getElementById(id);
    if (!menu) return;
    menu.classList.remove("open");
    menu.style.maxHeight = "0";

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

  function toggleMenu(id) {
    if (isHoverable) return;

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
    
  window.toggleMenu = toggleMenu;

  document.querySelectorAll(".side-bar-item").forEach((item) => {
    const height = item.dataset.height;
    if (height) item.style.height = height;
  });

  const toggleButtons = Array.from(document.querySelectorAll("[onclick^='toggleMenu']"));

  if (isHoverable) {
    toggleButtons.forEach((btn) => {
      const onclick = btn.getAttribute("onclick") || "";
      const match = onclick.match(/toggleMenu\(['"]([^'"]+)['"]\)/);
      if (!match) return;
      const targetId = match[1];
      const menu = document.getElementById(targetId);
      if (!menu) return;

      btn.addEventListener("mouseenter", () => openSidebarById(targetId));

      menu.addEventListener("mouseenter", () => {
        menu.classList.add("open");
        menu.style.maxHeight = menu.dataset.height || "450px";
        lockTopBar();
      });

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

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });
  } else {
    toggleButtons.forEach((btn) => btn.addEventListener("click", (e) => e.stopPropagation()));
  }

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

  document.addEventListener("click", (e) => {
    if (!searchContainer || !searchContainer.classList.contains("expanded")) return;
    if (searchContainer.contains(e.target) || (searchBtn && searchBtn.contains(e.target))) return;
    closeSearch();
    updateTopBarState();
  });

  document.addEventListener("click", (e) => {
    const clickedInsideSidebar = [...sideBars].some((menu) => menu.contains(e.target));
    const clickedInsideSearch = searchContainer && searchContainer.contains(e.target);
    const clickedTopBar = topBar && topBar.contains(e.target);
    const clickedToggle = e.target.closest("[onclick^='toggleMenu']");
    

    if (!clickedInsideSidebar && !clickedInsideSearch && !clickedTopBar && !clickedToggle && !clickedMenuIcon) {
      closeAllSidebars();
      closeSearch();
      updateTopBarState();
    }
  });

  let lastScrollTop = 0;
  const hideThreshold = 1300;
  const showThreshold = 30;

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollingDown = scrollTop > lastScrollTop + 5;
    const scrollingUp = scrollTop < lastScrollTop - 5;

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

  updateTopBarState();

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

  if (!window.location.pathname.includes("europe.html")) {
    const slides = document.querySelectorAll(".hero-carousel__item");
    if (slides.length > 0) {
      const total = slides.length;
      const fadeTime = 1000;
      const pauseTime = 2500;
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

  // -----------------------------
  // Mobile - Section (toggleMenu2)
  // -----------------------------
  window.toggleMenu2 = function (event) {
    if (event && event.stopPropagation) event.stopPropagation();
    const menu = document.getElementById("dropdownMenu");
    const menuIcon = document.getElementById("menu-icon");
    if (!menu || !menuIcon) return;
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";
    menuIcon.src = isOpen ? "images/menu-svgrepo-com.svg" : "images/close-svgrepo-com.svg";
  };

  // Close mobile dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("dropdownMenu");
    const icon = document.getElementById("menu-icon");
    if (!menu || !icon) return;
    if (!menu.contains(e.target) && !icon.contains(e.target)) {
      menu.style.display = "none";
      icon.src = "images/menu-svgrepo-com.svg";
    }
  });


  // ============================================
  // CIRCLE ANIMATION - INSIDE DOMContentLoaded
  // ============================================

  const bigCircle = document.getElementById('big-circle');
  if (bigCircle) {
    const smallCircles = bigCircle.querySelectorAll('.circle:not(.big)');

    if (smallCircles.length > 0) {
      console.log('✅ Circles found! Starting animation...');

      let angle = 0;
      let isPaused = false;
      let pauseStartTime = null;
      let lastPausedAngle = -100;

      const animate = () => {
        if (isPaused && pauseStartTime) {
          if (Date.now() - pauseStartTime >= 5000) {
            isPaused = false;
            pauseStartTime = null;
          }
        }

        if (!isPaused) {
          angle += 0.5;
          const normalizedAngle = angle % 360;
          
          smallCircles.forEach((circle, index) => {
            const circleAngle = (index * 360 / smallCircles.length);
            const checkAngle = (circleAngle + 90) % 360;
            
            if (normalizedAngle >= checkAngle - 2 && normalizedAngle <= checkAngle + 2) {
              if (Math.abs(normalizedAngle - lastPausedAngle) > 5) {
                isPaused = true;
                pauseStartTime = Date.now();
                lastPausedAngle = normalizedAngle;
              }
            }
          });
        }
        
        const centerX = bigCircle.offsetWidth / 2;
        const centerY = bigCircle.offsetHeight / 2;
        const radius = 160;

        smallCircles.forEach((circle, index) => {
          const orbitAngle = angle + (index * 360 / smallCircles.length);
          const x = radius * Math.cos(orbitAngle * Math.PI / 180);
          const y = radius * Math.sin(orbitAngle * Math.PI / 180);
          
          circle.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
          circle.style.left = '50%';
          circle.style.top = '50%';
        });

        requestAnimationFrame(animate);
      };

      animate();
    }
  }

  // ============================================
  // SLIDESHOW CLASSES
  // ============================================

  class VayaSlideshow {
    constructor() {
      this.slides = document.querySelectorAll('.slideshow-item');
      this.dots = document.querySelectorAll('.dot');
      this.prevBtn = document.querySelector('.slideshow-arrow.prev');
      this.nextBtn = document.querySelector('.slideshow-arrow.next');
      this.currentSlide = 0;
      this.autoplayInterval = null;
      this.isPlaying = false;
      
      if (!this.slides.length || !this.prevBtn || !this.nextBtn) return;
      
      this.init();
    }

    init() {
      this.enableGPUAcceleration();
      
      this.prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previousSlide();
      });
      
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.nextSlide();
      });
      
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goToSlide(index);
        });
      });

      this.showSlide(0);
      this.startAutoplay();
    }

    enableGPUAcceleration() {
      this.slides.forEach(slide => {
        slide.style.transform = 'translateZ(0)';
        slide.style.willChange = 'opacity';
      });
    }

    showSlide(index) {
      if (index < 0 || index >= this.slides.length) return;

      this.slides.forEach((slide, i) => {
        slide.classList.remove('active');
        slide.style.opacity = '0';
      });
      
      this.dots.forEach(dot => dot.classList.remove('active'));

      this.slides[index].classList.add('active');
      this.slides[index].style.opacity = '1';
      
      if (this.dots[index]) {
        this.dots[index].classList.add('active');
      }

      const autoplayBar = document.querySelector('.autoplay-bar');
      if (autoplayBar) {
        autoplayBar.style.animation = 'none';
        void autoplayBar.offsetWidth;
        autoplayBar.style.animation = 'autoplay 6s linear infinite';
      }
    }

    nextSlide() {
      this.currentSlide = (this.currentSlide + 1) % this.slides.length;
      this.showSlide(this.currentSlide);
    }

    previousSlide() {
      this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
      this.showSlide(this.currentSlide);
    }

    goToSlide(index) {
      this.currentSlide = index;
      this.showSlide(this.currentSlide);
    }

    startAutoplay() {
      if (this.isPlaying) return;
      if (this.autoplayInterval) clearInterval(this.autoplayInterval);
      
      this.isPlaying = true;
      this.autoplayInterval = setInterval(() => {
        try { this.nextSlide(); } catch (error) { console.error(error); }
      }, 6000);
    }

    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
        this.isPlaying = false;
      }
    }

    destroy() {
      this.stopAutoplay();
    }
  }

  class DissolveGallery {
    constructor() {
      this.items = document.querySelectorAll('.dissolve-item');
      this.dots = document.querySelectorAll('.dissolve-dot');
      this.prevBtn = document.querySelector('.dissolve-arrow.prev-image');
      this.nextBtn = document.querySelector('.dissolve-arrow.next-image');
      this.carousel = document.querySelector('.dissolve-carousel');
      this.currentImage = 0;
      this.autoplayInterval = null;
      this.isPlaying = false;
      
      if (!this.items.length || !this.carousel) return;
      
      this.init();
    }

    init() {
      this.enableGPUAcceleration();
      
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.previousImage();
        });
      }
      
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.nextImage();
        });
      }
      
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          this.goToImage(index);
        });
      });

      this.showImage(0);
      this.startAutoplay();
    }

    enableGPUAcceleration() {
      this.items.forEach(item => {
        item.style.transform = 'translate3d(0, 0, 0)';
        item.style.willChange = 'opacity';
        item.style.backfaceVisibility = 'hidden';
      });
    }

    showImage(index) {
      if (index < 0 || index >= this.items.length) return;

      this.items.forEach(item => {
        item.classList.remove('active');
        item.style.opacity = '0';
      });
      
      this.dots.forEach(dot => dot.classList.remove('active'));

      this.items[index].classList.add('active');
      this.items[index].style.opacity = '1';
      
      if (this.dots[index]) {
        this.dots[index].classList.add('active');
      }
    }

    nextImage() {
      this.currentImage = (this.currentImage + 1) % this.items.length;
      this.showImage(this.currentImage);
    }

    previousImage() {
      this.currentImage = (this.currentImage - 1 + this.items.length) % this.items.length;
      this.showImage(this.currentImage);
    }

    goToImage(index) {
      if (index >= 0 && index < this.items.length) {
        this.currentImage = index;
        this.showImage(this.currentImage);
      }
    }

    startAutoplay() {
      if (this.isPlaying) return;
      if (this.autoplayInterval) clearInterval(this.autoplayInterval);
      
      this.isPlaying = true;
      this.autoplayInterval = setInterval(() => {
        try { this.nextImage(); } catch (error) { console.error(error); }
      }, 4000);
    }

    stopAutoplay() {
      if (this.autoplayInterval) {
        clearInterval(this.autoplayInterval);
        this.autoplayInterval = null;
        this.isPlaying = false;
      }
    }

    destroy() {
      this.stopAutoplay();
    }
  }

  // Initialize slideshows
  try {
    window.vayaSlideshow = new VayaSlideshow();
  } catch (error) {
    console.error('VayaSlideshow error:', error);
  }
  
  try {
    if (document.querySelector('.dissolve-carousel')) {
      window.dissolveGallery = new DissolveGallery();
    }
  } catch (error) {
    console.error('DissolveGallery error:', error);
  }
});

// ============================================
// CLEANUP ON PAGE UNLOAD
// ============================================

window.addEventListener('beforeunload', () => {
  if (window.vayaSlideshow) window.vayaSlideshow.destroy();
  if (window.dissolveGallery) window.dissolveGallery.destroy();
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


