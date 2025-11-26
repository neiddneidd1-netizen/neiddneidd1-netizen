// Общий JavaScript для всех страниц

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    loadData();
    displayCurrentUser();
    applyRoleBasedUI();
    
    // Добавляем ссылку на личный кабинет в навигацию
    addProfileLink();
});

// Добавление ссылки на личный кабинет в навигацию
function addProfileLink() {
    const user = getCurrentUser();
    const nav = document.querySelector('.nav-menu');
    if (!nav) return;
    
    // Проверяем, есть ли уже ссылка на профиль
    let profileLink = nav.querySelector('a[href="profile.html"]');
    const loginLink = nav.querySelector('a[href="login.html"]');
    
    if (user) {
        // Если пользователь авторизован, заменяем "Вход" на "Личный кабинет"
        if (loginLink && !profileLink) {
            loginLink.href = 'profile.html';
            loginLink.innerHTML = 'Личный кабинет';
        }
    } else {
        // Если не авторизован, возвращаем "Вход"
        if (profileLink) {
            profileLink.href = 'login.html';
            profileLink.innerHTML = '🔑 Вход';
        }
    }
}

// Инициализация навигации
function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
        
        // Обработка клика по ссылке
        link.addEventListener('click', function(e) {
            if (href && href !== '#' && href !== currentPage) {
                // Сохраняем данные перед переходом
                saveData();
            }
        });
    });
}

// Загрузка данных из JSON
async function loadData() {
    try {
        // Сначала проверяем localStorage
        if (localStorage.getItem('appData')) {
            const localData = JSON.parse(localStorage.getItem('appData'));
            window.appData = localData;
            updatePageContent(localData);
            return Promise.resolve(localData);
        }
        
        // Если в localStorage нет, загружаем из файла
        const response = await fetch('database.json');
        if (response.ok) {
            const data = await response.json();
            window.appData = data;
            localStorage.setItem('appData', JSON.stringify(data));
            updatePageContent(data);
            return Promise.resolve(data);
        } else {
            // Если файл не найден, создаем начальные данные
            initializeDatabase();
            return Promise.resolve(window.appData);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        initializeDatabase();
        return Promise.resolve(window.appData);
    }
}

// Сохранение данных в JSON
async function saveData() {
    if (!window.appData) return;
    
    try {
        // Обновляем время последнего изменения
        if (window.appData.settings) {
            window.appData.settings.lastUpdate = new Date().toISOString();
        }
        
        // Сохраняем в localStorage
        localStorage.setItem('appData', JSON.stringify(window.appData));
        
        // В реальном приложении здесь был бы запрос к серверу для сохранения в файл
        // Для демо-версии используем только localStorage
        console.log('Данные сохранены в localStorage');
        
        // Попытка сохранить в файл через API (если доступен)
        try {
            await fetch('save-database.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.appData)
            });
        } catch (e) {
            // Игнорируем ошибку, если сервер недоступен
        }
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
    }
}

// Инициализация базы данных
function initializeDatabase() {
    if (localStorage.getItem('appData')) {
        window.appData = JSON.parse(localStorage.getItem('appData'));
    } else {
        // Загружаем начальные данные из файла
        fetch('database.json')
            .then(response => response.json())
            .then(data => {
                window.appData = data;
                // Убеждаемся, что все необходимые поля присутствуют
                if (!window.appData.users) window.appData.users = [];
                if (!window.appData.sessions) window.appData.sessions = [];
                if (!window.appData.requests) window.appData.requests = [];
                if (!window.appData.materials) window.appData.materials = [];
                if (!window.appData.employees) window.appData.employees = [];
                if (!window.appData.reports) window.appData.reports = [];
                if (!window.appData.settings) {
                    window.appData.settings = {
                        lastUpdate: new Date().toISOString(),
                        version: "1.0.0"
                    };
                }
                localStorage.setItem('appData', JSON.stringify(window.appData));
            })
            .catch(() => {
                // Если файл не найден, создаем пустую структуру
                window.appData = {
                    users: [],
                    sessions: [],
                    requests: [],
                    materials: [],
                    employees: [],
                    reports: [],
                    settings: {
                        lastUpdate: new Date().toISOString(),
                        version: "1.0.0"
                    }
                };
                localStorage.setItem('appData', JSON.stringify(window.appData));
            });
    }
}

// Обновление контента страницы на основе данных
function updatePageContent(data) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
        case '':
            updateHomePage(data);
            break;
        case 'requests.html':
            updateRequestsPage(data);
            break;
        case 'materials.html':
            updateMaterialsPage(data);
            break;
        case 'employees.html':
            updateEmployeesPage(data);
            break;
        case 'reports.html':
            updateReportsPage(data);
            break;
    }
}

// Обновление главной страницы
function updateHomePage(data) {
    // Обновление статистики
    const stats = calculateStats(data);
    const statElements = document.querySelectorAll('.stat-number');
    if (statElements.length >= 3) {
        statElements[0].textContent = stats.totalRequests || 0;
        statElements[1].textContent = stats.approvedRequests || 0;
        statElements[2].textContent = stats.inProgress || 0;
    }
}

// Обновление страницы заявок
function updateRequestsPage(data) {
    const requestsGrid = document.querySelector('.requests-grid');
    if (!requestsGrid || !data.requests) return;
    
    requestsGrid.innerHTML = '';
    data.requests.forEach(request => {
        const card = createRequestCard(request);
        requestsGrid.appendChild(card);
    });
}

// Обновление страницы материалов
function updateMaterialsPage(data) {
    const materialsGrid = document.querySelector('.materials-grid');
    if (!materialsGrid || !data.materials) return;
    
    materialsGrid.innerHTML = '';
    data.materials.forEach(material => {
        const card = createMaterialCard(material);
        materialsGrid.appendChild(card);
    });
}

// Обновление страницы сотрудников
function updateEmployeesPage(data) {
    const employeesGrid = document.querySelector('.employees-grid');
    if (!employeesGrid || !data.employees) return;
    
    employeesGrid.innerHTML = '';
    data.employees.forEach(employee => {
        const card = createEmployeeCard(employee);
        employeesGrid.appendChild(card);
    });
}

// Обновление страницы отчетов
function updateReportsPage(data) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;
    
    const stats = calculateStats(data);
    const statCards = statsGrid.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        statCards[0].querySelector('.stat-number').textContent = stats.totalRequests || 0;
        statCards[1].querySelector('.stat-number').textContent = stats.approvedRequests || 0;
        statCards[2].querySelector('.stat-number').textContent = stats.rejectedRequests || 0;
        statCards[3].querySelector('.stat-number').textContent = stats.totalAmount || '0 ₽';
    }
}

// Создание карточки заявки
function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'request-card';
    card.innerHTML = `
        <div class="request-header">
            <div class="request-id">#${request.id}</div>
            <div class="request-status status-${request.status}">${getStatusText(request.status)}</div>
        </div>
        <div class="request-details">
            <p><strong>Материал:</strong> ${request.material}</p>
            <p><strong>Количество:</strong> ${request.quantity}</p>
            <p><strong>Тип ковша:</strong> ${request.bucketType}</p>
            <p><strong>Заказчик:</strong> ${request.customer}</p>
            <p><strong>Создана:</strong> ${request.createdDate}</p>
        </div>
        <div class="request-actions">
            <button class="btn btn-primary" onclick="viewRequest('${request.id}')">Просмотр</button>
            <button class="btn btn-success" onclick="approveRequest('${request.id}')">Принять</button>
        </div>
    `;
    return card;
}

// Создание карточки материала
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    const stockClass = material.stock > 10 ? 'stock-available' : 'stock-low';
    const stockText = material.stock > 10 ? `✓ В наличии: ${material.stock} ${material.unit}` : `⚠ Мало: ${material.stock} ${material.unit}`;
    
    card.innerHTML = `
        <div class="material-header">
            <div>
                <div class="material-name">${material.name}</div>
                <div class="material-category">${material.category}</div>
            </div>
        </div>
        <div class="material-details">
            <p><strong>Описание:</strong> ${material.description}</p>
            <p><strong>Характеристики:</strong> ${material.specifications}</p>
            <p><strong>Единица:</strong> ${material.unit}</p>
            <p><strong>Цена:</strong> ${material.price} ₽/${material.unit}</p>
        </div>
        <div class="material-stock">
            <div class="stock-info ${stockClass}">${stockText}</div>
        </div>
        <div class="material-actions">
            <button class="btn btn-primary" onclick="editMaterial('${material.id}')">Изменить</button>
            <button class="btn btn-warning" onclick="orderMaterial('${material.id}')">Заказать</button>
        </div>
    `;
    return card;
}

