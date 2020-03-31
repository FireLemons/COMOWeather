const fs = require('fs')
const Mustache = require('mustache')
const Sass = require('sass')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

// Represents a source file used to generate a file
class SourceFile {
  // @param   {string}    path The path to the source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path, type) {
    if (typeof path !== 'string') {
      throw new TypeError('Param path must be a string')
    }

    this.path = path
  }

  // Get the contents of the file
  //  @returns {string}         the contents of the file
  //  @throws  {ReferenceError} when the contents have not been loaded
  getContents () {
    if (!(this.contents)) {
      throw new ReferenceError('File contents not loaded')
    }

    return this.contents
  }

  // Returns whether the contents have been loaded
  //   @returns {boolean} True if the contents of the file have been loaded. False otherwise
  isLoaded () {
    return this.contents !== undefined
  }

  // Loads the contents of the file
  //   @param {function[]} callbackList A list of functions to call after the source file has been loaded
  //   @throws {SystemError}  When the file could not be read
  //   @throws {TypeError}    When a parameter is of the incorrect type
  load (callbackList) {
    if (!(callbackList instanceof Array)) {
      throw new TypeError('Param callbackList is not an array')
    } else {
      callbackList.forEach((callback) => {
        if (!(callback instanceof Function)) {
          throw new TypeError('Param callbackList can only contain function objects')
        }
      })
    }

    fs.promises.readFile(this.path, 'utf8')
      .then((contents) => {
        this.contents = contents

        callbackList.forEach((elem) => {
          elem()
        })
      }).catch((err) => {
        throw err
      })
  }
}

// Represents a generated file and the source files used to generate it
class DependencyTree {
  // @param  {string}        generatedFilePath The path to the file generated
  // @param  {function}      build The function to generate the file
  // @param  {SourceFile[]}  sources The source files needed to generate a file
  // @throws {TypeError}     when an argument is of the wrong type
  constructor (generatedFilePath, build, sources) {
    if (typeof generatedFilePath !== 'string') {
      throw new TypeError('Param generatedFilePath must be a string')
    }

    if (!(build instanceof Function)) {
      throw new TypeError('Param build must be a function')
    }

    if (!(sources instanceof Array)) {
      throw new TypeError('Param sources must be an Array')
    } else {
      sources.forEach((source) => {
        if (!(source instanceof SourceFile)) {
          throw new TypeError('Param sources can only contain SourceFile objects')
        }
      })
    }

    this.generatedFilePath = generatedFilePath
    this.build = build
    this.sources = {}

    const fileNamePattern = /.*?\/([a-zA-Z_]+\.[a-z]+)/

    sources.forEach((source) => {
      this.sources[fileNamePattern.exec(source.path)[1]] = source
    })
  }

  // Generates the file if all the sources are loaded
  generateFile () {
    if (Object.values(this.sources).reduce((acc, source) => acc && source.isLoaded(), true)) {
      this.build(this.sources)
    }
  }

  // Determines whether the generated file is up to date with its source files
  //  @returns true if the generated file does not exist or is older than a source file. false otherwise
  isOutdated () {
    if (!fs.existsSync(this.generatedFilePath)) {
      return true
    } else {
      const generatedFileLastModifiedTime = fileLastModifiedTimes[this.generatedFilePath]

      for (const source in this.sources) {
        if (generatedFileLastModifiedTime < fileLastModifiedTimes[this.sources[source].path]) {
          return true
        }
      }

      return false
    }
  }
}

let checkedFileCount = 0
const TRACKED_FILE_COUNT = 12
const trackedFiles = [
  './about.html',
  './configMaker/index.html',
  './index.html',
  './templates/about.mustache',
  './templates/configMaker.mustache',
  './templates/index.mustache',
  './templates/aboutModal.mustache',
  './templates/nav.mustache',
  './templates/sharedStyles.mustache',
  './templates/sharedScripts.mustache',
  './css/configMaker.css',
  './css/sass/configMaker.scss'
]

const fileLastModifiedTimes = {}
const sources = {
  'about.mustache':         new SourceFile('./templates/about.mustache'),
  'configMaker.mustache':   new SourceFile('./templates/configMaker.mustache'),
  'configMaker.scss':       new SourceFile('./css/sass/configMaker.scss'),
  'index.mustache':         new SourceFile('./templates/index.mustache'),
  'aboutModal.mustache':    new SourceFile('./templates/aboutModal.mustache'),
  'nav.mustache':           new SourceFile('./templates/nav.mustache'),
  'sharedStyles.mustache':  new SourceFile('./templates/sharedStyles.mustache'),
  'sharedScripts.mustache': new SourceFile('./templates/sharedScripts.mustache')
}

/*
 * Functions to generate files
 */

