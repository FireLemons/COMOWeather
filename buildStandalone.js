const fs = require('fs')
const Mustache = require('mustache')
const Sass = require('sass')
const { SourceFile, DependencyTree } = require('./builder.js')

/*
 * Functions to generate files
 */

// Generates HTML files from Mustache templates
function buildHTML (generatedFilePath, primarySource, secondarySources, buildOptions) {
  for (const sourceKey in secondarySources) {
    secondarySources[sourceKey] = secondarySources[sourceKey].getContents()
  }

  fs.promises.writeFile(generatedFilePath, Mustache.render(primarySource.getContents(), buildOptions, secondarySources)).then(() => {
    console.log(`generated ${generatedFilePath}`)
  }).catch((err) => {
    console.log(`ERROR: Failed to generate ${generatedFilePath}`)
    console.error(err)
  })
}

// Generates css files from scss files
function buildCSS (generatedFilePath, primarySource, secondarySources) {
  fs.promises.writeFile(generatedFilePath, Sass.renderSync({
    data: primarySource.getContents(),
    importer: [
      function (url) {
        return {
          contents: secondarySources[url].getContents()
        }
      }
    ],
    sourceComments: true
  }).css
  ).then(() => {
    console.log(`generated ${generatedFilePath}`)
  }).catch((err) => {
    console.log(`ERROR: Failed to generate ${generatedFilePath}`)
    console.error(err)
  })
}

const sources = {
  'configMaker.mustache':   new SourceFile('./templates/configMaker.mustache'),
  'configMaker.scss':       new SourceFile('./css/scss/configMaker.scss'),
  'index.mustache':         new SourceFile('./templates/index.mustache'),
  'nav.scss':               new SourceFile('./configMaker/css/scss/_nav.scss'),
  'sharedStyles.mustache':  new SourceFile('./templates/sharedStyles.mustache'),
  'sharedScripts.mustache': new SourceFile('./templates/sharedScripts.mustache'),
  'theme.scss':             new SourceFile('./css/scss/_theme.scss'),
  'themeForms.scss':        new SourceFile('./css/scss/_themeForms.scss')
}

const buildTrees = [
  new DependencyTree(
    './configMaker/index.html',
    sources['configMaker.mustache'],
    [
      sources['sharedScripts.mustache'],
      sources['sharedStyles.mustache']
    ],
    buildHTML,
    {
      'js-possible':   true
    }
  ),
  new DependencyTree(
    './configMaker/css/configMaker.css',
    sources['configMaker.scss'],
    [
      sources['theme.scss'],
      sources['themeForms.scss'],
      sources['nav.scss']
    ],
    buildCSS
  ),
]

// Lazily builds generated files from dependencies
//  @param  {DependencyTree[]}  buildTrees A list of the files to be generated and their dependencies represented as trees
//  @throws {TypeError}         when an argument is of the wrong type
function build (buildTrees) {
  if (!(buildTrees instanceof Array)) {
    throw new TypeError('Param buildTrees must be an array')
  }

  buildTrees.forEach((buildTree, index) => {
    if (!(buildTree instanceof DependencyTree)) {
      throw new TypeError(`Param buildTrees must contain only DependencyTree objects. Encountered incompatible object at index: ${index}`)
    }
  })

  console.log('INFO: Generated files will only be updated if the source files were last modified later than the generated files.')

  buildTrees.forEach((buildTree) => {
    buildTree.statFiles()
      .then(() => {
        if (buildTree.isOutdated()) {
          buildTree.generateFile()
        }
      })
  })
}

build(buildTrees)
