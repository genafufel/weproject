const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Подключение к базе данных
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function exportTables() {
  const client = await pool.connect();
  try {
    // Получаем список всех таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`Найдено ${tables.length} таблиц: ${tables.join(', ')}`);
    
    // Создаем файл для экспорта
    const exportFile = path.join(process.cwd(), 'weproject_data_export.sql');
    fs.writeFileSync(exportFile, '-- Экспорт weproject\n\n');
    
    // Экспортируем каждую таблицу
    for (const table of tables) {
      console.log(`Экспортируем таблицу: ${table}`);
      
      // Получаем данные таблицы
      const dataResult = await client.query(`SELECT * FROM "${table}"`);
      
      // Если в таблице есть данные
      if (dataResult.rows.length > 0) {
        const columns = Object.keys(dataResult.rows[0]).map(col => `"${col}"`).join(', ');
        
        fs.appendFileSync(exportFile, `\n-- Данные для таблицы ${table}\n`);
        fs.appendFileSync(exportFile, `TRUNCATE TABLE "${table}" CASCADE;\n`);
        
        // Добавляем INSERT запросы
        for (const row of dataResult.rows) {
          const values = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'object' && val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return val;
          }).join(', ');
          
          fs.appendFileSync(exportFile, `INSERT INTO "${table}" (${columns}) VALUES (${values});\n`);
        }
        
        console.log(`  Экспортировано ${dataResult.rows.length} записей`);
      } else {
        console.log(`  Таблица пуста`);
      }
    }
    
    console.log(`\nЭкспорт завершен! Файл: ${exportFile}`);
    console.log(`Размер файла: ${(fs.statSync(exportFile).size / 1024).toFixed(2)} КБ`);
    
  } catch (err) {
    console.error('Ошибка при экспорте:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

exportTables();
