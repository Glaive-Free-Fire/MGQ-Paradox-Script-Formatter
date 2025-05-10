// Функции для обработки Library(Enemy)
function processText(text) {
    let lines = text.split('\n');
    
    // Шаг 1: Собираем информацию о блоках и ID
    let allIDs = new Set();       // Все ID, которые нужно создать
    let primaryIDs = new Set();   // ID, которые указаны первыми в каждом блоке
    let blockContents = {};       // Содержимое для каждого ID
    
    // Первый проход - собираем информацию о блоках
    let currentBlock = null;
    
    for (let line of lines) {
      if (isIDLine(line)) {
        // Сохраняем предыдущий блок, если есть
        if (currentBlock) {
          // Сохраняем содержимое для каждого ID в блоке
          for (const id of currentBlock.idList) {
            if (!blockContents[id]) {
              blockContents[id] = [...currentBlock.content];
            }
          }
        }
        
        // Создаем новый блок
        const idText = line.trim();
        const idList = parseIDList(idText);
        
        if (idList.length > 0) {
          // Первый ID считаем первичным (основным)
          primaryIDs.add(idList[0]);
          
          // Все ID добавляем в общий набор
          for (const id of idList) {
            allIDs.add(id);
          }
        }
        
        currentBlock = { 
          idList: idList,
          content: [] 
        };
      } else {
        if (currentBlock) {
          currentBlock.content.push(line);
        }
      }
    }
    
    // Сохраняем последний блок
    if (currentBlock) {
      for (const id of currentBlock.idList) {
        if (!blockContents[id]) {
          blockContents[id] = [...currentBlock.content];
        }
      }
    }
    
    // Шаг 2: Определяем диапазон первичных ID
    const primaryIDArray = Array.from(primaryIDs);
    
    if (primaryIDArray.length === 0) {
      return ""; // Нет блоков для обработки
    }
    
    const minPrimaryID = Math.min(...primaryIDArray);
    const maxPrimaryID = Math.max(...primaryIDArray);
    
    // Шаг 3: Создаем финальные блоки в правильном порядке
    let finalBlocks = [];
    
    // Сначала добавляем блоки с ID в диапазоне первичных ID
    for (let id = minPrimaryID; id <= maxPrimaryID; id++) {
      if (allIDs.has(id) && blockContents[id]) {
        finalBlocks.push({
          id: id,
          content: blockContents[id]
        });
      }
    }
    
    // Затем добавляем блоки с ID вне диапазона первичных ID
    const externalIDs = Array.from(allIDs)
      .filter(id => id < minPrimaryID || id > maxPrimaryID)
      .sort((a, b) => a - b);
    
    for (const id of externalIDs) {
      if (blockContents[id]) {
        finalBlocks.push({
          id: id,
          content: blockContents[id]
        });
      }
    }
    
    // Шаг 4: Формируем результат
    let result = '';
    
    for (const block of finalBlocks) {
      const processedBlock = { id: block.id.toString(), content: block.content };
      result += processBlock(processedBlock) + '\n';
    }
    
    return result;
}

