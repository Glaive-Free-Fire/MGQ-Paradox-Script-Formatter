# MGQ-Paradox Script Formatter

## Overview

MGQ-Paradox Script Formatter is a specialized web tool for editing and formatting text data files from Monster Girl Quest Paradox. This tool enables efficient localization and text data management by providing an intuitive interface for editing various game data files and formatting them correctly for the game engine.

## Key Features

- **Multi-format Support**: Edit different data structures including monster descriptions, job classes, medals, follower dialog, and map events
- **Language Toggle**: Switch between Japanese and Russian interfaces to support multilingual editing
- **Smart Text Formatting**: Automatic text wrapping and formatting based on configurable character limits
- **Direct Compilation**: Update original Ruby files with your edited content without manual copy/pasting
- **Skill Reference Resolution**: Replace numeric skill references with their actual names using the Skill Replacer

## Supported File Types

| Mode | File Pattern | Description |
|------|--------------|-------------|
| Library(Enemy) | 201 - Library(Enemy).rb | Monster descriptions and attributes |
| JobChange | 197 - JobChange.rb | Character class/job descriptions and skills |
| Library(Medal) | 204 - Library(Medal).rb | Achievement/medal descriptions |
| Skill Replacer | N/A | Tool to replace numeric skill IDs with names |
| Follower | 195 - Follower.rb | Companion dialog formatting |
| Map | Map events | Dialog and event text formatting |

## Usage Guide

### Basic Workflow

1. **Select Mode**: Choose the appropriate tab for the type of file you're editing
2. **Choose Language**: Toggle between RUS/JAP depending on which language you're working with
3. **Input Text**: Paste your raw text data into the left panel
4. **View Results**: See the properly formatted output in the right panel
5. **Export**: Either copy the formatted text or use the direct compilation feature

### Line Length Control

- Use the "ДЛИНА СТРОКИ" controls to adjust maximum line length
- Default values:
  - Russian text: 39 characters
  - Japanese text: 22 characters
  - JobChange text: 30 characters
  - Map text: 50 characters

### Direct Compilation Mode

For seamless integration with game files:

1. Click "Режим прямой компиляции"
2. Select the original Ruby file using the file selector
3. Click "Компилировать данные" to generate an updated file
4. Download the resulting file to use in your game

### Input Format Examples

#### Library(Enemy) Format
```
146 # Enemy Name
Description text goes here. This will be properly
formatted according to the line length settings.
Иллюстрация: Artist Name
```

#### JobChange Format
```
12 # Class Name
Class description text.
Экипировка: Weapon1　Weapon2　Weapon3
Навыки: Skill1　Skill2　Skill3
Способности: Ability1　Ability2
```

#### Follower Format
```
1,2,3,fc1 1 2 3
32#Dialog Title
"Question text here?"
"Yes response"
"No response"
```

## Technical Features

### Intelligent Text Processing

- **Wide Space Preservation**: Maintains Japanese-style wide spaces (　) used to separate list items
- **Illustration Attribution**: Properly formats artist credits with the correct prefix format
- **Section Detection**: Automatically identifies equipment, skills, and abilities sections
- **Smart Quoting**: Handles quotation marks and escaping in dialog correctly

### Map Text Correction

The Map mode includes extensive error correction for common issues:

- Fixes malformed `ShowText` commands
- Cleans redundant quotes in text strings
- Corrects command syntax errors
- Normalizes formatting for dialog choices

### Multi-block Processing

When working with files containing multiple entries:

- Entries are properly parsed and maintained in the correct order
- ID-based addressing ensures updates only affect the intended entries
- File structure and formatting is preserved during compilation

## Installation

1. Clone this repository
2. Open `Script_for_packing.html` in any modern web browser
3. No server setup required - the tool runs entirely in your browser

## Browser Compatibility

The tool works in all modern browsers that support:
- FileReader API
- ES6 JavaScript features
- Modern CSS layout techniques

## Contributing

Contributions to improve the MGQ-Paradox Script Formatter are welcome:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with your changes

## License

This tool is developed specifically for Monster Girl Quest Paradox modding and is provided as-is under the MIT license.

---

*This tool was created to streamline text editing for MGQP and may require modifications for use with other RPG Maker projects.*
