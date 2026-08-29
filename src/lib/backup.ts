import { supabase } from '@/lib/supabase';
import { ROLE_PERMISSIONS } from '@/types/roles';

export interface BackupData {
  metadata: {
    system: string;
    version: string;
    generated_at: string;
    environment: string;
    tables_count: number;
    total_records: number;
  };
  roles_and_permissions: typeof ROLE_PERMISSIONS;
  database: {
    categories: any[];
    businesses: any[];
    menu_items: any[];
    promotions: any[];
    events: any[];
    profiles: any[];
    system_users: any[];
    user_favorites: any[];
    app_logs: any[];
    app_analytics: any[];
  };
}

export async function fetchFullDatabaseBackup(): Promise<BackupData> {
  const [
    { data: categories },
    { data: businesses },
    { data: menu_items },
    { data: promotions },
    { data: events },
    { data: profiles },
    { data: system_users },
    { data: user_favorites },
    { data: app_logs },
    { data: app_analytics },
  ] = await Promise.all([
    supabase.from('categories').select('*').order('name', { ascending: true }),
    supabase.from('businesses').select('*').order('name', { ascending: true }),
    supabase.from('menu_items').select('*').order('name', { ascending: true }),
    supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    supabase.from('events').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('system_users').select('*').order('created_at', { ascending: false }),
    supabase.from('user_favorites').select('*'),
    supabase.from('app_logs').select('*').order('created_at', { ascending: false }),
    supabase.from('app_analytics').select('*').order('created_at', { ascending: false }),
  ]);

  const db = {
    categories: categories || [],
    businesses: businesses || [],
    menu_items: menu_items || [],
    promotions: promotions || [],
    events: events || [],
    profiles: profiles || [],
    system_users: system_users || [],
    user_favorites: user_favorites || [],
    app_logs: app_logs || [],
    app_analytics: app_analytics || [],
  };

  const totalRecords = Object.values(db).reduce((acc, curr) => acc + curr.length, 0);

  return {
    metadata: {
      system: 'Directorio Residencial El Doral',
      version: '2.0.0',
      generated_at: new Date().toISOString(),
      environment: 'production',
      tables_count: Object.keys(db).length,
      total_records: totalRecords,
    },
    roles_and_permissions: ROLE_PERMISSIONS,
    database: db,
  };
}

export function downloadJsonBackup(backup: BackupData, filenamePrefix = 'Backup_Directorio_Residencial'): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${filenamePrefix}_${dateStr}.json`;

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadSqlBackup(backup: BackupData, filenamePrefix = 'Backup_Directorio_Residencial'): void {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${filenamePrefix}_${dateStr}.sql`;

  let sql = `-- Respaldo de Base de Datos - Directorio Residencial\n\n`;

  const escapeSql = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return `${val}`;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (Array.isArray(val) || typeof val === 'object') {
      return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    return `'${String(val).replace(/'/g, "''")}'`;
  };

  const generateTableSql = (tableName: string, rows: any[]) => {
    if (!rows || rows.length === 0) return '';

    let out = `-- Tabla: ${tableName}\n`;
    const cols = Object.keys(rows[0]);
    const colsList = cols.map((c) => `"${c}"`).join(', ');

    rows.forEach((row) => {
      const valuesList = cols.map((c) => escapeSql(row[c])).join(', ');
      out += `INSERT INTO public."${tableName}" (${colsList}) VALUES (${valuesList}) ON CONFLICT ("id") DO UPDATE SET ${cols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')};\n`;
    });

    out += '\n';
    return out;
  };

  sql += generateTableSql('categories', backup.database.categories);
  sql += generateTableSql('businesses', backup.database.businesses);
  sql += generateTableSql('menu_items', backup.database.menu_items);
  sql += generateTableSql('promotions', backup.database.promotions);
  sql += generateTableSql('events', backup.database.events);
  sql += generateTableSql('profiles', backup.database.profiles);
  sql += generateTableSql('system_users', backup.database.system_users);
  sql += generateTableSql('user_favorites', backup.database.user_favorites);
  sql += generateTableSql('app_logs', backup.database.app_logs);
  sql += generateTableSql('app_analytics', backup.database.app_analytics);

  const blob = new Blob([sql], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
