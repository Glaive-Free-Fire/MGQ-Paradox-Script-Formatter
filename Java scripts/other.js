// other.js - Прочие скрипты, не относящиеся к определенным группам

/**
 * Переключение режима компиляции
 */
function toggleCompileMode() {
  const compileModeBtn = document.getElementById('compile-mode-btn');
  const copyBtn = document.getElementById('copy-btn');
  const compileBtn = document.getElementById('compile-btn');
  
  isCompileMode = !isCompileMode;
  
  if (isCompileMode) {
    // Включаем режим компиляции
    compileModeBtn.textContent = 'Стандартный режим';
    compileModeBtn.classList.add('active');
    copyBtn.style.display = 'none';
    compileBtn.style.display = 'block';
    
    // Показываем инструкцию
    showInstructions();
  } else {
    // Выключаем режим компиляции
    compileModeBtn.textContent = 'Режим прямой компиляции';
    compileModeBtn.classList.remove('active');
    copyBtn.style.display = 'block';
    compileBtn.style.display = 'none';
    
    // Скрываем инструкции
    hideInstructions();
  }
}

/**
 * Функция для отображения инструкций
 */
function showInstructions() {
  let instructionsDiv = document.getElementById('compile-instructions');
  if (!instructionsDiv) {
    instructionsDiv = document.createElement('div');
    instructionsDiv.id = 'compile-instructions';
    instructionsDiv.className = 'compile-instructions';
    instructionsDiv.innerHTML = `
      <h3>Инструкция по использованию режима прямой компиляции</h3>
      <ol start="1">
        <li>Выберите нужную вкладку и подготовьте данные в окне вывода</li>
        <li>Выберите оригинальный файл Ruby через поле загрузки ниже</li>
        <li>Нажмите "Компилировать данные", чтобы создать обновленную версию файла</li>
      </ol>
      <div id="file-input-container" style="margin-top: 15px;">
        <label for="input-file">Выбрать оригинальный файл для обновления:</label>
        <input type="file" id="input-file" accept=".rb" style="margin-top: 5px;">
      </div>
      <div id="download-container" style="margin-top: 15px; display: none;">
        <a id="download-link" href="#" download="" class="download-button">Скачать обновленный файл</a>
      </div>
    `;
    
    document.querySelector('.container').insertAdjacentElement('afterend', instructionsDiv);
    
    // Добавляем стили для инструкций
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .compile-instructions {
        margin: 20px auto;
        padding: 15px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f8f9fa;
        max-width: 800px;
      }
      .compile-instructions h3 {
        margin-top: 0;
        color: #2c3e50;
      }
      .compile-instructions ol {
        padding-left: 20px;
      }
      .compile-instructions li {
        margin-bottom: 8px;
      }
      .compile-instructions ul {
        margin-top: 5px;
      }
      .download-button {
        display: inline-block;
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        text-align: center;
      }
      .download-button:hover {
        background-color: #388E3C;
      }
      #download-container {
        text-align: center;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Добавляем обработчик события для выбора файла
    const fileInput = document.getElementById('input-file');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelection);
    }
  } else {
    instructionsDiv.style.display = 'block';
  }
}

/**
 * Функция для скрытия инструкций
 */
function hideInstructions() {
  const instructionsDiv = document.getElementById('compile-instructions');
  if (instructionsDiv) {
    instructionsDiv.style.display = 'none';
  }
}

/**
 * Обработчик выбора файла
 * @param {Event} event - Событие выбора файла
 */
function handleFileSelection(event) {
  const fileInput = event.target;
  const currentFileName = FILE_NAMES[currentTab];
  
  if (fileInput.files.length === 0) {
    return;
  }
  
  const selectedFile = fileInput.files[0];
  
  // Проверяем имя файла
  if (selectedFile.name !== currentFileName) {
    showStatusMessage(`Выбран файл ${selectedFile.name}, но для текущей вкладки ожидается ${currentFileName}. Файл будет обработан, но убедитесь, что вы выбрали правильный файл.`, true);
  }
  
  // Читаем содержимое файла
  const reader = new FileReader();
  reader.onload = function(e) {
    const fileContent = e.target.result;
    
    // Сохраняем содержимое файла в глобальную переменную для последующего использования
    window.lastSelectedFileContent = fileContent;
    window.lastSelectedFileName = selectedFile.name;
    
    // Показываем сообщение, что файл загружен и готов к обработке
    showStatusMessage(`Файл ${selectedFile.name} загружен и готов к обработке. Нажмите "Компилировать данные", чтобы обновить блоки.`);
  };
  reader.onerror = function() {
    showStatusMessage('Ошибка при чтении файла', true);
  };
  reader.readAsText(selectedFile);
}

