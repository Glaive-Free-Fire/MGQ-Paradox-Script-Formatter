// Функции для обработки вкладки JobChange
// Функция для определения наличия широких пробелов
function hasWideSpaces(text) {
  return text.includes('　');
}

// Улучшенная функция разделения с сохранением широких пробелов
function splitByWideSpaces(text) {
  if (!text) return [];
  
  const segments = [];
  let currentItem = '';
  
  // Обработка крайнего случая, когда текст начинается с широкого пробела
  if (text.startsWith('　')) {
    text = text.substring(1);
  }
  
  // Обработка каждого символа
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (char === '　') {
      // Найден широкий пробел
      if (currentItem.trim()) {
        segments.push(currentItem.trim());
      }
      currentItem = '';
    } else {
      // Обычный символ
      currentItem += char;
    }
  }
  
  // Добавление последнего элемента, если он есть
  if (currentItem.trim()) {
    segments.push(currentItem.trim());
  }
  
  return segments;
}

// Единая функция форматирования для оборудования и навыков
function formatWithWideSpaces(categoryName, inputLines, maxLineLength) {
  const result = [];
  
  // Step 1: Extract raw content (removing category prefix)
  let rawContent = "";
  inputLines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) return;
    
    let content = line.trim();
    
    // First line usually contains the category name - remove it
    if (index === 0) {
      // Remove category prefix with multiple colon types
      content = content.replace(new RegExp(`^${categoryName.replace(":", "")}[：:]\\s*`), "");
    }
    
    // Add space between lines for normal processing
    rawContent += (index > 0 && !content.startsWith('　') ? " " : "") + content;
  });
  
  // Step 2: Properly parse items preserving wide spaces
  let items = [];
  
  if (hasWideSpaces(rawContent)) {
    // Wide spaces found - split accordingly
    items = splitByWideSpaces(rawContent);
  } else {
    // Fallback to regular space splitting
    items = rawContent.split(/\s+/).filter(item => item.trim());
  }
  
  // Step 3: Format with line length constraints
  // Убираем двоеточие из categoryName, так как оно уже есть в исходном тексте
  let currentLine = `${categoryName.replace(":", "")}: `;
  let firstItem = true;
  
  items.forEach(item => {
    // Skip empty items
    if (!item || !item.trim()) return;
    
    const itemText = item.trim();
    
    if (firstItem) {
      // First item always goes on the first line
      currentLine += itemText;
      firstItem = false;
    } else if ((currentLine.length + 1 + itemText.length + 1) <= maxLineLength) {
      // Item fits on the current line - add with wide space
      currentLine += `　${itemText}`;
    } else {
      // Start a new line
      result.push(currentLine);
      currentLine = itemText;
    }
  });
  
  // Add the final line if not empty
  if (currentLine && currentLine !== `${categoryName}: `) {
    result.push(currentLine);
  }
  
  // Special case for empty content
  if (result.length === 0 && categoryName === "Способности:") {
    result.push(`${categoryName} Нет`);
  }
  
  return result;
}