// Функция для проверки строки на ID (включая диапазоны вида "2-3")
function isIDLine(line) {
    // Проверяем различные форматы ID:
    // - Просто число: "123"
    // - Диапазон: "123-456"
    // - С комментарием: "123 #комментарий" или "123-456 #комментарий"
    // - Список ID через запятую: "146, 559" или "146,559"
    return line.trim().match(/^(\d+(-\d+)?)(,\s*\d+)*(\s*#.*)?$/);
}

// Обновленная функция для очистки ID от комментариев
function cleanIDText(idText) {
    // Удаляем комментарий после #
    return idText.replace(/#.*$/, '').trim();
}

// Функция для парсинга списка ID (включая через запятую)
function parseIDList(idText) {
    // Очищаем от комментариев
    const cleanedText = cleanIDText(idText);
    
    // Разбиваем по запятым и обрабатываем каждую часть
    const parts = cleanedText.split(',').map(part => part.trim());
    
    // Массив для хранения всех ID
    let allIDs = [];
    
    // Обрабатываем каждую часть (может быть отдельным ID или диапазоном)
    for (const part of parts) {
      if (part.includes('-')) {
        // Это диапазон - используем существующую функцию для распаковки
        const rangeIDs = expandIDRange(part);
        allIDs = allIDs.concat(rangeIDs);
      } else if (part) { // Проверяем, что часть не пуста
        // Это отдельный ID
        allIDs.push(parseInt(part));
      }
    }
    
    return allIDs;
}

// Обновленная функция для распаковки диапазона ID в массив
function expandIDRange(idText) {
    // Сначала очищаем ID от комментариев
    const cleanedID = cleanIDText(idText);
    
    if (!cleanedID.includes('-')) {
      return [parseInt(cleanedID)];
    }
    
    const [start, end] = cleanedID.split('-').map(Number);
    const result = [];
    
    for (let id = start; id <= end; id++) {
      result.push(id);
    }
    
    return result;
}

// Функция для проверки строки на наличие символов нужного языка
function isLineInActiveLang(line) {
    if (currentMode === "RUS") {
      return /[А-Яа-яЁё]/.test(line);
    } else if (currentMode === "JAP") {
      return /[\u3040-\u30FF\u4E00-\u9FBF]/.test(line);
    }
    return false;
}

// Обрабатывает отдельный блок для Library
function processBlock(block) {
    let outputLines = [];
    let illustrationLine = "";
    
    function addLine(line) {
      if (line === "") {
        if (outputLines.length === 0 || outputLines[outputLines.length - 1] !== "") {
          outputLines.push("");
        }
      } else {
        outputLines.push(line);
      }
    }
    
    // Сначала ищем информацию об иллюстрации во всем блоке
    let japIllustration = "";
    let rusIllustration = "";
    
    block.content.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^Иллюстрация[:：]/)) {
        rusIllustration = trimmedLine;
      } else if (trimmedLine.match(/^イラスト：/)) {
        japIllustration = trimmedLine;
      }
    });
    
    // Добавляем строки активного языка
    block.content.forEach(line => {
      if (line.trim() === "") {
        addLine("");
        return;
      }
      
      // Пропускаем строки с информацией об иллюстрации
      if (line.trim().match(/^Иллюстрация[:：]/) || line.trim().match(/^イラスト：/)) {
        return;
      }
      
      if (isLineInActiveLang(line)) {
        let splitted = splitIntoLines(line, getCurrentMaxLineLength());
        splitted.forEach(subLine => addLine(subLine));
      }
    });
    
    // Выбираем источник информации об иллюстрации
    if (currentMode === "RUS") {
      illustrationLine = rusIllustration || japIllustration;
    } else {
      illustrationLine = japIllustration || rusIllustration;
    }
    
    // Добавляем информацию об иллюстрации с правильным форматированием
    if (illustrationLine) {
      // Извлекаем имя иллюстратора
      let illustratorName = "";
      if (illustrationLine.match(/^Иллюстрация[:：]/)) {
        illustratorName = illustrationLine.replace(/^Иллюстрация[:：]\s*/, "");
      } else if (illustrationLine.match(/^イラスト：/)) {
        illustratorName = illustrationLine.replace(/^イラスト：\s*/, "");
      }
      
      // Форматируем согласно выбранному языку
      addLine("");
      if (currentMode === "JAP") {
        addLine(illustrationPrefixJAP + illustratorName);
      } else {
        addLine(illustrationPrefixRUS + " " + illustratorName);
      }
    }
    
    // Форматируем результат так, как он будет выглядеть в файле
    const blockIdIndent = "    "; // 4 пробела перед ID блока
    const contentIndent = "      "; // 6 пробелов перед содержимым
    
    let result = `${blockIdIndent}${block.id} => [\n`;
    
    // Добавляем содержимое с отступами, пропуская пустые строки в начале
    let firstLine = true;
    outputLines.forEach(line => {
      if (firstLine && line === "") {
        return; // Пропускаем первую пустую строку
      }
      firstLine = false;
      result += `${contentIndent}"${escapeQuotes(line)}",\n`;
    });
    
    // Закрываем блок
    result += `${blockIdIndent}],`;
    
    return result;
}

