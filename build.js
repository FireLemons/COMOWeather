const fs = require('fs').promises
const Mustache = require('mustache')

let aboutTemplate,
    configMakerTemplate,
    indexTemplate,

    navPartial,
    navHeaderPartial

function onConfigMakerFilesLoaded(){

  if(configMakerTemplate && navPartial){
    console.log(Mustache.render(configMakerTemplate, {}, {
      nav: navPartial
    }))
  }
}

fs.readFile('./templates/configMaker.mustache', 'utf8')
  .then((template) => {
    configMakerTemplate = template
    onConfigMakerFilesLoaded()
  }).catch((err) => {
    console.log(err)
  })


fs.readFile('./templates/nav.mustache', 'utf8')
  .then((html) => {
    navPartial = html
    onConfigMakerFilesLoaded()
  }).catch((err) => {
    console.log(err)
  })
