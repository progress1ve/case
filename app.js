/**
 * Case Wallet - основной файл приложения
 */

// Глобальные переменные
let currentBalance = {
    usdt: 0,
    ton: 0
};
let currentScreen = 'main'; // 'main', 'send', 'receive'
let transactionHistory = [];
let updateBalanceInterval = null;

// DOM элементы
const elements = {
    // Общие элементы
    loadingScreen: document.getElementById('loading-screen'),
    mainContent: document.getElementById('main-content'),
    
    // Экраны
    sendScreen: document.getElementById('send-screen'),
    receiveScreen: document.getElementById('receive-screen'),
    
    // Профиль пользователя
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userId: document.getElementById('user-id'),
    
    // Баланс
    totalBalance: document.getElementById('total-balance'),
    usdtBalance: document.getElementById('usdt-balance'),
    usdtUsd: document.getElementById('usdt-usd'),
    tonBalance: document.getElementById('ton-balance'),
    tonUsd: document.getElementById('ton-usd'),
    
    // Кнопки действий
    btnSend: document.getElementById('btn-send'),
    btnReceive: document.getElementById('btn-receive'),
    
    // Экран отправки
    btnBackFromSend: document.getElementById('btn-back-from-send'),
    sendForm: document.getElementById('send-form'),
    currencySelect: document.getElementById('currency-select'),
    recipientAddress: document.getElementById('recipient-address'),
    amount: document.getElementById('amount'),
    currencyLabel: document.getElementById('currency-label'),
    availableBalance: document.getElementById('available-balance'),
    
    // Экран получения
    btnBackFromReceive: document.getElementById('btn-back-from-receive'),
    receiveCurrencySelect: document.getElementById('receive-currency-select'),
    walletAddress: document.getElementById('wallet-address'),
    btnCopyAddress: document.getElementById('btn-copy-address'),
    qrcodeContainer: document.getElementById('qrcode-container'),
    receiveCurrencyName: document.getElementById('receive-currency-name'),
    
    // Транзакции
    transactionsList: document.getElementById('transactions-list'),
    noTransactions: document.getElementById('no-transactions'),
    
    // Модальные окна
    confirmModal: new bootstrap.Modal(document.getElementById('confirmModal')),
    resultModal: new bootstrap.Modal(document.getElementById('resultModal')),
    confirmAmount: document.getElementById('confirm-amount'),
    confirmCurrency: document.getElementById('confirm-currency'),
    confirmAddress: document.getElementById('confirm-address'),
    btnConfirmSend: document.getElementById('btn-confirm-send'),
    resultSuccess: document.getElementById('result-success'),
    resultError: document.getElementById('result-error'),
    transactionId: document.getElementById('transaction-id'),
    errorMessage: document.getElementById('error-message')
};

/**
 * Инициализация приложения
 */