// Разбивка текста на строки с учётом максимальной длины для Library
function splitIntoLines(text, maxLen) {
    if (currentMode === "JAP") {
      let lines = [];
      for (let i = 0; i < text.length; i += maxLen) {
        lines.push(text.substr(i, maxLen));
      }
      return lines;
    } else {
      const words = text.replace(/\n/g, ' ').split(' ').filter(Boolean);
      let lines = [];
      let currentLine = '';
      words.forEach(word => {
        if ((currentLine.length ? currentLine.length + 1 : 0) + word.length > maxLen) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine += (currentLine ? ' ' : '') + word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    }
}

// Возвращает текущую максимальную длину строки для выбранного языка (для Library)
function getCurrentMaxLineLength() {
    return currentMode === "JAP" ? maxLineLengthJap : maxLineLengthRus;
}

// Функция для парсинга блоков Library
function parseLibraryBlocks(content) {
    console.log("Парсинг блоков Library...");
    const blocks = [];
    
    // Проверяем содержимое
    if (!content || typeof content !== 'string') {
      console.error("Пустое или некорректное содержимое для парсинга");
      return blocks;
    }
    
    // Вывод первых 200 символов для отладки
    console.log("Первые 200 символов содержимого:", content.substring(0, 200) + "...");
    
    // Модифицированный подход к поиску блоков
    // Сначала проверим символ "{" - с него должен начинаться контент
    if (!content.trim().startsWith('{')) {
      console.warn("Содержимое не начинается с открывающей скобки '{', это может вызвать проблемы");
    }
    
    // Разобьем текст на строки для построчного анализа
    const lines = content.split('\n');
    
    // Ищем все строки, которые содержат ID и начало блока
    const blockStartLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Ищем паттерн: число => [
      if (line.match(/^\d+\s*=>\s*\[/) || line.match(/^\s*\d+\s*=>\s*\[/)) {
        blockStartLines.push(i);
      }
    }
    
    console.log(`Найдено ${blockStartLines.length} потенциальных начал блоков`);
    
    // Если найдены потенциальные начала блоков, обрабатываем их
    if (blockStartLines.length > 0) {
      // Для каждого начала блока определяем его конец и извлекаем содержимое
      for (let i = 0; i < blockStartLines.length; i++) {
        const startLineIndex = blockStartLines[i];
        // Конец блока - либо следующее начало блока, либо конец содержимого
        const endLineIndex = i < blockStartLines.length - 1 ? blockStartLines[i + 1] : lines.length;
        
        // Извлекаем строки этого блока
        const blockLines = lines.slice(startLineIndex, endLineIndex);
        
        // Получаем ID блока из первой строки
        const firstLine = blockLines[0].trim();
        const idMatch = firstLine.match(/^(\d+)\s*=>/);
        
        if (!idMatch) {
          console.warn(`Не удалось извлечь ID из строки: ${firstLine}`);
          continue;
        }
        
        const id = idMatch[1];
        
        // Собираем блок со всеми оригинальными отступами
        const blockContent = blockLines.join('\n');
        
        // Добавляем блок в результат
        blocks.push({
          id: id,
          content: blockContent
        });
        
        console.log(`Обработан блок с ID: ${id}, длина: ${blockContent.length} символов`);
      }
    } else {
      // Запасной вариант - поиск блоков регулярным выражением
      console.log("Пробуем найти блоки с помощью регулярного выражения...");
      
      // Пытаемся найти все блоки вида "число => [содержимое],"
      const blockPattern = /\s*(\d+)\s*=>\s*\[([\s\S]*?)\],(?=\s*\d+\s*=>|\s*})/g;
      
      let match;
      while ((match = blockPattern.exec(content)) !== null) {
        const id = match[1].trim();
        const blockContent = match[0];
        
        blocks.push({
          id: id,
          content: blockContent
        });
        
        console.log(`Найден блок с ID: ${id} через регулярное выражение, длина: ${blockContent.length} символов`);
      }
      
      // Если и этот метод не нашел блоки, пробуем еще один подход
      if (blocks.length === 0) {
        console.log("Пробуем самый простой подход - поиск строк с ID...");
        
        // Ищем все строки, которые содержат ID и начало блока
        let currentBlock = null;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const originalLine = lines[i]; // Строка с оригинальным форматированием
          
          // Проверяем, является ли строка началом блока
          const idMatch = line.match(/^(\d+)\s*=>/);
          
          if (idMatch) {
            // Если у нас уже был блок, добавляем его в результат
            if (currentBlock) {
              blocks.push(currentBlock);
            }
            
            // Создаем новый блок
            const id = idMatch[1];
            currentBlock = {
              id: id,
              content: originalLine
            };
          } else if (currentBlock) {
            // Добавляем строку к текущему блоку
            currentBlock.content += '\n' + originalLine;
            
            // Проверяем, является ли эта строка концом блока
            if (line === "],") {
              blocks.push(currentBlock);
              currentBlock = null;
            }
          }
        }
        
        // Добавляем последний блок, если он есть
        if (currentBlock) {
          blocks.push(currentBlock);
        }
      }
    }
    
    console.log(`Всего найдено блоков: ${blocks.length}`);
    
    // Проверяем первый и последний блок, если они есть
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      const lastBlock = blocks[blocks.length - 1];
      
      console.log(`Первый блок (ID: ${firstBlock.id}): ${firstBlock.content.substring(0, 50)}...`);
      console.log(`Последний блок (ID: ${lastBlock.id}): ${lastBlock.content.substring(0, 50)}...`);
    }
    
    return blocks;
}

// Функция для обновления файла Library(Enemy)
function updateLibraryFile(originalContent, newBlocks) {
    console.log("Обновление файла Library(Enemy)...");
    
    // Проверяем, вызывается ли функция напрямую или из updateFileContent
    const isDirectCall = arguments.length === 0;
    let content, outputContent;
    
    if (isDirectCall) {
      // Прямой вызов из обработчика кнопки "Обновить библиотеку"
      const libraryFile = document.getElementById('library-file').files[0];
      
      if (!libraryFile) {
        console.error("Файл Library не выбран");
        showStatusMessage("Файл Library не выбран", true);
        return null;
      }
      
      // Получаем данные из текстового поля вывода
      outputContent = document.getElementById('output-content').textContent;
      if (!outputContent.trim()) {
        console.error("Нет данных для обновления (пустое поле вывода)");
        showStatusMessage("Нет данных для обновления (пустое поле вывода)", true);
        return null;
      }
      
      console.log("Данные для обновления получены, длина:", outputContent.length);
      console.log("Пример данных:", outputContent.substring(0, 100) + "...");
      
      // Читаем файл
      const reader = new FileReader();
      reader.onload = function(e) {
        const fileContent = e.target.result;
        try {
          processLibraryFile(fileContent, outputContent, true); // true - признак прямого вызова
        } catch (error) {
          console.error("Ошибка при обработке файла:", error);
          showStatusMessage("Ошибка при обработке файла: " + error.message, true);
        }
      };
      
      reader.onerror = function() {
        console.error("Ошибка при чтении файла");
        showStatusMessage("Ошибка при чтении файла", true);
      };
      
      reader.readAsText(libraryFile);
      return; // Выходим из функции, т.к. обработка асинхронная
    } else {
      // Вызов из updateFileContent
      content = originalContent;
      outputContent = newBlocks;
      return processLibraryFile(content, outputContent, false); // false - не прямой вызов
    }
}

// Функция для обработки файла Library(Enemy)
function processLibraryFile(content, newBlocks, isDirectCall) {
    try {
      console.log("Начинаю обработку файла...");
      
      // Добавляем информацию о файле
      console.log("Размер файла:", content.length, "символов");
      console.log("Количество строк:", content.split('\n').length);
      
      // Проверяем, есть ли в файле ключевые слова для определения формата
      const hasEndKeyword = content.includes("end");
      const hasCommentMarker = content.includes("# ENEMY_DESCRIPTION");
      
      console.log("Формат файла: " + 
        (hasEndKeyword ? "содержит 'end'" : "не содержит 'end'") + ", " +
        (hasCommentMarker ? "содержит комментарий '# ENEMY_DESCRIPTION'" : "не содержит комментарий")
      );
      
      // Определим формат окончания словаря на основе анализа файла
      let dictEndFormat = "} # ENEMY_DESCRIPTION"; // По умолчанию
      
      if (hasEndKeyword && !hasCommentMarker) {
        dictEndFormat = "}\nend"; // Тип 1: имеет end без комментария
      } else if (hasEndKeyword && hasCommentMarker) {
        // Ищем строку с концом словаря, чтобы понять формат
        const lines = content.split('\n');
        const closingLine = lines.find(line => line.trim() === "}" || line.trim() === "} # ENEMY_DESCRIPTION");
        const nextLine = lines[lines.indexOf(closingLine) + 1] || "";
        
        if (nextLine.trim() === "end") {
          dictEndFormat = "}\nend"; // Тип 2: закрывающая скобка и end на разных строках
        } else {
          dictEndFormat = "} # ENEMY_DESCRIPTION"; // Тип 3: комментарий с # ENEMY_DESCRIPTION
        }
      }
      
      console.log("Определен формат окончания словаря:", dictEndFormat);
      
      // Ищем словарь ENEMY_DESCRIPTION
      // Используем более точный подход - сначала найдем строку с объявлением словаря
      const dictionaryStartLine = content.split('\n').findIndex(line => 
        line.trim().startsWith('ENEMY_DESCRIPTION') && line.includes('=') && line.includes('{')
      );
      
      if (dictionaryStartLine === -1) {
        console.error("Не найдена строка с объявлением словаря ENEMY_DESCRIPTION");
        
        // Попробуем подход с регулярным выражением как резервный
        const dictPattern = /ENEMY_DESCRIPTION\s*=\s*{/;
        const dictMatch = content.match(dictPattern);
        
        if (!dictMatch) {
          console.error("Не найден словарь ENEMY_DESCRIPTION и резервный подход тоже не сработал");
          showStatusMessage("Не найден словарь ENEMY_DESCRIPTION", true);
          return null;
        }
        
        console.log("Резервный подход нашел словарь на позиции:", dictMatch.index);
        return processWithRegex(content, newBlocks, isDirectCall, dictMatch.index);
      }
      
      // Найдем позицию начала словаря в строке
      const lines = content.split('\n');
      const dictionaryLine = lines[dictionaryStartLine];
      console.log("Найдена строка словаря:", dictionaryLine);
      
      // Вычислим смещение начала словаря
      let offset = 0;
      for (let i = 0; i < dictionaryStartLine; i++) {
        offset += lines[i].length + 1; // +1 для учета символа новой строки
      }
      
      const openBraceIndex = dictionaryLine.indexOf('{');
      if (openBraceIndex === -1) {
        console.error("Не найдена открывающая скобка в строке словаря");
        showStatusMessage("Ошибка в формате словаря", true);
        return null;
      }
      
      // Вычисляем общий индекс начала словаря
      const dictStartIndex = offset + openBraceIndex;
      console.log("Индекс начала словаря:", dictStartIndex);
      
      // Теперь ищем конец словаря
      // Сначала попробуем найти строку с закрывающей скобкой и комментарием
      let dictEndLine = -1;
      for (let i = dictionaryStartLine + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "}") {
          dictEndLine = i;
          break;
        }
        if (line === "} # ENEMY_DESCRIPTION" || line.startsWith("} #")) {
          dictEndLine = i;
          break;
        }
      }
      
      if (dictEndLine === -1) {
        console.error("Не найден конец словаря в строках файла");
        
        // Попробуем регулярное выражение
        const alternativePatterns = [
          /}\s*# End of ENEMY_DESCRIPTION/i,
          /}\s*#\s*ENEMY_DESCRIPTION/i,
          /}\s*#end/i,
          /}\s*#\s*end/i,
          /}\s*# dictionary end/i,
          /}\s*#/i,
          /}\s*$/m  // Просто закрывающая скобка в конце строки
        ];
        
        // Ищем первое вхождение любого из этих паттернов после dictStartIndex
        let bestMatch = null;
        let bestPosition = content.length;
        
        for (const pattern of alternativePatterns) {
          // Ограничиваем поиск областью после начала словаря
          const subContent = content.substring(dictStartIndex);
          const match = subContent.match(pattern);
          
          if (match && match.index < bestPosition) {
            bestMatch = match;
            bestPosition = match.index;
          }
        }
        
        if (bestMatch) {
          console.log("Найден конец словаря по паттерну на позиции:", dictStartIndex + bestPosition);
          
          // Вычисляем конец словаря
          const dictEndIndex = dictStartIndex + bestPosition + bestMatch[0].length;
          
          // Извлекаем содержимое словаря
          const dictionaryContent = content.substring(dictStartIndex, dictEndIndex);
          
          return processDictionaryContent(dictStartIndex, dictEndIndex, dictionaryContent, content, newBlocks, isDirectCall);
        }
        
        console.error("Не удалось найти конец словаря ни одним методом");
        showStatusMessage("Не найден конец словаря ENEMY_DESCRIPTION", true);
        return null;
      }
      
      // Вычисляем позицию конца словаря
      let endOffset = 0;
      for (let i = 0; i <= dictEndLine; i++) {
        endOffset += lines[i].length + 1; // +1 для учета символа новой строки
      }
      
      // Учитываем длину закрывающей скобки
      const dictEndIndex = endOffset;
      console.log("Индекс конца словаря:", dictEndIndex);
      
      // Извлекаем содержимое словаря
      const dictionaryContent = content.substring(dictStartIndex, dictEndIndex);
      console.log("Длина содержимого словаря:", dictionaryContent.length, "символов");
      
      // Логируем первые 100 символов содержимого словаря для отладки
      console.log("Начало содержимого словаря:", dictionaryContent.substring(0, 100) + "...");
      
      // Ищем первый блок в словаре
      const firstBlockMatch = dictionaryContent.match(/\s*(\d+)\s*=>/);
      if (firstBlockMatch) {
        console.log("Найден первый блок с ID:", firstBlockMatch[1], "на позиции:", firstBlockMatch.index);
      } else {
        console.warn("Не найден первый блок в словаре");
      }
      
      return processDictionaryContent(dictStartIndex, dictEndIndex, dictionaryContent, content, newBlocks, isDirectCall);
    } catch (e) {
      console.error("Ошибка при обработке файла:", e);
      showStatusMessage("Ошибка при обработке файла: " + e.message, true);
      return null;
    }
}

