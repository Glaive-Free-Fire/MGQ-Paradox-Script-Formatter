// Функции для обработки вкладки Follower
function processFollowerText(input) {
    // Разбиваем входной текст на записи
    const entries = input.split(/\n\n/).filter(e => e.trim());
    
    return entries.map(entry => {
      const lines = entry.split('\n').filter(line => line.trim());
      if (lines.length < 4) return "Ошибка: неполные данные";

      // Парсим первую строку
      const firstLine = lines[0].split(',').map(s => s.trim());
      const actorId = firstLine[0];
      const denominator = firstLine[1];
      
      // Извлекаем ВСЮ информацию о диалогах, начиная с 3-го элемента (индекс 2)
      const dialogInfo = firstLine.slice(2).join(' ').replace(/,/g, '');
      
      // Изменяем регулярное выражение, чтобы оно искало _fc с любой цифрой, включая дефисы в именах (fc1, fc2, fc3, и т.д.)
      // Поддерживаем дефисы: [a-zA-Z0-9_-]+
      const identifierPattern = /([a-zA-Z0-9_-]+_fc\d+)/;
      const identifierMatch = dialogInfo.match(identifierPattern);
      if (!identifierMatch) return "Ошибка: не найден идентификатор";
      
      const firstIdentifier = identifierMatch[1];
      const escapedIdentifier = firstIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Объявляем переменные
      let num1, num2, num3, identifier1, identifier2, identifier3;
      
      // СНАЧАЛА пытаемся найти все пары с любыми идентификаторами (для случаев с разными идентификаторами)
      // Это важно для блоков типа "6 braunys_fc1, 6 braunys_fc1, 7 braunys_fc2"
      const allPairsPattern = /(\d+)\s+([a-zA-Z0-9_-]+_fc\d+)/g;
      const allMatches = [...dialogInfo.matchAll(allPairsPattern)];
      
      if (allMatches.length >= 3) {
        // Нашли 3 или более пар - используем первые три (могут быть разные идентификаторы)
        num1 = allMatches[0][1];
        identifier1 = allMatches[0][2];
        num2 = allMatches[1][1];
        identifier2 = allMatches[1][2];
        num3 = allMatches[2][1];
        identifier3 = allMatches[2][2];
      } else {
        // Если не нашли 3 пары с разными идентификаторами, пробуем с конкретным идентификатором
        const pattern = new RegExp(`(\\d+)\\s+${escapedIdentifier}`, 'g');
        const matches = [...dialogInfo.matchAll(pattern)];
        
        if (matches.length >= 3) {
          // Нашли 3 или более пар с конкретным идентификатором
          num1 = matches[0][1];
          identifier1 = firstIdentifier;
          num2 = matches[1][1];
          identifier2 = firstIdentifier;
          num3 = matches[2][1];
          identifier3 = firstIdentifier;
        } else {
          // Последний вариант - извлекаем числа через split
          const parts = dialogInfo.split(firstIdentifier);
          const numbers = [];
          
          // Извлекаем числа перед идентификаторами
          for (let i = 0; i < parts.length - 1; i++) {
            const beforeId = parts[i].trim();
            const numberMatch = beforeId.match(/(\d+)(?:\s|$)/);
            if (numberMatch) {
              numbers.push(numberMatch[1]);
            }
          }
          
          // Проверяем последнюю часть (может быть число после последнего идентификатора)
          const lastPart = parts[parts.length - 1].trim();
          const lastNumberMatch = lastPart.match(/^(\d+)/);
          if (lastNumberMatch && numbers.length < 3) {
            numbers.push(lastNumberMatch[1]);
          }
          
          if (numbers.length < 3) return "Ошибка: неполные данные диалогов";
          
          num1 = numbers[0] || '0';
          num2 = numbers[1] || '0';
          num3 = numbers[2] || '0';
          identifier1 = firstIdentifier;
          identifier2 = firstIdentifier;
          identifier3 = firstIdentifier;
        }
      }

      // Парсим вторую строку
      const [number, title] = lines[1].split('#').map(s => s.trim());

      // Получаем диалоги, убирая лишние кавычки
      const question = lines[2].slice(1, -1).replace(/^"|"$/g, '');
      const yes = lines[3].slice(1, -1).replace(/^"|"$/g, '');
      const no = lines[4].slice(1, -1).replace(/^"|"$/g, '');

      // Формируем результат с использованием правильных идентификаторов для каждого диалога
      let result = `    ${number} => { # ${title}\n`;
      result += `      :actor_id => ${actorId}, :denominator => ${denominator},\n`;
      result += `      :question => ["${question}", "${identifier1}", ${num1}],\n`;
      result += `      :yes => ["${yes}", "${identifier2}", ${num2}],\n`;
      result += `      :no => ["${no}", "${identifier3}", ${num3}],\n`;
      result += `    },`;

      return result;
    }).join("\n");
}