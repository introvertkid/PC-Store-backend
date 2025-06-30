function getCallerInfo() {
  const stack = new Error().stack.split("\n");

  const match = stack[3].match(/at (?:file:\/\/\/)?(.*):(\d+):(\d+)/);

  if (match) {
    return {
      file: match[1].split(/[\\/]/).pop(),
      line: match[2],
      col: match[3],
    };
  }
  return { file: "unknownFilename", line: "-1", col: "-1" };
}

function debug(message) {
  const { file, line, col } = getCallerInfo();
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] [${file}:${line}:${col}] ${message}`);
}

export default {
  debug,
};
