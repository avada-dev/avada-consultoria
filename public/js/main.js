// ==========================================
// AVADA CONSULTORIA - MAIN JAVASCRIPT
// ==========================================

(function () {
    'use strict';

    // ==========================================
    // NAVIGATION
    // ==========================================

    const header = document.querySelector('.header');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect for header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    mobileToggle?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
    });

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only handle anchor links on same page
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }

                // Close mobile menu after click
                navMenu?.classList.remove('active');
            }
        });
    });

    // Set active link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
            link.classList.add('active');
        }
    });

    // ==========================================
    // TYPED.JS INITIALIZATION
    // ==========================================

    const typedElement = document.querySelector('.typed-text');
    if (typedElement && typeof Typed !== 'undefined') {
        new Typed('.typed-text', {
            strings: [
                'Recursos de Multas de Trânsito',
                'Pareceres Técnicos Especializados',
                'Perícia Digital em Documentos',
                'Desenvolvimento de Sistemas'
            ],
            typeSpeed: 60,
            backSpeed: 40,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    // ==========================================
    // ANIMATED COUNTERS
    // ==========================================

    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    }

    // Intersection Observer for counters
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                animateCounter(entry.target);
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
        counterObserver.observe(counter);
    });

    // ==========================================
    // SPLIDE CAROUSEL (Testimonials)
    // ==========================================

    const testimonialCarousel = document.querySelector('.testimonial-carousel');
    if (testimonialCarousel && typeof Splide !== 'undefined') {
        new Splide('.testimonial-carousel', {
            type: 'loop',
            perPage: 1,
            perMove: 1,
            gap: '2rem',
            autoplay: true,
            interval: 5000,
            pauseOnHover: true,
            arrows: true,
            pagination: true,
            breakpoints: {
                768: {
                    arrows: false
                }
            }
        }).mount();
    }

    // ==========================================
    // FAQ ACCORDION
    // ==========================================

    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question?.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all FAQ items
            faqItems.forEach(faq => faq.classList.remove('active'));

            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ==========================================
    // CONTACT FORM HANDLING
    // ==========================================

    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            // Create WhatsApp message
            const message = `
*Nova Mensagem do Site - AVADA Consultoria*

*Nome:* ${data.name}
*Email:* ${data.email}
*Telefone:* ${data.phone || 'Não informado'}
*Assunto:* ${data.subject}

*Mensagem:*
${data.message}
      `.trim();

            const whatsappUrl = `https://wa.me/5513981854881?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            // Reset form
            contactForm.reset();

            // Show success message
            alert('Redirecionando para WhatsApp...');
        });
    }

    // ==========================================
    // ANIME.JS ANIMATIONS
    // ==========================================

    if (typeof anime !== 'undefined') {
        // Fade in elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const animateOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    anime({
                        targets: entry.target,
                        opacity: [0, 1],
                        translateY: [50, 0],
                        duration: 800,
                        easing: 'easeOutQuad'
                    });
                    animateOnScroll.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements with animation class
        document.querySelectorAll('.service-card, .team-card, .timeline-item').forEach(el => {
            el.style.opacity = '0';
            animateOnScroll.observe(el);
        });

        // Hero button animations
        anime({
            targets: '.hero-buttons .btn',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(150, { start: 500 }),
            duration: 800,
            easing: 'easeOutQuad'
        });
    }

    // ==========================================
    // WHATSAPP BUTTONS
    // ==========================================

    const whatsappButtons = document.querySelectorAll('[data-whatsapp]');
    whatsappButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const message = button.getAttribute('data-message') || 'Olá, gostaria de mais informações sobre os serviços da AVADA Consultoria.';
            const whatsappUrl = `https://wa.me/5513981854881?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    });

    // ==========================================
    // LOADING STATE
    // ==========================================

    window.addEventListener('load', () => {
        document.body.classList.add('loaded');

        // Trigger initial animations
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.hero-content > *',
                opacity: [0, 1],
                translateY: [30, 0],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutQuad'
            });
        }
    });

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    // Detect if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Debounce function for performance
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ==========================================
    // SCROLL REVEAL ANIMATIONS
    // ==========================================

    const revealElements = document.querySelectorAll('.animate-on-scroll');

    const revealOnScroll = debounce(() => {
        revealElements.forEach(element => {
            if (isInViewport(element) && !element.classList.contains('revealed')) {
                element.classList.add('revealed', 'animate-fadeInUp');
            }
        });
    }, 100);

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // ==========================================
    // BACK TO TOP BUTTON
    // ==========================================

    const backToTop = document.querySelector('.back-to-top');

    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.style.display = 'flex';
            } else {
                backToTop.style.display = 'none';
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    console.log('🚗 AVADA Consultoria - Website initialized successfully');

})();
