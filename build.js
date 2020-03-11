const fs = require('fs').promises
const Mustache = require('mustache')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

const TRACKED_FILE_COUNT = 10
let checked_file_count = 0
const fileLastModifiedTimes = {}
const templates = {}
const partials = {}

// Asynchronously fetches the last modified time for a file and stores it in fileLastModifiedTimes
//   @param  {string}       path The path to the template to be loaded
//   @throws {SystemError}  When the file's metadata could not be read
//   @throws {TypeError}    When path is not a string
function checkLastModifiedTime(path){
  fs.stat(path)
    .then((stats) => {
      fileLastModifiedTimes[/.*?([a-zA-Z_]+\.[a-z]+)$/.exec(path)[1]] = stats.mtimeMs
      checked_file_count++

      if(checked_file_count > TRACKED_FILE_COUNT){
          throw new RangeError(`\n\nERROR: More files were asynchronously checked for last modified time than TRACKED_FILE_COUNT(${TRACKED_FILE_COUNT}).\n       The callback for all files checked may not work properly. Was a new file added?\n`)
      } else if(checked_file_count === TRACKED_FILE_COUNT){
        //all files checked callback
      }
    }).catch((err) => {
      throw err
    })
}

// Loads the contents of a template file
//   @param  {string}       path The path to the template to be loaded
//   @param  {string}       destination A string describing which object to store the template in
//   @param  {function[]}   callbackList An array of functions to run after the template has been loaded
//   @throws {RangeError}   When an unsupported destination is passed
//   @throws {SystemError}  When the file could not be read
//   @throws {TypeError}    When a parameter is of the incorrect type
function loadTemplate(path, destination, callbackList){
  if(!path instanceof String) {
    throw new TypeError('Param path is not a string')
  }

  if(!destination instanceof String) {
    throw new TypeError('Param destination is not a string')
  }

  if(!callbackList instanceof Array) {
    throw new TypeError('Param callbackList is not an array')
  }

  fs.readFile(path, 'utf8')
    .then((template) => {
      let key = /.*?([a-zA-Z_]+)\.[a-z]+$/.exec(path)[1]

      switch (destination) {
        case 'partial':
          partials[key] = template
          break;
        case 'template':
          templates[key] = template
          break;
        default:
          throw new RangeError('Unrecognized destination: ' + destination)
          break;
      }

      callbackList.forEach((elem) => {
        elem()
      })
    }).catch((err) => {
      throw err
    })
}

// Generates about.html if all required templates are loaded
function onAboutFilesLoaded () {
  if (templates['about'] && partials['nav'] && partials['sharedStyles']) {
    fs.writeFile('./about.html', Mustache.render(templates['about'], {
      'js-possible': false
    }, {
      nav: partials['nav'],
      'shared-styles': partials['sharedStyles']
    })).then(() => {
      console.log('generated about.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

// Generates configMaker/index.html if all required templates are loaded
function onConfigMakerFilesLoaded () {
  if (templates['configMaker'] && partials['about_modal'] && partials['nav'] && partials['sharedScripts'] && partials['sharedStyles']) {
    fs.writeFile('./configMaker/index.html', Mustache.render(templates['configMaker'], {
      'extended-path': '../',
      'js-possible': true
    }, {
      'about-modal': partials['about_modal'],
      nav: partials['nav'],
      'shared-styles': partials['sharedStyles'],
      'shared-scripts': partials['sharedScripts']
    })).then(() => {
      console.log('generated configMaker/index.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

// Generates index.html if all required templates are loaded
function onIndexFilesLoaded () {
  if (templates['index'] && partials['about_modal'] && partials['nav'] && partials['sharedScripts'] && partials['sharedStyles']) {
    fs.writeFile('./index.html', Mustache.render(templates['index'], {
      'js-possible': true
    }, {
      'about-modal': partials['about_modal'],
      nav: partials['nav'],
      'shared-styles': partials['sharedStyles'],
      'shared-scripts': partials['sharedScripts']
    })).then(() => {
      console.log('generated index.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

// Check last modified times of all files
trackedFiles = [
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

