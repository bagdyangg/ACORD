# Решение проблем с кэшированием ACORD

## Проблема
Если первая страница приложения не загружается или показывает старую версию, это связано с кэшированием браузера.

## Быстрые способы решения

### 1. Очистка кэша через URL
Добавьте `?clear-cache` к URL приложения:
```
https://ваш-домен.com/?clear-cache
```

### 2. Принудительная очистка кэша
Перейдите по адресу:
```
https://ваш-домен.com/api/clear-cache
```

### 3. Очистка в браузере
**Chrome/Edge:**
- Нажмите `Ctrl+Shift+Delete` (Windows) или `Cmd+Shift+Delete` (Mac)
- Выберите "Изображения и файлы" и "Данные приложений"
- Нажмите "Очистить данные"

**Firefox:**
- Нажмите `Ctrl+Shift+Delete` (Windows) или `Cmd+Shift+Delete` (Mac)
- Выберите "Кэш" и "Данные сайтов"
- Нажмите "Очистить сейчас"

**Safari:**
- Перейдите в "Разработка" > "Очистить кэш"
- Или нажмите `Cmd+Option+E`

### 4. Жесткая перезагрузка
- **Windows:** `Ctrl+F5` или `Ctrl+Shift+R`
- **Mac:** `Cmd+Shift+R`
- **Mobile:** Долгое нажатие на кнопку обновления

### 5. Режим инкогнито
Откройте приложение в режиме инкогнито/приватного просмотра:
- **Chrome:** `Ctrl+Shift+N`
- **Firefox:** `Ctrl+Shift+P`
- **Safari:** `Cmd+Shift+N`

## Что исправлено

### ✅ Версия 1.1.1
- Переработан Service Worker с правильной стратегией кэширования
- Добавлено автоматическое версионирование кэша
- Исправлен конфликт между браузерным кэшем и Service Worker
- Добавлена автоматическая очистка устаревших кэшей
- Улучшена обработка обновлений приложения

### ✅ Новые возможности
- Автоматическая проверка обновлений каждые 30 секунд
- Принудительная очистка кэша при обновлениях
- Отладочные инструменты для решения проблем
- Улучшенная обработка офлайн-режима

## Для администраторов

### Проверка статуса кэша
```javascript
// Откройте консоль браузера (F12) и выполните:
caches.keys().then(names => console.log('Active caches:', names))
```

### Принудительная очистка всех кэшей
```javascript
// В консоли браузера:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  localStorage.clear();
  sessionStorage.clear();
  console.log('All caches cleared');
});
```

## Техническая информация

### Что изменено:
1. **Service Worker**: Переход с "cache-first" на "network-first" стратегию
2. **Версионирование**: Автоматическое обновление версии кэша
3. **Заголовки**: Правильные Cache-Control заголовки для разных типов файлов
4. **Автообновление**: Принудительное обновление при доступности новой версии

### Мониторинг:
- Логи Service Worker доступны в консоли браузера
- Статус кэша отображается в DevTools > Application > Storage
- Сетевые запросы отслеживаются во вкладке Network

## Поддержка

Если проблемы остаются:
1. Попробуйте все способы очистки кэша по порядку
2. Перезапустите браузер
3. Обратитесь к администратору системы
4. Используйте другой браузер или устройство для проверки