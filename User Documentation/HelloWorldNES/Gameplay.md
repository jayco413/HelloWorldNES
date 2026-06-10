# Gameplay

The ROM starts with `Hello World` centered on the screen in green text. `Hello` is initially underlined.

Controls:

- Left cycles the text color backward through ROYGBIV.
- Right cycles the text color forward through ROYGBIV.
- Select toggles the underline between `Hello` and `World`.
- Up moves the underlined word up one tile row.
- Down moves the underlined word down one tile row.

When the selected word reaches the top or bottom movement boundary, the ROM temporarily locks input and returns the word to its starting row before accepting input again.
