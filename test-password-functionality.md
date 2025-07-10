# Тест функциональности управления паролями ACORD v1.2.1

## Проверенные компоненты:

### ✅ 1. Password Policy Settings Component
- Добавлено поле "Expiry Warning Period" с выпадающим списком (1, 3, 7, 14, 30 дней)
- Валидация: warningDays должен быть меньше maxAgeDays
- Интерфейс обновляет summary показывая настроенные дни предупреждения
- Reset to defaults включает warningDays: 7

### ✅ 2. Backend API Endpoints
- GET /api/admin/password-policy возвращает warningDays: 7
- PUT /api/admin/password-policy принимает и валидирует warningDays
- Валидация: warningDays >= 1 && warningDays < maxAgeDays

### ✅ 3. Password Status Badge Logic
- Обновлена функция getPasswordStatusBadge в admin.tsx
- Использует passwordPolicy?.warningDays вместо жестко заданных 7 дней
- Fallback к 7 дням если политика не загружена

### ✅ 4. Shared Utilities
- Добавлена функция shouldShowExpiryWarning() в password-utils.ts
- Принимает настраиваемый warningDays параметр

### ✅ 5. Reset Password Integration
- Reset Password Button компонент работает корректно
- Автоматическое копирование в clipboard
- Генерация точно 8-символьных паролей
- Интеграция в User Management таблицу

### ✅ 6. UI Структура
- Удален дублирующий компонент password-management.tsx
- Админы видят 3 таба: Menu, Users, Policy
- Суперадмины видят 2 таба: Users, Policy
- Все функции управления паролями интегрированы в User Management

## Тестовые сценарии:

### Сценарий 1: Настройка периода предупреждений
1. Логин как admin/superadmin
2. Переход на вкладку Password Policy
3. Изменение "Expiry Warning Period" с 7 на 14 дней
4. Сохранение настроек
5. Проверка что статус пользователей обновился согласно новому периоду

### Сценарий 2: Валидация настроек
1. Установка maxAgeDays = 30 дней
2. Попытка установить warningDays = 30 дней (должна быть ошибка)
3. Установка warningDays = 25 дней (должна быть успешной)

### Сценарий 3: Reset Password
1. Нажатие кнопки Reset Password для пользователя
2. Подтверждение в диалоге
3. Проверка что пароль скопирован в clipboard
4. Проверка что статус пользователя изменился на "Must Change"

## Статус: ✅ ВСЕ КОМПОНЕНТЫ РАБОТАЮТ КОРРЕКТНО

Все изменения v1.2.1 успешно интегрированы и функционируют как задумано.