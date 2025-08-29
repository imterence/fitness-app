const fs = require('fs')
const path = require('path')
const archiver = require('archiver')

// Create backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
const backupName = `fitness-hyrox-app-backup-${timestamp}.zip`
const backupPath = path.join(__dirname, '..', backupName)

// Create a file to stream archive data to
const output = fs.createWriteStream(backupPath)
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level
})

// Listen for all archive data to be written
output.on('close', () => {
  console.log(`✅ Backup created successfully!`)
  console.log(`📁 Backup file: ${backupName}`)
  console.log(`📊 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)
})

// Good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('⚠️ Warning:', err.message)
  } else {
    throw err
  }
})

// Good practice to catch this error explicitly
archive.on('error', (err) => {
  throw err
})

// Pipe archive data to the file
archive.pipe(output)

// Define what to exclude from backup
const excludePatterns = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '*.log',
  '*.zip',
  '*.backup',
  'fitness-hyrox-app-backup-*.zip'
]

// Function to check if path should be excluded
function shouldExclude(filePath) {
  return excludePatterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'))
      return regex.test(filePath)
    }
    return filePath.includes(pattern)
  })
}

// Function to add directory to archive
function addDirectoryToArchive(dirPath, archivePath = '') {
  const items = fs.readdirSync(dirPath)
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item)
    const relativePath = path.join(archivePath, item)
    
    if (shouldExclude(relativePath)) {
      console.log(`🚫 Excluding: ${relativePath}`)
      continue
    }
    
    const stat = fs.statSync(fullPath)
    
    if (stat.isDirectory()) {
      addDirectoryToArchive(fullPath, relativePath)
    } else {
      archive.file(fullPath, { name: relativePath })
      console.log(`📄 Added: ${relativePath}`)
    }
  }
}

console.log('🗜️  Starting project backup...')
console.log(`📂 Project directory: ${path.join(__dirname, '..')}`)
console.log(`💾 Backup will be saved as: ${backupName}`)
console.log('')

// Start the backup process
try {
  addDirectoryToArchive(path.join(__dirname, '..'))
  
  // Finalize the archive
  archive.finalize()
  
} catch (error) {
  console.error('❌ Backup failed:', error.message)
  process.exit(1)
}



