import Path from 'path';
import FS from 'fs';

const exp = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;

// Credit to https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
function getFiles(directory: string) {
  const files: string[] = [];
  FS.readdirSync(directory).forEach((file) => {
    const absolute = Path.join(directory, file);
    if (FS.statSync(absolute).isDirectory()) return getFiles(absolute);
    else return files.push(absolute);
  });
  return files.flat();
}

function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || process.cwd();
  const files = getFiles(directory);
  const results = files
    .map((file) => {
      const content = FS.readFileSync(file, 'utf8');
      return content.match(exp);
    })
    .flat()
    .filter((x) => x);

  console.log(results);
}

main();
