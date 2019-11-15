const fs = require('fs').promises
const Mustache = require('mustache')

let aboutTemplate,
    configMakerTemplate,
    indexTemplate,

    navPartial,
    navHeaderPartial

function onConfigMakerFilesLoaded(){
  if(configMakerTemplate && navPartial){
    fs.writeFile('./configMaker.html', Mustache.render(configMakerTemplate, {}, {
      nav: navPartial
    })).then(() => {
      console.log('generated configMaker.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

function onIndexFilesLoaded(){
  if(indexTemplate && navPartial){
    fs.writeFile('./index.html', Mustache.render(indexTemplate, {}, {
      nav: navPartial
    })).then(() => {
      console.log('generated index.html')
    }).catch((err) => {
      console.error(err)
    })
  }
}

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

fs.readFile('./templates/nav.mustache', 'utf8')
  .then((html) => {
    navPartial = html
    onConfigMakerFilesLoaded()
    onIndexFilesLoaded()
  }).catch((err) => {
    console.error(err)
  })
