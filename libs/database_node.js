import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config(); 


const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let pool;
export async function initDB() {
  try {
    pool = await mysql.createPool({
      ...dbConfig,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    });
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
}


export async function query(sql, values = []) {
  if (!pool) throw new Error('Database not initialized.');
  const [results] = await pool.execute(sql, values);
  return results;
}


export async function addNode(nodePath) {
  try {
    const configPath = path.join(nodePath, 'node_config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    
    const result = await query(
      `INSERT INTO Nodes (name, author, description, version, guild_id, type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [config.name, config.author, config.description, config.node_version, config.node_guildid, config.node_type]
    );
    const nodeId = result.insertId;

    
    async function addFiles(dir, nodeId) {
      const files = await fs.readdir(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);

        if (file.isFile()) {
          const content = await fs.readFile(filePath, 'utf8');
          const [fileResult] = await query(
            `INSERT INTO NodeFiles (node_id, path) VALUES (?, ?)`,
            [nodeId, path.relative(nodePath, filePath)]
          );
          await query(
            `INSERT INTO NodeFilesContent (file_id, content) VALUES (?, ?)`,
            [fileResult.insertId, content]
          );
        } else if (file.isDirectory()) {
          await addFiles(filePath, nodeId); 
        }
      }
    }

    await addFiles(nodePath, nodeId);
  } catch (error) {
    console.error('Error adding node:', error);
  }
}


export async function loadNode(nodeName, destinationPath) {
  try {
    
    const [node] = await query(`SELECT * FROM Nodes WHERE name = ?`, [nodeName]);
    if (!node) throw new Error(`Node "${nodeName}" not found.`);

    
    const files = await query(
      `SELECT NodeFiles.path, NodeFilesContent.content
       FROM NodeFiles
       JOIN NodeFilesContent ON NodeFiles.file_id = NodeFilesContent.file_id
       WHERE NodeFiles.node_id = ?`,
      [node.node_id]
    );

    
    for (const file of files) {
      const filePath = path.join(destinationPath, file.path);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file.content, 'utf8');
    }
  } catch (error) {
    console.error('Error loading node:', error);
  }
}


export async function deleteNode(nodeName) {
  try {
    const [node] = await query(`SELECT node_id FROM Nodes WHERE name = ?`, [nodeName]);
    if (!node) throw new Error(`Node "${nodeName}" not found.`);

    
    await query(`DELETE FROM Nodes WHERE node_id = ?`, [node.node_id]);
    console.log(`Node "${nodeName}" and its files were successfully deleted.`);
  } catch (error) {
    console.error('Error deleting node:', error);
  }
}

export async function addOne(tableName, data) {
  try {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const sql = `INSERT INTO ?? (${columns}) VALUES (${placeholders})`;
    return await query(sql, [tableName, ...values]);
  } catch (error) {
    console.error('Error adding one item:', error);
  }
}


export async function addMultiple(tableName, dataArray) {
  try {
    if (dataArray.length === 0) return;
    const columns = Object.keys(dataArray[0]).join(', ');
    const placeholders = Object.keys(dataArray[0]).map(() => '?').join(', ');
    const sql = `INSERT INTO ?? (${columns}) VALUES ${dataArray.map(() => `(${placeholders})`).join(', ')}`;
    const values = [tableName, ...dataArray.flatMap(Object.values)];

    return await query(sql, values);
  } catch (error) {
    console.error('Error adding multiple items:', error);
  }
}


export async function removeOne(tableName, id) {
  try {
    const sql = `DELETE FROM ?? WHERE id = ?`;
    return await query(sql, [tableName, id]);
  } catch (error) {
    console.error('Error removing one item:', error);
  }
}


export async function removeMultiple(tableName, conditionField, conditionValue) {
  try {
    const sql = `DELETE FROM ?? WHERE ?? = ?`;
    return await query(sql, [tableName, conditionField, conditionValue]);
  } catch (error) {
    console.error('Error removing multiple items:', error);
  }
}


export async function addCollection(tableName, schema) {
  try {
    const columns = Object.entries(schema).map(([col, type]) => `?? ${type}`).join(', ');
    const sql = `CREATE TABLE IF NOT EXISTS ?? (${columns})`;
    const values = [tableName, ...Object.keys(schema)];
    
    return await query(sql, values);
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}


export async function removeCollection(tableName) {
  try {
    const sql = `DROP TABLE IF EXISTS ??`;
    return await query(sql, [tableName]);
  } catch (error) {
    console.error('Error removing collection:', error);
  }
}


export async function downloadFromChannel(interaction) {
  
}

