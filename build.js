const fs = require('fs').promises
const Mustache = require('mustache')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

const TRACKED_FILE_COUNT = 10
let checkedFileCount = 0
const fileLastModifiedTimes = {}
const templates = {}
const partials = {}

class SourceFile {
  // @param   {string}    path The path to the source file
  // @param   {string}    type The type of source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path, type) {
    if(typeof path !==  'string') {
      throw new TypeError('Param path must be a string')
    }

    if(typeof type !== 'string') {
      throw new TypeError('Param type must be a string')
    }

    this.path = path
    this.type = type
  }

  // Loads the contents of the file
  //  @param {function[]} callbackList A list of functions to call after the source file has been loaded
  load(callbackList){
    
  }

  // Get the contents of the file
  //  @returns {string}         the contents of the file
  //  @throws  {ReferenceError} when the contents have not been loaded
  getContents(){
    if(!(this.contents)){
      throw new ReferenceError('File contents not loaded')
    }

    return this.contents
  }
}

// Represents a generated file and the source files used to generate it
class DependencyTree {
  // @param  {string}     generatedFilePath The path to the file generated
  // @param  {function}   generationCallback The function to generate the file after all the source files are loaded
  // @param  {SourceFile[]}  sources The source files needed to generate a file
  // @throws {TypeError} when an argument is of the wrong type
  constructor (generatedFilePath, generationCallback, sources) {
    if(generatedFilePath !== 'string') {
      throw new TypeError('Param generatedFilePath must be a string')
    }

    if(!(generationCallback instanceof Function)) {
      throw new TypeError('Param generationCallback must be a function')
    }

    if(!(sources instanceof Array)) {
      throw new TypeError('Param sources must be an Array')
    } else {
      sources.forEach((source) => {
        if(!(source instanceof SourceFile)){
          throw new TypeError('Param sources can only contain SourceFile objects')
        }
      })
    }

    this.generatedFilePath = generatedFilePath
    this.generationCallback = generationCallback
    this.sources = sources
  }

  isMemberSource(source) {
    return sources.includes(source)
  }
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

// Loads the contents of a source file
//   @param  {string}       path The path to the source to be loaded
//   @param  {string}       destination A string describing which object to store the source file contents in
//   @param  {function[]}   callbackList An array of functions to run after the source file has been loaded
//   @throws {RangeError}   When an unsupported destination is passed
//   @throws {SystemError}  When the file could not be read
//   @throws {TypeError}    When a parameter is of the incorrect type
function loadTemplate (path, destination, callbackList) {
  if (typeof path !== 'string') {
    throw new TypeError('Param path is not a string')
  }

  if (typeof destination !== 'string') {
    throw new TypeError('Param destination is not a string')
  }

  if (!(callbackList instanceof Array)) {
    throw new TypeError('Param callbackList is not an array')
  }

  fs.readFile(path, 'utf8')
    .then((source) => {
      const key = /.*?([a-zA-Z_]+)\.[a-z]+$/.exec(path)[1]

      switch (destination) {
        case 'partial':
          partials[key] = source
          break
        case 'template':
          templates[key] = source
          break
        default:
          throw new RangeError('Unrecognized destination: ' + destination)
      }

      callbackList.forEach((elem) => {
        elem()
      })
    }).catch((err) => {
      throw err
    })
}

// Generates about.html if all required source files are loaded
function onAboutFilesLoaded () {
  if (templates.about && partials.nav && partials.sharedStyles) {
    fs.writeFile('./about.html', Mustache.render(templates.about, {
      'js-possible': false
    }, {
      nav: partials.nav,
      'shared-styles': partials.sharedStyles
    })).then(() => {
      console.log('generated about.html')
    }).catch((err) => {
      console.log('ERROR: Failed to generate about.html')
      console.error(err)
    })
  }
}

// Generates configMaker/index.html if all required source files are loaded
function onConfigMakerFilesLoaded () {
  if (templates.configMaker && partials.about_modal && partials.nav && partials.sharedScripts && partials.sharedStyles) {
    fs.writeFile('./configMaker/index.html', Mustache.render(templates.configMaker, {
      'extended-path': '../',
      'js-possible': true
    }, {
      'about-modal': partials.about_modal,
      nav: partials.nav,
      'shared-styles': partials.sharedStyles,
      'shared-scripts': partials.sharedScripts
    })).then(() => {
      console.log('generated configMaker/index.html')
    }).catch((err) => {
      console.log('ERROR: Failed to generate configMaker/index.html')
      console.error(err)
    })
  }
}

// Generates index.html if all required source files are loaded
function onIndexFilesLoaded () {
  if (templates.index && partials.about_modal && partials.nav && partials.sharedScripts && partials.sharedStyles) {
    fs.writeFile('./index.html', Mustache.render(templates.index, {
      'js-possible': true
    }, {
      'about-modal': partials.about_modal,
      nav: partials.nav,
      'shared-styles': partials.sharedStyles,
      'shared-scripts': partials.sharedScripts
    })).then(() => {
      console.log('generated index.html')
    }).catch((err) => {
      console.error('ERROR: Failed to generate index.html')
      console.error(err)
    })
  }
}

// Determines which files to generate based on last modified times of files
function onLastModifiedTimesCollected () {
  let requiredSources = {},
      aboutTime = fileLastModifiedTimes['./about.html'],
      aboutTemplateTime = fileLastModifiedTimes['./templates/about.mustache'],
      navTemplateTime = fileLastModifiedTimes['./templates/nav.mustache']


  if( aboutTemplateTime > aboutTime || navTemplateTime > aboutTime){
    requiredSources['./templates/about.mustache'] = {
      type: 'template',

    }
  }

  for(let source in requiredSources){
  
  }
}

// Check last modified times of all files
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

trackedFiles.forEach((filePath) => {
  checkLastModifiedTime(filePath)
})

loadTemplate('./templates/about.mustache', 'template', [onAboutFilesLoaded])
loadTemplate('./templates/configMaker.mustache', 'template', [onConfigMakerFilesLoaded])
loadTemplate('./templates/index.mustache', 'template', [onIndexFilesLoaded])
loadTemplate('./templates/about_modal.mustache', 'partial', [onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/nav.mustache', 'partial', [onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/sharedStyles.mustache', 'partial', [onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/sharedScripts.mustache', 'partial', [onConfigMakerFilesLoaded, onIndexFilesLoaded])
