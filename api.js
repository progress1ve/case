/**
 * API клиент для взаимодействия с бэкендом
 */
class ApiClient {
    /**
     * Отправляет запрос к API с данными из Telegram Web App
     * 
     * @param {string} endpoint - Конечная точка API
     * @param {Object} additionalData - Дополнительные данные для запроса
     * @returns {Promise<Object>} - Результат запроса
     */
    async sendRequest(endpoint, additionalData = {}) {
        try {
            // Формируем базовые данные запроса с initData
            const requestData = {
                initData: getInitData(),
                ...additionalData
            };
            
            // Отправляем запрос
            const response = await fetch(getApiUrl(endpoint), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                timeout: config.requestTimeout
            });
            
            // Проверяем статус ответа
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка запроса: ${response.status}`);
            }
            
            // Возвращаем данные
            return await response.json();
            
        } catch (error) {
            console.error(`Ошибка API (${endpoint}):`, error);
            throw error;
        }
    }
    
    /**
     * Получает информацию о пользователе из Telegram Web App
     * @returns {Promise<Object>} - Информация о пользователе
     */
    async getUserInfo() {
        return await this.sendRequest('user_info');
    }
    
    /**
     * Получает баланс пользователя (USDT и TON)
     * @returns {Promise<Object>} - Баланс пользователя
     */
    async getBalance() {
        return await this.sendRequest('balance');
    }
    
    /**
     * Получает историю транзакций пользователя
     * @returns {Promise<Array>} - История транзакций
     */
    async getTransactions() {
        return await this.sendRequest('transactions');
    }
    
    /**
     * Отправляет запрос на перевод криптовалюты
     * 
     * @param {string} address - Адрес получателя
     * @param {number} amount - Сумма перевода
     * @param {string} currency - Валюта (USDT или TON)
     * @returns {Promise<Object>} - Результат транзакции
     */
    async transfer(address, amount, currency) {
        return await this.sendRequest('transfer', {
            address,
            amount,
            currency
        });
    }
}

// Создаем экземпляр API клиента
const api = new ApiClient(); 