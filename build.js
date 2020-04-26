const fs = require('fs')
const Mustache = require('mustache')
const Sass = require('sass')

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
    if (this.contents === undefined) {
      throw new ReferenceError('File contents not loaded')
    } else if (this.contents.trim() === '') {
      console.warn(`WARNING: ${this.path} is empty or contains only whitespace.`)
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
  // @param {SourceFile}    primarySource The source that references all other sources
  // @param  {SourceFile[]}  secondarySources The source files referenced by the primary source
  // @param  {function}      build(generatedFilePath, sourceFiles) The function to generate the file
  //   @param {string}         generatedFilePath the path to the file to be generated
  //   @param {SourceFile}     primarySource The source that references all other sources
  //   @param {object}         sourceFiles The source files referenced by the primary source in an object where the key for the source is the name of the source file excluding its extension
  //   @param {object}         buildOptions Additional arguments for generating the file
  // @param  {object}        buildOptions Additional arguments to be passed to the build function
  // @throws {TypeError}     when an argument is of the wrong type
  constructor (generatedFilePath, primarySource, secondarySources, build, buildOptions) {
    if (typeof generatedFilePath !== 'string') {
      throw new TypeError('Param generatedFilePath must be a string')
    }

    if (!(build instanceof Function)) {
      throw new TypeError('Param build must be a function')
    }

    if (!(primarySource instanceof SourceFile)) {
      throw new TypeError('Param primarySource must be a SourceFile')
    }

    if (!(secondarySources instanceof Array)) {
      throw new TypeError('Param secondarySources must be an Array')
    } else {
      secondarySources.forEach((source) => {
        if (!(source instanceof SourceFile)) {
          throw new TypeError('Param secondarySources can only contain SourceFile objects')
        }
      })
    }

    let secondarySourcesAsObject = {}

    secondarySources.forEach((source) => {
      secondarySourcesAsObject[/.*?\/_?([a-zA-Z]+)\.[a-z]+/.exec(source.path)[1]] = source
    })

    this.generatedFilePath = generatedFilePath
    this.primarySource = primarySource
    this.secondarySources = secondarySourcesAsObject
    this.build = build
    this.buildOptions = buildOptions
  }

  // Generates the file if all the sources are loaded
  generateFile () {
    const primarySource = this.primarySource
    const secondarySources = this.secondarySources

    if (primarySource.isLoaded() && Object.values(secondarySources).reduce((acc, source) => acc && source.isLoaded(), true)) {
      this.build(this.generatedFilePath, primarySource, secondarySources, this.buildOptions)
    }
  }

  // Determines whether the generated file is up to date with its source files
  //  @returns true if the generated file does not exist or is older than a source file. false otherwise
  isOutdated () {
    if (!fs.existsSync(this.generatedFilePath)) {
      return true
    } else {
      const generatedFileLastModifiedTime = fileLastModifiedTimes[this.generatedFilePath]

      if (generatedFileLastModifiedTime < fileLastModifiedTimes[this.primarySource.path]) {
        return true
      }

      for (const source in this.secondarySources) {
        if (generatedFileLastModifiedTime < fileLastModifiedTimes[this.secondarySources[source].path]) {
          return true
        }
      }

      return false
    }
  }
}

let checkedFileCount = 0
const trackedFiles = {
  sources: {
    'about.mustache':         new SourceFile('./templates/about.mustache'),
    'configMaker.mustache':   new SourceFile('./templates/configMaker.mustache'),
    'configMaker.scss':       new SourceFile('./css/sass/configMaker.scss'),
    'index.mustache':         new SourceFile('./templates/index.mustache'),
    'aboutModal.mustache':    new SourceFile('./templates/aboutModal.mustache'),
    'nav.mustache':           new SourceFile('./templates/nav.mustache'),
    'nav.scss':               new SourceFile('./css/sass/_nav.scss'),
    'sharedStyles.mustache':  new SourceFile('./templates/sharedStyles.mustache'),
    'sharedScripts.mustache': new SourceFile('./templates/sharedScripts.mustache'),
    'theme.scss':             new SourceFile('./css/sass/_theme.scss'),
    'themeForms.scss':        new SourceFile('./css/sass/_themeForms.scss')
  },
  generatedFiles: [
    './about.html',
    './configMaker/index.html',
    './index.html',
    './css/configMaker.css'
  ]
}

const fileLastModifiedTimes = {}
const sources = trackedFiles.sources
const TRACKED_FILE_COUNT = Object.keys(sources).length + trackedFiles.generatedFiles.length
/*
 * Functions to generate files
 */

// Generates HTML files from Mustache templates
function buildHTML (generatedFilePath, primarySource, secondarySources, buildOptions) {
  for (let sourceKey in secondarySources) {
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
      function(url) {
        return {
          contents: secondarySources[url].getContents()
        }
      }
    ],
    sourceComments: true
  }).css
  ).then(() => {
    console.log('generated css/configMaker.css')
  }).catch((err) => {
    console.log('ERROR: Failed to generate css/configMaker.css')
    console.error(err)
  })
}

const buildTrees = [
  new DependencyTree(
    './about.html',
    sources['about.mustache'],
    [
      sources['nav.mustache'],
      sources['sharedStyles.mustache']
    ],
    buildHTML,
    {
      'js-possible': false
    }
  ),
  new DependencyTree(
    './configMaker/index.html',
    sources['configMaker.mustache'],
    [
      sources['aboutModal.mustache'],
      sources['nav.mustache'],
      sources['sharedScripts.mustache'],
      sources['sharedStyles.mustache']
    ],
    buildHTML,
    {
      'extended-path':  '../',
      'js-possible':    true
    }
  ),
  new DependencyTree(
    './css/configMaker.css',
    sources['configMaker.scss'],
    [
      sources['nav.scss'],
      sources['theme.scss'],
      sources['themeForms.scss']
    ],
    buildCSS
  ),
  new DependencyTree(
    './index.html',
    sources['index.mustache'],
    [
      sources['aboutModal.mustache'],
      sources['nav.mustache'],
      sources['sharedScripts.mustache'],
      sources['sharedStyles.mustache']
    ],
    buildHTML,
    {
      'js-possible': true
    }
  )
]

// Determines which files to generate based on last modified times of files
function onLastModifiedTimesCollected () {
  console.log('WARNING: Generated files will only be updated if the source files were last modified later than the generated files.')

  buildTrees.forEach((buildTree) => {
    if (buildTree.isOutdated()) {
      const primarySource = buildTree.primarySource

      if (primarySource.loadCallbacks) {
        primarySource.loadCallbacks.push(() => { buildTree.generateFile() })
      } else {
        primarySource.loadCallbacks = [() => { buildTree.generateFile() }]
      }

      Object.values(buildTree.secondarySources).forEach((source) => {
        if (source.loadCallbacks) {
          source.loadCallbacks.push(() => { buildTree.generateFile() })
        } else {
          source.loadCallbacks = [() => { buildTree.generateFile() }]
        }
      })
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

      if (checkedFileCount === TRACKED_FILE_COUNT) {
        onLastModifiedTimesCollected()
      }
    }).catch((err) => {
      checkedFileCount++
      console.warn(err)
    })
}

// Check last modified times of all files
Object.values(sources).map((source) => source.path).forEach(checkLastModifiedTime)

trackedFiles.generatedFiles.forEach(checkLastModifiedTime)