async function initApp() {
    try {
        // Инициализация Telegram Web App
        if (isTelegramWebApp()) {
            const webApp = window.Telegram.WebApp;
            
            // Установка цветовой схемы
            if (webApp.colorScheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            
            document.body.classList.add('telegram-app');
            
            // Уведомление Telegram, что Web App готова
            webApp.ready();
            
            // Включаем основное расширение (если доступно)
            if (webApp.MainButton) {
                webApp.MainButton.hide();
            }
            
            // Установка темы
            webApp.setHeaderColor(webApp.colorScheme === 'dark' ? '#1f1f1f' : '#ffffff');
            webApp.setBackgroundColor(webApp.colorScheme === 'dark' ? '#1f1f1f' : '#ffffff');
        }
        
        // Загрузка данных пользователя
        await loadUserInfo();
        
        // Загрузка баланса
        await loadBalance();
        
        // Загрузка транзакций
        await loadTransactions();
        
        // Настройка обработчиков событий
        setupEventListeners();
        
        // Настройка интервала обновления баланса
        updateBalanceInterval = setInterval(loadBalance, config.balanceUpdateInterval);
        
        // Скрываем экран загрузки и показываем основной контент
        elements.loadingScreen.style.display = 'none';
        elements.mainContent.classList.remove('d-none');
        
    } catch (error) {
        console.error('Ошибка инициализации приложения:', error);
        alert('Ошибка загрузки приложения: ' + error.message);
    }
}

/**
 * Загружает и отображает информацию о пользователе
 */
async function loadUserInfo() {
    try {
        // Запрашиваем информацию о пользователе из API
        const userData = await api.getUserInfo();
        
        // Обновляем элементы интерфейса
        if (userData.photo_url) {
            elements.userAvatar.src = userData.photo_url;
        }
        
        const displayName = userData.first_name || userData.username || 'Пользователь';
        elements.userName.textContent = displayName;
        
        if (userData.id) {
            elements.userId.textContent = `ID: ${userData.id}`;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки информации о пользователе:', error);
        // Используем значения по умолчанию в случае ошибки
    }
}

/**
 * Загружает и отображает баланс пользователя
 */
async function loadBalance() {
    try {
        // Запрашиваем баланс из API
        const balanceData = await api.getBalance();
        
        // Обновляем глобальные переменные
        currentBalance.usdt = balanceData.usdt.balance;
        currentBalance.ton = balanceData.ton.balance;
        
        // Обновляем элементы интерфейса
        elements.usdtBalance.textContent = currentBalance.usdt.toFixed(2);
        elements.usdtUsd.textContent = formatUSD(currentBalance.usdt);
        
        elements.tonBalance.textContent = currentBalance.ton.toFixed(2);
        elements.tonUsd.textContent = formatUSD(convertToUSD(currentBalance.ton, 'TON'));
        
        // Обновляем общий баланс (в USD)
        const totalUsd = currentBalance.usdt + convertToUSD(currentBalance.ton, 'TON');
        elements.totalBalance.textContent = formatUSD(totalUsd);
        
        // Обновляем доступный баланс в форме отправки, если она открыта
        updateAvailableBalance();
        
    } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
        // Не обновляем значения в случае ошибки
    }
}

/**
 * Загружает и отображает историю транзакций
 */
async function loadTransactions() {
    try {
        // Запрашиваем транзакции из API
        transactionHistory = await api.getTransactions();
        
        // Проверяем, есть ли транзакции
        if (transactionHistory.length === 0) {
            elements.noTransactions.classList.remove('d-none');
            return;
        }
        
        // Скрываем сообщение об отсутствии транзакций
        elements.noTransactions.classList.add('d-none');
        
        // Очищаем список транзакций
        while (elements.transactionsList.firstChild) {
            elements.transactionsList.removeChild(elements.transactionsList.firstChild);
        }
        
        // Отображаем последние 5 транзакций
        const recentTransactions = transactionHistory.slice(0, 5);
        
        recentTransactions.forEach(transaction => {
            const transactionElement = createTransactionElement(transaction);
            elements.transactionsList.appendChild(transactionElement);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки транзакций:', error);
        // Оставляем сообщение об отсутствии транзакций
        elements.noTransactions.classList.remove('d-none');
    }
}

/**
 * Создает DOM элемент для транзакции
 * @param {Object} transaction - Данные о транзакции
 * @returns {HTMLElement} - DOM элемент транзакции
 */
function createTransactionElement(transaction) {
    const isOutgoing = transaction.recipient_address && !transaction.sender_address;
    const dateObj = new Date(transaction.created_at);
    const formattedDate = dateObj.toLocaleDateString() + ' ' + 
                         dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Создаем элемент транзакции
    const transactionDiv = document.createElement('div');
    transactionDiv.className = 'transaction-item';
    
    // Определяем иконку и класс суммы в зависимости от типа транзакции
    const iconClass = isOutgoing ? 'fa-arrow-up text-danger' : 'fa-arrow-down text-success';
    const amountClass = isOutgoing ? 'transaction-amount-negative' : 'transaction-amount-positive';
    const amountPrefix = isOutgoing ? '-' : '+';
    
    // Формируем адрес для отображения
    const address = isOutgoing ? 
                   shortenAddress(transaction.recipient_address) : 
                   shortenAddress(transaction.sender_address || 'Неизвестно');
    
    // Устанавливаем HTML содержимое
    transactionDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <div class="transaction-icon me-3">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-info">
                    <h6 class="mb-0">${isOutgoing ? 'Отправлено' : 'Получено'}</h6>
                    <small class="text-muted">${address}</small>
                </div>
            </div>
            <div class="transaction-amount text-end">
                <h6 class="mb-0 ${amountClass}">${amountPrefix}${transaction.amount} ${transaction.currency}</h6>
                <small class="text-muted">${formattedDate}</small>
            </div>
        </div>
    `;
    
    return transactionDiv;
}

/**
 * Настраивает обработчики событий для элементов интерфейса
 */
function setupEventListeners() {
    // Кнопки навигации
    elements.btnSend.addEventListener('click', showSendScreen);
    elements.btnReceive.addEventListener('click', showReceiveScreen);
    elements.btnBackFromSend.addEventListener('click', showMainScreen);
    elements.btnBackFromReceive.addEventListener('click', showMainScreen);
    
    // Форма отправки
    elements.sendForm.addEventListener('submit', handleSendFormSubmit);
    elements.currencySelect.addEventListener('change', updateAvailableBalance);
    
    // Экран получения
    elements.receiveCurrencySelect.addEventListener('change', updateReceiveAddress);
    elements.btnCopyAddress.addEventListener('click', copyWalletAddress);
    
    // Подтверждение отправки
    elements.btnConfirmSend.addEventListener('click', confirmTransfer);
}

/**
 * Показывает главный экран
 */
function showMainScreen() {
    elements.mainContent.classList.remove('d-none');
    elements.sendScreen.classList.add('d-none');
    elements.receiveScreen.classList.add('d-none');
    currentScreen = 'main';
}

/**
 * Показывает экран отправки
 */
function showSendScreen() {
    elements.mainContent.classList.add('d-none');
    elements.sendScreen.classList.remove('d-none');
    elements.receiveScreen.classList.add('d-none');
    currentScreen = 'send';
    
    // Сбрасываем форму
    elements.sendForm.reset();
    
    // Обновляем доступный баланс
    updateAvailableBalance();
}

/**
 * Показывает экран получения
 */
function showReceiveScreen() {
    elements.mainContent.classList.add('d-none');
    elements.sendScreen.classList.add('d-none');
    elements.receiveScreen.classList.remove('d-none');
    currentScreen = 'receive';
    
    // Обновляем адрес и QR-код
    updateReceiveAddress();
}

/**
 * Обновляет доступный баланс в форме отправки
 */
function updateAvailableBalance() {
    const currency = elements.currencySelect.value;
    elements.currencyLabel.textContent = currency;
    
    if (currency === 'USDT') {
        elements.availableBalance.textContent = currentBalance.usdt.toFixed(2);
    } else if (currency === 'TON') {
        elements.availableBalance.textContent = currentBalance.ton.toFixed(2);
    }
}

/**
 * Обновляет адрес кошелька на экране получения и генерирует QR-код
 */
function updateReceiveAddress() {
    const currency = elements.receiveCurrencySelect.value;
    const address = config.walletAddresses[currency];
    
    elements.walletAddress.value = address;
    elements.receiveCurrencyName.textContent = currency === 'USDT' ? 'USDT (TRC-20)' : 'TON';
    
    // Очищаем контейнер QR-кода
    elements.qrcodeContainer.innerHTML = '';
    
    // Генерируем новый QR-код
    QRCode.toCanvas(elements.qrcodeContainer, address, {
        width: 200,
        margin: 2,
        color: {
            dark: getTelegramTheme() === 'dark' ? '#ffffff' : '#000000',
            light: '#0000'
        }
    });
}

/**
 * Копирует адрес кошелька в буфер обмена
 */
function copyWalletAddress() {
    const address = elements.walletAddress.value;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(address)
            .then(() => {
                // Изменяем иконку кнопки на время
                const button = elements.btnCopyAddress;
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.remove('btn-outline-primary');
                button.classList.add('btn-success');
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-outline-primary');
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка при копировании в буфер обмена:', err);
                alert('Не удалось скопировать адрес. Пожалуйста, скопируйте его вручную.');
            });
    } else {
        // Запасной вариант для старых браузеров
        elements.walletAddress.select();
        document.execCommand('copy');
        alert('Адрес скопирован!');
    }
}

/**
 * Обрабатывает отправку формы отправки
 * @param {Event} event - Событие отправки формы
 */
function handleSendFormSubmit(event) {
    event.preventDefault();
    
    const currency = elements.currencySelect.value;
    const address = elements.recipientAddress.value.trim();
    const amount = parseFloat(elements.amount.value);
    
    // Проверяем, что адрес не пустой
    if (!address) {
        alert('Пожалуйста, введите адрес получателя');
        return;
    }
    
    // Проверяем, что сумма валидна
    if (isNaN(amount) || amount <= 0) {
        alert('Пожалуйста, введите корректную сумму');
        return;
    }
    
    // Проверяем, что у пользователя достаточно средств
    const availableBalance = currency === 'USDT' ? currentBalance.usdt : currentBalance.ton;
    if (amount > availableBalance) {
        alert(`Недостаточно средств. Доступно: ${availableBalance.toFixed(2)} ${currency}`);
        return;
    }
    
    // Заполняем модальное окно подтверждения
    elements.confirmAmount.textContent = amount.toFixed(2);
    elements.confirmCurrency.textContent = currency;
    elements.confirmAddress.textContent = address;
    
    // Сохраняем данные для отправки
    elements.btnConfirmSend.dataset.address = address;
    elements.btnConfirmSend.dataset.amount = amount;
    elements.btnConfirmSend.dataset.currency = currency;
    
    // Показываем модальное окно подтверждения
    elements.confirmModal.show();
}

/**
 * Подтверждает перевод средств
 */
async function confirmTransfer() {
    // Скрываем модальное окно подтверждения
    elements.confirmModal.hide();
    
    // Получаем данные для отправки
    const address = elements.btnConfirmSend.dataset.address;
    const amount = parseFloat(elements.btnConfirmSend.dataset.amount);
    const currency = elements.btnConfirmSend.dataset.currency;
    
    try {
        // Отправляем запрос на перевод
        const result = await api.transfer(address, amount, currency);
        
        // Показываем результат успешной транзакции
        elements.resultSuccess.classList.remove('d-none');
        elements.resultError.classList.add('d-none');
        
        if (result.transaction_id) {
            elements.transactionId.textContent = `ID транзакции: ${result.transaction_id}`;
        } else {
            elements.transactionId.textContent = '';
        }
        
        // Обновляем баланс и историю транзакций
        await loadBalance();
        await loadTransactions();
        
        // Возвращаемся на главный экран после закрытия модального окна
        document.getElementById('resultModal').addEventListener('hidden.bs.modal', () => {
            showMainScreen();
        }, { once: true });
        
    } catch (error) {
        // Показываем ошибку
        elements.resultSuccess.classList.add('d-none');
        elements.resultError.classList.remove('d-none');
        elements.errorMessage.textContent = error.message || 'Произошла ошибка при отправке транзакции';
    }
    
    // Показываем модальное окно с результатом
    elements.resultModal.show();
}

// Запускаем инициализацию приложения после загрузки страницы
document.addEventListener('DOMContentLoaded', initApp); 