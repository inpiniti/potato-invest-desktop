import { exec } from 'child_process';
import { writeFile } from 'fs';

const command = 'git log --reverse --pretty=format:"|||COMMIT|||%h|%s|%cd" --name-only -n 30';

exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
  if (error) {
    console.error(error);
    return;
  }

  const raw = stdout.split('|||COMMIT|||').filter(Boolean);
  const commits = raw.map((chunk, index) => {
    const lines = chunk.trim().split('\n');
    const header = lines[0].split('|');
    const hash = header[0];
    const message = header[1];
    const date = header[2];
    const files = lines.slice(1).filter(line => line.trim() !== '');

    return {
      version: `0.0.${index}`,
      hash,
      date,
      message,
      files
    };
  });

  writeFile('patch_data.json', JSON.stringify(commits, null, 2), (err) => {
    if (err) console.error(err);
    else console.log('Successfully generated patch_data.json');
  });
});
