import * as fs from 'fs-extra';
import * as path from 'path';

async function testFolderCreation() {
  try {
    console.log('Testing folder creation...');
    
    const checkpointsDbPath = path.join(process.cwd(), 'checkpoints_db');
    console.log('Creating checkpoints_db folder...');
    
    await fs.ensureDir(checkpointsDbPath);
    console.log('Folder created successfully!');
    
    const exists = await fs.pathExists(checkpointsDbPath);
    console.log(`Folder exists: ${exists}`);
    
    // Create a test file
    const testFile = path.join(checkpointsDbPath, 'test.txt');
    await fs.writeFile(testFile, 'test');
    console.log('Test file created');
    
    const files = await fs.readdir(checkpointsDbPath);
    console.log('Files in folder:', files);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testFolderCreation();
