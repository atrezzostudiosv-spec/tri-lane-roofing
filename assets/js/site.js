
        /* ==================== 1. MULTIPAGE NAVIGATION ==================== */
const pageFiles = { home:'index.html', about:'about.html', services:'services.html', gallery:'gallery.html', contact:'contact.html' };

function navigateTo(pageId) {
    window.location.href = pageFiles[pageId] || pageFiles.home;
}

function updateActiveNavigation() {
    const currentPage = document.body.dataset.page || 'home';
    document.querySelectorAll('[data-nav]').forEach(link => {
        if (link.getAttribute('data-nav') === currentPage) {
            link.classList.add('text-brand-orange','bg-white/10');
            link.classList.remove('text-stone-300');
            link.setAttribute('aria-current','page');
        } else {
            link.classList.remove('text-brand-orange','bg-white/10');
            link.classList.add('text-stone-300');
            link.removeAttribute('aria-current');
        }
    });
    // Independent-page navigation: each new page loads with its menu closed.
    if (typeof closeMobileMenu === 'function') closeMobileMenu();
    if (typeof renderGalleryGrid === 'function' && currentPage === 'gallery') renderGalleryGrid();
}

window.addEventListener('DOMContentLoaded', updateActiveNavigation);

/* ==================== 2. MOBILE MENU ==================== */
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuIconOpen = document.getElementById('menu-icon-open');
        const menuIconClose = document.getElementById('menu-icon-close');

        function toggleMobileMenu() {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');
            menuIconOpen.classList.toggle('hidden');
            menuIconClose.classList.toggle('hidden');
        }

        function closeMobileMenu() {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.add('hidden');
            menuIconOpen.classList.remove('hidden');
            menuIconClose.classList.add('hidden');
        }

        mobileMenuBtn.addEventListener('click', toggleMobileMenu);

        /* ==================== 3. GALLERY & LIGHTBOX DATA ==================== */
        const galleryProjects = [
            {
                id: 1,
                title: "Architectural Shingle Roofing",
                category: "Residential Roofing",
                img: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=1200&q=80",
                desc: "High-grade architectural shingle installation with reinforced ridge cap detailing."
            },
            {
                id: 2,
                title: "Modern Exterior Restoration",
                category: "Exterior Construction",
                img: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
                desc: "Full roof replacement paired with customized trim and protective accenting."
            },
            {
                id: 3,
                title: "Storm Damage Roof Replacement",
                category: "Storm Repair",
                img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
                desc: "Complete tear-off and replacement following heavy storm hail impact."
            },
            {
                id: 4,
                title: "Custom Residential Build",
                category: "New Construction",
                img: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=1200&q=80",
                desc: "Precision roof deck framing and material application for a custom home builder."
            },
            {
                id: 5,
                title: "Window & Siding Upgrade",
                category: "Windows & Siding",
                img: "https://images.unsplash.com/photo-1503708928676-1cb796a0891e?auto=format&fit=crop&w=1200&q=80",
                desc: "Energy-efficient window replacements paired with updated exterior siding protection."
            },
            {
                id: 6,
                title: "Seamless Gutter Installation",
                category: "Gutters",
                img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
                desc: "Custom drainage system installation to direct rainwater away from foundation walls."
            }
        ];

        let currentLightboxIndex = 0;

        function renderGalleryGrid() {
            const container = document.getElementById('gallery-grid');
            if (!container) return;

            container.innerHTML = galleryProjects.map((p, idx) => `
                <div class="bg-white rounded overflow-hidden shadow-md border border-stone-200 group cursor-pointer hover:shadow-xl transition-all" onclick="openLightbox(${idx})">
                    <div class="h-64 overflow-hidden relative">
                        <img src="${p.img}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute inset-0 bg-brand-charcoal/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <span class="bg-brand-orange px-4 py-2 rounded text-xs font-bold font-display tracking-widest"><i class="fa-solid fa-magnifying-glass"></i> INSPECT PROJECT</span>
                        </div>
                    </div>
                    <div class="p-5">
                        <span class="text-xs font-bold text-brand-orange tracking-widest uppercase block mb-1">${p.category}</span>
                        <h3 class="font-bold text-lg text-brand-charcoal">${p.title}</h3>
                    </div>
                </div>
            `).join('');
        }

        function openLightbox(index) {
            currentLightboxIndex = index;
            updateLightboxContent();
            document.getElementById('gallery-lightbox').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            document.getElementById('gallery-lightbox').classList.add('hidden');
            document.body.style.overflow = '';
        }

        function updateLightboxContent() {
            const item = galleryProjects[currentLightboxIndex];
            document.getElementById('lightbox-img').src = item.img;
            document.getElementById('lightbox-title').innerText = item.title;
            document.getElementById('lightbox-desc').innerText = item.desc;
            document.getElementById('lightbox-counter').innerText = `${currentLightboxIndex + 1} / ${galleryProjects.length}`;
        }

        function prevLightboxImage() {
            currentLightboxIndex = (currentLightboxIndex - 1 + galleryProjects.length) % galleryProjects.length;
            updateLightboxContent();
        }

        function nextLightboxImage() {
            currentLightboxIndex = (currentLightboxIndex + 1) % galleryProjects.length;
            updateLightboxContent();
        }

        document.addEventListener('keydown', (e) => {
            const lightbox = document.getElementById('gallery-lightbox');
            if (!lightbox.classList.contains('hidden')) {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') prevLightboxImage();
                if (e.key === 'ArrowRight') nextLightboxImage();
            }
        });

        /* ==================== 4. CONTACT FORM VALIDATION ==================== */
        function handleContactSubmit(e) {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const service = document.getElementById('contact-service').value;
            const message = document.getElementById('contact-message').value.trim();
            const statusMsg = document.getElementById('form-status-msg');

            let isValid = true;

            if (!name) {
                document.getElementById('err-name').classList.remove('hidden');
                isValid = false;
            } else {
                document.getElementById('err-name').classList.add('hidden');
            }

            if (!phone && !email) {
                document.getElementById('err-phone').classList.remove('hidden');
                document.getElementById('err-email').classList.remove('hidden');
                isValid = false;
            } else {
                document.getElementById('err-phone').classList.add('hidden');
                document.getElementById('err-email').classList.add('hidden');
            }

            if (isValid) {
                statusMsg.className = 'p-4 rounded text-sm bg-amber-50 border border-amber-300 text-amber-900 mt-4';
                statusMsg.innerHTML = `
                    <strong>Inquiry Validated locally:</strong> Backend integration pending verification. 
                    Your inquiry details for <em>${service}</em> have been logged in prototype state. 
                    Please call DFW <strong>(817) 717-3997</strong> for immediate response.
                `;
                statusMsg.classList.remove('hidden');
            }
        }

        /* ==================== 5. MULTISTEP WIZARD ASSISTANT ==================== */
        let currentWizStep = 1;
        let selectedService = '';

        function openInquiryModal(preselectedService = '') {
            if (preselectedService) {
                selectedService = preselectedService;
            }
            currentWizStep = 1;
            updateWizardUI();
            document.getElementById('inquiry-modal').classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeInquiryModal() {
            document.getElementById('inquiry-modal').classList.add('hidden');
            document.body.style.overflow = '';
        }

        function selectWizardService(service) {
            selectedService = service;
            wizardNext();
        }

        function wizardNext() {
            if (currentWizStep === 1 && !selectedService) {
                alert('Please select a service to proceed.');
                return;
            }
            if (currentWizStep === 3) {
                const city = document.getElementById('wiz-city').value.trim();
                const zip = document.getElementById('wiz-zip').value.trim();
                if (!city || !zip) {
                    alert('Please enter your City and ZIP Code.');
                    return;
                }
            }
            if (currentWizStep < 4) {
                currentWizStep++;
                updateWizardUI();
            } else if (currentWizStep === 4) {
                submitWizardInquiry();
            }
        }

        function wizardPrev() {
            if (currentWizStep > 1) {
                currentWizStep--;
                updateWizardUI();
            }
        }

        function updateWizardUI() {
            // Titles & Progress
            const titles = [
                "What do you need help with?",
                "Tell us a little about your project.",
                "Where is your project located?",
                "How can we reach you?"
            ];
            document.getElementById('assistant-title').innerText = titles[currentWizStep - 1];
            document.getElementById('assistant-progress').style.width = `${(currentWizStep / 4) * 100}%`;

            // Steps Display
            for (let i = 1; i <= 4; i++) {
                const stepEl = document.getElementById(`wizard-step-${i}`);
                if (i === currentWizStep) {
                    stepEl.classList.remove('hidden');
                } else {
                    stepEl.classList.add('hidden');
                }
            }

            // Buttons
            const prevBtn = document.getElementById('wiz-prev-btn');
            const nextBtn = document.getElementById('wiz-next-btn');

            if (currentWizStep === 1) {
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden'); // Clicking service auto-advances
            } else {
                prevBtn.classList.remove('hidden');
                nextBtn.classList.remove('hidden');
                nextBtn.innerText = currentWizStep === 4 ? "Submit Inquiry" : "Continue";
            }

            // Populate Summary on Step 4
            if (currentWizStep === 4) {
                const typeRadio = document.querySelector('input[name="wiz-type"]:checked');
                document.getElementById('sum-service').innerText = selectedService || 'Not Selected';
                document.getElementById('sum-type').innerText = typeRadio ? typeRadio.value : 'General';
                document.getElementById('sum-location').innerText = `${document.getElementById('wiz-city').value}, ${document.getElementById('wiz-zip').value}`;
            }
        }

        function submitWizardInquiry() {
            const name = document.getElementById('wiz-name').value.trim();
            const contact = document.getElementById('wiz-contact').value.trim();
            const status = document.getElementById('wiz-status');

            if (!name || !contact) {
                alert('Please provide your name and contact info.');
                return;
            }

            status.className = "p-3 rounded text-xs bg-amber-50 border border-amber-300 text-amber-900 block mt-2";
            status.innerHTML = `
                <strong>Inquiry Form Submitted:</strong> Backend destination is pending configuration. 
                Your preliminary request for <em>${selectedService}</em> has been verified on the front-end. 
                Call DFW Headquarters directly at <strong>(817) 717-3997</strong> for scheduling.
            `;
        }


/* === ATREZZO ARCHITECTURAL ASSEMBLY — SELECTIVE MOTION v1 ===
 * Purposeful reveal only: Home intro/services/approach, Services exterior
 * cards, About values, Gallery image tiles. Contact remains static.
 */
(function () {
  "use strict";
  function initArchitecturalAssembly() {
    const page = document.body && document.body.dataset.page;
    if (!["home", "services", "about", "gallery"].includes(page)) return;
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const selected = [];
    function add(selector, stagger, rowAware) {
      const items = Array.from(document.querySelectorAll(selector));
      if (!items.length) return;
      items.forEach((item, index) => {
        if (selected.includes(item)) return;
        let inRow = index;
        if (rowAware) {
          const top = item.offsetTop;
          inRow = items.slice(0, index).filter(other =>
            Math.abs(other.offsetTop - top) < 3
          ).length;
        }
        item.style.setProperty("--at-assembly-delay", Math.min(inRow * stagger, 270) + "ms");
        item.classList.add("at-assembly-item");
        selected.push(item);
      });
    }

    if (page === "home") {
      add('#page-home [class~="lg:col-span-7"], #page-home [class~="lg:col-span-5"]', 100, false);
      add(".tl-wwd-feature", 0, false);
      add(".tl-wwd-secondary > .tl-wwd-card", 90, true);
      add(".tl-tablet-approach-grid > *", 90, true);
    } else if (page === "services") {
      add("#sv-exterior-cards > .sv-card", 90, true);
    } else if (page === "about") {
      add("#at-about-v1 .at-about-values-grid > .at-about-value", 90, true);
    } else if (page === "gallery") {
      add("#at-gallery-redesign .at-gallery-grid > .at-gallery-tile", 90, true);
    }
    if (!selected.length) return;

    // Enable hidden entry states only once all observer targets are known.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("at-assembly-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    selected.forEach(item => observer.observe(item));
    document.body.classList.add("at-assembly-enabled");

    // Browser restoring a scrolled page and breakpoint changes must never
    // leave an already-passed block invisible.
    window.addEventListener("pageshow", () => {
      selected.forEach(item => {
        const box = item.getBoundingClientRect();
        if (box.bottom <= 0 || box.top >= window.innerHeight) {
          if (box.bottom <= 0) {
            item.classList.add("at-assembly-visible");
            observer.unobserve(item);
          }
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initArchitecturalAssembly, {once:true});
  } else {
    initArchitecturalAssembly();
  }
})();