// Создание карточки сотрудника
function createEmployeeCard(employee) {
    const card = document.createElement('div');
    card.className = 'employee-card';
    const initials = (employee.firstName[0] + employee.lastName[0]).toUpperCase();
    
    card.innerHTML = `
        <div class="employee-header">
            <div class="employee-avatar">${initials}</div>
            <div class="employee-info">
                <h3>${employee.lastName} ${employee.firstName} ${employee.middleName}</h3>
                <div class="employee-position">${employee.position}</div>
            </div>
        </div>
        <div class="employee-details">
            <div class="detail-row">
                <span class="detail-label">Отдел:</span>
                <span class="detail-value">${employee.department}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">${employee.email}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Роль:</span>
                <span class="role-badge role-${employee.role}">${getRoleText(employee.role)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Статус:</span>
                <span class="status-badge status-${employee.status}">${employee.status === 'active' ? 'Активен' : 'Неактивен'}</span>
            </div>
        </div>
        <div class="employee-actions">
            <button class="btn btn-primary btn-sm" onclick="editEmployee('${employee.id}')">Редактировать</button>
            <button class="btn btn-warning btn-sm" onclick="resetPassword('${employee.id}')">Сбросить пароль</button>
        </div>
    `;
    return card;
}

// Вспомогательные функции
function getStatusText(status) {
    const statusMap = {
        'draft': 'Черновик',
        'pending': 'На согласовании',
        'approved': 'Утверждена',
        'in-progress': 'В обработке',
        'completed': 'Завершена'
    };
    return statusMap[status] || status;
}

function getRoleText(role) {
    const roleMap = {
        'employee': 'Сотрудник',
        'manager': 'Руководитель',
        'procurement': 'Закупки',
        'admin': 'Администратор'
    };
    return roleMap[role] || role;
}

// Расчет статистики
function calculateStats(data) {
    const requests = data.requests || [];
    return {
        totalRequests: requests.length,
        approvedRequests: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length,
        inProgress: requests.filter(r => r.status === 'in-progress').length,
        totalAmount: requests.reduce((sum, r) => sum + (r.amount || 0), 0)
    };
}

// Функции для работы с заявками
function viewRequest(id) {
    const request = window.appData.requests.find(r => r.id === id);
    if (request) {
        alert(`Заявка #${id}\nМатериал: ${request.material}\nСтатус: ${getStatusText(request.status)}`);
    }
}

function approveRequest(id) {
    const request = window.appData.requests.find(r => r.id === id);
    if (request) {
        request.status = 'approved';
        saveData();
        updateRequestsPage(window.appData);
        alert('Заявка утверждена!');
    }
}

// Функции для работы с материалами
function editMaterial(id) {
    const material = window.appData.materials.find(m => m.id === id);
    if (material) {
        alert(`Редактирование материала: ${material.name}`);
    }
}

// Заказ материала (создание заявки)
function orderMaterial(id) {
    if (!hasPermission('canOrderMaterial')) {
        alert('У вас нет прав для заказа материалов.');
        return;
    }
    
    const material = window.appData.materials.find(m => m.id === id);
    if (!material) {
        alert('Материал не найден.');
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        alert('Необходима авторизация для заказа материалов.');
        window.location.href = 'login.html';
        return;
    }
    
    // Запрашиваем количество
    const quantity = prompt(`Заказать материал "${material.name}"\nВведите количество (${material.unit}):`);
    if (!quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
        if (quantity !== null) {
            alert('Введите корректное количество!');
        }
        return;
    }
    
    // Создаем заявку на материал
    const requestData = {
        material: material.name,
        quantity: `${quantity} ${material.unit}`,
        bucketType: 'Не указан',
        customer: `${user.firstName} ${user.lastName}`,
        status: 'draft',
        amount: material.price * parseFloat(quantity)
    };
    
    const result = addRequest(requestData);
    
    if (result.success) {
        alert(`Заявка № ${result.request.id} создана!\nМатериал: ${material.name}\nКоличество: ${quantity} ${material.unit}\n\nВы можете найти её в разделе "Заявки".`);
        // Перенаправляем на страницу заявок, если мы не на ней
        if (!window.location.pathname.includes('requests.html')) {
            if (confirm('Перейти к заявкам?')) {
                window.location.href = 'requests.html';
            }
        } else {
            // Если мы на странице заявок, обновляем список
            if (typeof updateRequestsList === 'function') {
                updateRequestsList();
            }
        }
    } else {
        alert('Ошибка при создании заявки: ' + result.message);
    }
}

// Функции для работы с сотрудниками
function editEmployee(id) {
    const employee = window.appData.employees.find(e => e.id === id);
    if (employee) {
        alert(`Редактирование сотрудника: ${employee.lastName} ${employee.firstName}`);
    }
}

