import CFB from 'cfb';

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readUInt32LE(data: Uint8Array, offset: number): number {
  return (
    data[offset] |
    (data[offset + 1] << 8) |
    (data[offset + 2] << 16) |
    (data[offset + 3] << 24)
  );
}

function binaryToUnicode(text: string): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x80 && code <= 0x9f) {
      result.push(String.fromCharCode(0x20ac + (code - 0x80)));
    } else {
      result.push(text[i]);
    }
  }
  return result.join('');
}

function clean(text: string): string {
  return text
    .replace(/\x00/g, '')
    .replace(/\r\r/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractDocText(arrayBuffer: ArrayBuffer): string {
  const data = new Uint8Array(arrayBuffer);
  const cfb = CFB.read(data, { type: 'array' });

  const wordDocEntry = CFB.find(cfb, 'WordDocument');
  if (!wordDocEntry || !wordDocEntry.content) {
    throw new Error('Could not find WordDocument stream in .doc file');
  }
  const wordDoc = wordDocEntry.content instanceof Uint8Array
    ? wordDocEntry.content
    : new Uint8Array(wordDocEntry.content);

  const magic = readUInt16LE(wordDoc, 0);
  if (magic !== 0xa5ec) {
    throw new Error('This does not seem to be a valid Word .doc file');
  }

  const flags = readUInt16LE(wordDoc, 0xA);
  const streamName = (flags & 0x0200) !== 0 ? '1Table' : '0Table';

  const tableEntry = CFB.find(cfb, streamName);
  if (!tableEntry || !tableEntry.content) {
    throw new Error(`Could not find ${streamName} stream in .doc file`);
  }
  const tableData = tableEntry.content instanceof Uint8Array
    ? tableEntry.content
    : new Uint8Array(tableEntry.content);

  const ccpText = readUInt32LE(wordDoc, 0x004c);
  const ccpFtn = readUInt32LE(wordDoc, 0x0050);
  const ccpHdd = readUInt32LE(wordDoc, 0x0054);
  const ccpAtn = readUInt32LE(wordDoc, 0x005c);
  const ccpEdn = readUInt32LE(wordDoc, 0x0060);
  const ccpTxbx = readUInt32LE(wordDoc, 0x0064);
  const ccpHdrTxbx = readUInt32LE(wordDoc, 0x0068);

  let pos = readUInt32LE(wordDoc, 0x01a2);
  let flag: number;
  while (true) {
    flag = tableData[pos];
    if (flag !== 1) break;
    pos++;
    const skip = readUInt16LE(tableData, pos);
    pos += 2 + skip;
  }

  flag = tableData[pos];
  pos++;
  if (flag !== 2) {
    throw new Error('Corrupted Word file: invalid piece table marker');
  }

  const pieceTableSize = readUInt32LE(tableData, pos);
  pos += 4;

  const piecesCount = (pieceTableSize - 4) / 12;

  const pieceTexts: string[] = [];
  let startCp = 0;

  for (let x = 0; x < piecesCount; x++) {
    const lStart = readUInt32LE(tableData, pos + x * 4);
    const lEnd = readUInt32LE(tableData, pos + (x + 1) * 4);
    const totLength = lEnd - lStart;

    const offset = pos + ((piecesCount + 1) * 4) + x * 8 + 2;
    let startFilePos = readUInt32LE(tableData, offset);
    let unicode: boolean;

    if ((startFilePos & 0x40000000) === 0) {
      unicode = true;
    } else {
      startFilePos = startFilePos & ~(0x40000000);
      startFilePos = Math.floor(startFilePos / 2);
      unicode = false;
    }

    const size = unicode ? totLength * 2 : totLength;

    const textBuffer = wordDoc.slice(startFilePos, startFilePos + size);

    if (unicode) {
      const chars: string[] = [];
      for (let i = 0; i < textBuffer.length; i += 2) {
        chars.push(String.fromCharCode(readUInt16LE(textBuffer, i)));
      }
      pieceTexts.push(chars.join(''));
    } else {
      const binaryStr = Array.from(textBuffer)
        .map(b => String.fromCharCode(b))
        .join('');
      pieceTexts.push(binaryToUnicode(binaryStr));
    }

    startCp += totLength;
  }

  const fullText = pieceTexts.join('');

  const bodyEnd = ccpText;
  const body = fullText.substring(0, bodyEnd);

  return clean(body);
}
