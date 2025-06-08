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
      const questionNum = firstLine[2];
      
      // Извлекаем идентификатор и номера из оставшейся части первой строки
      const dialogInfo = firstLine.slice(3).join(' ');
      
      // Изменяем регулярное выражение, чтобы оно искало _fc1 или _fc2
      const identifierMatch = dialogInfo.match(/([a-zA-Z0-9_]+_fc[12])/);
      if (!identifierMatch) return "Ошибка: не найден идентификатор";
      const identifier = identifierMatch[1];
      
      // Извлекаем номера диалогов, учитывая возможные пробелы
      const numbers = dialogInfo.split(identifier)
        .map(s => s.trim())
        .filter(s => s)
        .map(s => s.split(/\s+/)[0]); // Берем только первое число из каждой части
      
      if (numbers.length < 3) return "Ошибка: неполные данные диалогов";
      const [num1, num2, num3] = numbers;

      // Парсим вторую строку
      const [number, title] = lines[1].split('#').map(s => s.trim());

      // Получаем диалоги, убирая лишние кавычки
      const question = lines[2].slice(1, -1).replace(/^"|"$/g, '');
      const yes = lines[3].slice(1, -1).replace(/^"|"$/g, '');
      const no = lines[4].slice(1, -1).replace(/^"|"$/g, '');

      // Формируем результат
      let result = `    ${number} => { # ${title}\n`;
      result += `      :actor_id => ${actorId}, :denominator => ${denominator},\n`;
      result += `      :question => ["${question}", "${identifier}", ${num1}],\n`;
      result += `      :yes => ["${yes}", "${identifier}", ${num2}],\n`;
      result += `      :no => ["${no}", "${identifier}", ${num3}],\n`;
      result += `    },`;

      return result;
    }).join("\n\n");
}