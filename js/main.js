// Translations loaded globally from translations.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // State
    let currentLang = 'es';

    // DOM Elements
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const langToggle = document.getElementById('lang-toggle');
    const newsGrid = document.getElementById('news-grid');

    // Mobile Menu Toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // 3D Tilt Effect for Cards
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg rotation
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });

    // Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.section, .hero-content').forEach(section => {
        section.classList.add('hidden');
        observer.observe(section);
    });

    // Language Switching
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            console.log("Language toggle clicked");
            currentLang = currentLang === 'es' ? 'en' : 'es';
            updateContent();
            langToggle.textContent = currentLang === 'es' ? 'EN' : 'ES';
        });

        // Initialize button text
        langToggle.textContent = 'EN';
    } else {
        console.error("Language toggle button not found");
    }

    function updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][key]) {
                element.innerHTML = translations[currentLang][key];
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = currentLang;

        // Reload news to update "Read More" text if needed
        // But news content is dynamic, so we might need to re-render it or update it in place.
        // For simplicity, we can re-call loadNews() or just update the static parts.
        // The news items themselves (title/desc) are from JSON and might not be translated unless JSON has multiple langs.
        // The "Read More" text IS translated in the template literal in loadNews.
        // So let's re-render news.
        if (cachedNewsData) {
            renderNews(cachedNewsData);
        } else {
            loadNews();
        }

        // Initialize charts (timeout to allow DOM to update via innerHTML)
        setTimeout(initCharts, 0);
    }

    let chart1 = null;
    let chart2 = null;

    function initCharts() {
        if (!window.Chart) return; // Safeguard if Chart.js is not loaded

        const ctx1 = document.getElementById('chart-proj1');
        if (ctx1) {
            if (chart1) chart1.destroy();
            chart1 = new window.Chart(ctx1, {
                type: 'bar',
                data: {
                    labels: [currentLang === 'es' ? 'Antes de IA' : 'Before AI', currentLang === 'es' ? 'Con IA' : 'After AI'],
                    datasets: [{
                        label: currentLang === 'es' ? 'Tiempo de procesamiento (min)' : 'Processing Time (mins)',
                        data: [45, 12],
                        backgroundColor: 'rgba(0, 243, 255, 0.4)',
                        borderColor: 'rgba(0, 243, 255, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#fff' } } },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        const ctx2 = document.getElementById('chart-proj2');
        if (ctx2) {
            if (chart2) chart2.destroy();
            chart2 = new window.Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: [currentLang === 'es' ? 'Modelo Base' : 'Base Model', currentLang === 'es' ? 'Cuantizado (4-bit)' : 'Quantized (4-bit)'],
                    datasets: [{
                        label: currentLang === 'es' ? 'Velocidad (Tokens/seg)' : 'Speed (Tokens/sec)',
                        data: [12, 45],
                        backgroundColor: ['rgba(255, 255, 255, 0.2)', 'rgba(188, 19, 254, 0.4)'],
                        borderColor: ['rgba(255, 255, 255, 0.5)', 'rgba(188, 19, 254, 1)'],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y', // horizontal bar
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, ticks: { color: '#ccc' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#ccc' }, grid: { display: false } }
                    }
                }
            });
        }
    }

    // State for news
    let cachedNewsData = null;
    let newsLastUpdate = null;

    // News Loading
    if (!newsGrid) return;

    const updateTimeEl = document.getElementById('news-update-time');

    // Render Skeletons
    newsGrid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        newsGrid.innerHTML += `
            <div class="news-card glass-card skeleton-wrapper" aria-hidden="true">
                <div class="news-content">
                    <div class="skeleton skeleton-meta"></div>
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-title short"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `;
    }

    try {
        if (window.aiNewsData && window.aiNewsData.items) {
            cachedNewsData = window.aiNewsData.items;
            newsLastUpdate = window.aiNewsData.last_updated;

            renderNews(cachedNewsData);

            if (updateTimeEl) {
                updateTimeEl.textContent = new Date(newsLastUpdate).toLocaleString(currentLang === 'es' ? 'es-ES' : 'en-US', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }
        } else {
            throw new Error('AI news data not found. Please ensure the Python script has run.');
        }

    } catch (error) {
        console.error('Error fetching AI news:', error);
        // Fallback content in case fetch fails
        const fallbackNews = [
            {
                "title": "Local LLMs are getting better",
                "short_summary": "Offline, localized LLMs are bridging the gap between cloud dependence and data privacy.",
                "source": "AI Fallback",
                "published_at": new Date().toISOString(),
                "url": "#",
                "tag": "NEWS"
            }
        ];
        renderNews(fallbackNews);
    }


    function renderNews(newsItems) {
        if (!newsGrid || !newsItems) return;
        newsGrid.innerHTML = '';

        newsItems.forEach(item => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card glass-card';

            const tag = item.tag || 'AI';
            // Parse date to readable format
            const dateObj = new Date(item.published_at);
            const dateStr = dateObj.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            const readMoreText = translations[currentLang]?.news_read_more || 'Read More';

            newsCard.innerHTML = `
                <div class="news-img-wrapper">
                    <img src="assets/news-placeholder.png" alt="AI News" class="news-image" loading="lazy">
                    <div class="news-tag">${tag}</div>
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-source"><i class="fas fa-bolt"></i> ${item.source}</span>
                        <span class="news-date">${dateStr}</span>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.short_summary}</p>
                    <a href="${item.url}" target="_blank" rel="noopener" class="read-more">
                        ${readMoreText} <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            `;

            newsGrid.appendChild(newsCard);
        });
    }
    // Floating Button Logic
    const floatingBtn = document.getElementById('floating-news-btn');
    if (floatingBtn) {
        // Hide button when in news section
        const newsSection = document.getElementById('news');

        window.addEventListener('scroll', () => {
            if (!newsSection) return;

            const rect = newsSection.getBoundingClientRect();
            const isVisible = (rect.top <= window.innerHeight && rect.bottom >= 0);

            if (isVisible) {
                floatingBtn.style.opacity = '0';
                floatingBtn.style.pointerEvents = 'none';
            } else {
                floatingBtn.style.opacity = '1';
                floatingBtn.style.pointerEvents = 'auto';
            }
        });
    }

    // --- CV Modal Logic ---
    const btnDownloadCv = document.getElementById('btn-download-cv');
    const cvModal = document.getElementById('cv-modal');
    const closeCvModal = document.getElementById('close-cv-modal');
    const btnCancelCv = document.getElementById('btn-cancel-cv');
    const cvForm = document.getElementById('cv-form');
    const cvMsgBox = document.getElementById('cv-msg-box');
    const btnSubmitCv = document.getElementById('btn-submit-cv');

    function openModal(e) {
        if (e) e.preventDefault();
        cvModal.classList.add('show');
        cvMsgBox.className = 'form-msg'; // reset
        cvMsgBox.innerHTML = '';
        cvForm.reset();
        btnSubmitCv.disabled = false;
    }

    function closeModal() {
        cvModal.classList.remove('show');
    }

    if (btnDownloadCv) btnDownloadCv.addEventListener('click', openModal);
    if (closeCvModal) closeCvModal.addEventListener('click', closeModal);
    if (btnCancelCv) btnCancelCv.addEventListener('click', closeModal);

    // Close on click outside
    window.addEventListener('click', (e) => {
        if (e.target === cvModal) {
            closeModal();
        }
    });

    // Form Submission Logic
    if (cvForm) {
        cvForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const name = document.getElementById('cv-name').value;
            const position = document.getElementById('cv-position').value;
            const company = document.getElementById('cv-company').value;

            // Set loading state
            btnSubmitCv.disabled = true;
            const originalText = btnSubmitCv.innerHTML;
            btnSubmitCv.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // We use formsubmit.co to send the email via AJAX
            fetch("https://formsubmit.co/ajax/issammezdagat@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: `New CV Download Request: ${name} from ${company}`,
                    Nombre_LinkedIn: name,
                    Puesto: position,
                    Empresa: company
                })
            })
                .then(response => response.json())
                .then(data => {
                    // Success styling
                    cvMsgBox.className = 'form-msg success';
                    cvMsgBox.innerHTML = translations[currentLang]?.cv_success_msg || 'Thank you! Download starting...';

                    // Trigger download
                    setTimeout(() => {
                        const link = document.createElement('a');
                        link.href = 'data/CVIssamMezdagat_TEX.pdf';
                        link.download = 'Issam_Mezdagat_CV.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Close modal after a bit
                        setTimeout(closeModal, 2000);
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error submitting form', error);
                    cvMsgBox.className = 'form-msg error';
                    cvMsgBox.innerHTML = translations[currentLang]?.cv_error_msg || 'Error. You can still download the CV.';
                    // Provide fallback download
                    cvMsgBox.innerHTML += `<br><a href="data/CVIssamMezdagat_TEX.pdf" download="Issam_Mezdagat_CV.pdf" style="color:var(--primary-color)">Click here to download</a>`;
                    btnSubmitCv.disabled = false;
                    btnSubmitCv.innerHTML = originalText;
                });
        });
    }
    // --- Innovative Visuals ---

    // 1. Dynamic Typewriter Effect
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typewriterTimeout;

    function resetTypewriter() {
        clearTimeout(typewriterTimeout);
        charIndex = 0;
        isDeleting = false;
        roleIndex = 0;
        const typewriterEl = document.getElementById('typewriter');
        if (typewriterEl) typewriterEl.textContent = '';
        typeWriter();
    }

    function typeWriter() {
        const typewriterEl = document.getElementById('typewriter');
        if (!typewriterEl) return;

        const currentRoles = translations[currentLang]?.hero_roles || ["Software Developer", "AI Engineer"];
        const currentText = currentRoles[roleIndex];

        if (isDeleting) {
            typewriterEl.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterEl.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % currentRoles.length;
            typeSpeed = 500; // Pause before typing next
        }

        typewriterTimeout = setTimeout(typeWriter, typeSpeed);
    }

    // Start typewriter
    resetTypewriter();


    // 2. Intersection Observer for Scroll Reveal
    const revealObserverOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, revealObserverOptions);

    // Apply reveal to specific elements
    document.querySelectorAll('.section-title, .glass-card, .timeline-item, .skill-card, .edu-card, .project-card, .news-card').forEach(el => {
        el.classList.add('reveal');
        revealObserver.observe(el);
    });

    // 3. Mouse Tracking Glow Effect for Glass Cards
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    updateContent();
});
