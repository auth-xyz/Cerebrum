import fs from 'fs/promises'

export function validateConfig(config) {
    const requiredFields = {
        name: 'string',
        author: 'string',
        description: 'string',
        node_version: 'string',
        node_guildid: 'string',
        node_type: 'string',
        node_commands: 'array',
        node_events: 'array'
    };

    return Object.keys(requiredFields).every(field => {
        const expectedType = requiredFields[field];
        const actualType = Array.isArray(config[field]) ? 'array' : typeof config[field];
        return actualType === expectedType;
    });
}

export async function extractFunctionName(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const match = fileContent.match(/(?:export\s+default|module\.exports\s*=\s*)\s*(\w+)/);
        return match ? match[1] : path.basename(filePath);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return path.basename(filePath);
    }
}

export async function mapFunctionsToFiles(files) {
    const result = [];
    for (const file of files) {
        const functionName = await extractFunctionName(file);
        result.push({ functionName, file });
    }
    return result;
}

export function categorizeByType(files) {
    const categorized = { mjs: [], ts: [], js: [] };

    files.forEach(file => {
        const fileType = file.split('.').pop();
        if (categorized[fileType]) {
            categorized[fileType].push(file);
        } else {
            console.warn(`Unrecognized file type: ${file}`);
        }
    });

    return categorized;
}

export async function exists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function readNodeConfig(configPath) {
    const data = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(data);
}


