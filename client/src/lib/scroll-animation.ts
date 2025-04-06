/**
 * Утилита для анимации элементов при прокрутке страницы и автоматической прокрутки к секциям
 */

export function setupScrollAnimations() {
  // Получаем все элементы с классом section-animate и fullscreen-section
  const animatedSections = document.querySelectorAll('.section-animate');
  const fullscreenSections = document.querySelectorAll('.fullscreen-section');
  
  // Состояние для контроля автопрокрутки
  let isAutoScrolling = false;
  let lastScrollTime = Date.now();
  let lastScrollY = window.scrollY || 0;
  let scrollTimeout: ReturnType<typeof setTimeout>;
  
  // Функция для проверки видимости элемента
  const isElementInViewport = (el: Element) => {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Элемент считается в зоне видимости, когда его верхняя часть
    // находится в пределах нижних 80% экрана
    return rect.top <= windowHeight * 0.8;
  };
  
  // Функция для анимации элементов при прокрутке
  const handleScroll = () => {
    animatedSections.forEach((section) => {
      if (isElementInViewport(section) && !section.classList.contains('animate-visible')) {
        section.classList.add('animate-visible');
      }
    });
    
    // Если прошло достаточно времени с последней автопрокрутки, сбрасываем флаг
    if (Date.now() - lastScrollTime > 800) {
      isAutoScrolling = false;
    }
  };
  
  // Функция для нахождения ближайшей секции и прокрутки к ней
  const scrollToNearestSection = () => {
    // Если уже в процессе автопрокрутки, выходим
    if (isAutoScrolling) return;
    
    // Устанавливаем флаг и время прокрутки
    isAutoScrolling = true;
    lastScrollTime = Date.now();
    
    // Определяем направление прокрутки (вверх или вниз)
    const scrollDirection = window.scrollY > lastScrollY ? 1 : -1;
    lastScrollY = window.scrollY;
    
    // Проверка, находимся ли мы внизу страницы
    const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    
    // Если мы уже внизу страницы и пытаемся прокрутить дальше вниз, выходим
    if (isAtBottom && scrollDirection > 0) {
      isAutoScrolling = false;
      return;
    }
    
    // Находим ближайшую секцию к текущей позиции прокрутки
    let targetSection: Element | null = null;
    let minDistance = Infinity;
    
    fullscreenSections.forEach((section, index) => {
      const rect = section.getBoundingClientRect();
      
      // Если скроллим вниз, ищем секцию, верх которой ниже текущего вида
      if (scrollDirection > 0 && rect.top > 10) {
        if (rect.top < minDistance) {
          minDistance = rect.top;
          targetSection = section;
        }
      } 
      // Если скроллим вверх, ищем секцию, низ которой выше текущего вида
      else if (scrollDirection < 0 && rect.bottom < 0) {
        if (Math.abs(rect.bottom) < minDistance) {
          minDistance = Math.abs(rect.bottom);
          targetSection = section;
        }
      }
    });
    
    // Если не нашли подходящую секцию через направление прокрутки,
    // используем стандартный поиск ближайшей секции
    if (!targetSection) {
      minDistance = Infinity;
      fullscreenSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distance = Math.abs(rect.top);
        
        if (distance < minDistance && (rect.top < -10 || rect.top > 10)) {
          minDistance = distance;
          targetSection = section;
        }
      });
    }
    
    // Если нашли секцию для прокрутки, скроллим к ней
    if (targetSection) {
      // Вместо scrollIntoView используем scrollTo с расчетом позиции
      const rect = targetSection.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop;
      
      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });
    } else {
      // Если в самом низу страницы и не нашли секцию, прокручиваем до конца
      if (scrollDirection > 0 && !isAtBottom) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        // Если нет подходящей секции, сбрасываем флаг
        isAutoScrolling = false;
      }
    }
  };
  
  // Функция для обработки прокрутки без автоскролла
  const handleScrollWithoutAutoScroll = () => {
    // Обрабатываем только анимации при прокрутке
    handleScroll();
  };
  
  // Запускаем проверку при загрузке страницы
  window.addEventListener('load', handleScroll);
  
  // Добавляем обработчик события прокрутки без автопрокрутки
  window.addEventListener('scroll', handleScrollWithoutAutoScroll, { passive: true });
  
  // Проверяем элементы сразу (для тех, которые уже видны)
  setTimeout(handleScroll, 100);
  
  return () => {
    // Функция очистки
    window.removeEventListener('load', handleScroll);
    window.removeEventListener('scroll', handleScrollWithoutAutoScroll);
    clearTimeout(scrollTimeout);
  };
}