function processJobChangeText(text) {
    try {
      // Parse input into blocks
      let lines = text.split('\n');
      let blocks = [];
      let currentBlock = null;
      let currentSection = 'description'; // Отслеживаем текущую секцию

      for (let line of lines) {
        if (line.trim().match(/^\d+\s*#/)) {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = { 
            header: line.trim(), 
            description: [],
            equipment: [],
            skills: [],
            abilities: []
          };
          currentSection = 'description'; // Сбрасываем секцию для нового блока
        } else if (currentBlock) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Парсер, который теперь работает корректно
          if (trimmedLine.match(/^\s*Экипировка[：:]/i) || trimmedLine.match(/^\s*装備武器[：:]/i)) {
            currentSection = 'equipment';
            currentBlock.equipment.push(trimmedLine);
          } else if (trimmedLine.match(/^\s*Навыки[：:]/i) || trimmedLine.match(/^\s*スキル[：:]/i)) {
            currentSection = 'skills';
            currentBlock.skills.push(trimmedLine);
          } else if (trimmedLine.match(/^\s*(Способность|Способности|アビリティ)[：:]/i)) {
            currentSection = 'abilities';
            currentBlock.abilities.push(trimmedLine);
          } else {
            // Добавляем строку в текущую активную секцию
            switch (currentSection) {
              case 'equipment':
                currentBlock.equipment.push(trimmedLine);
                break;
              case 'skills':
                currentBlock.skills.push(trimmedLine);
                break;
              case 'abilities':
                currentBlock.abilities.push(trimmedLine);
                break;
              default: // 'description'
                currentBlock.description.push(trimmedLine);
                break;
            }
          }
        }
      }
      
      if (currentBlock) blocks.push(currentBlock);
      
      let result = "";
      blocks.forEach(block => {
        // Skip blocks without matching language characters if needed
        let blockText = block.header + "\n" + 
                       block.description.join("\n") + "\n" +
                       block.equipment.join("\n") + "\n" +
                       block.skills.join("\n") + "\n" +
                       block.abilities.join("\n");
                       
        if (currentMode === "RUS" && !/[А-Яа-яЁё]/.test(blockText)) return;
        if (currentMode === "JAP" && !/[\u3040-\u30FF\u4E00-\u9FBF]/.test(blockText)) return;
        
        // Extract ID and title
        let headerParts = block.header.split('#');
        let id = headerParts[0].trim();
        let title = headerParts.length > 1 ? '# ' + headerParts[1].trim() : '';
        
        // Format description
        let formattedDescription = [];
        if (block.description.length > 0) {
          let descText = block.description.join(' ');
          formattedDescription = wrapTextJobChange(descText, 
                                          currentTab === "jobchange" ? maxLineLengthJobChangeVar : getCurrentMaxLineLength(), 
                                          currentMode);
        }
        
        const maxLen = currentTab === "jobchange" ? maxLineLengthJobChangeVar : getCurrentMaxLineLength();
        
        // --- ИСПРАВЛЕНИЕ ДЛЯ ЯПОНСКИХ ЗАГОЛОВКОВ ---

        // 1. Динамически определяем заголовок для Экипировки
        let equipmentCategoryName = "Экипировка:"; 
        if (block.equipment.length > 0) {
            const match = block.equipment[0].match(/^\s*([^：:]+[：:])/);
            if (match) equipmentCategoryName = match[1];
        }

        // 2. Динамически определяем заголовок для Навыков
        let skillsCategoryName = "Навыки:";
        if (block.skills.length > 0) {
            const match = block.skills[0].match(/^\s*([^：:]+[：:])/);
            if (match) skillsCategoryName = match[1];
        }

        // 3. Динамически определяем заголовок для Способностей
        let abilitiesCategoryName = "Способности:";
        if (block.abilities.length > 0) {
            const match = block.abilities[0].match(/^\s*([^：:]+[：:])/);
            if (match) abilitiesCategoryName = match[1];
        }

        // 4. Передаем в функцию ПРАВИЛЬНЫЕ заголовки
        let formattedEquipment = formatWithWideSpaces(equipmentCategoryName, block.equipment, maxLen);
        let formattedSkills = formatWithWideSpaces(skillsCategoryName, block.skills, maxLen);
        let formattedAbilities = formatWithWideSpaces(abilitiesCategoryName, block.abilities, maxLen);
        
        // Build result with proper indentation
        result += `    ${id} => ${title}\n      [[\n`;
        
        // Description section
        formattedDescription.forEach(line => {
          result += `        "${escapeQuotes(line)}",\n`;
        });
        
        // Section separator
        result += `    ],\n    [\n`;
        
        // Equipment, skills and abilities sections
        formattedEquipment.forEach(line => {
          result += `        "${escapeQuotes(line)}",\n`;
        });
        
        formattedSkills.forEach(line => {
          result += `        "${escapeQuotes(line)}",\n`;
        });
        
        formattedAbilities.forEach(line => {
          result += `        "${escapeQuotes(line)}",\n`;
        });
        
        // Добавляем пустую строку после всех секций
        result += `        "",\n`;
        
        result += `      ]],\n`;
      });
      
      return result;
    } catch (e) {
      console.error("Error in processJobChangeText:", e);
      return "Error processing text: " + e.message;
    }
}

