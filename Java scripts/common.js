// common.js - Общие функции и инициализация, используемые всеми вкладками

// Глобальные переменные для всех режимов
let currentMode = "RUS"; // Текущий язык
let currentTab = "library"; // Текущая вкладка
let maxLineLengthRus = 39;
let maxLineLengthJap = 22;
let maxLineLengthJobChangeVar = 30; // Лимит строки для JobChange
let maxLineLengthMap = 50; // Лимит строки для Map
let isCompileMode = false; // Режим прямой компиляции

// Константы для имен файлов
const FILE_NAMES = {
  "library": "201 - Library(Enemy).rb",
  "jobchange": "197 - JobChange.rb",
  "medal": "204 - Library(Medal).rb",
  "follower": "195 - Follower.rb"
};

// Глобальные переменные для хранения информации о выбранном файле
window.lastSelectedFileContent = null;
window.lastSelectedFileName = null;

// Префиксы для иллюстрации
const illustrationPrefixRUS = "Иллюстрация：";
const illustrationPrefixJAP = "イラスト：";

/**
 * Инициализация обработчиков событий и настройка интерфейса
 */
function initializeApp() {
  // Переключение вкладок
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-mode');
      
      // Показываем/скрываем элементы в зависимости от выбранной вкладки
      const skillsFileContainer = document.getElementById('skills-file-container');
      const lengthControlContainer = document.getElementById('length-control');
      const processSkillBtn = document.getElementById('process-skill-btn');
      const outputContainer = document.querySelector('.output');
      const copyBtn = document.getElementById('copy-btn');
      const langControls = document.getElementById('lang-controls');
      const compileModeBtn = document.getElementById('compile-mode-btn');
      
      if (currentTab === "skillreplacer") {
        // Скрываем ненужные элементы для вкладки Skill Replacer
        if (skillsFileContainer) skillsFileContainer.style.display = 'flex';
        if (processSkillBtn) processSkillBtn.style.display = 'inline-block';
        if (lengthControlContainer) lengthControlContainer.style.display = 'none';
        if (outputContainer) outputContainer.style.display = 'none';
        if (copyBtn) copyBtn.style.display = 'none';
        if (langControls) langControls.style.display = 'none'; // Скрываем выбор языка
        if (compileModeBtn) compileModeBtn.style.display = 'none'; // Скрываем кнопку режима компиляции
      } else if (currentTab === "library") {
        // Показываем элементы управления библиотекой для вкладки Library(Enemy)
        if (skillsFileContainer) skillsFileContainer.style.display = 'none';
        if (processSkillBtn) processSkillBtn.style.display = 'none';
        if (lengthControlContainer) lengthControlContainer.style.display = 'flex';
        if (outputContainer) outputContainer.style.display = 'block';
        if (copyBtn) copyBtn.style.display = 'inline-block';
        if (langControls) langControls.style.display = 'block'; // Показываем выбор языка
        if (compileModeBtn) compileModeBtn.style.display = 'block'; // Показываем кнопку режима компиляции
      } else {
        // Возвращаем отображение элементов для других вкладок
        if (skillsFileContainer) skillsFileContainer.style.display = 'none';
        if (processSkillBtn) processSkillBtn.style.display = 'none';
        if (lengthControlContainer) lengthControlContainer.style.display = 'flex';
        if (outputContainer) outputContainer.style.display = 'block';
        if (copyBtn) copyBtn.style.display = 'inline-block';
        if (langControls) langControls.style.display = 'block'; // Показываем выбор языка
        if (compileModeBtn) compileModeBtn.style.display = 'block'; // Показываем кнопку режима компиляции
        updateOutput();
      }
    });
  });

  // Обработчики кнопок выбора языка
  const btnRus = document.getElementById('btn-rus');
  const btnJap = document.getElementById('btn-jap');
  btnRus.addEventListener('click', () => {
    currentMode = "RUS";
    btnRus.classList.add('active');
    btnJap.classList.remove('active');
    updateOutput();
  });
  btnJap.addEventListener('click', () => {
    currentMode = "JAP";
    btnJap.classList.add('active');
    btnRus.classList.remove('active');
    updateOutput();
  });

  // Обработчик ввода данных
  const inputEl = document.getElementById('input-data');
  inputEl.addEventListener('input', updateOutput);

  // Обработчик кнопок изменения длины строки
  document.getElementById('decrease-length').addEventListener('click', () => adjustLength(-1));
  document.getElementById('increase-length').addEventListener('click', () => adjustLength(1));
  document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
  
  // Явно добавляем обработчик для кнопки Skill Replacer
  document.getElementById('process-skill-btn').addEventListener('click', processSkillReplacer);
  
  // Обработчик для кнопки режима компиляции
  document.getElementById('compile-mode-btn').addEventListener('click', toggleCompileMode);
  
  // Обработчик для кнопки компиляции данных
  document.getElementById('compile-btn').addEventListener('click', compileData);
}

