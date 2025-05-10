// logs.js - Модуль для единого логирования всех действий

/**
 * Настройки логирования
 */
const LogSettings = {
  // Включить/выключить логирование
  enabled: true,
  
  // Уровни логирования (true - включено, false - выключено)
  levels: {
    debug: true,    // Отладочная информация
    info: true,     // Информационные сообщения
    warn: true,     // Предупреждения
    error: true     // Ошибки
  },
  
  // Включить/выключить логи для определенных модулей
  modules: {
    library: true,
    jobchange: true,
    medal: true,
    skillreplacer: true,
    follower: true,
    map: true,
    common: true,
    other: true
  },
  
  // Временная метка в логах
  showTimestamp: true,
  
  // Расширенное форматирование (цвета в консоли)
  useColors: true
};

/**
 * Форматирование времени для логов
 * @returns {string} - Строка с форматированным временем
 */
function getTimestamp() {
  if (!LogSettings.showTimestamp) return '';
  
  const now = new Date();
  return `[${now.toLocaleTimeString('ru-RU', { hour12: false })}:${now.getMilliseconds().toString().padStart(3, '0')}] `;
}

/**
 * Базовая функция логирования
 * @param {string} level - Уровень лога (debug, info, warn, error)
 * @param {string} module - Название модуля
 * @param {string} message - Сообщение для лога
 * @param {any} data - Дополнительные данные для лога
 */
function log(level, module, message, data = null) {
  // Проверка включен ли логгер вообще
  if (!LogSettings.enabled) return;
  
  // Проверка уровня лога
  if (!LogSettings.levels[level]) return;
  
  // Проверка модуля
  if (module && !LogSettings.modules[module]) return;
  
  // Формирование префикса сообщения
  const modulePrefix = module ? `[${module}] ` : '';
  const timestamp = getTimestamp();
  const prefix = `${timestamp}${modulePrefix}`;
  
  // Выбор метода консоли на основе уровня
  let consoleMethod;
  let stylePrefix = '';
  let styleSuffix = '';
  
  switch (level) {
    case 'debug':
      consoleMethod = console.debug || console.log;
      if (LogSettings.useColors) {
        stylePrefix = '%c';
        styleSuffix = 'color: #6c757d'; // Серый
      }
      break;
    case 'info':
      consoleMethod = console.info || console.log;
      if (LogSettings.useColors) {
        stylePrefix = '%c';
        styleSuffix = 'color: #0d6efd'; // Синий
      }
      break;
    case 'warn':
      consoleMethod = console.warn;
      if (LogSettings.useColors) {
        stylePrefix = '%c';
        styleSuffix = 'color: #ffc107; font-weight: bold'; // Желтый
      }
      break;
    case 'error':
      consoleMethod = console.error;
      if (LogSettings.useColors) {
        stylePrefix = '%c';
        styleSuffix = 'color: #dc3545; font-weight: bold'; // Красный
      }
      break;
    default:
      consoleMethod = console.log;
  }
  
  // Вывод в консоль
  if (LogSettings.useColors && stylePrefix) {
    if (data !== null) {
      consoleMethod(`${stylePrefix}${prefix}${message}`, styleSuffix, data);
    } else {
      consoleMethod(`${stylePrefix}${prefix}${message}`, styleSuffix);
    }
  } else {
    if (data !== null) {
      consoleMethod(`${prefix}${message}`, data);
    } else {
      consoleMethod(`${prefix}${message}`);
    }
  }
}

/**
 * Логирование отладочной информации
 * @param {string} module - Название модуля
 * @param {string} message - Сообщение
 * @param {any} data - Дополнительные данные
 */
function debug(module, message, data = null) {
  log('debug', module, message, data);
}

/**
 * Логирование информационных сообщений
 * @param {string} module - Название модуля
 * @param {string} message - Сообщение
 * @param {any} data - Дополнительные данные
 */
function info(module, message, data = null) {
  log('info', module, message, data);
}

/**
 * Логирование предупреждений
 * @param {string} module - Название модуля
 * @param {string} message - Сообщение
 * @param {any} data - Дополнительные данные
 */
function warn(module, message, data = null) {
  log('warn', module, message, data);
}

/**
 * Логирование ошибок
 * @param {string} module - Название модуля
 * @param {string} message - Сообщение
 * @param {any} data - Дополнительные данные
 */
function error(module, message, data = null) {
  log('error', module, message, data);
}

/**
 * Старт группы логов
 * @param {string} module - Название модуля
 * @param {string} title - Заголовок группы
 */
function groupStart(module, title) {
  if (!LogSettings.enabled) return;
  
  // Проверка модуля
  if (module && !LogSettings.modules[module]) return;
  
  const modulePrefix = module ? `[${module}] ` : '';
  const timestamp = getTimestamp();
  console.group(`${timestamp}${modulePrefix}${title}`);
}

/**
 * Завершение группы логов
 */
function groupEnd() {
  if (!LogSettings.enabled) return;
  console.groupEnd();
}

/**
 * Включить/выключить все логи
 * @param {boolean} enabled - Включить/выключить
 */
function setEnabled(enabled) {
  LogSettings.enabled = enabled;
}

/**
 * Включить/выключить логи определенного уровня
 * @param {string} level - Уровень (debug, info, warn, error)
 * @param {boolean} enabled - Включить/выключить
 */
function setLevelEnabled(level, enabled) {
  if (LogSettings.levels.hasOwnProperty(level)) {
    LogSettings.levels[level] = enabled;
  }
}

/**
 * Включить/выключить логи для определенного модуля
 * @param {string} module - Название модуля
 * @param {boolean} enabled - Включить/выключить
 */
function setModuleEnabled(module, enabled) {
  if (LogSettings.modules.hasOwnProperty(module)) {
    LogSettings.modules[module] = enabled;
  }
}

// Экспорт функций для использования в других модулях
window.Logger = {
  debug,
  info,
  warn,
  error,
  groupStart,
  groupEnd,
  setEnabled,
  setLevelEnabled,
  setModuleEnabled,
  settings: LogSettings
};