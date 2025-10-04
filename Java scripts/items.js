// items.js - Функции для обработки вкладки Items

/**
 * Первичная обработка текста из левого окна.
 * Переносит ранг из конца названия в начало.
 * @param {string} text - Входной текст с блоками предметов.
 * @returns {string} - Отформатированный текст.
 */
function processItemsText(text) {
  // Разделяем весь текст на отдельные блоки по пустой строке
  const blocks = text.split(/\n\s*\n/);
  const resultBlocks = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split('\n');
    const newLines = [];

    for (const line of lines) {
      // Ищем строку с именем
      if (line.trim().startsWith('Name =')) {
        // Используем регулярное выражение для поиска названия и ранга в скобках
        // Обновлено, чтобы поддерживать ★ в рангах
        const nameMatch = line.match(/Name = "(.+?)\[(.+?)\]"/);
        if (nameMatch) {
          const name = nameMatch[1].trim(); // "Истребление Полулюдей"
          const rank = nameMatch[2];       // "★1" или "B"

          // Формируем новую строку
          newLines.push(`Name = "[${rank}]${name}"`);
        } else {
          // Если формат не совпал, оставляем строку как есть
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    resultBlocks.push(newLines.join('\n'));
  }

  return resultBlocks.join('\n\n');
}

/**
 * Обработчик для кнопки "Сопоставить ранги".
 * Запускает процесс чтения и сопоставления рангов из японского файла.
 */
function handleJapaneseItemsFile() {
  const itemsFileInput = document.getElementById('items-file-input');
  const outputContentEl = document.getElementById('output-content');
  
  if (!itemsFileInput || !itemsFileInput.files[0]) {
    alert('Пожалуйста, загрузите японский файл Items.txt!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const japaneseText = e.target.result;
      // Шаг 1: Парсим японский файл и создаем карту рангов {id: rank}
      const rankMap = parseJapaneseItems(japaneseText);

      // Шаг 2: Берем текущий текст из окна вывода
      const currentOutput = outputContentEl.textContent;

      // Шаг 3: Обновляем ранги в тексте из окна вывода
      const updatedOutput = updateRanksInOutput(currentOutput, rankMap);

      // Шаг 4: Помещаем результат обратно в окно вывода
      outputContentEl.textContent = updatedOutput;

      alert('Ранги успешно сопоставлены и обновлены!');
    } catch (err) {
      console.error("Ошибка при обработке файла Items:", err);
      alert('Произошла ошибка: ' + err.message);
    }
  };
  
  reader.onerror = function() {
    alert('Ошибка при чтении файла!');
  };
  
  reader.readAsText(itemsFileInput.files[0], 'UTF-8');
}

/**
 * Парсит японский файл Items.txt для извлечения ID и рангов.
 * @param {string} japaneseText - Содержимое японского файла.
 * @returns {Object} - Карта вида { "ID": "Rank" }, например, { "2197": "★1" }.
 */
function parseJapaneseItems(japaneseText) {
  // ОБНОВЛЕНИЕ: Новая, более совершенная система ранжирования
  const JAP_RANK_MAP = {
    '秘石': '★1',
    '大秘石': '★2',
    '超秘石': '★3',
    '絶秘石': '★4',
    '極秘石': '★5',
    '神秘石': '★6',
    '無限秘石': '★7',
    '究極秘石': '★8',
    '混沌秘石': '★9',
    '最終秘石': '★10'
  };

  // Создаем отсортированный список ключей для проверки, от самого длинного к самому короткому.
  // Это гарантирует, что мы сначала проверим "大秘石", а не его короткую часть "秘石".
  const sortedRankKeys = Object.keys(JAP_RANK_MAP).sort((a, b) => b.length - a.length);

  const idRankMap = {};
  const blocks = japaneseText.split(/^Item /m);

  for (const block of blocks) {
    if (!block.trim()) continue;

    // Извлекаем ID
    const idMatch = block.match(/^(\d+)/);
    if (!idMatch) continue;
    const id = idMatch[1];

    // Извлекаем имя
    const nameMatch = block.match(/Name = "([^"]+)"/);
    if (!nameMatch) continue;
    const japaneseName = nameMatch[1];

    // Итерируем по отсортированному массиву ключей.
    for (const japRank of sortedRankKeys) {
      if (japaneseName.includes(japRank)) {
        idRankMap[id] = JAP_RANK_MAP[japRank];
        break; // Нашли самый точный ранг, можно переходить к следующему блоку.
      }
    }
  }
  return idRankMap;
}

/**
 * Обновляет ранги в русском тексте на основе карты рангов.
 * @param {string} currentOutput - Текст из окна вывода.
 * @param {Object} rankMap - Карта рангов, полученная из японского файла.
 * @returns {string} - Текст с обновленными рангами.
 */
function updateRanksInOutput(currentOutput, rankMap) {
  const blocks = currentOutput.split(/^Item /m);
  const resultBlocks = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const idMatch = block.match(/^(\d+)/);
    if (!idMatch) {
      resultBlocks.push('Item ' + block);
      continue;
    }
    const id = idMatch[1];

    // Проверяем, есть ли для этого ID новый ранг
    if (rankMap[id]) {
      const newRank = rankMap[id];
      // Заменяем существующий ранг на новый
      // Регулярное выражение ищет `Name = "[любой_ранг]"` и заменяет его
      const updatedBlock = block.replace(/(Name = ")\[[^\]]+\]/, `$1[${newRank}]`);
      resultBlocks.push('Item ' + updatedBlock);
    } else {
      // Если нового ранга нет, оставляем блок без изменений
      resultBlocks.push('Item ' + block);
    }
  }

  // Собираем текст обратно, удаляя лишние пустые строки в начале
  return resultBlocks.join('').trim();
}