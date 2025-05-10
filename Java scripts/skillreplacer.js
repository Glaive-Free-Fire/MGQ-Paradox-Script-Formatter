// Функции для обработки вкладки Skill Replacer
function processSkillReplacer() {
    try {
      console.log("Начинаем обработку Skills...");
      const inputData = document.getElementById('input-data');
      const mainText = inputData.value;
      if (!mainText.trim()) {
        alert('Пожалуйста, введите текст с упоминаниями навыков!');
        return;
      }
      
      const skillsFileInput = document.getElementById('skills-file-input');
      if (!skillsFileInput || !skillsFileInput.files[0]) {
        alert('Пожалуйста, загрузите файл Skills!');
        return;
      }
      
      console.log("Файл Skills выбран, читаем содержимое...");
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          console.log("Файл прочитан, размер:", e.target.result.length);
          const skillMap = parseSkills(e.target.result);
          console.log("Карта навыков создана, найдено навыков:", Object.keys(skillMap).length);
          
          const result = replaceSkills(mainText, skillMap);
          console.log("Обработка завершена, обновляем поле ввода...");
          inputData.value = result;
          alert('Обработка успешно завершена!');
        } catch (err) {
          console.error("Ошибка при обработке: ", err);
          alert('Ошибка обработки файла Skills: ' + err.message);
        }
      };
      
      reader.onerror = function() {
        console.error("Ошибка чтения файла");
        alert('Ошибка чтения файла Skills!');
      };
      
      reader.readAsText(skillsFileInput.files[0]);
    } catch (e) {
      console.error("Общая ошибка в processSkillReplacer:", e);
      alert('Ошибка обработки: ' + e.message);
    }
}

// Обновленная функция парсинга файла Skills
function parseSkills(text) {
    console.log("Начинаем парсинг Skills...");
    const skillMap = {};
    
    // Проверка формата файла
    if (text.indexOf("Skill") === -1) {
      console.warn("Предупреждение: в файле не найдены записи с 'Skill'");
    }
    
    // Пробуем разные регулярные выражения для поиска навыков
    const blocks = text.split(/^Skill\s+/gm);
    console.log(`Найдено блоков: ${blocks.length - 1}`);
    
    blocks.forEach((block, index) => {
      if (index === 0 || !block.trim()) return; // Пропускаем первый блок (он перед первым Skill)
      
      const lines = block.split('\n');
      if (lines.length === 0) return;
      
      // Получаем номер навыка из первой строки
      const firstLine = lines[0].trim();
      const skillNumberMatch = firstLine.match(/^(\d+)/);
      
      if (!skillNumberMatch) {
        console.warn(`Не удалось извлечь номер навыка из строки: ${firstLine}`);
        return;
      }
      
      const skillNumber = skillNumberMatch[1];
      
      // Ищем строку с именем
      const nameLine = lines.find(line => line.trim().match(/^Name\s*=\s*"/i));
      
      if (!nameLine) {
        console.warn(`Не найдена строка с именем для навыка ${skillNumber}`);
        return;
      }
      
      // Извлекаем имя из строки "Name = "имя"..."
      const nameMatch = nameLine.match(/Name\s*=\s*"([^"]+)"/i);
      
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim();
        skillMap[skillNumber] = name;
        
        if (index < 5 || index > blocks.length - 5) {
          console.log(`Добавлен навык: ${skillNumber} => ${name}`);
        }
      } else {
        console.warn(`Не удалось извлечь имя из строки: ${nameLine}`);
      }
    });
    
    console.log(`Всего обработано навыков: ${Object.keys(skillMap).length}`);
    return skillMap;
}

// Function to replace Skill references in main text with skill names
function replaceSkills(text, skillMap) {
    // Улучшенное регулярное выражение для поиска паттернов Skill
    return text.replace(/Skill\s+(\d+)/gi, function(match, number) {
      console.log(`Обнаружено совпадение: ${match}, номер: ${number}, замена на: ${skillMap[number] || match}`);
      return skillMap[number] || match;
    });
}