/**
 * Функция для отображения опции использования BAT-файла
 */
function showBatchFileOption() {
  let batchInfoDiv = document.getElementById('batch-file-option');
  if (!batchInfoDiv) {
    batchInfoDiv = document.createElement('div');
    batchInfoDiv.id = 'batch-file-option';
    batchInfoDiv.className = 'batch-file-option';
    batchInfoDiv.innerHTML = `
      <h3>Использование локального редактирования файлов</h3>
      <p>Для работы с файлами вы можете:</p>
      <ol>
        <li>Скачать и запустить BAT-файл, который создаст необходимую структуру папок</li>
        <li>Поместить файлы Ruby в созданную папку Decompiled</li>
        <li>Экспортировать текущие данные и использовать их для обновления файлов</li>
      </ol>
      <div class="batch-actions">
        <button id="generate-batch-btn" class="batch-btn">Сгенерировать BAT-файл</button>
        <button id="export-data-btn" class="batch-btn">Экспортировать данные</button>
      </div>
    `;
    
    document.querySelector('.container').insertAdjacentElement('afterend', batchInfoDiv);
    
    // Добавляем стили для нового раздела
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .batch-file-option {
        margin: 20px auto;
        padding: 15px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f8f9fa;
        max-width: 800px;
      }
      .batch-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      .batch-btn {
        padding: 8px 16px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      .batch-btn:hover {
        background-color: #388E3C;
      }
    `;
    document.head.appendChild(styleElement);
    
    // Добавляем обработчики событий
    document.getElementById('generate-batch-btn').addEventListener('click', generateBatchFile);
    document.getElementById('export-data-btn').addEventListener('click', exportCurrentData);
  } else {
    batchInfoDiv.style.display = 'block';
  }
}

/**
 * Функция для скрытия опции использования BAT-файла
 */
function hideBatchFileOption() {
  const batchInfoDiv = document.getElementById('batch-file-option');
  if (batchInfoDiv) {
    batchInfoDiv.style.display = 'none';
  }
}

/**
 * Функция для генерации BAT-файла
 */
function generateBatchFile() {
  // Содержимое BAT-файла
  const batchContent = `@echo off
echo ==============================================
echo Создание структуры папок и файлов для RB_Script
echo ==============================================

:: Проверяем и создаем папку Decompiled
if not exist "Decompiled" (
  echo Создаем папку Decompiled...
  mkdir "Decompiled"
) else (
  echo Папка Decompiled уже существует.
)

echo.
echo Папка Decompiled создана/проверена.
echo.
echo Следующие шаги:
echo 1. Скопируйте файлы "201 - Library(Enemy).rb", "197 - JobChange.rb" и "204 - Library(Medal).rb" в папку Decompiled
echo 2. В браузере экспортируйте данные для обновления файлов
echo 3. Используйте экспортированные данные для модификации файлов
echo.
echo Нажмите любую клавишу для завершения...
pause > nul
`;

  // Создаем ссылку для скачивания
  const blob = new Blob([batchContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'setup_rb_script_folders.bat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showStatusMessage('BAT-файл успешно сгенерирован и скачан');
}

/**
 * Функция для экспорта текущих данных
 */
function exportCurrentData() {
  try {
    // Получаем текущие данные из вывода
    const outputContent = document.getElementById('output-content').textContent;
    if (!outputContent.trim()) {
      showStatusMessage('Нет данных для экспорта', true);
      return;
    }
    
    // Определяем имя файла в зависимости от вкладки
    let fileName;
    switch (currentTab) {
      case 'library':
        fileName = 'library_enemy_data.txt';
        break;
      case 'jobchange':
        fileName = 'jobchange_data.txt';
        break;
      case 'medal':
        fileName = 'medal_data.txt';
        break;
      default:
        fileName = 'exported_data.txt';
    }
    
    // Создаем инструкцию по использованию
    const instruction = `# Данные для обновления файла ${FILE_NAMES[currentTab]}
# Скопируйте эти данные и замените соответствующие блоки в файле вручную
# -----------------------------------------------------------------------

`;
    const contentWithInstruction = instruction + outputContent;
    
    // Создаем ссылку для скачивания
    const blob = new Blob([contentWithInstruction], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatusMessage('Данные успешно экспортированы');
  } catch (e) {
    console.error('Ошибка при экспорте данных:', e);
    showStatusMessage('Ошибка при экспорте данных: ' + e.message, true);
  }
}

/**
 * Функция для отображения сообщения состояния
 * @param {string} message - Текст сообщения
 * @param {boolean} isError - Флаг ошибки
 */
function showStatusMessage(message, isError = false) {
  const statusDiv = document.getElementById('status-message') || document.createElement('div');
  
  if (!document.getElementById('status-message')) {
    statusDiv.id = 'status-message';
    document.querySelector('.controls').appendChild(statusDiv);
  }
  
  statusDiv.textContent = message;
  statusDiv.className = isError ? 'error' : 'success';
  statusDiv.style.display = 'block';
  
  // Очищаем предыдущий таймер, если он есть
  if (statusDiv.timerID) {
    clearTimeout(statusDiv.timerID);
  }
  
  // Автоматически скрыть сообщение через 5 секунд, но только если это не ошибка
  if (!isError) {
    statusDiv.timerID = setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

/**
 * Функция для компиляции данных
 */
function compileData() {
  Logger.info('other', 'Начало компиляции данных', { currentTab });
  
  try {
    // Получаем содержимое файла
    const fileContent = window.lastSelectedFileContent;
    if (!fileContent) {
      Logger.warn('other', 'Файл не выбран для компиляции');
      showStatusMessage('Сначала выберите файл для компиляции', true);
      return;
    }
    
    // Получаем данные из окна вывода
    const outputContent = document.getElementById('output-content').textContent;
    if (!outputContent.trim()) {
      Logger.warn('other', 'Нет данных для обновления файла');
      showStatusMessage('Нет данных для обновления файла', true);
      return;
    }
    
    // Разбиваем содержимое окна вывода на блоки
    let newBlocks;
    if (currentTab === "follower") {
      newBlocks = outputContent.split(/\n\n/).filter(block => block.trim());
    } else {
      newBlocks = outputContent.split(/\n\n/).filter(block => block.trim());
    }
    
    Logger.debug('other', 'Подготовка блоков для компиляции', {
      blockCount: newBlocks.length,
      firstBlock: newBlocks[0]?.substring(0, 100) + '...'
    });
    
    // Обновляем содержимое файла
    const newContent = updateFileContent(fileContent, newBlocks, true);
    if (!newContent) {
      Logger.error('other', 'Не удалось обновить файл');
      showStatusMessage('Не удалось обновить файл', true);
      return;
    }
    
    Logger.info('other', 'Компиляция данных успешно завершена');
    
  } catch (e) {
    Logger.error('other', 'Ошибка при компиляции данных', e);
    showStatusMessage(`Ошибка при компиляции данных: ${e.message}`, true);
  }
}

/**
 * Функция для обновления содержимого файла
 * @param {string} content - Исходное содержимое файла
 * @param {Array} newBlocks - Новые блоки данных
 * @param {boolean} isDirectCall - Флаг прямого вызова
 * @returns {string} - Обновленное содержимое файла
 */
function updateFileContent(content, newBlocks, isDirectCall = false) {
  Logger.info('other', 'Начало обновления содержимого файла', { 
    currentTab,
    blockCount: newBlocks.length,
    isDirectCall 
  });
  
  try {
    let newContent = '';
    let updatedCount = 0;
    
    // Определяем тип файла и формат
    let fileType = '';
    let fileStartFormat = '';
    let fileEndFormat = '';
    
    if (currentTab === "library") {
      fileType = "library";
      fileStartFormat = "module NWConst::Enemy\n  ENEMY = {\n";
      fileEndFormat = "  }\nend\n";
    } else if (currentTab === "jobchange") {
      fileType = "jobchange";
      fileStartFormat = "module NWConst::JobChange\n  JOB_CHANGE = {\n";
      fileEndFormat = "  }\nend\n";
    } else if (currentTab === "medal") {
      fileType = "medal";
      fileStartFormat = "module NWConst::Medal\n  MEDAL = {\n";
      fileEndFormat = "  }\nend\n";
    } else if (currentTab === "follower") {
      fileType = "follower";
      fileStartFormat = ""; // Не добавляем начало файла для Follower
      fileEndFormat = ""; // Не добавляем конец файла для Follower
    } else {
      Logger.error('other', 'Неподдерживаемая вкладка для компиляции', { currentTab });
      throw new Error("Неподдерживаемая вкладка для компиляции");
    }
    
    Logger.debug('other', 'Параметры форматирования файла', {
      fileType,
      hasStartFormat: !!fileStartFormat,
      hasEndFormat: !!fileEndFormat
    });
    
    // Добавляем начало файла только если это не вкладка Follower
    if (currentTab !== "follower") {
      newContent += fileStartFormat;
    }
    
    // Создаем карту новых блоков для быстрого доступа
    const newBlocksMap = {};
    newBlocks.forEach(block => {
      const idMatch = block.match(/^\s*(\d+)\s*=>/);
      if (idMatch) {
        newBlocksMap[idMatch[1]] = block;
      }
    });
    
    Logger.debug('other', 'Создана карта блоков', {
      blockCount: Object.keys(newBlocksMap).length
    });
    
    // Разбиваем содержимое на строки
    const lines = content.split('\n');
    let result = [];
    let currentBlock = [];
    let currentBlockId = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Пропускаем начало и конец файла
      if ((fileStartFormat && trimmedLine === fileStartFormat.trim()) || 
          (fileEndFormat && trimmedLine === fileEndFormat.trim())) {
        continue;
      }
      
      // Проверяем, является ли строка началом блока
      const blockStartMatch = trimmedLine.match(/^\s*(\d+)\s*=>/);
      
      if (blockStartMatch) {
        // Если у нас уже есть блок, добавляем его в результат
        if (currentBlock.length > 0) {
          result.push(...currentBlock);
          currentBlock = [];
        }
        
        currentBlockId = blockStartMatch[1];
        currentBlock.push(line);
      } else if (currentBlockId) {
        // Если мы внутри блока
        currentBlock.push(line);
        
        // Проверяем, является ли эта строка концом блока
        if (trimmedLine === "}," || trimmedLine === "}") {
          // Если есть обновленная версия блока, используем её
          if (newBlocksMap[currentBlockId]) {
            result.push(newBlocksMap[currentBlockId]);
            updatedCount++;
            Logger.debug('other', 'Блок обновлен', { blockId: currentBlockId });
          } else {
            result.push(...currentBlock);
          }
          currentBlock = [];
          currentBlockId = null;
        }
      } else {
        // Если мы не внутри блока
        result.push(line);
      }
    }
    
    // Добавляем последний блок, если он есть
    if (currentBlock.length > 0) {
      if (currentBlockId && newBlocksMap[currentBlockId]) {
        result.push(newBlocksMap[currentBlockId]);
        updatedCount++;
        Logger.debug('other', 'Последний блок обновлен', { blockId: currentBlockId });
      } else {
        result.push(...currentBlock);
      }
    }
    
    // Собираем финальный результат
    newContent += '\n' + result.join('\n');
    
    // Добавляем окончание файла только если это не вкладка Follower
    if (currentTab !== "follower" && fileEndFormat) {
      newContent += fileEndFormat;
    }
    
    // Удаляем пустые строки между блоками
    newContent = removeEmptyLinesBetweenBlocks(newContent);
    
    Logger.info('other', 'Обновление файла завершено', { 
      updatedBlocks: updatedCount,
      totalBlocks: Object.keys(newBlocksMap).length
    });
    
    // Проверяем, вызван ли метод напрямую
    if (isDirectCall) {
      // Создаем новый файл с обновленным содержимым
      const blob = new Blob([newContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = `updated_${FILE_NAMES[currentTab]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      Logger.info('other', 'Файл успешно сохранен', { 
        fileName: `updated_${FILE_NAMES[currentTab]}`
      });
      showStatusMessage("Файл успешно обновлен и сохранен");
    }
    
    return newContent;
  } catch (e) {
    Logger.error('other', 'Ошибка при обновлении файла', e);
    showStatusMessage('Ошибка при обновлении файла', true);
    return null;
  }
}

/**
 * Удаляет пустые строки между блоками
 * @param {string} content - Исходное содержимое
 * @returns {string} - Содержимое без пустых строк между блоками
 */
function removeEmptyLinesBetweenBlocks(content) {
  // Разбиваем содержимое на строки
  let lines = content.split('\n');
  let result = [];
  let lastNonEmptyLine = '';
  let blockStartPattern = /^\s*\d+\s*=>/;
  let blockEndPattern = /\]\],\s*$/;
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trimRight(); // Убираем пробелы справа
    
    // Пропускаем пустые строки между блоками
    if (currentLine.trim() === '') {
      // Проверяем, находимся ли мы между блоками
      if (lastNonEmptyLine.match(blockEndPattern)) {
        // Ищем следующую непустую строку
        let nextNonEmptyLine = '';
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].trim() !== '') {
            nextNonEmptyLine = lines[j].trim();
            break;
          }
        }
        // Если следующая непустая строка начинает новый блок, пропускаем текущую пустую строку
        if (nextNonEmptyLine.match(blockStartPattern)) {
          continue;
        }
      }
    }
    
    // Сохраняем последнюю непустую строку
    if (currentLine.trim() !== '') {
      lastNonEmptyLine = currentLine;
    }
    
    // Добавляем строку в результат
    result.push(currentLine);
  }
  
  // Удаляем возможные пустые строки в конце файла перед закрывающей скобкой
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }
  
  // Собираем результат с правильными переносами строк
  return result.join('\n');
}