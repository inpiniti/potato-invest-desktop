import { exec } from 'child_process';
import { writeFile } from 'fs';

exec('git log --pretty=format:"%H|%s|%cd" --date=short -n 30', { encoding: 'utf8' }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // 한글 깨짐 방지를 위해 stdout 자체를 그대로 파일로 저장해본다.
  // Node.js exec의 encoding: 'utf8'이 잘 먹히길 기대함.
  writeFile('git_log_utf8.txt', stdout, (err) => {
    if (err) console.error(err);
    else console.log('Log saved to git_log_utf8.txt');
  });
});
