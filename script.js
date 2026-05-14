// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== Mobile Navigation Toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // Animate hamburger to X
    const spans = navToggle.querySelectorAll('span');
    if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Close mobile menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// ===== Accordion Logic =====
const accordions = document.querySelectorAll('.topic-accordion');

accordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    const content = accordion.querySelector('.accordion-content');

    header.addEventListener('click', () => {
        const isActive = accordion.classList.contains('active');

        // Close all accordions
        accordions.forEach(a => {
            a.classList.remove('active');
            a.querySelector('.accordion-content').style.maxHeight = null;
        });

        // If it wasn't active, open it
        if (!isActive) {
            accordion.classList.add('active');
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});

// Initialize the first accordion as open
if(accordions.length > 0) {
    accordions[0].classList.add('active');
    const firstContent = accordions[0].querySelector('.accordion-content');
    firstContent.style.maxHeight = firstContent.scrollHeight + "px";
}

// ===== Animated Counters =====
const counters = document.querySelectorAll('.counter');
const animateCounters = () => {
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000; // ms
        const start = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeOutExpo)
            const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            counter.innerText = Math.floor(easeOut * target);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target;
            }
        };

        requestAnimationFrame(updateCounter);
    });
};

// Intersection Observer for triggering counters
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(statsSection);
}

// ===== Form Submission & Toast =====
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent actual submission
        
        // Show Toast
        toast.classList.add('show');
        
        // Hide Toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);

        // Reset form
        contactForm.reset();
    });
}
