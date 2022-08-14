import Path from 'path';
import FS from 'fs/promises';

const exp = /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm;

// Credit to https://stackoverflow.com/questions/41462606/get-all-files-recursively-in-directories-nodejs
// Rewrite to properly handle async stuff
async function getFiles(directory: string) {
  const files: string[] = [];
  const results = await FS.readdir(directory);
  await Promise.all(
    results.map(async (file) => {
      const absolute = Path.join(directory, file);
      if (await FS.stat(absolute).then((fas) => fas.isDirectory()))
        return await getFiles(absolute);
      else return files.push(absolute);
    })
  );
  return files.flat();
}

type MatchResult = {
  index: number;
  match: string;
  file: string;
  line: number;
};

// Regex = /e\w?a/gm
//       Match 1          Match 2     Match 3
// "here is my example\n string example \n featuring multi-line.
//           i = 16          i = 33     i = 46
//
// str.slice(0, index).split('\n').length

function getLineNumberForIndex(
  index: number | undefined,
  data: string
): number | undefined {
  const preceedingText = data.slice(0, index);
  return preceedingText.split(/\r\n|\r|\n/).length;
}

async function main() {
  const args = process.argv.slice(2);
  const directory = args[0] || process.cwd();
  const files = await getFiles(directory);
  const results = await Promise.all(
    files.map(async (file) => {
      console.log('Reading file', file);
      const content = await FS.readFile(file, 'utf8');
      const results = content.matchAll(exp);
      const indices = [];
      const matchResults = [];
      for (const result of results) {
        indices.push(result.index);
        matchResults.push(<MatchResult>{
          index: result.index,
          line: getLineNumberForIndex(result.index, content),
          file,
          match: result.toString(),
        });
      }
      return matchResults;
    })
  );
  return results;
}

main().then((m) => console.log(m));