// Вспомогательная функция для обработки с использованием регулярных выражений
function processWithRegex(content, newBlocks, isDirectCall, dictStartPosition) {
    // Ищем конец словаря
    const alternativePatterns = [
      /}\s*# ENEMY_DESCRIPTION/i,
      /}\s*# End of ENEMY_DESCRIPTION/i,
      /}\s*#\s*ENEMY_DESCRIPTION/i,
      /}\s*#end/i,
      /}\s*#\s*end/i,
      /}\s*# dictionary end/i,
      /}\s*#/i,
      /}\s*$/m  // Просто закрывающая скобка в конце строки
    ];
    
    // Ищем первое вхождение любого из этих паттернов после dictStartPosition
    let bestMatch = null;
    let bestPosition = content.length;
    
    for (const pattern of alternativePatterns) {
      // Ограничиваем поиск областью после начала словаря
      const subContent = content.substring(dictStartPosition);
      const match = subContent.match(pattern);
      
      if (match && match.index < bestPosition) {
        bestMatch = match;
        bestPosition = match.index;
      }
    }
    
    if (bestMatch) {
      console.log("Найден конец словаря по паттерну на позиции:", dictStartPosition + bestPosition);
      
      // Вычисляем конец словаря
      const dictEndIndex = dictStartPosition + bestPosition + bestMatch[0].length;
      
      // Извлекаем содержимое словаря
      const dictionaryContent = content.substring(dictStartPosition, dictEndIndex);
      
      return processDictionaryContent(dictStartPosition, dictEndIndex, dictionaryContent, content, newBlocks, isDirectCall);
    }
    
    console.error("Не удалось найти конец словаря ни одним методом");
    showStatusMessage("Не найден конец словаря ENEMY_DESCRIPTION", true);
    return null;
}

// Выделяем общую логику обработки содержимого словаря
function processDictionaryContent(dictStartIndex, dictEndIndex, dictionaryContent, content, newBlocks, isDirectCall) {
    // Определяем формат окончания словаря
    let dictEndFormat = "} # ENEMY_DESCRIPTION"; // По умолчанию
    
    // Проверяем наличие ключевых слов для определения формата
    const hasEndKeyword = content.includes("end");
    const hasCommentMarker = content.includes("# ENEMY_DESCRIPTION");
    
    if (hasEndKeyword && !hasCommentMarker) {
      dictEndFormat = "}\nend"; // Тип 1: имеет end без комментария
    } else if (hasEndKeyword && hasCommentMarker) {
      // Найдем конец словаря и посмотрим, что идет дальше
      const endPart = content.substring(dictEndIndex - 20, dictEndIndex + 20);
      console.log("Анализируем окончание словаря:", endPart);
      
      if (endPart.includes("}\nend")) {
        dictEndFormat = "}\nend"; // Тип 2: закрывающая скобка и end на разных строках
      }
    }
    
    console.log("Будем использовать формат окончания словаря:", dictEndFormat);
  
    // Парсим блоки из словаря
    const blocks = parseLibraryBlocks(dictionaryContent);
    
    if (blocks.length === 0) {
      console.error("Не найдены блоки для обновления");
      showStatusMessage("Не найдены блоки для обновления", true);
      return null;
    }
    
    console.log(`Найдено ${blocks.length} блоков в оригинальном файле`);
    
    // Парсим новые блоки из textarea
    const newLines = newBlocks.split('\n');
    const newBlocksMap = {};
    
    let currentId = null;
    let currentBlock = [];
    
    // Обрабатываем новые блоки
    for (const line of newLines) {
      const idMatch = line.match(/^\s*(\d+)\s*=>/);
      
      if (idMatch) {
        // Если ранее был открыт блок, сохраняем его
        if (currentId !== null && currentBlock.length > 0) {
          newBlocksMap[currentId] = currentBlock.join('\n');
          currentBlock = [];
        }
        
        currentId = idMatch[1];
        currentBlock.push(line);
      } else if (currentId !== null) {
        currentBlock.push(line);
      }
    }
    
    // Сохраняем последний блок
    if (currentId !== null && currentBlock.length > 0) {
      newBlocksMap[currentId] = currentBlock.join('\n');
    }
    
    console.log(`Найдено ${Object.keys(newBlocksMap).length} новых блоков для обновления`);
    
    // Выводим найденные блоки для отладки
    for (const id in newBlocksMap) {
      console.log(`Блок ${id}, начало: ${newBlocksMap[id].substring(0, 50)}...`);
    }
    
    // Проверяем, есть ли блоки для обновления
    if (Object.keys(newBlocksMap).length === 0) {
      console.error("Не найдены новые блоки для обновления");
      showStatusMessage("Не найдены новые блоки для обновления", true);
      return null;
    }
    
    // Обновляем блоки в оригинальном файле
    let updatedContent = content.substring(0, dictStartIndex);
    updatedContent += "ENEMY_DESCRIPTION = {";
    
    let updatedCount = 0;
    
    for (const block of blocks) {
      // Проверяем, есть ли обновленный блок
      if (newBlocksMap[block.id]) {
        // Заменяем блок на новый
        updatedContent += "\n" + newBlocksMap[block.id];
        updatedCount++;
        console.log(`Обновлен блок с ID: ${block.id}`);
      } else {
        // Сохраняем оригинальный блок
        updatedContent += "\n" + block.content;
      }
    }
    
    // Добавляем конец словаря и оставшуюся часть файла
    // Используем определенный формат завершения словаря
    let remainingContent = "";
    if (dictEndFormat === "}\nend") {
      // Если формат с end, то нужно заменить всё до "end" включительно
      const endIndex = content.indexOf("end", dictEndIndex) + "end".length;
      remainingContent = content.substring(endIndex);
      updatedContent += "\n  " + dictEndFormat;
    } else {
      // Если формат с комментарием, то просто заменяем старый блок
      remainingContent = content.substring(dictEndIndex);
      updatedContent += "\n" + dictEndFormat;
    }
    
    updatedContent += remainingContent;
    
    console.log(`Обновлено ${updatedCount} блоков`);
    
    // Проверяем, вызван ли метод напрямую или из updateFileContent
    if (isDirectCall) {
      // Прямой вызов из кнопки "Обновить библиотеку"
      // Создаем новый файл с обновленным содержимым
      const blob = new Blob([updatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = 'updated_201_-_Library(Enemy).rb';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("Файл успешно обновлен и сохранен");
      showStatusMessage("Файл успешно обновлен и сохранен");
    }
    
    // Возвращаем обновленное содержимое для updateFileContent
    return updatedContent;
}