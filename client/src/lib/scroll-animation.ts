/**
 * Утилита для анимации элементов при прокрутке страницы
 */

export function setupScrollAnimations() {
  // Получаем все элементы с классом section-animate
  const animatedSections = document.querySelectorAll('.section-animate');
  
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
  };
  
  // Запускаем проверку при загрузке страницы
  window.addEventListener('load', handleScroll);
  
  // Добавляем обработчик события прокрутки
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Проверяем элементы сразу (для тех, которые уже видны)
  setTimeout(handleScroll, 100);
  
  return () => {
    // Функция очистки
    window.removeEventListener('load', handleScroll);
    window.removeEventListener('scroll', handleScroll);
  };
}