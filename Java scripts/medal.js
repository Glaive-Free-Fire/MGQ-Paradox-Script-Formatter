// Функции для обработки вкладки Medal
function processMedalText(text) {
    try {
      const lines = text.split('\n');
      let result = "";
      let currentId = null;
      let currentIconId = null;
      let currentPriority = null;
      let japTitle = null;
      let japDescription = null;
      let rusTitle = null;
      let rusDescription = null;
      let collectingJap = false;
      let collectingRus = false;
      
      // Проходим по всем строкам текста
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Пропускаем пустые строки
        if (!line) continue;
        
        // Проверяем, начинается ли строка с ID медали
        const idMatch = line.match(/^(\d+)\s*=>\s*\{/);
        if (idMatch) {
          // Если у нас уже есть данные о медали, добавляем их в результат
          if (currentId !== null) {
            // В зависимости от выбранного языка, используем соответствующие данные
            const title = currentMode === "JAP" ? japTitle : rusTitle;
            const description = currentMode === "JAP" ? japDescription : rusDescription;
            
            if (title && description) {
              result += formatMedal(currentId, currentIconId, title, description, currentPriority);
            }
          }
          
          // Начинаем сбор данных для новой медали
          currentId = idMatch[1];
          collectingJap = false;
          collectingRus = false;
          japTitle = null;
          japDescription = null;
          rusTitle = null;
          rusDescription = null;
          continue;
        }
        
        // Ищем icon_id
        const iconIdMatch = line.match(/:icon_id\s*=>\s*(\d+)/);
        if (iconIdMatch) {
          currentIconId = iconIdMatch[1];
          continue;
        }
        
        // Ищем priority
        const priorityMatch = line.match(/:priority\s*=>\s*(\d+)/);
        if (priorityMatch) {
          currentPriority = priorityMatch[1];
          continue;
        }
        
        // Проверка на конец блока медали
        if (line === "},") {
          collectingJap = false;
          collectingRus = true; // После закрывающей скобки идет русское название
          continue;
        }
        
        // Если мы не в режиме сбора японского текста, и строка не совпадает с паттернами выше,
        // и мы еще не собрали японский заголовок
        if (!collectingJap && !collectingRus && japTitle === null && 
            !iconIdMatch && !priorityMatch && line !== "},") {
          collectingJap = true;
        }
        
        // Сбор японского текста
        if (collectingJap) {
          if (japTitle === null) {
            japTitle = line;
          } else if (japDescription === null) {
            japDescription = line;
            collectingJap = false;
          }
          continue;
        }
        
        // Сбор русского текста
        if (collectingRus) {
          if (rusTitle === null) {
            rusTitle = line;
          } else if (rusDescription === null) {
            rusDescription = line;
            collectingRus = false;
          }
          continue;
        }
      }
      
      // Добавляем последнюю медаль, если есть данные
      if (currentId !== null) {
        const title = currentMode === "JAP" ? japTitle : rusTitle;
        const description = currentMode === "JAP" ? japDescription : rusDescription;
        
        if (title && description) {
          result += formatMedal(currentId, currentIconId, title, description, currentPriority);
        }
      }
      
      return result;
    } catch (e) {
      console.error("Error in processMedalText:", e);
      return "Error processing medal text: " + e.message;
    }
}

// Функция форматирования медали
function formatMedal(id, iconId, title, description, priority) {
    return `    ${id} => {
      :icon_id => ${iconId},
      :title => "${title}",
      :description => "${description}",
      :priority => ${priority},
    },\n`;
}

// Функция для парсинга блоков Medal
function parseMedalBlocks(content) {
    const blocks = [];
    const regex = /\s*(\d+)\s*=>\s*\{([\s\S]*?)\},/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      blocks.push({
        id: match[1].trim(),
        content: match[0]
      });
    }
    
    return blocks;
}

// Функция для обновления файла Medal
function updateMedalFile(originalContent, newBlocks) {
    try {
      // Парсим новые блоки
      const blocks = parseMedalBlocks(newBlocks);
      if (blocks.length === 0) {
        showStatusMessage('Не найдены блоки для обновления', true);
        return null;
      }
      
      let updatedContent = originalContent;
      
      // Обновляем каждый блок
      blocks.forEach(block => {
        const id = block.id;
        const content = block.content;
        
        // Ищем блок с таким ID в оригинальном файле с учетом форматирования
        const regex = new RegExp(`\\s*${id}\\s*=>\\s*\\{[^}]*?\\},`, 's');
        const match = updatedContent.match(regex);
        
        if (match) {
          // Получаем контекст блока и его отступы
          const blockContext = match[0];
          
          // Определяем, с новой ли строки начинался оригинальный блок
          const startsWithNewline = /^\s*\n\s*\d+\s*=>/m.test(blockContext);
          
          // Определяем отступ перед началом блока
          const indentMatch = blockContext.match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '';
          
          // Обрабатываем новый контент, сохраняя форматирование
          let formattedContent = content;
          
          // Добавляем отступ в начало, если он был
          if (indent && !formattedContent.startsWith(indent)) {
            formattedContent = indent + formattedContent.trimStart();
          }
          
          // Добавляем перенос строки перед блоком, если он был
          if (startsWithNewline && !formattedContent.startsWith('\n')) {
            formattedContent = '\n' + formattedContent;
          }
          
          // Заменяем блок с учетом форматирования
          updatedContent = updatedContent.replace(regex, formattedContent);
        } else {
          // Блок не найден, добавляем новый блок в конец
          // Находим последний блок
          const lastBlockMatch = updatedContent.match(/(\d+)\s*=>\s*\{[^}]*?\},\s*$/s);
          if (lastBlockMatch) {
            const position = lastBlockMatch.index + lastBlockMatch[0].length;
            
            // Определяем, был ли перенос строки перед последним блоком
            const lastBlockStart = updatedContent.lastIndexOf('\n', lastBlockMatch.index);
            const lastBlockPrefix = updatedContent.substring(lastBlockStart + 1, lastBlockMatch.index);
            const indentLevel = lastBlockPrefix.match(/^\s*/)[0];
            
            // Добавляем блок с тем же форматированием, что и последний блок
            const newBlockContent = '\n' + indentLevel + content;
            updatedContent = updatedContent.substring(0, position) + newBlockContent + 
                             updatedContent.substring(position);
          } else {
            // Если не нашли последний блок, добавляем в конец файла
            updatedContent += '\n    ' + content;
          }
        }
      });
      
      return updatedContent;
    } catch (e) {
      console.error('Ошибка при обновлении Medal файла:', e);
      showStatusMessage('Ошибка при обновлении Medal файла', true);
      return null;
    }
}