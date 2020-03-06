const fs = require('fs').promises
const Mustache = require('mustache')

console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

let aboutTemplate,
  configMakerTemplate,
  indexTemplate,

  aboutModalPartial,
  navPartial,
  sharedScriptsPartial,
  sharedStylesPartial

const templates = {}
const partials = {}

// Generates about.html if all the templates are loaded
function onAboutFilesLoaded () {
  if (aboutTemplate && navPartial && sharedStylesPartial) {
    fs.writeFile('./about.html', Mustache.render(aboutTemplate, {
      'js-possible': false
    }, {
      nav: navPartial,
      'shared-styles': sharedStylesPartial
    })).then(() => {
      console.log('generated about.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

// Generates configMaker/index.html if all the templates are loaded
function onConfigMakerFilesLoaded () {
  if (configMakerTemplate && aboutModalPartial && navPartial && partials['sharedScripts'] && sharedStylesPartial) {
    fs.writeFile('./configMaker/index.html', Mustache.render(configMakerTemplate, {
      'extended-path': '../',
      'js-possible': true
    }, {
      'about-modal': aboutModalPartial,
      nav: navPartial,
      'shared-styles': sharedStylesPartial,
      'shared-scripts': sharedScriptsPartial
    })).then(() => {
      console.log('generated configMaker/index.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

// Generates index.html if all the files are loaded
function onIndexFilesLoaded () {
  if (indexTemplate && aboutModalPartial && navPartial && sharedScriptsPartial && sharedStylesPartial) {
    fs.writeFile('./index.html', Mustache.render(indexTemplate, {
      'js-possible': true
    }, {
      'about-modal': aboutModalPartial,
      nav: navPartial,
      'shared-styles': sharedStylesPartial,
      'shared-scripts': sharedScriptsPartial
    })).then(() => {
      console.log('generated index.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

fs.readFile('./templates/about.mustache', 'utf8')
  .then((template) => {
    aboutTemplate = template
    onAboutFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

fs.readFile('./templates/configMaker.mustache', 'utf8')
  .then((template) => {
    configMakerTemplate = template
    onConfigMakerFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

fs.readFile('./templates/index.mustache', 'utf8')
  .then((template) => {
    indexTemplate = template
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

fs.readFile('./templates/about_modal.mustache', 'utf8')
  .then((template) => {
    aboutModalPartial = template
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

fs.readFile('./templates/nav.mustache', 'utf8')
  .then((template) => {
    navPartial = template
    onAboutFilesLoaded()
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

fs.readFile('./templates/sharedStyles.mustache', 'utf8')
  .then((template) => {
    sharedStylesPartial = template
    onAboutFilesLoaded()
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })

/*fs.readFile('./templates/sharedScripts.mustache', 'utf8')
  .then((template) => {
    sharedScriptsPartial = template
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })*/

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
      let key = /.*?([a-zA-Z]+)\.[a-z]+$/.exec(path)[1]

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

loadTemplate('./templates/sharedScripts.mustache', 'partial', [onConfigMakerFilesLoaded, onIndexFilesLoaded])
