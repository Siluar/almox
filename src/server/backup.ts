import fs from "fs";
import path from "path";

function dbPath(): string {
  return process.env.DB_PATH || "inventory.db";
}

function cleanupOldBackups(dir: string): void {
  const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 10);
  const files = fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".db"))
    .sort()
    .reverse();

  files.slice(keep).forEach(f => fs.rmSync(path.join(dir, f), { force: true }));
}

export function backupDatabase(): string | null {
  const dir = "backups";
  try {
    fs.mkdirSync(dir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const dest = path.join(dir, `inventory-${timestamp}.db`);
    fs.copyFileSync(dbPath(), dest);
    cleanupOldBackups(dir);
    return dest;
  } catch (err) {
    console.error("Backup automático falhou:", (err as Error).message);
    return null;
  }
}

export function startBackupSchedule(): void {
  const intervalHours = Math.max(1, Number(process.env.BACKUP_INTERVAL_HOURS) || 6);

  const initial = backupDatabase();
  if (initial) console.log(`Backup inicial criado: ${initial}`);

  setInterval(() => {
    backupDatabase();
  }, intervalHours * 60 * 60 * 1000);

  console.log(`Backup automático agendado a cada ${intervalHours}h.`);
}