
function inicializarCarruselCaracteristicas() {
    const carousel = document.querySelector('.features-carousel');
    if (!carousel) {
        console.log("DEBUG: Contenedor .features-carousel no encontrado. Carrusel no se inicializará.");
        return; 
    }

    console.log("DEBUG: Iniciando carrusel para .features-carousel");

    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(track.children).filter(child => child.classList.contains('feature-card'));
    const dotsContainer = carousel.querySelector('.feature-pagination');
    const dots = dotsContainer ? Array.from(dotsContainer.children).filter(child => child.classList.contains('dot')) : [];
    
    const prevButton = carousel.querySelector('.prev-arrow');
    const nextButton = carousel.querySelector('.next-arrow');
    if (!track || slides.length === 0) {
        console.error('DEBUG: Error crítico: No se encontró .carousel-track o no hay .feature-card (slides).');
        return;
    }
    if (!prevButton || !nextButton) {
        console.warn('DEBUG: Advertencia: Flechas de navegación no encontradas. El carrusel podría no ser completamente navegable.')
    }
    if (dotsContainer && dots.length !== slides.length) {
        console.warn(`DEBUG: Advertencia: El número de puntos (${dots.length}) no coincide con el número de diapositivas (${slides.length}). La paginación de puntos puede no funcionar correctamente.`);
    }

    let currentIndex = 0;

    function updateCarouselUI(animate = true) {
        if (slides.length === 0 || currentIndex < 0 || currentIndex >= slides.length) {
            console.error("DEBUG: Error en updateCarouselUI - slides vacías o currentIndex fuera de rango:", currentIndex, slides.length);
            return;
        }

        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
        }

        let offsetToActiveSlideLeftEdge = 0;
        for (let i = 0; i < currentIndex; i++) {
            if (slides[i]) { 
                offsetToActiveSlideLeftEdge += slides[i].offsetWidth +
                    parseFloat(getComputedStyle(slides[i]).marginLeft) +
                    parseFloat(getComputedStyle(slides[i]).marginRight);
            }
        }
        
        const currentSlideElement = slides[currentIndex];
        if (!currentSlideElement) {
            console.error("DEBUG: No se pudo obtener el slide actual en el índice:", currentIndex);
            return;
        }

        const activeSlideCenterPoint = offsetToActiveSlideLeftEdge +
            parseFloat(getComputedStyle(currentSlideElement).marginLeft) +
            (currentSlideElement.offsetWidth / 2);

        const carouselViewportCenterPoint = carousel.offsetWidth / 2;
        const finalTransform = carouselViewportCenterPoint - activeSlideCenterPoint;
        
        track.style.transform = `translateX(${finalTransform}px)`;
        console.log(`DEBUG: moveToSlide a índice ${currentIndex}. Transform: translateX(${finalTransform}px)`);


        slides.forEach((slide, idx) => {
            slide.classList.toggle('active-slide', idx === currentIndex);
        });

        if (dotsContainer && dots.length === slides.length) {
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active-dot', idx === currentIndex);
            });
        }

        if (!animate) {
            setTimeout(() => {
                track.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
            }, 50);
        }
    }

    if (dotsContainer && dots.length === slides.length) {
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                console.log(`DEBUG: Clic en Dot ${index}`);
                currentIndex = index;
                updateCarouselUI();
            });
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            console.log("DEBUG: Clic en Next");
            currentIndex = (currentIndex + 1) % slides.length;
            updateCarouselUI();
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            console.log("DEBUG: Clic en Prev");
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateCarouselUI();
        });
    }
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log("DEBUG: Ventana redimensionada, actualizando UI del carrusel.");
            updateCarouselUI(false); 
        }, 250);
    });

    if (slides.length > 0) {
        const initialActiveDotIndex = dots.findIndex(dot => dot.classList.contains('active-dot'));
        if (initialActiveDotIndex !== -1) {
            currentIndex = initialActiveDotIndex;
        }
        console.log("DEBUG: Inicializando carrusel en el slide índice:", currentIndex);
        updateCarouselUI(false);
    } else {
        console.warn("DEBUG: No hay slides para inicializar el carrusel.");
    }
}

document.addEventListener('DOMContentLoaded', inicializarCarruselCaracteristicas);