// Generates about.html
function buildAboutHTML (sourceFiles) {
  fs.promises.writeFile('./about.html', Mustache.render(sources['about.mustache'].getContents(), {
    'js-possible':    false
  }, {
    'nav':          sources['nav.mustache'].getContents(),
    'sharedStyles': sources['sharedStyles.mustache'].getContents()
  })).then(() => {
    console.log('generated about.html')
  }).catch((err) => {
    console.log('ERROR: Failed to generate about.html')
    console.error(err)
  })
}

// Generates configMaker/index.html
function buildConfigMakerIndexHTML (sourceFiles) {
  fs.promises.writeFile('./configMaker/index.html', Mustache.render(sources['configMaker.mustache'].getContents(), {
    'extended-path':  '../',
    'js-possible':    true
  }, {
    'aboutModal':    sources['aboutModal.mustache'].getContents(),
    'nav':           sources['nav.mustache'].getContents(),
    'sharedStyles':  sources['sharedStyles.mustache'].getContents(),
    'sharedScripts': sources['sharedScripts.mustache'].getContents()
  })).then(() => {
    console.log('generated configMaker/index.html')
  }).catch((err) => {
    console.log('ERROR: Failed to generate configMaker/index.html')
    console.error(err)
  })
}

// Generates css/configMaker.css
function buildConfigMakerCSS (sourceFiles) {
  fs.promises.writeFile('./css/configMaker.css', Sass.renderSync({data: sources['configMaker.scss'].getContents()}).css
  ).then(() => {
    console.log('generated css/configMaker.css')
  }).catch((err) => {
    console.log('ERROR: Failed to generate css/configMaker.css')
    console.error(err)
  })
}

// Generates index.html
function buildIndexHTML (sourceFiles) {
  fs.promises.writeFile('./index.html', Mustache.render(sourceFiles['index.mustache'].getContents(), {
    'js-possible':    true
  }, {
    'aboutModal':     sourceFiles['aboutModal.mustache'].getContents(),
    'nav':            sourceFiles['nav.mustache'].getContents(),
    'sharedScripts':  sourceFiles['sharedScripts.mustache'].getContents(),
    'sharedStyles':   sourceFiles['sharedStyles.mustache'].getContents()
  })).then(() => {
    console.log('generated index.html')
  }).catch((err) => {
    console.error('ERROR: Failed to generate index.html')
    console.error(err)
  })
}

const buildTrees = {
  'about.html':             new DependencyTree('./about.html',             buildAboutHTML,            [sources['about.mustache'], sources['nav.mustache'], sources['sharedStyles.mustache']]),
  'configMaker/index.html': new DependencyTree('./configMaker/index.html', buildConfigMakerIndexHTML, [sources['configMaker.mustache'], sources['aboutModal.mustache'], sources['nav.mustache'], sources['sharedScripts.mustache'], sources['sharedStyles.mustache']]),
  'css/configMaker.css':    new DependencyTree('./css/configMaker.css',    buildConfigMakerCSS,       [sources['configMaker.scss']]),
  'index.html':             new DependencyTree('./index.html',             buildIndexHTML,            [sources['index.mustache'], sources['aboutModal.mustache'], sources['nav.mustache'], sources['sharedScripts.mustache'], sources['sharedStyles.mustache']])
}

// Determines which files to generate based on last modified times of files
function onLastModifiedTimesCollected () {
  Object.values(buildTrees).forEach((buildTree) => {
    if (buildTree.isOutdated()) {
      for (const sourceKey in buildTree.sources) {
        const source = sources[sourceKey]
        if (source.loadCallbacks) {
          source.loadCallbacks.push(() => { buildTree.generateFile() })
        } else {
          source.loadCallbacks = [() => { buildTree.generateFile() }]
        }
      }
    }
  })

  Object.values(sources).forEach((source) => {
    if (source.loadCallbacks) {
      source.load(source.loadCallbacks)
    }
  })
  
  console.log('Finished generating files')
}

// Asynchronously fetches the last modified time for a file and stores it in fileLastModifiedTimes
//   @param  {string}       path The path to the source file to be loaded
//   @throws {TypeError}    When path is not a string
function checkLastModifiedTime (path) {
  if (typeof path !== 'string') {
    throw new TypeError('Param path must be a string')
  }

  fs.promises.stat(path)
    .then((stats) => {
      fileLastModifiedTimes[path] = stats.mtimeMs
      checkedFileCount++

      if (checkedFileCount > TRACKED_FILE_COUNT) {
        throw new RangeError(`\n\nERROR: More files were asynchronously checked for last modified time than TRACKED_FILE_COUNT(${TRACKED_FILE_COUNT}).\n       The callback for all files checked may not work properly. Was a new file added?\n`)
      } else if (checkedFileCount === TRACKED_FILE_COUNT) {
        onLastModifiedTimesCollected()
      }
    }).catch((err) => {
      checkedFileCount++
      console.error(err)
    })
}

// Check last modified times of all files
trackedFiles.forEach((filePath) => {
  checkLastModifiedTime(filePath)
})