function resetPassword(id) {
    const employee = window.appData.employees.find(e => e.id === id);
    if (employee) {
        alert(`Сброс пароля для: ${employee.email}`);
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ ==========

// Авторизация пользователя
function loginUser(email, password) {
    if (!window.appData || !window.appData.users) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    // Ищем пользователя по email (проверяем всех, кроме заблокированных)
    const user = window.appData.users.find(u => u.email === email && u.status !== 'inactive');
    
    if (!user) {
        return { success: false, message: 'Пользователь не найден или заблокирован' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Неверный пароль' };
    }
    
    // Создаем сессию
    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const session = {
        id: sessionId,
        userId: user.id,
        email: user.email,
        role: user.role,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 часа
    };
    
    if (!window.appData.sessions) {
        window.appData.sessions = [];
    }
    
    window.appData.sessions.push(session);
    localStorage.setItem('currentSession', sessionId);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    saveData();
    
    return { success: true, user: user, session: session };
}

// Регистрация нового пользователя
function registerUser(userData) {
    if (!window.appData || !window.appData.users) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = window.appData.users.find(u => u.email === userData.email);
    if (existingUser) {
        return { success: false, message: 'Пользователь с таким email уже существует' };
    }
    
    // Создаем нового пользователя
    const newUserId = 'USR-' + String(window.appData.users.length + 1).padStart(3, '0');
    
    // Создаем запись сотрудника
    const newEmployeeId = 'EMP-' + String((window.appData.employees || []).length + 1).padStart(3, '0');
    const newEmployee = {
        id: newEmployeeId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || '',
        position: userData.position || 'Сотрудник',
        department: getDepartmentName(userData.department),
        email: userData.email,
        role: 'employee',
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    // Добавляем сотрудника в базу
    if (!window.appData.employees) {
        window.appData.employees = [];
    }
    window.appData.employees.push(newEmployee);
    
    // Создаем пользователя со статусом 'active', чтобы он мог сразу войти
    const newUser = {
        id: newUserId,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName || '',
        employeeId: newEmployeeId,
        role: 'employee',
        status: 'active', // Пользователь может сразу войти
        createdAt: new Date().toISOString()
    };
    
    window.appData.users.push(newUser);
    saveData();
    
    return { success: true, user: newUser, message: 'Регистрация успешна! Теперь вы можете войти в систему.' };
}

// Проверка текущей сессии
function checkSession() {
    const sessionId = localStorage.getItem('currentSession');
    if (!sessionId || !window.appData || !window.appData.sessions) {
        return null;
    }
    
    const session = window.appData.sessions.find(s => s.id === sessionId);
    if (!session) {
        return null;
    }
    
    // Проверяем срок действия сессии
    if (new Date(session.expiresAt) < new Date()) {
        logoutUser();
        return null;
    }
    
    const user = window.appData.users.find(u => u.id === session.userId);
    return { session: session, user: user };
}

// Выход пользователя
function logoutUser() {
    const sessionId = localStorage.getItem('currentSession');
    if (sessionId && window.appData && window.appData.sessions) {
        const index = window.appData.sessions.findIndex(s => s.id === sessionId);
        if (index > -1) {
            window.appData.sessions.splice(index, 1);
            saveData();
        }
    }
    
    localStorage.removeItem('currentSession');
    localStorage.removeItem('currentUser');
}

// Получение текущего пользователя
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
}

// Отображение информации о текущем пользователе
function displayCurrentUser() {
    const currentUser = getCurrentUser();
    const nav = document.querySelector('.nav-menu');
    
    if (!nav) return;
    
    // Удаляем старый блок пользователя, если есть
    const oldUserInfo = document.querySelector('.user-info');
    if (oldUserInfo) {
        oldUserInfo.remove();
    }
    
    if (currentUser) {
        const roleText = {
            'admin': 'Администратор',
            'manager': 'Руководитель',
            'procurement': 'Менеджер по закупкам',
            'employee': 'Сотрудник'
        }[currentUser.role] || 'Пользователь';
        
        const roleColor = {
            'admin': '#9b59b6',
            'manager': '#e74c3c',
            'procurement': '#f39c12',
            'employee': '#95a5a6'
        }[currentUser.role] || '#7f8c8d';
        
        const userInfo = document.createElement('li');
        userInfo.className = 'user-info';
        userInfo.style.cssText = `
            margin-left: auto;
            padding: 10px 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        userInfo.innerHTML = `
            <span style="font-size: 1.2em;"></span>
            <div style="display: flex; flex-direction: column;">
                <span style="font-weight: bold; color: white;">${currentUser.firstName} ${currentUser.lastName}</span>
                <span style="font-size: 0.85em; color: ${roleColor};">${roleText}</span>
            </div>
            <a href="#" onclick="logoutUser(); window.location.href='login.html'; return false;" 
               style="color: white; text-decoration: none; margin-left: 10px; padding: 5px 10px; background: rgba(255,255,255,0.2); border-radius: 3px; font-size: 0.9em;">
               Выход
            </a>
        `;
        
        nav.appendChild(userInfo);
    } else {
        // Если пользователь не авторизован, можно добавить ссылку на вход
        const loginLink = nav.querySelector('a[href="login.html"]');
        if (loginLink) {
            loginLink.innerHTML = '🔑 Вход';
        }
    }
}

// Добавление новой заявки
function addRequest(requestData) {
    if (!window.appData || !window.appData.requests) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'Необходима авторизация' };
    }
    
    if (!hasPermission('canCreateRequest')) {
        return { success: false, message: 'У вас нет прав для создания заявок' };
    }
    
    const newRequestId = 'З-2024-' + String(window.appData.requests.length + 1).padStart(3, '0');
    const newRequest = {
        id: newRequestId,
        material: requestData.material,
        quantity: requestData.quantity,
        bucketType: requestData.bucketType,
        customer: requestData.customer,
        createdDate: new Date().toLocaleDateString('ru-RU'),
        status: 'draft',
        amount: requestData.amount || 0,
        createdBy: currentUser.id,
        updatedAt: new Date().toISOString()
    };
    
    window.appData.requests.push(newRequest);
    saveData();
    
    return { success: true, request: newRequest };
}

// Добавление нового материала
function addMaterial(materialData) {
    if (!window.appData || !window.appData.materials) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    if (!hasPermission('canAddMaterial')) {
        return { success: false, message: 'У вас нет прав для добавления материалов' };
    }
    
    const newMaterialId = 'MAT-' + String(window.appData.materials.length + 1).padStart(3, '0');
    const newMaterial = {
        id: newMaterialId,
        name: materialData.name,
        category: materialData.category,
        description: materialData.description,
        specifications: materialData.specifications,
        unit: materialData.unit,
        price: materialData.price,
        stock: materialData.stock || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    window.appData.materials.push(newMaterial);
    saveData();
    
    return { success: true, material: newMaterial };
}

// Добавление нового сотрудника
function addEmployee(employeeData) {
    if (!window.appData || !window.appData.employees) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    if (!hasPermission('canAddEmployee')) {
        return { success: false, message: 'У вас нет прав для добавления сотрудников' };
    }
    
    const newEmployeeId = 'EMP-' + String(window.appData.employees.length + 1).padStart(3, '0');
    const newEmployee = {
        id: newEmployeeId,
        firstName: employeeData.firstName,
        lastName: employeeData.lastName,
        middleName: employeeData.middleName || '',
        position: employeeData.position,
        department: employeeData.department,
        email: employeeData.email,
        role: employeeData.role || 'employee',
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    window.appData.employees.push(newEmployee);
    saveData();
    
    return { success: true, employee: newEmployee };
}

// ========== ОБЩИЕ ФУНКЦИИ ДЛЯ МОДАЛЬНЫХ ОКОН ==========

// Создание модального окна
function createModal(title, content, buttons = []) {
    // Удаляем существующее модальное окно
    const existingModal = document.getElementById('modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        box-sizing: border-box;
    `;
    
    modal.innerHTML = `
        <h2 style="margin-bottom: 20px; color: #2c3e50;">${title}</h2>
        <div id="modal-content">${content}</div>
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap;">
            ${buttons.map(btn => `<button class="btn ${btn.class || 'btn-primary'}" onclick="${btn.onclick || 'closeModal()'}" style="min-width: 100px; white-space: nowrap;">${btn.text}</button>`).join('')}
        </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Закрытие по клику вне модального окна
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeModal();
        }
    });
    
    return modal;
}

// Закрытие модального окна
function closeModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАЯВКАМИ ==========

// Обновление статуса заявки
function updateRequestStatus(requestId, newStatus) {
    if (!window.appData || !window.appData.requests) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    // Проверка прав в зависимости от статуса
    if (newStatus === 'approved' && !hasPermission('canApproveRequest')) {
        return { success: false, message: 'У вас нет прав для утверждения заявок' };
    }
    if (newStatus === 'rejected' && !hasPermission('canRejectRequest')) {
        return { success: false, message: 'У вас нет прав для отклонения заявок' };
    }
    if (newStatus === 'completed' && !hasPermission('canCompleteRequest')) {
        return { success: false, message: 'У вас нет прав для завершения заявок' };
    }
    if (newStatus === 'pending' && !hasPermission('canSendRequest')) {
        return { success: false, message: 'У вас нет прав для отправки заявок' };
    }
    
    const request = window.appData.requests.find(r => r.id === requestId);
    if (!request) {
        return { success: false, message: 'Заявка не найдена' };
    }
    
    request.status = newStatus;
    request.updatedAt = new Date().toISOString();
    saveData();
    
    return { success: true, request: request };
}

// Удаление заявки
function deleteRequest(requestId) {
    if (!window.appData || !window.appData.requests) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    const index = window.appData.requests.findIndex(r => r.id === requestId);
    if (index === -1) {
        return { success: false, message: 'Заявка не найдена' };
    }
    
    window.appData.requests.splice(index, 1);
    saveData();
    
    return { success: true };
}

// Фильтрация заявок
function filterRequests(filters) {
    if (!window.appData || !window.appData.requests) {
        return [];
    }
    
    let filtered = [...window.appData.requests];
    
    if (filters.status && filters.status !== 'Все статусы') {
        const statusMap = {
            'Черновик': 'draft',
            'На согласовании': 'pending',
            'Утверждена': 'approved',
            'В обработке': 'in-progress',
            'Завершена': 'completed'
        };
        filtered = filtered.filter(r => r.status === statusMap[filters.status]);
    }
    
    if (filters.bucketType && filters.bucketType !== 'Все типы') {
        filtered = filtered.filter(r => r.bucketType && r.bucketType.includes(filters.bucketType));
    }
    
    if (filters.dateFrom) {
        filtered = filtered.filter(r => {
            const requestDate = new Date(r.createdDate.split('.').reverse().join('-'));
            return requestDate >= new Date(filters.dateFrom);
        });
    }
    
    if (filters.dateTo) {
        filtered = filtered.filter(r => {
            const requestDate = new Date(r.createdDate.split('.').reverse().join('-'));
            return requestDate <= new Date(filters.dateTo);
        });
    }
    
    return filtered;
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С МАТЕРИАЛАМИ ==========

// Обновление материала
function updateMaterial(materialId, materialData) {
    if (!window.appData || !window.appData.materials) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    if (!hasPermission('canEditMaterial')) {
        return { success: false, message: 'У вас нет прав для редактирования материалов' };
    }
    
    const material = window.appData.materials.find(m => m.id === materialId);
    if (!material) {
        return { success: false, message: 'Материал не найден' };
    }
    
    Object.assign(material, materialData);
    material.updatedAt = new Date().toISOString();
    saveData();
    
    return { success: true, material: material };
}

// Удаление материала
function deleteMaterial(materialId) {
    if (!window.appData || !window.appData.materials) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    const index = window.appData.materials.findIndex(m => m.id === materialId);
    if (index === -1) {
        return { success: false, message: 'Материал не найден' };
    }
    
    window.appData.materials.splice(index, 1);
    saveData();
    
    return { success: true };
}

// Поиск материалов
function searchMaterials(query, category = null) {
    if (!window.appData || !window.appData.materials) {
        return [];
    }
    
    let filtered = [...window.appData.materials];
    
    if (query) {
        const lowerQuery = query.toLowerCase();
        filtered = filtered.filter(m => 
            m.name.toLowerCase().includes(lowerQuery) ||
            m.description.toLowerCase().includes(lowerQuery) ||
            m.category.toLowerCase().includes(lowerQuery)
        );
    }
    
    if (category && category !== 'Все материалы') {
        filtered = filtered.filter(m => m.category === category);
    }
    
    return filtered;
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С СОТРУДНИКАМИ ==========

// Обновление сотрудника
function updateEmployee(employeeId, employeeData) {
    if (!window.appData || !window.appData.employees) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    if (!hasPermission('canEditEmployee')) {
        return { success: false, message: 'У вас нет прав для редактирования сотрудников' };
    }
    
    const employee = window.appData.employees.find(e => e.id === employeeId);
    if (!employee) {
        return { success: false, message: 'Сотрудник не найден' };
    }
    
    Object.assign(employee, employeeData);
    saveData();
    
    return { success: true, employee: employee };
}

// Удаление сотрудника
function deleteEmployee(employeeId) {
    if (!window.appData || !window.appData.employees) {
        return { success: false, message: 'База данных не загружена' };
    }
    
    const index = window.appData.employees.findIndex(e => e.id === employeeId);
    if (index === -1) {
        return { success: false, message: 'Сотрудник не найден' };
    }
    
    window.appData.employees.splice(index, 1);
    saveData();
    
    return { success: true };
}

// Поиск сотрудников
function searchEmployees(query) {
    if (!window.appData || !window.appData.employees) {
        return [];
    }
    
    if (!query) {
        return window.appData.employees;
    }
    
    const lowerQuery = query.toLowerCase();
    return window.appData.employees.filter(e => 
        e.firstName.toLowerCase().includes(lowerQuery) ||
        e.lastName.toLowerCase().includes(lowerQuery) ||
        e.email.toLowerCase().includes(lowerQuery) ||
        e.position.toLowerCase().includes(lowerQuery) ||
        e.department.toLowerCase().includes(lowerQuery)
    );
}

// Сброс пароля сотрудника
function resetEmployeePassword(employeeId) {
    const employee = window.appData.employees.find(e => e.id === employeeId);
    if (!employee) {
        return { success: false, message: 'Сотрудник не найден' };
    }
    
    // Находим пользователя по employeeId
    const user = window.appData.users.find(u => u.employeeId === employeeId);
    if (user) {
        // Генерируем новый временный пароль
        const newPassword = 'temp' + Math.random().toString(36).substr(2, 8);
        user.password = newPassword;
        saveData();
        return { success: true, password: newPassword };
    }
    
    return { success: false, message: 'Пользователь не найден' };
}

// ========== ФУНКЦИИ ДЛЯ ОТЧЕТОВ ==========

// Формирование отчета по заявкам
function generateRequestsReport(filters = {}) {
    if (!window.appData || !window.appData.requests) {
        return null;
    }
    
    let requests = filterRequests(filters);
    
    const report = {
        total: requests.length,
        byStatus: {},
        byBucketType: {},
        totalAmount: 0,
        averageAmount: 0
    };
    
    requests.forEach(req => {
        // По статусам
        report.byStatus[req.status] = (report.byStatus[req.status] || 0) + 1;
        
        // По типам ковшей
        const bucketType = req.bucketType || 'Не указан';
        report.byBucketType[bucketType] = (report.byBucketType[bucketType] || 0) + 1;
        
        // Сумма
        report.totalAmount += req.amount || 0;
    });
    
    report.averageAmount = requests.length > 0 ? report.totalAmount / requests.length : 0;
    
    return report;
}

// Формирование отчета по материалам
function generateMaterialsReport() {
    if (!window.appData || !window.appData.materials) {
        return null;
    }
    
    const report = {
        total: window.appData.materials.length,
        byCategory: {},
        lowStock: [],
        totalValue: 0
    };
    
    window.appData.materials.forEach(mat => {
        // По категориям
        report.byCategory[mat.category] = (report.byCategory[mat.category] || 0) + 1;
        
        // Низкие остатки
        if (mat.stock < 10) {
            report.lowStock.push(mat);
        }
        
        // Общая стоимость
        report.totalValue += (mat.price || 0) * (mat.stock || 0);
    });
    
    return report;
}

// Экспорт отчета в JSON
function exportReportToJSON(report, filename) {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Вспомогательная функция для получения названия отдела
function getDepartmentName(departmentCode) {
    const departments = {
        'welding': 'Цех сварки и наплавки',
        'procurement': 'Отдел закупок',
        'quality': 'ОТК',
        'it': 'IT отдел',
        'management': 'Руководство'
    };
    return departments[departmentCode] || departmentCode || 'Не указан';
}

// ========== СИСТЕМА ПРАВ ДОСТУПА И РОЛЕЙ ==========

// Определение прав доступа для каждой роли
const ROLE_PERMISSIONS = {
    'employee': {
        // Заявки
        canCreateRequest: true,
        canEditOwnRequest: true,
        canViewAllRequests: false,
        canViewOwnRequests: true,
        canApproveRequest: false,
        canRejectRequest: false,
        canCompleteRequest: false,
        canDeleteRequest: false,
        canSendRequest: true,
        
        // Материалы
        canViewMaterials: true,
        canAddMaterial: false,
        canEditMaterial: false,
        canDeleteMaterial: false,
        canOrderMaterial: true,
        
        // Сотрудники
        canViewEmployees: false,
        canAddEmployee: false,
        canEditEmployee: false,
        canDeleteEmployee: false,
        canResetPassword: false,
        
        // Отчеты
        canViewReports: false,
        canGenerateReports: false,
        canExportReports: false,
        
        // Настройки
        canManageSettings: false,
        canManageUsers: false
    },
    'manager': {
        // Заявки
        canCreateRequest: true,
        canEditOwnRequest: true,
        canViewAllRequests: true,
        canViewOwnRequests: true,
        canApproveRequest: true,
        canRejectRequest: true,
        canCompleteRequest: false,
        canDeleteRequest: false,
        canSendRequest: true,
        
        // Материалы
        canViewMaterials: true,
        canAddMaterial: false,
        canEditMaterial: false,
        canDeleteMaterial: false,
        canOrderMaterial: true,
        
        // Сотрудники
        canViewEmployees: true,
        canAddEmployee: false,
        canEditEmployee: false,
        canDeleteEmployee: false,
        canResetPassword: false,
        
        // Отчеты
        canViewReports: true,
        canGenerateReports: true,
        canExportReports: true,
        
        // Настройки
        canManageSettings: false,
        canManageUsers: false
    },
    'procurement': {
        // Заявки
        canCreateRequest: true,
        canEditOwnRequest: true,
        canViewAllRequests: true,
        canViewOwnRequests: true,
        canApproveRequest: false,
        canRejectRequest: false,
        canCompleteRequest: true,
        canDeleteRequest: false,
        canSendRequest: true,
        
        // Материалы
        canViewMaterials: true,
        canAddMaterial: true,
        canEditMaterial: true,
        canDeleteMaterial: false,
        canOrderMaterial: true,
        
        // Сотрудники
        canViewEmployees: true,
        canAddEmployee: false,
        canEditEmployee: false,
        canDeleteEmployee: false,
        canResetPassword: false,
        
        // Отчеты
        canViewReports: true,
        canGenerateReports: true,
        canExportReports: true,
        
        // Настройки
        canManageSettings: false,
        canManageUsers: false
    },
    'admin': {
        // Заявки - полный доступ
        canCreateRequest: true,
        canEditOwnRequest: true,
        canViewAllRequests: true,
        canViewOwnRequests: true,
        canApproveRequest: true,
        canRejectRequest: true,
        canCompleteRequest: true,
        canDeleteRequest: true,
        canSendRequest: true,
        
        // Материалы - полный доступ
        canViewMaterials: true,
        canAddMaterial: true,
        canEditMaterial: true,
        canDeleteMaterial: true,
        canOrderMaterial: true,
        
        // Сотрудники - полный доступ
        canViewEmployees: true,
        canAddEmployee: true,
        canEditEmployee: true,
        canDeleteEmployee: true,
        canResetPassword: true,
        
        // Отчеты - полный доступ
        canViewReports: true,
        canGenerateReports: true,
        canExportReports: true,
        
        // Настройки - полный доступ
        canManageSettings: true,
        canManageUsers: true
    }
};

// Проверка прав доступа
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions) return false;
    
    return permissions[permission] === true;
}

// Проверка, является ли пользователь владельцем заявки
function isRequestOwner(requestId) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const request = window.appData.requests.find(r => r.id === requestId);
    if (!request) return false;
    
    return request.createdBy === user.id;
}

// Получение прав доступа текущего пользователя
function getUserPermissions() {
    const user = getCurrentUser();
    if (!user) return null;
    
    return ROLE_PERMISSIONS[user.role] || null;
}

// Проверка доступа к странице
function checkPageAccess(allowedRoles) {
    const user = getCurrentUser();
    if (!user) {
        alert('Необходима авторизация для доступа к этой странице.');
        window.location.href = 'login.html';
        return false;
    }
    
    if (!allowedRoles.includes(user.role)) {
        alert('У вас нет доступа к этой странице.');
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Применение прав доступа к элементам страницы
function applyRoleBasedUI() {
    const user = getCurrentUser();
    if (!user) return;
    
    const permissions = getUserPermissions();
    if (!permissions) return;
    
    // Скрываем/показываем элементы навигации
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Сотрудники - только для менеджеров, закупок и админов
        if (href === 'employees.html' && !permissions.canViewEmployees) {
            link.style.display = 'none';
        }
        
        // Отчеты - только для менеджеров, закупок и админов
        if (href === 'reports.html' && !permissions.canViewReports) {
            link.style.display = 'none';
        }
    });
    
    // Скрываем кнопки добавления, если нет прав
    const addButtons = document.querySelectorAll('.btn-success');
    addButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        if (text.includes('добавить')) {
            if (text.includes('материал') && !permissions.canAddMaterial) {
                btn.style.display = 'none';
            } else if (text.includes('сотрудник') && !permissions.canAddEmployee) {
                btn.style.display = 'none';
            } else if (text.includes('заявк') && !permissions.canCreateRequest) {
                btn.style.display = 'none';
            }
        }
    });
}

// Получение описания прав доступа для роли
function getRoleDescription(role) {
    const descriptions = {
        'employee': {
            title: 'Сотрудник',
            description: 'Может создавать и просматривать свои заявки, просматривать материалы и делать заказы.',
            permissions: [
                '✓ Создание заявок',
                '✓ Просмотр своих заявок',
                '✓ Просмотр материалов',
                '✓ Заказ материалов',
                '✗ Утверждение заявок',
                '✗ Управление сотрудниками',
                '✗ Просмотр отчетов'
            ]
        },
        'manager': {
            title: 'Руководитель',
            description: 'Может утверждать/отклонять заявки, просматривать все заявки и отчеты, управлять сотрудниками (просмотр).',
            permissions: [
                '✓ Создание заявок',
                '✓ Просмотр всех заявок',
                '✓ Утверждение/отклонение заявок',
                '✓ Просмотр материалов',
                '✓ Просмотр сотрудников',
                '✓ Формирование отчетов',
                '✗ Управление материалами',
                '✗ Добавление сотрудников'
            ]
        },
        'procurement': {
            title: 'Менеджер по закупкам',
            description: 'Может обрабатывать утвержденные заявки, управлять материалами, просматривать отчеты.',
            permissions: [
                '✓ Создание заявок',
                '✓ Просмотр всех заявок',
                '✓ Завершение утвержденных заявок',
                '✓ Управление материалами',
                '✓ Просмотр сотрудников',
                '✓ Формирование отчетов',
                '✗ Утверждение заявок',
                '✗ Добавление сотрудников'
            ]
        },
        'admin': {
            title: 'Администратор',
            description: 'Полный доступ ко всем функциям системы.',
            permissions: [
                '✓ Все функции системы',
                '✓ Управление заявками',
                '✓ Управление материалами',
                '✓ Управление сотрудниками',
                '✓ Формирование отчетов',
                '✓ Настройки системы'
            ]
        }
    };
    
    return descriptions[role] || { title: 'Неизвестная роль', description: '', permissions: [] };
}

// ========== ФУНКЦИИ ДЛЯ СТРАНИЦЫ ВХОДА/РЕГИСТРАЦИИ ==========

// Переключение между вкладками
function switchTab(tabName) {
    const container = document.querySelector('.auth-container');
    const leftPanel = document.querySelector('.left-panel');
    
    // Обновляем вкладки
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Обновляем формы
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Активируем выбранную вкладку и форму
    if (tabName === 'login') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('login-section').classList.add('active');
        container.classList.remove('register-mode');
        if (leftPanel) leftPanel.style.display = 'flex';
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('register-section').classList.add('active');
        container.classList.add('register-mode');
        if (leftPanel) leftPanel.style.display = 'none';
    }
}

// Инициализация форм входа/регистрации
function initLoginForms() {
    // Обработка формы входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            performLogin(email, password);
        });
    }

    // Обработка кнопки демо-входа
    const demoLoginBtn = document.getElementById('demoLoginBtn');
    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', function() {
            document.getElementById('login-email').value = 'admin@kovshey-service.ru';
            document.getElementById('login-password').value = 'admin123';
            performLogin('admin@kovshey-service.ru', 'admin123');
        });
    }

    // Обработка формы регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Пароли не совпадают!');
                return;
            }
            
            if (password.length < 8) {
                alert('Пароль должен содержать минимум 8 символов!');
                return;
            }
            
            const userData = {
                firstName: document.getElementById('reg-firstName').value.trim(),
                lastName: document.getElementById('reg-lastName').value.trim(),
                middleName: '',
                email: document.getElementById('reg-email').value.trim().toLowerCase(),
                password: password,
                department: document.getElementById('reg-department').value,
                position: document.getElementById('reg-position').value.trim()
            };
            
            const result = registerUser(userData);
            
            if (result.success) {
                alert(result.message + '\n\nВаши данные:\nEmail: ' + userData.email + '\nПароль: (ваш введенный пароль)\n\nВы можете войти в систему прямо сейчас!');
                const loginResult = loginUser(userData.email, userData.password);
                if (loginResult.success) {
                    window.location.href = 'index.html';
                } else {
                    switchTab('login');
                }
            } else {
                alert('Ошибка регистрации: ' + result.message);
            }
        });
    }
}

// Выполнение входа
function performLogin(email, password) {
    const result = loginUser(email, password);
    
    if (result.success) {
        const roleText = result.user.role === 'admin' ? 'Администратор' : 
                        result.user.role === 'manager' ? 'Руководитель' :
                        result.user.role === 'procurement' ? 'Менеджер по закупкам' : 'Сотрудник';
        
        alert(`Вход выполнен успешно!\nДобро пожаловать, ${result.user.firstName} ${result.user.lastName}!\nРоль: ${roleText}`);
        window.location.href = 'index.html';
    } else {
        alert('Ошибка входа: ' + result.message);
    }
}

// Инициализация страницы входа/регистрации
function initLoginPage() {
    if (!window.appData) {
        loadData().then(() => {
            initLoginForms();
        });
    } else {
        initLoginForms();
    }
}

// ========== ФУНКЦИИ ДЛЯ ЛИЧНОГО КАБИНЕТА ==========

// Инициализация страницы профиля
function initProfilePage() {
    loadProfileData();
    showProfileSection('overview');
}

// Загрузка данных профиля
function loadProfileData() {
    const user = getCurrentUser();
    if (!user) return;

    // Обновляем аватар и имя
    const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
    const avatarEl = document.getElementById('profileAvatar');
    const nameEl = document.getElementById('profileName');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    
    const roleText = getRoleText(user.role);
    const roleColor = {
        'admin': '#9b59b6',
        'manager': '#e74c3c',
        'procurement': '#f39c12',
        'employee': '#95a5a6'
    }[user.role] || '#7f8c8d';
    
    const roleBadge = document.getElementById('profileRole');
    if (roleBadge) {
        roleBadge.textContent = roleText;
        roleBadge.style.background = roleColor;
        roleBadge.style.color = 'white';
    }

    // Показываем меню в зависимости от роли
    const adminMenuItem = document.getElementById('admin-menu-item');
    const managerMenuItem = document.getElementById('manager-menu-item');
    const procurementMenuItem = document.getElementById('procurement-menu-item');
    
    if (adminMenuItem) adminMenuItem.style.display = user.role === 'admin' ? 'block' : 'none';
    if (managerMenuItem) managerMenuItem.style.display = user.role === 'manager' ? 'block' : 'none';
    if (procurementMenuItem) procurementMenuItem.style.display = user.role === 'procurement' ? 'block' : 'none';

    // Загружаем данные для каждого раздела
    loadProfileOverview();
    loadProfileInfo();
    loadMyRequests();
    
    if (user.role === 'admin') {
        loadAdminPanel();
    }
    if (user.role === 'manager') {
        loadManagerPanel();
    }
    if (user.role === 'procurement') {
        loadProcurementPanel();
    }
}

// Переключение разделов профиля
function showProfileSection(sectionName) {
    // Скрываем все разделы
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Убираем активный класс у всех пунктов меню
    document.querySelectorAll('.profile-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Показываем выбранный раздел
    const section = document.getElementById(`section-${sectionName}`);
    const menuItem = document.getElementById(`menu-${sectionName}`);
    if (section) section.classList.add('active');
    if (menuItem) menuItem.classList.add('active');
}

// Загрузка обзора
function loadProfileOverview() {
    const user = getCurrentUser();
    if (!user) return;

    const stats = calculateUserStats(user);
    const allStats = calculateStats(window.appData);
    
    let statsHTML = '';
    
    // Статистика для всех ролей
    statsHTML += `
        <div class="stat-card" style="background: #34495e;">
            <div class="number">${stats.myRequests}</div>
            <div class="label">Мои заявки</div>
        </div>
        <div class="stat-card" style="background: #34495e;">
            <div class="number">${stats.approvedRequests}</div>
            <div class="label">Утверждено</div>
        </div>
        <div class="stat-card" style="background: #34495e;">
            <div class="number">${stats.pendingRequests}</div>
            <div class="label">На согласовании</div>
        </div>
    `;
    
    // Дополнительная статистика для менеджеров, закупок и админов
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'procurement') {
        statsHTML += `
            <div class="stat-card" style="background: #34495e;">
                <div class="number">${allStats.totalRequests}</div>
                <div class="label">Всего заявок</div>
            </div>
        `;
    }
    
    // Статистика для администратора
    if (user.role === 'admin') {
        statsHTML += `
            <div class="stat-card" style="background: #34495e;">
                <div class="number">${(window.appData.users || []).length}</div>
                <div class="label">Пользователей</div>
            </div>
            <div class="stat-card" style="background: #34495e;">
                <div class="number">${(window.appData.materials || []).length}</div>
                <div class="label">Материалов</div>
            </div>
        `;
    }
    
    const overviewStats = document.getElementById('overviewStats');
    if (overviewStats) overviewStats.innerHTML = statsHTML;
}

// Расчет статистики пользователя
function calculateUserStats(user) {
    const requests = window.appData.requests || [];
    const myRequests = requests.filter(r => r.createdBy === user.id);
    
    return {
        myRequests: myRequests.length,
        approvedRequests: myRequests.filter(r => r.status === 'approved').length,
        pendingRequests: myRequests.filter(r => r.status === 'pending').length,
        totalRequests: requests.length
    };
}

// Загрузка информации профиля
function loadProfileInfo() {
    const user = getCurrentUser();
    if (!user) return;

    // Находим связанного сотрудника
    const employee = window.appData.employees.find(e => e.id === user.employeeId);
    
    const infoHTML = `
        <div class="info-item">
            <label>Имя</label>
            <div class="value">${user.firstName}</div>
        </div>
        <div class="info-item">
            <label>Фамилия</label>
            <div class="value">${user.lastName}</div>
        </div>
        <div class="info-item">
            <label>Отчество</label>
            <div class="value">${user.middleName || 'Не указано'}</div>
        </div>
        <div class="info-item">
            <label>Email</label>
            <div class="value">${user.email}</div>
        </div>
        ${employee ? `
        <div class="info-item">
            <label>Должность</label>
            <div class="value">${employee.position}</div>
        </div>
        <div class="info-item">
            <label>Отдел</label>
            <div class="value">${employee.department}</div>
        </div>
        ` : ''}
        <div class="info-item">
            <label>Роль</label>
            <div class="value">${getRoleText(user.role)}</div>
        </div>
        <div class="info-item">
            <label>Дата регистрации</label>
            <div class="value">${new Date(user.createdAt).toLocaleDateString('ru-RU')}</div>
        </div>
    `;
    
    const profileInfo = document.getElementById('profileInfo');
    if (profileInfo) profileInfo.innerHTML = infoHTML;
}

// Загрузка моих заявок
function loadMyRequests() {
    const user = getCurrentUser();
    if (!user) return;

    const myRequests = (window.appData.requests || []).filter(r => r.createdBy === user.id);
    const myRequestsList = document.getElementById('myRequestsList');
    if (!myRequestsList) return;
    
    if (myRequests.length === 0) {
        myRequestsList.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">У вас пока нет заявок</p>';
        return;
    }

    const requestsHTML = myRequests.map(request => {
        const statusText = getStatusText(request.status);
        const statusColors = {
            'draft': '#f39c12',
            'pending': '#e74c3c',
            'approved': '#27ae60',
            'completed': '#3498db',
            'rejected': '#95a5a6'
        };
        
        return `
            <div class="request-item">
                <div class="request-item-info">
                    <strong>${request.id}</strong> - ${request.material}
                    <div style="margin-top: 5px; color: #666; font-size: 0.9em;">
                        ${request.customer} • ${request.createdDate}
                    </div>
                </div>
                <span class="request-item-status" style="background: ${statusColors[request.status] || '#95a5a6'}; color: white;">
                    ${statusText}
                </span>
            </div>
        `;
    }).join('');
    
    myRequestsList.innerHTML = requestsHTML;
}

// Загрузка панели администратора
function loadAdminPanel() {
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    const adminHTML = `
        <div class="admin-card" onclick="window.location.href='employees.html'">
            <h3>👥 Управление сотрудниками</h3>
            <p>Добавление, редактирование и удаление сотрудников</p>
        </div>
        <div class="admin-card" onclick="window.location.href='materials.html'">
            <h3>Управление материалами</h3>
            <p>Полное управление каталогом материалов</p>
        </div>
        <div class="admin-card" onclick="window.location.href='requests.html'">
            <h3>Управление заявками</h3>
            <p>Просмотр и управление всеми заявками</p>
        </div>
        <div class="admin-card" onclick="window.location.href='reports.html'">
            <h3>Отчеты и аналитика</h3>
            <p>Формирование отчетов и анализ данных</p>
        </div>
        <div class="admin-card" onclick="showSystemStats()">
            <h3>Статистика системы</h3>
            <p>Общая статистика и метрики системы</p>
        </div>
        <div class="admin-card" onclick="showDatabaseInfo()">
            <h3>База данных</h3>
            <p>Информация о базе данных и экспорт</p>
        </div>
        <div class="admin-card" onclick="showUsersManagement()">
            <h3>Управление пользователями</h3>
            <p>Управление учетными записями и правами доступа</p>
        </div>
        <div class="admin-card" onclick="showSystemSettings()">
            <h3>Настройки системы</h3>
            <p>Системные настройки и конфигурация</p>
        </div>
    `;
    
    adminPanel.innerHTML = adminHTML;
}

// Загрузка панели руководителя
function loadManagerPanel() {
    const managerPanel = document.getElementById('managerPanel');
    if (!managerPanel) return;
    
    const managerHTML = `
        <div class="admin-card" onclick="window.location.href='requests.html'">
            <h3>Управление заявками</h3>
            <p>Утверждение и отклонение заявок на согласовании</p>
        </div>
        <div class="admin-card" onclick="window.location.href='reports.html'">
            <h3>Отчеты и аналитика</h3>
            <p>Формирование отчетов по заявкам и деятельности</p>
        </div>
        <div class="admin-card" onclick="window.location.href='employees.html'">
            <h3>Просмотр сотрудников</h3>
            <p>Просмотр списка сотрудников и их активности</p>
        </div>
        <div class="admin-card" onclick="showPendingRequests()">
            <h3>Заявки на согласовании</h3>
            <p>Просмотр заявок, ожидающих вашего решения</p>
        </div>
    `;
    
    managerPanel.innerHTML = managerHTML;
}

// Загрузка панели закупок
function loadProcurementPanel() {
    const procurementPanel = document.getElementById('procurementPanel');
    if (!procurementPanel) return;
    
    const procurementHTML = `
        <div class="admin-card" onclick="window.location.href='materials.html'">
            <h3>Управление материалами</h3>
            <p>Добавление и редактирование материалов</p>
        </div>
        <div class="admin-card" onclick="window.location.href='requests.html'">
            <h3>Утвержденные заявки</h3>
            <p>Обработка и завершение утвержденных заявок</p>
        </div>
        <div class="admin-card" onclick="window.location.href='reports.html'">
            <h3>Отчеты по закупкам</h3>
            <p>Формирование отчетов по закупочной деятельности</p>
        </div>
        <div class="admin-card" onclick="showApprovedRequests()">
            <h3>Заявки к обработке</h3>
            <p>Просмотр утвержденных заявок, требующих обработки</p>
        </div>
    `;
    
    procurementPanel.innerHTML = procurementHTML;
}

// Показать заявки на согласовании
function showPendingRequests() {
    const pendingRequests = (window.appData.requests || []).filter(r => r.status === 'pending');
    
    if (pendingRequests.length === 0) {
        createModal('Заявки на согласовании', '<p style="text-align: center; padding: 40px;">Нет заявок, ожидающих согласования</p>', [
            { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
        ]);
        return;
    }
    
    let requestsHTML = '<div style="max-height: 400px; overflow-y: auto;">';
    pendingRequests.forEach(request => {
        requestsHTML += `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <strong>${request.id}</strong> - ${request.material}<br>
                <span style="color: #666; font-size: 0.9em;">${request.customer} • ${request.createdDate}</span>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-success btn-sm" onclick="approveFromModal('${request.id}')" style="min-width: 100px; white-space: nowrap;">Утвердить</button>
                    <button class="btn btn-warning btn-sm" onclick="rejectFromModal('${request.id}')" style="min-width: 100px; white-space: nowrap;">Отклонить</button>
                </div>
            </div>
        `;
    });
    requestsHTML += '</div>';
    
    createModal('Заявки на согласовании', requestsHTML, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Показать утвержденные заявки
function showApprovedRequests() {
    const approvedRequests = (window.appData.requests || []).filter(r => r.status === 'approved');
    
    if (approvedRequests.length === 0) {
        createModal('Утвержденные заявки', '<p style="text-align: center; padding: 40px;">Нет утвержденных заявок для обработки</p>', [
            { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
        ]);
        return;
    }
    
    let requestsHTML = '<div style="max-height: 400px; overflow-y: auto;">';
    approvedRequests.forEach(request => {
        requestsHTML += `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <strong>${request.id}</strong> - ${request.material}<br>
                <span style="color: #666; font-size: 0.9em;">${request.customer} • ${request.createdDate}</span>
                <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn btn-success btn-sm" onclick="completeFromModal('${request.id}')" style="min-width: 100px; white-space: nowrap;">Завершить</button>
                </div>
            </div>
        `;
    });
    requestsHTML += '</div>';
    
    createModal('Утвержденные заявки', requestsHTML, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Утвердить заявку из модального окна
function approveFromModal(requestId) {
    const result = updateRequestStatus(requestId, 'approved');
    if (result.success) {
        alert('Заявка утверждена!');
        closeModal();
        // Обновляем данные профиля, если мы на странице профиля
        if (document.getElementById('overviewStats')) {
            loadProfileOverview();
            loadMyRequests();
        }
    }
}

// Отклонить заявку из модального окна
function rejectFromModal(requestId) {
    if (confirm('Отклонить эту заявку?')) {
        const result = updateRequestStatus(requestId, 'rejected');
        if (result.success) {
            alert('Заявка отклонена.');
            closeModal();
            // Обновляем данные профиля, если мы на странице профиля
            if (document.getElementById('overviewStats')) {
                loadProfileOverview();
                loadMyRequests();
            }
        }
    }
}

// Завершить заявку из модального окна
function completeFromModal(requestId) {
    const result = updateRequestStatus(requestId, 'completed');
    if (result.success) {
        alert('Заявка завершена!');
        closeModal();
        // Обновляем данные профиля, если мы на странице профиля
        if (document.getElementById('overviewStats')) {
            loadProfileOverview();
            loadMyRequests();
        }
    }
}

// Редактировать профиль
function editProfile() {
    const user = getCurrentUser();
    if (!user) return;

    const employee = window.appData.employees.find(e => e.id === user.employeeId);
    
    const content = `
        <form id="editProfileForm" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Имя:</label>
                <input type="text" id="edit-firstName" value="${user.firstName}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Фамилия:</label>
                <input type="text" id="edit-lastName" value="${user.lastName}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Отчество:</label>
                <input type="text" id="edit-middleName" value="${user.middleName || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
                <input type="email" id="edit-email" value="${user.email}" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            ${employee ? `
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Должность:</label>
                <input type="text" id="edit-position" value="${employee.position}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Отдел:</label>
                <input type="text" id="edit-department" value="${employee.department}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            </div>
            ` : ''}
        </form>
    `;
    
    createModal('Редактировать профиль', content, [
        { text: 'Отмена', onclick: 'closeModal()', class: 'btn-secondary' },
        { text: 'Сохранить', onclick: 'saveProfile()', class: 'btn-success' }
    ]);
}

// Сохранить профиль
function saveProfile() {
    const user = getCurrentUser();
    if (!user) return;

    const firstName = document.getElementById('edit-firstName').value;
    const lastName = document.getElementById('edit-lastName').value;
    const middleName = document.getElementById('edit-middleName').value;
    const email = document.getElementById('edit-email').value;

    // Обновляем пользователя
    user.firstName = firstName;
    user.lastName = lastName;
    user.middleName = middleName;
    user.email = email;

    // Обновляем сотрудника, если есть
    const employee = window.appData.employees.find(e => e.id === user.employeeId);
    if (employee) {
        const position = document.getElementById('edit-position');
        const department = document.getElementById('edit-department');
        if (position) employee.position = position.value;
        if (department) employee.department = department.value;
    }

    // Сохраняем в localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    saveData();

    alert('Профиль обновлен!');
    closeModal();
    loadProfileData();
    displayCurrentUser(); // Обновляем отображение в навигации
}

// Изменить пароль
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Заполните все поля!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
    }

    if (newPassword.length < 8) {
        alert('Пароль должен содержать минимум 8 символов!');
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    // Проверяем текущий пароль
    const dbUser = window.appData.users.find(u => u.id === user.id);
    if (!dbUser || dbUser.password !== currentPassword) {
        alert('Неверный текущий пароль!');
        return;
    }

    // Обновляем пароль
    dbUser.password = newPassword;
    user.password = newPassword;
    
    localStorage.setItem('currentUser', JSON.stringify(user));
    saveData();

    alert('Пароль успешно изменен!');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// Показать статистику системы
function showSystemStats() {
    const stats = {
        totalUsers: (window.appData.users || []).length,
        totalEmployees: (window.appData.employees || []).length,
        totalRequests: (window.appData.requests || []).length,
        totalMaterials: (window.appData.materials || []).length,
        activeSessions: (window.appData.sessions || []).length,
        lastUpdate: window.appData.settings?.lastUpdate || 'Не указано'
    };

    const content = `
        <div style="line-height: 2;">
            <p><strong>Всего пользователей:</strong> ${stats.totalUsers}</p>
            <p><strong>Всего сотрудников:</strong> ${stats.totalEmployees}</p>
            <p><strong>Всего заявок:</strong> ${stats.totalRequests}</p>
            <p><strong>Всего материалов:</strong> ${stats.totalMaterials}</p>
            <p><strong>Активных сессий:</strong> ${stats.activeSessions}</p>
            <p><strong>Последнее обновление:</strong> ${new Date(stats.lastUpdate).toLocaleString('ru-RU')}</p>
        </div>
    `;

    createModal('Статистика системы', content, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Показать информацию о базе данных
function showDatabaseInfo() {
    const dbSize = JSON.stringify(window.appData).length;
    const dbSizeKB = (dbSize / 1024).toFixed(2);
    
    const content = `
        <div style="line-height: 2;">
            <p><strong>Размер базы данных:</strong> ${dbSizeKB} KB</p>
            <p><strong>Версия:</strong> ${window.appData.settings?.version || '1.0.0'}</p>
            <p><strong>Последнее обновление:</strong> ${new Date(window.appData.settings?.lastUpdate || Date.now()).toLocaleString('ru-RU')}</p>
        </div>
        <div style="margin-top: 20px;">
            <button class="btn btn-success" onclick="exportDatabase()">Экспортировать базу данных</button>
        </div>
    `;

    createModal('Информация о базе данных', content, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Экспорт базы данных
function exportDatabase() {
    const dataStr = JSON.stringify(window.appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('База данных экспортирована!');
}

// Показать управление пользователями
function showUsersManagement() {
    const users = window.appData.users || [];
    
    let usersHTML = '<div style="max-height: 400px; overflow-y: auto;">';
    users.forEach(user => {
        const roleText = getRoleText(user.role);
        const statusText = user.status === 'active' ? 'Активен' : user.status === 'pending' ? 'Ожидает' : 'Заблокирован';
        const statusColor = user.status === 'active' ? '#27ae60' : user.status === 'pending' ? '#f39c12' : '#e74c3c';
        
        usersHTML += `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${user.firstName} ${user.lastName}</strong><br>
                        <span style="color: #666; font-size: 0.9em;">${user.email}</span><br>
                        <span style="color: #666; font-size: 0.9em;">Роль: ${roleText}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: ${statusColor}; color: white; padding: 5px 12px; border-radius: 15px; font-size: 0.85em;">
                            ${statusText}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    usersHTML += '</div>';
    
    createModal('Управление пользователями', usersHTML, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Показать настройки системы
function showSystemSettings() {
    const content = `
        <div style="line-height: 2;">
            <h3 style="margin-bottom: 15px;">Настройки системы</h3>
            <div class="form-group" style="margin-bottom: 15px;">
                <label>Версия системы:</label>
                <input type="text" value="${window.appData.settings?.version || '1.0.0'}" readonly style="background: #f8f9fa;">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
                <label>Последнее обновление:</label>
                <input type="text" value="${new Date(window.appData.settings?.lastUpdate || Date.now()).toLocaleString('ru-RU')}" readonly style="background: #f8f9fa;">
            </div>
            <div style="margin-top: 20px;">
                <button class="btn btn-warning" onclick="clearCache()">Очистить кэш</button>
                <button class="btn btn-danger" onclick="resetDatabase()" style="background: #e74c3c; margin-left: 10px;">Сбросить базу данных</button>
            </div>
        </div>
    `;
    
    createModal('Настройки системы', content, [
        { text: 'Закрыть', onclick: 'closeModal()', class: 'btn-primary' }
    ]);
}

// Очистить кэш
function clearCache() {
    if (confirm('Очистить кэш localStorage? Это не удалит данные из базы данных.')) {
        const appData = localStorage.getItem('appData');
        localStorage.clear();
        if (appData) {
            localStorage.setItem('appData', appData);
        }
        alert('Кэш очищен!');
        location.reload();
    }
}

// Сбросить базу данных
function resetDatabase() {
    if (confirm('ВНИМАНИЕ! Это действие сбросит всю базу данных к начальному состоянию. Все пользовательские данные будут удалены. Продолжить?')) {
        if (confirm('Вы уверены? Это действие нельзя отменить!')) {
            // Загружаем начальные данные из файла
            fetch('database.json')
                .then(response => response.json())
                .then(data => {
                    window.appData = data;
                    localStorage.setItem('appData', JSON.stringify(data));
                    alert('База данных сброшена к начальному состоянию!');
                    location.reload();
                })
                .catch(() => {
                    alert('Ошибка при сбросе базы данных.');
                });
        }
    }
}

// Инициализация страницы профиля
function initProfilePageHandler() {
    const user = getCurrentUser();
    if (!user) {
        alert('Необходима авторизация для доступа к личному кабинету.');
        window.location.href = 'login.html';
        return;
    }

    if (!window.appData) {
        loadData().then(() => initProfilePage());
    } else {
        initProfilePage();
    }
}

// ========== ФУНКЦИИ ДЛЯ ГЛАВНОЙ СТРАНИЦЫ ==========

// Инициализация главной страницы
function initHomePage() {
    updateHomeStats();
    initQuickActions();
    showRoleInfo();
}

// Обновление статистики на главной странице
function updateHomeStats() {
    const stats = calculateStats(window.appData);
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = stats.totalRequests || 0;
        statNumbers[1].textContent = stats.approvedRequests || 0;
        statNumbers[2].textContent = stats.inProgress || 0;
    }
}

// Инициализация быстрых действий
function initQuickActions() {
    const buttons = document.querySelectorAll('.quick-actions button');
    const user = getCurrentUser();
    if (!user) return;
    
    // Новая заявка
    if (buttons[0] && hasPermission('canCreateRequest')) {
        buttons[0].addEventListener('click', () => {
            window.location.href = 'requests.html';
        });
    } else if (buttons[0]) {
        buttons[0].style.display = 'none';
    }
    
    // Черновики
    if (buttons[1] && hasPermission('canViewOwnRequests')) {
        buttons[1].addEventListener('click', () => {
            window.location.href = 'requests.html';
        });
    } else if (buttons[1]) {
        buttons[1].style.display = 'none';
    }
    
    // Текущие заявки
    if (buttons[2] && (hasPermission('canViewAllRequests') || hasPermission('canViewOwnRequests'))) {
        buttons[2].addEventListener('click', () => {
            window.location.href = 'requests.html';
        });
    } else if (buttons[2]) {
        buttons[2].style.display = 'none';
    }
    
    // История (отчеты)
    if (buttons[3] && hasPermission('canViewReports')) {
        buttons[3].addEventListener('click', () => {
            window.location.href = 'reports.html';
        });
    } else if (buttons[3]) {
        buttons[3].style.display = 'none';
    }
    
    // Каталог
    if (buttons[4] && hasPermission('canViewMaterials')) {
        buttons[4].addEventListener('click', () => {
            window.location.href = 'materials.html';
        });
    } else if (buttons[4]) {
        buttons[4].style.display = 'none';
    }
    
    // Поиск
    if (buttons[5] && hasPermission('canViewMaterials')) {
        buttons[5].addEventListener('click', () => {
            window.location.href = 'materials.html';
        });
    } else if (buttons[5]) {
        buttons[5].style.display = 'none';
    }
    
    // Пользователи
    if (buttons[6] && hasPermission('canViewEmployees')) {
        buttons[6].addEventListener('click', () => {
            window.location.href = 'employees.html';
        });
    } else if (buttons[6]) {
        buttons[6].style.display = 'none';
    }
    
    // Роли
    if (buttons[7] && hasPermission('canViewEmployees')) {
        buttons[7].addEventListener('click', () => {
            window.location.href = 'employees.html';
        });
    } else if (buttons[7]) {
        buttons[7].style.display = 'none';
    }
}

// Показать информацию о роли
function showRoleInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const roleInfo = getRoleDescription(user.role);
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    
    // Создаем информационную карточку о правах
    const roleCard = document.createElement('div');
    roleCard.className = 'card role-info-card';
    
    roleCard.innerHTML = `
        <h3>Ваша роль: ${roleInfo.title}</h3>
        <p>${roleInfo.description}</p>
        <div class="role-permissions-grid">
            ${roleInfo.permissions.map(p => `<div class="role-permission-item">${p}</div>`).join('')}
        </div>
    `;
    
    mainContent.insertBefore(roleCard, mainContent.firstChild);
}

// Инициализация главной страницы
function initHomePageHandler() {
    const user = getCurrentUser();
    if (!user) {
        alert('Для полного доступа к функциям системы необходимо войти.');
        window.location.href = 'login.html';
        return;
    }
    
    if (!window.appData) {
        loadData().then(() => initHomePage());
    } else {
        initHomePage();
    }
}