/**
 * Копирование в буфер обмена
 */
function copyToClipboard() {
  navigator.clipboard.writeText(document.getElementById('output-content').textContent)
    .then(() => alert('Текст скопирован!'))
    .catch(err => console.error('Ошибка копирования:', err));
}

/**
 * Изменение длины строки с учетом текущей вкладки
 * @param {number} delta - Величина изменения
 */
function adjustLength(delta) {
  Logger.debug('common', 'Изменение длины строки', { 
    delta, 
    currentTab,
    currentMode,
    oldLength: currentTab === "map" ? maxLineLengthMap : (currentMode === "JAP" ? maxLineLengthJap : maxLineLengthRus)
  });

  if (currentTab === "jobchange") {
    maxLineLengthJobChangeVar = Math.max(10, maxLineLengthJobChangeVar + delta);
  } else if (currentTab === "map") {
    maxLineLengthMap = Math.max(10, maxLineLengthMap + delta);
    Logger.info('common', 'Изменена длина строки для карты', { newLength: maxLineLengthMap });
  } else if (currentMode === "JAP") {
    maxLineLengthJap = Math.max(10, maxLineLengthJap + delta);
  } else {
    maxLineLengthRus = Math.max(10, maxLineLengthRus + delta);
  }

  updateOutput(); // Вызываем обновление после исправления
}

/**
 * Обновление отображения длины строки
 */
function updateLengthDisplay() {
  let len;
  if (currentTab === "jobchange") {
    len = maxLineLengthJobChangeVar;
  } else if (currentTab === "map") {
    len = maxLineLengthMap;
  } else {
    len = currentMode === "JAP" ? maxLineLengthJap : maxLineLengthRus;
  }
  Logger.debug('common', 'Обновление отображения длины строки', { 
    currentTab,
    currentMode,
    length: len 
  });
  document.getElementById('current-length').textContent = len;
}

/**
 * Единая функция обновления вывода
 */
function updateOutput() {
  Logger.debug('common', 'Начало обновления вывода', { 
    currentTab,
    currentMode,
    isCompileMode 
  });

  updateLengthDisplay();
  const inputText = document.getElementById('input-data').value;
  if (!inputText.trim()) {
    Logger.debug('common', 'Пустой ввод, очистка вывода');
    document.getElementById('output-content').textContent = '';
    return;
  }
  try {
    let output;
    
    if (currentTab === "library") {
      output = processText(inputText);
    } else if (currentTab === "jobchange") {
      output = processJobChangeText(inputText);
    } else if (currentTab === "medal") {
      output = processMedalText(inputText);
    } else if (currentTab === "skillreplacer") {
      // Для вкладки Skill Replacer не выполняем автоматическую обработку
      return;
    } else if (currentTab === "follower") {
      output = processFollowerText(inputText);
    } else if (currentTab === "map") {
      Logger.info('common', 'Вызов обработки текста карты');
      output = processMapText(inputText);
    }
    
    document.getElementById('output-content').textContent = output;
    Logger.debug('common', 'Вывод успешно обновлен');
  } catch (e) {
    Logger.error('common', 'Ошибка при обновлении вывода', e);
    document.getElementById('output-content').textContent = 'Ошибка форматирования';
  }
}

/**
 * Экранирование кавычек в строке
 * @param {string} str - Исходная строка
 * @returns {string} - Строка с экранированными кавычками
 */
function escapeQuotes(str) {
  return str.replace(/"/g, '\\"');
}

/**
 * Возвращает текущую максимальную длину строки для выбранного языка
 * @returns {number} - Максимальная длина строки
 */
function getCurrentMaxLineLength() {
  return currentMode === "JAP" ? maxLineLengthJap : maxLineLengthRus;
}

// Инициализация приложения при загрузке документа
document.addEventListener('DOMContentLoaded', initializeApp);