// Функция для обработки категорий с японским стилем
function formatCategoryWithJapaneseStyle(lines, maxLineLength) {
    try {
      if (!lines || lines.length === 0) return [];
      
      // Determine the category from the first line
      const firstLine = lines[0].trim();
      
      // Check for both types of colons in category headers
      let categoryMatch = firstLine.match(/^(Экипировка|Навыки|Способности|Способность)[：:]/);
      
      if (!categoryMatch) return []; // No category found
      
      let categoryName = categoryMatch[1];
      // Не нормализуем "Способность" к "Способности", сохраняем оригинальное название
      
      // Detect if the input already has the category name with either colon style
      const hasDuplicateCategory = firstLine.indexOf(categoryName + ":") === 0 || 
                                 firstLine.indexOf(categoryName + "：") === 0;
      
      // Process based on category type
      if (categoryName === "Экипировка") {
        return formatEquipment(categoryName, lines, maxLineLength, hasDuplicateCategory);
      } 
      else if (categoryName === "Навыки") {
        return formatSkills(categoryName, lines, maxLineLength, hasDuplicateCategory);
      }
      else if (categoryName === "Способности" || categoryName === "Способность") {
        return formatAbilities(categoryName, lines, maxLineLength, hasDuplicateCategory);
      }
      
      return []; // Fallback
    } catch (e) {
      console.error("Error in formatCategoryWithJapaneseStyle:", e);
      return ["Error processing category: " + e.message];
    }
}

// Форматирование оборудования
function formatEquipment(categoryName, lines, maxLineLength, hasDuplicateCategory) {
    const indent = "			   "; // Standard indentation
    let result = [];
    
    // Collect all equipment text
    let fullText = "";
    
    lines.forEach((line, index) => {
      let content = line.trim();
      if (index === 0) {
        // Remove the category prefix from the first line
        content = content.replace(/^(Экипировка[：:])\s*/, "");
      }
      fullText += " " + content;
    });
    
    // Split by wide spaces correctly
    let items = [];
    if (fullText.includes('　')) {
      // Use wide spaces as delimiters
      const parts = fullText.split('　');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].trim()) {
          items.push(parts[i].trim());
        }
      }
    } else {
      // Fallback to regular spaces
      items = fullText.split(' ').filter(Boolean);
    }
    
    if (items.length === 0) return [];
    
    // Process items
    // Убираем двоеточие из categoryName, так как оно уже есть в исходном тексте
    let currentLine = categoryName.replace(":", "") + ": " + items[0];
    
    for (let i = 1; i < items.length; i++) {
      // Check if adding this item would exceed the line length
      if ((currentLine.length + 1 + items[i].length + 1) <= maxLineLength) {
        currentLine += "　" + items[i];
      } else {
        result.push(currentLine);
        currentLine = indent + items[i];
      }
    }
    
    // Add the last line
    if (currentLine && currentLine !== (categoryName + ": ")) {
      result.push(currentLine);
    }
    
    return result;
}

