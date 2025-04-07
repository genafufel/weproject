/**
 * Утилита для анимации элементов при прокрутке страницы
 * и автоматической прокрутки к секциям при приближении к ним
 */

// Переменная для отслеживания блокировки прокрутки
let isScrollLocked = false;
let autoScrollTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
let lockScrollTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

// Функция для плавной прокрутки к элементу
export function smoothScrollTo(element: Element | null, duration = 800, callback?: () => void) {
  if (!element) return;
  
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime: number | null = null;

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);
    const easeInOutCubic = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    window.scrollTo(0, startPosition + distance * easeInOutCubic);
    
    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    } else {
      if (callback) callback();
    }
  }
  
  requestAnimationFrame(animation);
}

// Функция для блокировки прокрутки
function lockScroll(duration: number) {
  if (isScrollLocked) return;
  
  isScrollLocked = true;
  const scrollY = window.scrollY;
  
  // Предотвращаем прокрутку, восстанавливая позицию прокрутки
  const handleScrollDuringLock = () => {
    window.scrollTo(0, scrollY);
  };
  
  window.addEventListener('scroll', handleScrollDuringLock);
  
  // Разблокируем прокрутку через указанное время
  clearTimeout(lockScrollTimeout);
  lockScrollTimeout = setTimeout(() => {
    window.removeEventListener('scroll', handleScrollDuringLock);
    isScrollLocked = false;
  }, duration);
}

// Функция для проверки, находится ли элемент рядом с областью видимости
function isElementNearViewport(el: Element, threshold = 0.2) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Элемент считается близким к зоне видимости, когда до его верхней части
  // осталось 20% от высоты экрана
  return rect.top <= windowHeight * (1 + threshold) && rect.top > 0;
}

// Функция для проверки видимости элемента
const isElementInViewport = (el: Element, threshold = 0.8) => {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  
  // Элемент считается в зоне видимости, когда его верхняя часть
  // находится в пределах нижних threshold% экрана
  return rect.top <= windowHeight * threshold;
};

export function setupScrollAnimations() {
  // Получаем все элементы с классом section-animate
  const animatedSections = document.querySelectorAll('.section-animate');
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
  
  // Получаем CTA секцию
  const ctaSection = document.getElementById('cta');
  let hasTriggeredAutoScroll = false;
  
  // Функция для анимации элементов при прокрутке
  const handleScroll = () => {
    // Анимация всех секций при попадании в область видимости
    animatedSections.forEach((section) => {
      if (isElementInViewport(section) && !section.classList.contains('animate-visible')) {
        section.classList.add('animate-visible');
      }
    });
    
    // Проверка для автоматической прокрутки к CTA секции
    if (ctaSection && !hasTriggeredAutoScroll && !isScrollLocked) {
      if (isElementNearViewport(ctaSection, 0.2)) {
        hasTriggeredAutoScroll = true;
        
        // Отложим прокрутку на короткий промежуток времени
        clearTimeout(autoScrollTimeout);
        autoScrollTimeout = setTimeout(() => {
          // Плавно прокручиваем к CTA секции
          smoothScrollTo(ctaSection, 800, () => {
            // После завершения прокрутки блокируем на 2.5 секунды
            lockScroll(2500);
            
            // Добавляем класс для запуска анимации
            ctaSection.classList.add('animate-visible');
            ctaSection.classList.add('animate-highlight');
            
            // Удаляем класс выделения через некоторое время
            setTimeout(() => {
              ctaSection.classList.remove('animate-highlight');
            }, 2500);
          });
        }, 200);
      }
    }
  };
  
  // Сбрасываем флаг автопрокрутки при перезагрузке страницы
  const resetFlags = () => {
    hasTriggeredAutoScroll = false;
  };
  
  // Запускаем проверку при загрузке страницы
  window.addEventListener('load', () => {
    handleScroll();
    resetFlags();
  });
  
  // Добавляем обработчик события прокрутки с дебаунсингом
  window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = undefined;
      }, 50);
    }
  }, { passive: true });
  
  // Проверяем элементы сразу (для тех, которые уже видны)
  setTimeout(handleScroll, 100);
  
  return () => {
    // Функция очистки
    window.removeEventListener('load', handleScroll);
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(scrollTimeout);
    clearTimeout(autoScrollTimeout);
    clearTimeout(lockScrollTimeout);
  };
}