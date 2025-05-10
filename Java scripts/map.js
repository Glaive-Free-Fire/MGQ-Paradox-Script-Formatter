// map.js - Функции для обработки вкладки Map

/**
 * Очищает лишние кавычки в строках ShowText
 * @param {string} text - Текст для очистки
 * @returns {string} - Очищенный текст
 */
function cleanShowTextQuotes(text) {
  // Если строка не начинается с ShowText, возвращаем как есть
  if (!text.trim().startsWith('ShowText([')) {
    return text;
  }
  
  try {
    // Извлекаем основное содержимое между ShowText([ и ])
    const contentStartIndex = text.indexOf('ShowText([') + 10;
    const contentEndIndex = text.lastIndexOf('])');
    
    if (contentStartIndex >= 10 && contentEndIndex > contentStartIndex) {
      let content = text.substring(contentStartIndex, contentEndIndex);
    
      // Удаляем начальную и конечную кавычки, если они есть
    if (content.startsWith('"') && content.endsWith('"')) {
        content = content.substring(1, content.length - 1);
      }
      
      // Удаляем лишние кавычки после управляющих кодов
      content = content.replace(/\\C\[(\d+)\]>"([^"]*?)"/g, '\\C[$1]>$2');
      
      // Удаляем лишние кавычки в начале и конце
      content = content.replace(/^"|"$/g, '');
      
      // Собираем строку обратно
      return `ShowText(["${content}"])`;
    }
    
    // Если не удалось извлечь содержимое, возвращаем как есть
    return text;
  } catch (e) {
    Logger.error('map', 'Ошибка при обработке строки ShowText', {text, error: e});
    return text;
  }
}

/**
 * Исправляет вложенные ShowText и лишние кавычки
 * @param {string} text - Исходный текст
 * @returns {string} - Исправленный текст
 */
function fixNestedShowText(text) {
  // Исправляем вложенные ShowText
  text = text.replace(/ShowText\(\["ShowText\(\["([^"]*?)"\]\)"\]\)/g, 'ShowText(["$1"])');
  
  // Удаляем двойные кавычки
  text = text.replace(/ShowText\(\[""([^"]*?)""\]\)/g, 'ShowText(["$1"])');
  
  // Исправляем двойные закрывающие скобки
  text = text.replace(/ShowText\(\["([^"]*?)"\]\)"\]\)/g, 'ShowText(["$1"])');
  
  // Удаляем лишние кавычки внутри текста
  text = text.replace(/ShowText\(\["([^"]*?)"\]\)/g, function(match, content) {
    // Заменяем все неэкранированные кавычки
    var cleanedContent = content.replace(/(?<!\\)"/g, '');
    return 'ShowText(["' + cleanedContent + '"])';
  });
  
  return text;
}

/**
 * Очищает текст команды ShowChoices от лишних кавычек
 * @param {string} text - Текст команды ShowChoices
 * @returns {string} - Очищенный текст команды
 */
function cleanShowChoices(text) {
  try {
    // Проверяем, является ли строка командой ShowChoices
    if (!text.includes('ShowChoices([[')) {
      return text;
    }
    
    // Извлекаем массив вариантов
    const choicesMatch = text.match(/ShowChoices\(\[\[(.*?)\], (\d+)\]\)/);
    if (!choicesMatch) {
      return text;
    }
    
    const choices = choicesMatch[1];
    const defaultChoice = choicesMatch[2];
    
    // Разбиваем строку на отдельные варианты, учитывая возможные запятые внутри строк
    let inQuotes = false;
    let currentChoice = '';
    let choiceArray = [];
    
    for (let i = 0; i < choices.length; i++) {
      const char = choices[i];
      
      if (char === '"' && (i === 0 || choices[i-1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      
      if (char === ',' && !inQuotes) {
        // Конец текущего варианта выбора
        choiceArray.push(currentChoice.trim());
        currentChoice = '';
        continue;
      }
      
      currentChoice += char;
    }
    
    // Добавляем последний вариант
    if (currentChoice.trim()) {
      choiceArray.push(currentChoice.trim());
    }
    
    // Очищаем каждый вариант от лишних кавычек
    choiceArray = choiceArray.map(choice => {
      // Удаляем все избыточные кавычки, оставляя только одну пару
      let cleanedChoice = choice;
      
      // Удаляем экранированные кавычки
      cleanedChoice = cleanedChoice.replace(/\\"/g, '');
      
      // Удаляем все кавычки
      cleanedChoice = cleanedChoice.replace(/"/g, '');
      
      // Добавляем одну пару кавычек обратно
      return `"${cleanedChoice}"`;
    });
    
    // Собираем команду обратно
    return `ShowChoices([[${choiceArray.join(', ')}], ${defaultChoice}])`;
  } catch (e) {
    Logger.error('map', 'Ошибка при обработке ShowChoices', { text, error: e });
    return text;
  }
}

/**
 * Исправляет известные ошибки в тексте карты
 * @param {string} text - Исходный текст
 * @returns {string} - Исправленный текст
 */
function fixMapErrors(text) {
  Logger.debug('map', 'Начало исправления ошибок в тексте карты');
  
  // 1. Улучшенное исправление поврежденных ShowText с отрезанным началом
  // Это исправит такие варианты как owText, howText, wText и т.д.
  text = text.replace(/(\s*)([a-zA-Z]*?)owText\(\["([^"]*?)"\]\)/g, '$1ShowText(["$3"])');
  
  // 2. Новое исправление для других вариантов повреждённых ShowText
  // Находит любые *Text, если они не начинаются с 'Show' или 'Empty'
  text = text.replace(/(\s*)(?!Show|Empty)([a-zA-Z]*?)Text\(\["([^"]*?)"\]\)/g, '$1ShowText(["$3"])');
  
  // НОВОЕ: Исправляем случайную замену ShowText на Copy
  text = text.replace(/Copy\(\["([^"]*)"\]\)/g, 'ShowText(["$1"])');
  
  // НОВОЕ: Исправляем повреждённые ShowTextAttributes с незакрытой кавычкой
  text = text.replace(/ShowTextAttributes\(\["([^"]*),\s*(\d+),\s*(\d+),\s*(\d+)\]\)/g, 'ShowTextAttributes(["$1", $2, $3, $4])');
  
  // НОВОЕ: Исправляем повреждённые ShowTextAttributes с пустой строкой
  text = text.replace(/ShowTextAttributes\(\[,\s*(\d+),\s*(\d+),\s*(\d+)\]\)/g, 'ShowTextAttributes(["", $1, $2, $3])');
  
  // НОВОЕ: Исправляем опечатки в командах ShowText
  text = text.replace(/^(\s*)(howText|ShowTextt|SShowText)\(/gm, '$1ShowText(');
  
  // Исправляем ShowTextShowText на ShowText
  text = text.replace(/ShowTextShowText\(/g, 'ShowText(');
  
  // НОВОЕ: Исправляем случаи, когда ShowText и ShowTextAttributes слиты вместе
  text = text.replace(/ShowTextShowTextAttributes\((\[[^\]]+\])\)/g, 'ShowTextAttributes($1)');
  
  // Исправляем Page на Page 0
  text = text.replace(/^(\s*)Page\s*$/gm, '$1Page 0');
  
  // 1. Исправляем лишние скобки перед массивом
  text = text.replace(/ShowText\(\(\[/g, 'ShowText([');
  
  // 2. Исправляем несоответствие скобок и кавычек
  text = text.replace(/ShowText\(\["([^"]*?)"\]\)\)/g, 'ShowText(["$1"])');
  
  // 3. Исправляем микс одинарных и двойных кавычек
  text = text.replace(/ShowText\(\["'([^']*?)»([^"]*?)"\]\)/g, 'ShowText(["«$1»$2"])');
  
  // 4. Исправляем отсутствие закрывающей скобки у ShowText
  text = text.replace(/ShowText\(\["([^"]*?)"\]\)(?!\))/g, 'ShowText(["$1"])');
  
  // 5. Удаляем все экранированные кавычки в текстовых строках
  text = text.replace(/ShowText\(\["(.*?)"\]\)/g, function(match, content) {
    // Сначала сохраняем управляющие коды
    let controlCodes = [];
    let tempContent = content.replace(/(\\\\?[Cn<>\[\]])(\[\d+\])?/g, function(match) {
      controlCodes.push(match);
      return `__CODE${controlCodes.length - 1}__`;
    });
    
    // Удаляем экранированные кавычки
    tempContent = tempContent.replace(/\\"/g, '');
    // Удаляем обычные кавычки
    tempContent = tempContent.replace(/"/g, '');
    
    // Восстанавливаем управляющие коды
    for (let i = 0; i < controlCodes.length; i++) {
      tempContent = tempContent.replace(`__CODE${i}__`, controlCodes[i]);
    }
    
    return `ShowText(["${tempContent}"])`;
  });
  
  // 6. Исправляем одиночные обратные слеши в управляющих кодах
  text = text.replace(/ShowText\(\["([^"]*?)"\]\)/g, function(match, content) {
    // Заменяем только одиночные обратные слеши перед управляющими символами на двойные
    content = content.replace(/(?<!\\)\\([nC<>])/g, '\\\\$1');
    return `ShowText(["${content}"])`;
  });
  
  // 7. Исправляем проблему с кавычками в тексте вокруг тире
  text = text.replace(/ShowText\(\["([^"]*?)"[\s]*([—–-])[\s]*([^"]*?)"\]\)/g, 'ShowText(["$1 $2 $3"])');
  
  // 8. Исправляем проблему с кавычками внутри текста (общий случай)
  text = text.replace(/ShowText\(\["([^"]*)(")((?:[^"]|"[^"]*")*?)"\]\)/g, function(match, before, quote, after) {
    return 'ShowText(["' + before + after + '"])';
  });
  
  // 9. Последний проход для очистки всех промежуточных кавычек
  text = text.replace(/ShowText\(\["\s*(.*?)\s*"\]\)/g, function(match, content) {
    content = content.replace(/(?<!\\)"/g, '');
    return 'ShowText(["' + content + '"])';
  });
  
  // 10. НОВОЕ: Исправление строк, начинающихся с (["текст"]) без ShowText
  text = text.replace(/^(\s*)\(\["([^"]*?)"\]\)(\s*\?\s*)?$/gm, '$1ShowText(["$2"])');
  
  // 11. НОВОЕ: Обработка строк, которые начинаются с (["текст"]) и идут после ShowTextAttributes
  text = text.replace(/(ShowTextAttributes\(\[[^\]]+\]\)\s*\n\s*)\(\["([^"]*?)"\]\)(\s*\?\s*)?/g, '$1ShowText(["$2"])');
  
  // 12. НОВОЕ: Общий случай - строки начинающиеся скобкой заменяем на ShowText
  text = text.replace(/^(\s*)\(\["([^"]*?)"\]\)(\s*.*)?$/gm, '$1ShowText(["$2"])$3');
  
  // 13. НОВОЕ: Удаление пустых комментариев между командами
  text = text.replace(/^(\s*)#\s*$/gm, '');
  
  // Исправляем лишние кавычки после управляющих кодов
  text = text.replace(/\\C\[(\d+)\]>"([^"]*?)"/g, '\\C[$1]>$2');
  
  // Исправляем вложенные ShowText и лишние кавычки
  text = fixNestedShowText(text);
  
  // 14. НОВОЕ: Убираем подряд идущие дубли ShowTextAttributes
  text = text.replace(
    /^(\s*ShowTextAttributes\(\[[^\]]+\]\))(?:\r?\n\s*)+\1/gm,
    '$1'
  );
  
  // НОВОЕ: Исправление для ShowChoices с лишними кавычками
  text = text.replace(/ShowChoices\(\[\[(.*?)\], (\d+)\]\)/g, function(match, choices, defaultChoice) {
    // Разбиваем на отдельные варианты выбора
    const choiceArray = choices.split(',').map(choice => {
      // Очищаем каждый вариант от лишних кавычек
      let cleanedChoice = choice.trim();
      
      // Удаляем избыточные кавычки (например, ""Текст" -> "Текст")
      cleanedChoice = cleanedChoice.replace(/^"+|"+$/g, '"');
      
      // Убедимся, что есть только одна пара кавычек
      if (!cleanedChoice.startsWith('"')) {
        cleanedChoice = '"' + cleanedChoice;
      }
      if (!cleanedChoice.endsWith('"')) {
        cleanedChoice = cleanedChoice + '"';
      }
      
      // Удаляем лишние кавычки внутри выбора (например, "Ответ "да"" -> "Ответ да")
      cleanedChoice = cleanedChoice.replace(/^"(.*?)"$/, function(m, inner) {
        return '"' + inner.replace(/"/g, '') + '"';
      });
      
      return cleanedChoice;
    });
    
    // Собираем обратно в строку
    return `ShowChoices([[${choiceArray.join(', ')}], ${defaultChoice}])`;
  });
  
  // ТАКЖЕ: Еще одно исправление для вариаций формата ShowChoices
  text = text.replace(/ShowChoices\(\[\["([^"]*)""+([^"]*)"(.*?)\], (\d+)\]\)/g, 
    'ShowChoices([["$1$2"$3], $4])');
  
  // Исправление случаев, когда внутри ShowChoices есть экранированные кавычки
  text = text.replace(/ShowChoices\(\[\[(.*?)\], (\d+)\]\)/g, function(match, choices, defaultChoice) {
    // Удаляем все экранированные кавычки внутри вариантов
    const cleanedChoices = choices.replace(/\\"/g, '');
    return `ShowChoices([[${cleanedChoices}], ${defaultChoice}])`;
  });
  
  Logger.debug('map', 'Исправление ошибок завершено');
  return text;
}

/**
 * Обрабатывает текст карты
 * @param {string} text - Исходный текст карты
 * @returns {string} - Отформатированный текст карты
 */
function processMapText(text) {
  try {
    Logger.info('map', 'Начало обработки текста карты');
    
    // Исправляем двойные кавычки в Display Name
    text = text.replace(/Display Name = ""([^"]*)"/, 'Display Name = "$1"');
    
    // Сначала исправляем известные ошибки
    text = fixMapErrors(text);
    
    // Заменяем неразрывный пробел (U+00A0) на обычный пробел
    text = text.replace(/\u00A0/g, ' ');
    
    const lines = text.split('\n');
    let result = '';
    let currentIndent = 2; // Базовый отступ для Page 0
    let conditionalBranchDepth = 0; // Счетчик вложенности ConditionalBranch
    let isInPage0 = false; // Флаг для отслеживания нахождения внутри Page 0
    let isInPage1 = false; // НОВОЕ: Флаг для отслеживания нахождения внутри Page 1
    let page0Indent = 4; // Базовый отступ для команд внутри Page 0
    
    Logger.debug('map', 'Начальные параметры форматирования', {
      currentIndent,
      conditionalBranchDepth,
      isInPage0,
      isInPage1,
      page0Indent
    });
    
    for (let line of lines) {
      // Пропускаем пустые строки
      if (!line.trim()) {
        result += '\n';
        continue;
      }
      
      // Проверяем начало Page 0
      if (line.trim() === 'Page 0') {
        isInPage0 = true;
        isInPage1 = false;
        result += '  Page 0\n';
        currentIndent = page0Indent;
        Logger.debug('map', 'Обнаружен Page 0', { currentIndent });
        continue;
      }
      
      // НОВОЕ: Проверяем начало Page 1
      if (line.trim() === 'Page 1') {
        isInPage0 = false;
        isInPage1 = true;
        result += '  Page 1\n';
        currentIndent = page0Indent;
        Logger.debug('map', 'Обнаружен Page 1', { currentIndent });
        continue;
      }
      
      // Проверяем начало ConditionalBranch
      if (line.includes('ConditionalBranch([')) {
        result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
        conditionalBranchDepth++;
        currentIndent = (isInPage0 || isInPage1) ? page0Indent + (conditionalBranchDepth * 2) : 2 + (conditionalBranchDepth * 2);
        Logger.debug('map', 'Обнаружен ConditionalBranch', { 
          depth: conditionalBranchDepth,
          currentIndent 
        });
        continue;
      }
      
      // Проверяем конец ConditionalBranch
      if (line.includes('BranchEnd')) {
        conditionalBranchDepth = Math.max(0, conditionalBranchDepth - 1);
        currentIndent = (isInPage0 || isInPage1) ? page0Indent + (conditionalBranchDepth * 2) : 2 + (conditionalBranchDepth * 2);
        result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
        Logger.debug('map', 'Обнаружен BranchEnd', { 
          depth: conditionalBranchDepth,
          currentIndent 
        });
        continue;
      }
      
      // Проверяем, является ли строка частью Display Name блока
      if (line.includes('Display Name =') || 
          line.includes('Parallax Name =') || 
          line.includes('Note =') ||
          line.includes('CommonEvent') ||
          line.includes('Name =')) {
        result += `${line.trim()}\n`;
        Logger.debug('map', 'Обработка блока с именем', { line: line.trim() });
        continue;
      }
      
      // Если мы внутри Page 0 или Page 1, применяем отступы
      if (isInPage0 || isInPage1) {
        try {
        // Проверяем, является ли строка диалогом
        if (line.includes('ShowText([')) {
            // Очищаем лишние кавычки с помощью улучшенной функции
          const cleanedLine = cleanShowTextQuotes(line.trim());
            result += `${' '.repeat(currentIndent)}${cleanedLine}\n`;
            Logger.debug('map', 'Обработка строки ShowText', { 
              original: line.trim(),
              cleaned: cleanedLine 
            });
        } else if (line.includes('ShowTextAttributes([')) {
          // Обработка строк с ShowTextAttributes
          const textMatch = line.match(/^(\s*)ShowTextAttributes\(\[([^\]]+)\]\)(?:\s+(.+))?$/);
          
          if (textMatch) {
            const attributes = textMatch[2];
            const comment = textMatch[3];
            
            result += `${' '.repeat(currentIndent)}ShowTextAttributes([${attributes}])\n`;
            
            if (comment) {
              result += `${' '.repeat(currentIndent)}#${comment}\n`;
            }
              
              Logger.debug('map', 'Обработка ShowTextAttributes', {
                attributes,
                comment
              });
          } else {
            result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
              Logger.warn('map', 'Не удалось обработать ShowTextAttributes', { line: line.trim() });
          }
        } else if (line.includes('Empty([')) {
          const textMatch = line.match(/^(\s*)Empty\(\[([^\]]*)\]\)/);
          
          if (textMatch) {
            result += `${' '.repeat(currentIndent)}Empty([])\n`;
              Logger.debug('map', 'Обработка Empty блока');
            } else {
              result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
              Logger.warn('map', 'Не удалось обработать Empty блок', { line: line.trim() });
            }
          } else if (line.includes('ShowChoices([')) {
            line = cleanShowChoices(line.trim());
            result += `${' '.repeat(currentIndent)}${line}\n`;
            continue;
          } else {
            result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
          }
        } catch (e) {
          // В случае любой ошибки, сохраняем строку как есть
          Logger.error('map', 'Ошибка при обработке строки', {line: line.trim(), error: e});
          result += `${' '.repeat(currentIndent)}${line.trim()}\n`;
        }
      } else {
        result += `${line.trim()}\n`;
      }
    }
    
    Logger.info('map', 'Обработка текста карты завершена успешно');
    return result.trim();
  } catch (e) {
    Logger.error('map', 'Ошибка при обработке текста карты', e);
    return "Error processing map text: " + e.message;
  }
}

/**
 * Разбивает текст карты на строки с учетом максимальной длины
 * @param {string} text - Исходный текст
 * @param {number} maxLen - Максимальная длина строки
 * @returns {Array} - Массив строк
 */
function wrapMapText(text, maxLen) {
  Logger.debug('map', 'Начало разбиения текста на строки', { text, maxLen });
  
  const words = text.split(' ');
  let lines = [];
  let currentLine = '';
  
  for (let word of words) {
    if ((currentLine.length ? currentLine.length + 1 : 0) + word.length <= maxLen) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  Logger.debug('map', 'Текст успешно разбит на строки', { lines });
  return lines;
}