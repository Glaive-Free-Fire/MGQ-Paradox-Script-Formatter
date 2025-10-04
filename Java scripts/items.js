// items.js - Функции для обработки вкладки Items

/**
 * Главная функция обработки, которая и форматирует, и применяет ранги.
 * @param {string} text - Входной текст с блоками предметов.
 * @param {Object} rankMap - Карта рангов для применения, вида { "ID": "Rank" }.
 * @returns {string} - Отформатированный текст.
 */
function processAndRankItems(text, rankMap = {}) {
  // Разделяем весь текст на отдельные блоки по пустой строке
  const blocks = text.split(/\n\s*\n/);
  const resultBlocks = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    // Находим ID предмета в блоке
    let id = null;
    const itemLineMatch = block.match(/^Item\s+(\d+)/m);
    if (itemLineMatch) {
      id = itemLineMatch[1];
    }

    // ИСПРАВЛЕНИЕ: Проверяем, является ли предмет самоцветом, с помощью регулярного выражения,
    // которое распознает и русскую 'С', и английскую 'C'.
    const isGem = /Description = "\[[СC]амоцвет]/.test(block);
    const overrideRank = (id && rankMap[id]) ? rankMap[id] : null;

    const lines = block.split('\n');
    const newLines = [];

    for (const line of lines) {
      // Обрабатываем только строку с именем
      if (line.trim().startsWith('Name =')) {
        let nameMatch = line.match(/Name = "(.*)"/);
        let currentName = nameMatch ? nameMatch[1] : "";

        // Шаг 1: Всегда определяем "чистое" имя и первоначальный ранг.
        let baseName = currentName.replace(/\[[^\]]+\]$/, '').trim();
        let initialRank = null;
        const initialRankMatch = currentName.match(/\[(.+?)\]$/);
        if (initialRankMatch) {
          initialRank = initialRankMatch[1];
        }

        // Шаг 2: Определяем, какой ранг в итоге нужно применить.
        let rankToApply = null;

        if (isGem && overrideRank) {
          // Если это самоцвет и есть ранг из японского файла, он в приоритете.
          rankToApply = overrideRank;
        } else if (Object.keys(rankMap).length === 0 && initialRank) {
          // Если это первичная обработка (японский файл не загружен), используем исходный ранг.
          rankToApply = initialRank;
        }
        
        // Шаг 3: Собираем итоговую строку.
        if (rankToApply) {
          newLines.push(`Name = "${rankToApply}${baseName}"`);
        } else {
          // Если ранг применять не нужно, оставляем строку как есть.
          newLines.push(line);
        }

      } else {
        // Все остальные строки добавляем без изменений.
        newLines.push(line);
      }
    }
    resultBlocks.push(newLines.join('\n'));
  }

  return resultBlocks.join('\n\n');
}


/**
 * Первичная обработка, вызываемая при вводе текста.
 * Просто обертка для основной функции без карты рангов.
 * @param {string} text - Входной текст.
 * @returns {string} - Отформатированный текст.
 */
function processItemsText(text) {
  // Вызываем основную функцию без карты рангов для первоначального форматирования
  return processAndRankItems(text, {});
}


/**
 * Обработчик для кнопки "Сопоставить ранги".
 */
function handleJapaneseItemsFile() {
  const itemsFileInput = document.getElementById('items-file-input');
  const outputContentEl = document.getElementById('output-content');
  
  if (!itemsFileInput || !itemsFileInput.files[0]) {
    alert('Пожалуйста, загрузите японский файл Items.txt!');
    return;
  }

  // Важно: всегда используем оригинальный текст из левого окна как источник правды
  const inputText = document.getElementById('input-data').value;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const japaneseText = e.target.result;
      // Шаг 1: Парсим японский файл и создаем карту рангов
      const rankMap = parseJapaneseItems(japaneseText);

      // Шаг 2: Вызываем основную функцию обработки, передавая ей и текст, и карту рангов
      const updatedOutput = processAndRankItems(inputText, rankMap);

      // Шаг 3: Помещаем результат в окно вывода
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
 * (Эта функция остается без изменений)
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

  const sortedRankKeys = Object.keys(JAP_RANK_MAP).sort((a, b) => b.length - a.length);

  const idRankMap = {};
  const blocks = japaneseText.split(/^Item /m);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const idMatch = block.match(/^(\d+)/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const nameMatch = block.match(/Name = "([^"]+)"/);
    if (!nameMatch) continue;
    const japaneseName = nameMatch[1];

    for (const japRank of sortedRankKeys) {
      if (japaneseName.includes(japRank)) {
        idRankMap[id] = JAP_RANK_MAP[japRank];
        break;
      }
    }
  }
  return idRankMap;
}