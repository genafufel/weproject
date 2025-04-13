import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Получение директории текущего файла в ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function exportSchema() {
  const client = await pool.connect();
  try {
    // Создаем файл для экспорта схемы
    const exportFile = path.join(process.cwd(), 'weproject_schema.sql');
    fs.writeFileSync(exportFile, '-- Экспорт схемы weproject\n\n');
    
    // Получаем список таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Найдено ${tables.length} таблиц: ${tables.join(', ')}`);
    
    // Для каждой таблицы получаем DDL
    for (const table of tables) {
      console.log(`Экспортируем схему таблицы: ${table}`);
      
      // Получаем структуру таблицы
      const columnsResult = await client.query(`
        SELECT column_name, data_type, character_maximum_length, 
               column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      fs.appendFileSync(exportFile, `\n-- Схема таблицы ${table}\n`);
      fs.appendFileSync(exportFile, `CREATE TABLE IF NOT EXISTS "${table}" (\n`);
      
      const columns = columnsResult.rows.map(col => {
        let definition = `  "${col.column_name}" ${col.data_type}`;
        
        if (col.character_maximum_length) {
          definition += `(${col.character_maximum_length})`;
        }
        
        if (col.column_default) {
          definition += ` DEFAULT ${col.column_default}`;
        }
        
        if (col.is_nullable === 'NO') {
          definition += ' NOT NULL';
        }
        
        return definition;
      });
      
      // Получаем первичный ключ
      const pkResult = await client.query(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
        ORDER BY kcu.ordinal_position
      `, [table]);
      
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(row => `"${row.column_name}"`).join(', ');
        columns.push(`  PRIMARY KEY (${pkColumns})`);
      }
      
      fs.appendFileSync(exportFile, columns.join(',\n') + '\n);\n\n');
      
      // Получаем индексы
      const indexesResult = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = $1
          AND indexname NOT LIKE '%_pkey'
      `, [table]);
      
      if (indexesResult.rows.length > 0) {
        fs.appendFileSync(exportFile, `-- Индексы таблицы ${table}\n`);
        for (const idx of indexesResult.rows) {
          fs.appendFileSync(exportFile, `${idx.indexdef};\n`);
        }
        fs.appendFileSync(exportFile, '\n');
      }
    }
    
    // Получаем внешние ключи
    fs.appendFileSync(exportFile, `-- Внешние ключи\n`);
    const fksResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);
    
    for (const fk of fksResult.rows) {
      fs.appendFileSync(exportFile, `ALTER TABLE "${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" ` +
                                   `FOREIGN KEY ("${fk.column_name}") REFERENCES "${fk.foreign_table_name}" ("${fk.foreign_column_name}");\n`);
    }
    
    // Получаем последовательности
    const sequencesResult = await client.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `);
    
    if (sequencesResult.rows.length > 0) {
      fs.appendFileSync(exportFile, `\n-- Последовательности\n`);
      for (const seq of sequencesResult.rows) {
        fs.appendFileSync(exportFile, `-- Sequence: ${seq.sequence_name}\n`);
        
        // Получаем значение последовательности
        const currvalResult = await client.query(`
          SELECT last_value FROM "${seq.sequence_name}"
        `);
        
        if (currvalResult.rows.length > 0) {
          const lastValue = currvalResult.rows[0].last_value;
          fs.appendFileSync(exportFile, `SELECT setval('${seq.sequence_name}', ${lastValue}, true);\n\n`);
        }
      }
    }
    
    console.log(`\nЭкспорт схемы завершен! Файл: ${exportFile}`);
    console.log(`Размер файла: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} КБ`);
    
  } catch (err) {
    console.error('Ошибка при экспорте схемы:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

exportSchema();