// Форматирование навыков
function formatSkills(categoryName, lines, maxLineLength, hasDuplicateCategory) {
    const indent = "			   "; // Standard indentation
    let result = [];
    
    // Collect all skill text
    let fullText = "";
    
    lines.forEach((line, index) => {
      let content = line.trim();
      if (index === 0) {
        // Remove the category prefix from the first line
        content = content.replace(/^(Навыки[：:])\s*/, "");
      }
      fullText += " " + content;
    });
    
    // Extract skills by preserving the original wide spaces
    let skillItems = [];
    
    // Check if the text contains wide spaces
    if (fullText.includes('　')) {
      // Extract original wide-space separated items
      const segmentsByWideSpace = fullText.split('　');
      
      for (let i = 0; i < segmentsByWideSpace.length; i++) {
        const segment = segmentsByWideSpace[i].trim();
        if (segment) {
          skillItems.push(segment);
        }
      }
    } else {
      // Fallback to space splitting
      skillItems = fullText.split(' ').filter(Boolean);
    }
    
    // Process skill items
    // Убираем двоеточие из categoryName, так как оно уже есть в исходном тексте
    let currentLine = categoryName.replace(":", "") + ": " + skillItems[0];
    
    for (let i = 1; i < skillItems.length; i++) {
      if ((currentLine.length + 1 + skillItems[i].length + 1) <= maxLineLength) {
        // Add a wide space between skills
        currentLine += "　" + skillItems[i];
      } else {
        result.push(currentLine);
        currentLine = indent + skillItems[i];
      }
    }
    
    // Add the last line
    if (currentLine && currentLine !== (categoryName + ": ")) {
      result.push(currentLine);
    }
    
    return result;
}

// Функция для форматирования блока способностей
function formatAbilities(categoryName, lines, maxLineLength, hasDuplicateCategory) {
    const indent = "			   "; // Standard indentation
    let result = [];
    
    // Определяем правильное название раздела из исходного текста
    if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const abilityMatch = firstLine.match(/^(Способности?)[：:]/);
        if (abilityMatch) {
            categoryName = abilityMatch[1] + ":";
        }
    }
    
    // Collect all skill text
    let fullText = "";
    
    lines.forEach((line, index) => {
      let content = line.trim();
      if (index === 0) {
        // Remove the category prefix from the first line
        content = content.replace(/^(Способности?[：:])\s*/, "");
      }
      // Add a space between lines to ensure proper separation
      fullText += (index > 0 ? " " : "") + content;
    });
    
    // Clean up the text
    fullText = fullText.trim();
    
    // Properly split abilities by wide spaces
    let abilities = [];
    if (fullText.includes('　')) {
      // Split by wide spaces first
      const wideSpaceSplit = fullText.split('　');
      
      for (let part of wideSpaceSplit) {
        if (part.trim()) {
          abilities.push(part.trim());
        }
      }
    } else {
      // Look for ability patterns: percentages, effects, etc.
      // Split by logical breaks and patterns
      abilities = fullText.split(/\s+(?=[А-Я])/).filter(a => a.trim().length > 0);
      
      // If no clear separations found, treat as a single ability
      if (abilities.length === 0) {
        abilities = [fullText];
      }
    }
    
    // Remove any empty abilities
    abilities = abilities.filter(ability => ability && ability.trim().length > 0);
    
    // Start with category name
    // Убираем двоеточие из categoryName, так как оно уже есть в исходном тексте
    let currentLine = categoryName.replace(":", "") + ": ";
    let firstAbility = true;
    
    // Process each ability using the line length limit
    for (let i = 0; i < abilities.length; i++) {
      const ability = abilities[i].trim();
      
      // Skip empty abilities
      if (!ability) continue;
      
      // Check if we can add this ability to the current line
      if (firstAbility) {
        // First ability always goes on the first line
        currentLine += ability;
        firstAbility = false;
      } else if ((currentLine.length + 1 + ability.length) <= maxLineLength) {
        // Add ability with proper separator
        currentLine += "　" + ability;
      } else {
        // Line is full, add it to result and start a new line
        result.push(currentLine);
        currentLine = indent + ability;
      }
    }
    
    // Add the last line if it has content
    if (currentLine && currentLine !== (categoryName.replace(":", "") + ": ")) {
      result.push(currentLine);
    } else if (abilities.length === 0 && currentLine === (categoryName.replace(":", "") + ": ")) {
      // If we have no abilities, add "Нет" for "None"
      result.push(categoryName.replace(":", "") + ": Нет");
    }
    
    return result;
}



