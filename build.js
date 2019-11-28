const fs = require('fs').promises
const Mustache = require('mustache')

let aboutTemplate,
    configMakerTemplate,
    indexTemplate,

    aboutModalPartial,
    navPartial,
    sharedScriptsPartial,
    sharedStylesPartial

function onAboutFilesLoaded(){
  if(aboutTemplate && navPartial && sharedStylesPartial){
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

function onConfigMakerFilesLoaded(){
  if(configMakerTemplate && aboutModalPartial && navPartial && sharedScriptsPartial && sharedStylesPartial){
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

function onIndexFilesLoaded(){
  if(indexTemplate && aboutModalPartial && navPartial && sharedScriptsPartial && sharedStylesPartial){
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

fs.readFile('./templates/sharedScripts.mustache', 'utf8')
  .then((template) => {
    sharedScriptsPartial = template
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })
