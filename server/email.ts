import { ask_secrets } from "./utils";

// Временное решение для имитации отправки Email
let emailApiKey: string | null = null;

export async function askForEmailAPIKey(): Promise<string> {
  if (!emailApiKey) {
    emailApiKey = process.env.EMAIL_API_KEY || await ask_secrets(["EMAIL_API_KEY"]);
  }
  return emailApiKey;
}

// Функция для отправки Email
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  try {
    // Если Email API ключ отсутствует, запрашиваем его
    const apiKey = await askForEmailAPIKey();
    
    // В реальном приложении здесь будет логика отправки Email через API сервиса
    // Например, через SendGrid, Mailgun или другой сервис
    
    // Имитация для разработки
    console.log(`Отправка Email на адрес ${to}:`);
    console.log(`Тема: ${subject}`);
    console.log(`Содержание: ${body}`);
    console.log(`Используемый API ключ: ${apiKey}`);
    
    return true;
  } catch (error) {
    console.error("Ошибка при отправке Email:", error);
    return false;
  }
}