// Парсинг блоков JobChange
function parseJobChangeBlocks(content) {
    const blocks = [];
    console.log("Начинаем парсинг блоков JobChange");
    console.log("Содержимое для парсинга:", content.substring(0, 200) + "...");

    // Разбиваем содержимое на строки для построчного анализа
    const lines = content.split('\n');
    let currentBlock = null;
    let blockContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Ищем начало нового блока (число и #)
      const blockStart = line.match(/^(\d+)\s*(?:=>)?\s*#/);
      
      if (blockStart) {
        // Если у нас уже есть блок, сохраняем его
        if (currentBlock) {
          // Собираем содержимое блока с правильным форматированием
          currentBlock.content = blockContent.join('\n');
          blocks.push(currentBlock);
          blockContent = [];
        }
        
        // Начинаем новый блок
        currentBlock = {
          id: blockStart[1].trim(),
          content: ''
        };
        blockContent.push(line);
      } else if (currentBlock && line) {
        // Добавляем строку к текущему блоку
        blockContent.push(line);
        
        // Если это конец блока (]],), добавляем его в список
        if (line.match(/\]\],?$/)) {
          currentBlock.content = blockContent.join('\n');
          blocks.push(currentBlock);
          currentBlock = null;
          blockContent = [];
        }
      }
    }

    // Добавляем последний блок, если он есть
    if (currentBlock && blockContent.length > 0) {
      currentBlock.content = blockContent.join('\n');
      blocks.push(currentBlock);
    }

    console.log(`Найдено блоков: ${blocks.length}`);
    if (blocks.length > 0) {
      console.log("Пример первого блока:", blocks[0].content);
    }

    return blocks;
}

