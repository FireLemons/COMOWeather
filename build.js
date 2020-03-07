const fs = require('fs').promises
const Mustache = require('mustache')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

const templates = {}
const partials = {}

// Generates about.html if all the templates are loaded
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

// Generates configMaker/index.html if all the templates are loaded
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

// Generates index.html if all the files are loaded
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

// Loads the contents of a template file
//   @param  {string}     path The path to the template to be loaded
//   @param  {string}     destination A string describing which object to store the template in
//   @param  {function[]} callbackList An array of functions to run after the template has been loaded
//   @throws {RangeError} When an unsupported destination is passed
//   @throws {TypeError}  When a parameter is of the incorrect type
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
      console.error(err)
    })
}

loadTemplate('./templates/about.mustache', 'template', [onAboutFilesLoaded])
loadTemplate('./templates/configMaker.mustache', 'template', [onConfigMakerFilesLoaded])
loadTemplate('./templates/index.mustache', 'template', [onIndexFilesLoaded])
loadTemplate('./templates/about_modal.mustache', 'partial', [onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/nav.mustache', 'partial', [onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/sharedStyles.mustache', 'partial', [onAboutFilesLoaded, onConfigMakerFilesLoaded, onIndexFilesLoaded])
loadTemplate('./templates/sharedScripts.mustache', 'partial', [onConfigMakerFilesLoaded, onIndexFilesLoaded])

