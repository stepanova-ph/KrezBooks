import fs from 'fs';
import path from 'path';
import { app } from 'electron';

let logStream: fs.WriteStream | null = null;

function getLogPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'app.log');
}

function initLogStream() {
  if (!logStream) {
    const logPath = getLogPath();
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
    console.log('Logging to:', logPath);
  }
}

function log(level: string, ...args: any[]) {
  initLogStream();
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${level}] ${args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ')}\n`;
  
  logStream?.write(message);
  console.log(...args); // Still log to console in dev
}

export const logger = {
  info: (...args: any[]) => log('INFO', ...args),
  error: (...args: any[]) => log('ERROR', ...args),
  log: (...args: any[]) => log('LOG', ...args),
  debug: (...args: any[]) => log('DEBUG', ...args),
  warn: (...args: any[]) => log('WARN', ...args),
};