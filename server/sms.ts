import { ask_secrets } from "./utils";

// Временное решение для имитации отправки SMS
let smsApiKey = "";

export async function askForSMSAPIKey(): Promise<string> {
  if (!smsApiKey) {
    smsApiKey = process.env.SMS_API_KEY || await ask_secrets(["SMS_API_KEY"]);
  }
  return smsApiKey;
}

// Функция для отправки SMS
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // Если SMS API ключ отсутствует, запрашиваем его
    const apiKey = await askForSMSAPIKey();
    
    // В реальном приложении здесь будет логика отправки SMS через API сервиса
    // Например, через Twilio, Nexmo или другой сервис
    
    // Имитация для разработки
    console.log(`Отправка SMS на номер ${phoneNumber}:`);
    console.log(`Сообщение: ${message}`);
    console.log(`Используемый API ключ: ${apiKey}`);
    
    return true;
  } catch (error) {
    console.error("Ошибка при отправке SMS:", error);
    return false;
  }
}