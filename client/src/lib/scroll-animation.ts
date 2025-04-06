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
    
    // Находим ближайшую секцию к текущей позиции прокрутки
    let closestSection: Element | null = null;
    let minDistance = Infinity;
    
    fullscreenSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      // Расстояние от верха вьюпорта до верха секции (для определения направления прокрутки)
      const distance = Math.abs(rect.top);
      
      // Если секция ближе всех остальных и не полностью на экране, запоминаем её
      if (distance < minDistance && (rect.top < -10 || rect.top > 10)) {
        minDistance = distance;
        closestSection = section;
      }
    });
    
    // Если нашли ближайшую секцию, скроллим к ней
    if (closestSection) {
      closestSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    } else {
      // Если нет подходящей секции, сбрасываем флаг
      isAutoScrolling = false;
    }
  };
  
  // Функция с дебаунсом для автопрокрутки
  const handleScrollWithAutoScroll = () => {
    // Обрабатываем анимации при каждой прокрутке
    handleScroll();
    
    // Очищаем предыдущий таймаут
    clearTimeout(scrollTimeout);
    
    // Если не в режиме автопрокрутки, планируем автопрокрутку через небольшую задержку
    if (!isAutoScrolling) {
      scrollTimeout = setTimeout(() => {
        scrollToNearestSection();
      }, 180); // Небольшая задержка перед автопрокруткой
    }
  };
  
  // Запускаем проверку при загрузке страницы
  window.addEventListener('load', handleScroll);
  
  // Добавляем обработчик события прокрутки с функцией автопрокрутки
  window.addEventListener('scroll', handleScrollWithAutoScroll, { passive: true });
  
  // Проверяем элементы сразу (для тех, которые уже видны)
  setTimeout(handleScroll, 100);
  
  return () => {
    // Функция очистки
    window.removeEventListener('load', handleScroll);
    window.removeEventListener('scroll', handleScrollWithAutoScroll);
    clearTimeout(scrollTimeout);
  };
}