import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

async function getRenderedHTML() {
  try {
    // Получаем HTML-страницу
    const response = await fetch('http://localhost:5000/');
    const html = await response.text();
    
    console.log('HTML код главной страницы:');
    console.log('='.repeat(80));
    console.log(html);
    console.log('='.repeat(80));
    
    // Можно также использовать JSDOM для анализа
    const dom = new JSDOM(html);
    const bodyContent = dom.window.document.body.innerHTML;
    
    console.log('\n\nСодержимое body:');
    console.log('='.repeat(80));
    console.log(bodyContent);
  } catch (error) {
    console.error('Ошибка при получении HTML:', error);
  }
}

getRenderedHTML();