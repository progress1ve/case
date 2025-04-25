/**
 * Конфигурация приложения
 */
const config = {
    // Базовый URL API Backend
    apiUrl: 'http://localhost:5000',
    
    // Адреса кошельков для получения средств
    walletAddresses: {
        USDT: 'TRUwpM7w9FxkRuTqWC7GbEBnxqNw9JGyEK', // Пример адреса USDT TRC-20 кошелька
        TON: 'UQBCv5hzioTR2KCkaX2jPyJHN-byRs1sm0-cAtLM2gfV-qE9'   // Пример адреса TON кошелька
    },
    
    // Курсы валют (фиксированные для примера)
    rates: {
        USDT: 1,    // 1 USDT = 1 USD
        TON: 6.42   // 1 TON = 6.42 USD (на момент разработки)
    },
    
    // Таймаут запросов в миллисекундах
    requestTimeout: 10000,
    
    // Интервал обновления баланса в миллисекундах
    balanceUpdateInterval: 30000
};

/**
 * Проверяет, запущено ли приложение внутри Telegram Web App
 * @returns {boolean} true, если приложение запущено в Telegram Web App
 */
function isTelegramWebApp() {
    return window.Telegram && window.Telegram.WebApp;
}

/**
 * Возвращает тему Telegram
 * @returns {string} 'dark' или 'light'
 */
function getTelegramTheme() {
    if (isTelegramWebApp()) {
        return window.Telegram.WebApp.colorScheme;
    }
    return 'light'; // По умолчанию светлая тема
}

/**
 * Возвращает параметры initData для запросов к API
 * @returns {string} initData строка или пустая строка, если не внутри Telegram Web App
 */
function getInitData() {
    if (isTelegramWebApp()) {
        return window.Telegram.WebApp.initData;
    }
    return '';
}

/**
 * Возвращает URL адрес API с учетом конечной точки
 * @param {string} endpoint - Конечная точка API (без начального слеша)
 * @returns {string} Полный URL адрес API
 */
function getApiUrl(endpoint) {
    return `${config.apiUrl}/api/${endpoint}`;
}

/**
 * Форматирует сумму в USD с двумя десятичными знаками
 * @param {number} amount - Сумма для форматирования
 * @returns {string} Отформатированная сумма с символом доллара
 */
function formatUSD(amount) {
    return `$${parseFloat(amount).toFixed(2)}`;
}

/**
 * Конвертирует сумму криптовалюты в USD
 * @param {number} amount - Сумма криптовалюты
 * @param {string} currency - Валюта (USDT или TON)
 * @returns {number} Сумма в USD
 */
function convertToUSD(amount, currency) {
    return parseFloat(amount) * config.rates[currency];
}

/**
 * Обрезает длинный адрес кошелька для отображения
 * @param {string} address - Полный адрес кошелька
 * @returns {string} Сокращенный адрес (начало...конец)
 */
function shortenAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
} 