// Функция для обновления файла JobChange
function updateJobChangeFile(originalContent, newBlocks, isDirectCall = false) {
    try {
      console.log("Начинаем обновление файла JobChange");
      
      // Парсим новые блоки
      const blocks = parseJobChangeBlocks(newBlocks);
      if (blocks.length === 0) {
        console.log("Блоки не найдены в новом содержимом");
        showStatusMessage('Не найдены блоки для обновления', true);
        return null;
      }
      
      console.log(`Найдено ${blocks.length} блоков для обновления`);
      
      // Разделяем оригинальный контент на части
      const [beforeBlocks, blocksContent] = originalContent.split('JOB_DESC_TEXT = {');
      if (!blocksContent) {
        console.error('Не найдена секция JOB_DESC_TEXT');
        return null;
      }
      
      // Начинаем новое содержимое с правильным форматированием
      let newContent = beforeBlocks + 'JOB_DESC_TEXT = {';
      let updatedCount = 0;
      
      // Разбиваем содержимое на строки для анализа
      const lines = blocksContent.split('\n');
      let currentBlock = [];
      let currentBlockId = null;
      let isInBlock = false;
      let result = [];
      let fileEndFormat = null;
      
      // Определяем формат окончания файла
      const endMatch = blocksContent.match(/(\s*}\s*\n\s*end\s*$)/);
      if (endMatch) {
        fileEndFormat = endMatch[1];
      }
      
      // Создаем карту новых блоков для быстрого доступа
      const newBlocksMap = {};
      blocks.forEach(block => {
        newBlocksMap[block.id] = block.content.split('\n');
      });
      
      // Проходим по каждой строке оригинального файла
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const idMatch = trimmedLine.match(/^(\d+)\s*=>/);
        
        // Пропускаем строки окончания файла
        if (fileEndFormat && line.trim() === '}') break;
        if (fileEndFormat && line.trim() === 'end') break;
        
        if (idMatch) {
          // Если мы нашли новый блок
          if (currentBlock.length > 0) {
            // Добавляем предыдущий блок в результат
            result.push(...currentBlock);
          }
          
          currentBlockId = idMatch[1];
          currentBlock = [];
          isInBlock = true;
          
          if (newBlocksMap[currentBlockId]) {
            // Если есть обновленный блок, начинаем его обработку
            const newBlockLines = newBlocksMap[currentBlockId];
            const indent = line.match(/^\s*/)[0];
            
            // Обработка комментария в первой строке
            const originalFirstLine = line;
            const newFirstLine = newBlockLines[0];
            
            const originalComment = originalFirstLine.match(/#\s*([^#]+?)(?:\s*$|$)/);
            const newComment = newFirstLine.match(/#\s*([^#]+?)(?:\s*$|$)/);
            
            // Формируем первую строку с объединенным комментарием
            let firstLine = indent + currentBlockId + ' =>'; // Базовая часть строки
            
            if (originalComment && newComment) {
              const origCommentText = originalComment[1].trim();
              const newCommentText = newComment[1].trim();
              
              if (origCommentText !== newCommentText) {
                if (!origCommentText.includes(newCommentText) && !newCommentText.includes(origCommentText)) {
                  firstLine += ' # ' + origCommentText + '/' + newCommentText;
                } else {
                  firstLine += ' # ' + (origCommentText.length > newCommentText.length ? origCommentText : newCommentText);
                }
              } else {
                firstLine += ' # ' + origCommentText;
              }
            } else if (originalComment) {
              firstLine += ' # ' + originalComment[1].trim();
            } else if (newComment) {
              firstLine += ' # ' + newComment[1].trim();
            }
            
            currentBlock.push(firstLine);
            
            // Флаги для отслеживания структуры блока
            let inFirstArray = false;
            let inSecondArray = false;
            let firstArrayClosed = false;
            
            // Обрабатываем остальные строки нового блока
            for (let j = 1; j < newBlockLines.length; j++) {
              const newLine = newBlockLines[j].trim();
              
              if (newLine === '[[') {
                inFirstArray = true;
                currentBlock.push(indent + '  ' + newLine);
              } else if (newLine === ']]' || newLine === ']],' || newLine.startsWith(']]') && newLine.endsWith(',')) {
                inFirstArray = false;
                inSecondArray = false;
                currentBlock.push(indent + '  ' + newLine);
              } else if (newLine === '],') {
                inFirstArray = false;
                firstArrayClosed = true;
                currentBlock.push(indent + '  ' + newLine);
              } else if (newLine === '[' && firstArrayClosed) {
                inSecondArray = true;
                currentBlock.push(indent + '  ' + newLine);
              } else if (newLine.startsWith('"')) {
                // Строки с описанием получают ровно 8 пробелов отступа
                currentBlock.push('        ' + newLine);
              } else {
                // Прочие строки получают базовый отступ + 2 пробела
                currentBlock.push(indent + '  ' + newLine);
              }
            }
            
            updatedCount++;
          } else {
            // Если нет обновленного блока, сохраняем оригинальную строку
            currentBlock.push(line);
          }
        } else if (isInBlock) {
          // Если мы внутри блока и нет обновленной версии
          if (!newBlocksMap[currentBlockId]) {
            currentBlock.push(line);
          }
        }
      }
      
      // Добавляем последний блок
      if (currentBlock.length > 0) {
        result.push(...currentBlock);
      }
      
      // Собираем финальный результат
      newContent += '\n' + result.join('\n');
      
      // Добавляем окончание файла
      if (fileEndFormat) {
        newContent += fileEndFormat;
      } else {
        newContent += '\n  }\n\nend\n';
      }
      
      // Удаляем пустые строки между блоками
      newContent = removeEmptyLinesBetweenBlocks(newContent);
      
      console.log(`Обновлено ${updatedCount} блоков`);
      
      // Проверяем, вызван ли метод напрямую
      if (isDirectCall) {
        // Создаем новый файл с обновленным содержимым
        const blob = new Blob([newContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Создаем ссылку для скачивания
        const a = document.createElement('a');
        a.href = url;
        a.download = 'updated_197_-_JobChange.rb';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log("Файл успешно обновлен и сохранен");
        showStatusMessage("Файл успешно обновлен и сохранен");
      }
      
      return newContent;
    } catch (e) {
      console.error('Ошибка при обновлении JobChange файла:', e);
      showStatusMessage('Ошибка при обновлении JobChange файла', true);
      return null;
    }
}