const fs = require('fs').promises
const Mustache = require('mustache')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

class SourceFile {
  // @param   {string}    path The path to the source file
  // @param   {string}    type The type of source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path, type) {
    if (typeof path !== 'string') {
      throw new TypeError('Param path must be a string')
    }

    if (typeof type !== 'string') {
      throw new TypeError('Param type must be a string')
    }

    this.path = path
    this.type = type
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

    fs.readFile(this.path, 'utf8')
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

    const fileName = /.*?\/([a-zA-Z_]+)\.[a-z]+/

    sources.forEach((source) => {
      this.sources[fileName.exec(source.path)[1]] = source
    })

    console.log(this.sources)
  }

  // Generates the file if all the sources are loaded
  generateFile () {
    if (this.sources.reduce((acc, source) => acc || source.isLoaded(), true)) {
      this.build()
    }
  }
}

let checkedFileCount = 0
const TRACKED_FILE_COUNT = 10
const trackedFiles = [
  './about.html',
  './configMaker/index.html',
  './index.html',
  './templates/about.mustache',
  './templates/configMaker.mustache',
  './templates/index.mustache',
  './templates/about_modal.mustache',
  './templates/nav.mustache',
  './templates/sharedStyles.mustache',
  './templates/sharedScripts.mustache'
]

const fileLastModifiedTimes = {}
const sources = {
  about: new SourceFile('./templates/about.mustache', 'template'),
  configMaker: new SourceFile('./templates/configMaker.mustache', 'template'),
  index: new SourceFile('./templates/index.mustache', 'template'),
  about_modal: new SourceFile('./templates/about_modal.mustache', 'partial'),
  nav: new SourceFile('./templates/nav.mustache', 'partial'),
  sharedStyles: new SourceFile('./templates/sharedStyles.mustache', 'partial'),
  sharedScripts: new SourceFile('./templates/sharedScripts.mustache', 'partial')
}

/*
 * Functions to generate files
 */

// Generates about.html
function buildAboutHTML (sourceFiles) {
  fs.writeFile('./about.html', Mustache.render(sources.about.getContents(), {
    'js-possible': false
  }, {
    nav: sources.nav.getContents(),
    'shared-styles': sources.sharedStyles.getContents()
  })).then(() => {
    console.log('generated about.html')
  }).catch((err) => {
    console.log('ERROR: Failed to generate about.html')
    console.error(err)
  })
}

// Generates configMaker/index.html
function buildConfigMakerIndexHTML (sourceFiles) {
  fs.writeFile('./configMaker/index.html', Mustache.render(sources.configMaker.getContents(), {
    'extended-path': '../',
    'js-possible': true
  }, {
    'about-modal': sources.about_modal.getContents(),
    nav: sources.nav.getContents(),
    'shared-styles': sources.sharedStyles.getContents(),
    'shared-scripts': sources.sharedScripts.getContents()
  })).then(() => {
    console.log('generated configMaker/index.html')
  }).catch((err) => {
    console.log('ERROR: Failed to generate configMaker/index.html')
    console.error(err)
  })
}

// Generates index.html
function buildIndexHTML (sourceFiles) {
  fs.writeFile('./index.html', Mustache.render(sourceFiles.index.getContents(), {
    'js-possible': true
  }, {
    'about-modal': sourceFiles.about_modal.getContents(),
    nav: sourceFiles.nav.getContents(),
    'shared-scripts': sourceFiles.sharedScripts.getContents(),
    'shared-styles': sourceFiles.sharedStyles.getContents()
  })).then(() => {
    console.log('generated index.html')
  }).catch((err) => {
    console.error('ERROR: Failed to generate index.html')
    console.error(err)
  })
}

const buildTrees = {
  'about.html': new DependencyTree('./about.html', buildAboutHTML, [sources.about, sources.nav, sources.sharedStyles]),
  'configMaker/index.html': new DependencyTree('./configMaker/index.html', buildConfigMakerIndexHTML, [sources.configMaker, sources.about_modal, sources.nav, sources.sharedScripts, sources.sharedStyles]),
  'index.html': new DependencyTree('./index.html', buildIndexHTML, [sources.index, sources.about_modal, sources.nav, sources.sharedScripts, sources.sharedStyles])
}

// Asynchronously fetches the last modified time for a file and stores it in fileLastModifiedTimes
//   @param  {string}       path The path to the source file to be loaded
//   @throws {SystemError}  When the file's metadata could not be read
//   @throws {TypeError}    When path is not a string
function checkLastModifiedTime (path) {
  fs.stat(path)
    .then((stats) => {
      fileLastModifiedTimes[path] = stats.mtimeMs
      checkedFileCount++

      if (checkedFileCount > TRACKED_FILE_COUNT) {
        throw new RangeError(`\n\nERROR: More files were asynchronously checked for last modified time than TRACKED_FILE_COUNT(${TRACKED_FILE_COUNT}).\n       The callback for all files checked may not work properly. Was a new file added?\n`)
      } else if (checkedFileCount === TRACKED_FILE_COUNT) {
        // all files checked callback
      }
    }).catch((err) => {
      throw err
    })
}

// Determines which files to generate based on last modified times of files
function onLastModifiedTimesCollected () {
  const requiredSources = {}
  const aboutTime = fileLastModifiedTimes['./about.html']
  const aboutTemplateTime = fileLastModifiedTimes['./templates/about.mustache']
  const navTemplateTime = fileLastModifiedTimes['./templates/nav.mustache']

  if (aboutTemplateTime > aboutTime || navTemplateTime > aboutTime) {

  }

  for (const source in requiredSources) {

  }
}

// Check last modified times of all files

trackedFiles.forEach((filePath) => {
  checkLastModifiedTime(filePath)
})

sources.about.load([onAboutFilesLoaded])
sources.configMaker.load([onConfigMakerFilesLoaded])
sources.index.load([onIndexFilesLoaded])
sources.about_modal.load([onConfigMakerFilesLoaded, onIndexFilesLoaded])
sources.nav.load([onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
sources.sharedStyles.load([onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
sources.sharedScripts.load([onConfigMakerFilesLoaded, onIndexFilesLoaded])
