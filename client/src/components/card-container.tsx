import React, { ReactNode } from "react";

interface CardContainerProps {
  children: React.ReactNode;
}

/**
 * Компонент для размещения карточек с поддержкой объединения карточек без фото попарно в один столбец
 */
export function CardContainer({ children }: CardContainerProps) {
  // Разделяем карточки на группы - с фото и без фото
  const cardsWithPhoto: ReactNode[] = [];
  const cardsWithoutPhoto: ReactNode[] = [];
  
  // Функция проверки класса карточки
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      // Проверяем, есть ли у карточки класс 'card-no-photo'
      const className = child.props.className || "";
      if (className.includes("card-no-photo")) {
        cardsWithoutPhoto.push(child);
      } else {
        cardsWithPhoto.push(child);
      }
    }
  });
  
  // Создаём пары из карточек без фото (одна под другой)
  const smallCardPairs: ReactNode[] = [];
  for (let i = 0; i < cardsWithoutPhoto.length; i += 2) {
    if (i + 1 < cardsWithoutPhoto.length) {
      // Если есть пара, объединяем их в один контейнер
      smallCardPairs.push(
        <div key={`pair-${i}`} className="flex flex-col gap-6">
          {cardsWithoutPhoto[i]}
          {cardsWithoutPhoto[i + 1]}
        </div>
      );
    } else {
      // Для нечётной последней карточки
      smallCardPairs.push(cardsWithoutPhoto[i]);
    }
  }
  
  // Объединяем все карточки для отображения
  const allItems = [...cardsWithPhoto, ...smallCardPairs];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {allItems}
    </div>
  );
}