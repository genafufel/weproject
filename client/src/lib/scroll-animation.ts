/**
 * Утилита для анимации элементов при прокрутке страницы
 */

export function setupScrollAnimations(sectionIds?: string[]) {
  // Получаем все элементы с классом section-animate
  const animatedSections = document.querySelectorAll('.section-animate');
  
  // Если переданы ID секций, добавим им класс для анимации
  if (sectionIds && sectionIds.length > 0) {
    sectionIds.forEach(id => {
      const section = document.getElementById(id);
      if (section && !section.classList.contains('section-animate')) {
        section.classList.add('section-animate');
      }
    });
  }
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
    clearTimeout(scrollTimeout);
  };
}