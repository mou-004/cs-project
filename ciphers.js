(() => {
  "use strict";

  function letters(text) {
    return String(text || "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .replace(/J/g, "I");
  }

  function validKey(key) {
    const clean = String(key || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (clean.length < 4) {
      throw new Error("Keyword must contain at least 4 letters.");
    }
    return clean;
  }

  function vigenereEncrypt(text, key) {
    key = validKey(key);
    let keyIndex = 0;

    return [...text].map(char => {
      if (!/[A-Z]/.test(char)) return char;
      const p = char.charCodeAt(0) - 65;
      const k = key.charCodeAt(keyIndex++ % key.length) - 65;
      return String.fromCharCode(65 + ((p + k) % 26));
    }).join("");
  }

  function vigenereDecrypt(text, key) {
    key = validKey(key);
    let keyIndex = 0;

    return [...text].map(char => {
      if (!/[A-Z]/.test(char)) return char;
      const c = char.charCodeAt(0) - 65;
      const k = key.charCodeAt(keyIndex++ % key.length) - 65;
      return String.fromCharCode(65 + ((c - k + 26) % 26));
    }).join("");
  }

  function playfairMatrix(key) {
    key = validKey(key).replace(/J/g, "I");
    const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
    const characters = [...new Set((key + alphabet).split(""))];
    const matrix = [];
    const positions = {};

    for (let row = 0; row < 5; row++) {
      matrix[row] = characters.slice(row * 5, row * 5 + 5);
      matrix[row].forEach((char, column) => {
        positions[char] = [row, column];
      });
    }

    return { matrix, positions };
  }

  function playfairPrepare(text) {
    const input = letters(text);
    if (!input) throw new Error("Authorization text needs letters.");

    const output = [];
    let index = 0;

    while (index < input.length) {
      const first = input[index];
      const second = input[index + 1];

      if (!second) {
        output.push(first, "X");
        index += 1;
      } else if (first === second) {
        output.push(first, first === "X" ? "Q" : "X");
        index += 1;
      } else {
        output.push(first, second);
        index += 2;
      }
    }

    return output.join("");
  }

  function playfairTransform(text, key, direction) {
    const { matrix, positions } = playfairMatrix(key);
    let output = "";

    for (let index = 0; index < text.length; index += 2) {
      const first = text[index];
      const second = text[index + 1];
      const [row1, column1] = positions[first];
      const [row2, column2] = positions[second];

      if (row1 === row2) {
        output +=
          matrix[row1][(column1 + direction + 5) % 5] +
          matrix[row2][(column2 + direction + 5) % 5];
      } else if (column1 === column2) {
        output +=
          matrix[(row1 + direction + 5) % 5][column1] +
          matrix[(row2 + direction + 5) % 5][column2];
      } else {
        output += matrix[row1][column2] + matrix[row2][column1];
      }
    }

    return output;
  }

  function playfairEncrypt(preparedText, key) {
    return playfairTransform(preparedText, key, 1);
  }

  function playfairDecrypt(ciphertext, key) {
    return playfairTransform(ciphertext, key, -1);
  }

  function validateRails(value, textLength = 0) {
    const rails = Number(value);

    if (!Number.isInteger(rails) || rails < 2 || rails > 20) {
      throw new Error("Rail count must be 2 to 20.");
    }

    if (textLength && rails > textLength) {
      throw new Error("Rail count cannot exceed text length.");
    }

    return rails;
  }

  function railFenceEncrypt(text, railValue) {
    const rails = validateRails(railValue, text.length);
    const rows = Array.from({ length: rails }, () => []);
    let row = 0;
    let direction = 1;

    for (const char of text) {
      rows[row].push(char);

      if (row === 0) direction = 1;
      else if (row === rails - 1) direction = -1;

      row += direction;
    }

    return rows.flat().join("");
  }

  function railFenceDecrypt(ciphertext, railValue) {
    const rails = validateRails(railValue, ciphertext.length);
    const pattern = [];
    let row = 0;
    let direction = 1;

    for (let index = 0; index < ciphertext.length; index++) {
      pattern.push(row);

      if (row === 0) direction = 1;
      else if (row === rails - 1) direction = -1;

      row += direction;
    }

    const counts = Array(rails).fill(0);
    pattern.forEach(rail => counts[rail]++);

    const railData = [];
    let cursor = 0;

    for (const count of counts) {
      railData.push(ciphertext.slice(cursor, cursor + count).split(""));
      cursor += count;
    }

    const positions = Array(rails).fill(0);
    return pattern.map(rail => railData[rail][positions[rail]++]).join("");
  }

  function algorithmLabel(algorithm) {
    return {
      vigenere: "Vigenère",
      playfair: "Playfair",
      railfence: "Rail Fence"
    }[algorithm] || algorithm;
  }

  function prepare(text, algorithm) {
    const base = letters(text);

    if (base.length < 6) {
      throw new Error("Write at least 6 letters in authorization text.");
    }

    return algorithm === "playfair" ? playfairPrepare(base) : base;
  }

  function encrypt(text, algorithm, parameter) {
    if (algorithm === "vigenere") {
      return vigenereEncrypt(text, parameter);
    }

    if (algorithm === "playfair") {
      return playfairEncrypt(text, parameter);
    }

    if (algorithm === "railfence") {
      return railFenceEncrypt(text, parameter);
    }

    throw new Error("Unsupported cipher algorithm.");
  }

  function decrypt(text, algorithm, parameter) {
    if (algorithm === "vigenere") {
      return vigenereDecrypt(text, parameter);
    }

    if (algorithm === "playfair") {
      return playfairDecrypt(text, parameter);
    }

    if (algorithm === "railfence") {
      return railFenceDecrypt(text, parameter);
    }

    throw new Error("Unsupported cipher algorithm.");
  }

  window.CipherAlgorithms = Object.freeze({
    letters,
    validKey,
    playfairPrepare,
    algorithmLabel,
    prepare,
    encrypt,
    decrypt,
    vigenereEncrypt,
    vigenereDecrypt,
    playfairEncrypt,
    playfairDecrypt,
    railFenceEncrypt,
    railFenceDecrypt
  });
})();
