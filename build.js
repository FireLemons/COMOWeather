const fs = require('fs')
const Mustache = require('mustache')
const Sass = require('sass')

// Represents a generic file
class File {
  // @param   {string}    path The path to the source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path) {
    this.path = path

    if (typeof path !== 'string') {
      throw new TypeError('Param path must be a string')
    }

    this.promiseStat = null
  }

  // Stat this file
  //   @return {Promise}     a promise awating the stat operation of the file
  //   @throws {SystemError} When the file could not be stat
  stat () {
    const path = this.path

    if (this.promiseStat === null) {
      this.promiseStat = fs.promises.stat(path)
        .then((stats) => {
          this.lastModifiedTime = stats.mtimeMs
        })
    }

    return this.promiseStat
  }
}

// Represents a source file used to generate a file
class SourceFile extends File {
  // @param   {string}    path The path to the source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path) {
    super(path)

    // DependencyTrees this SourceFile is a member of
    this.containingTrees = []

    this.promiseLoad = null
  }

  // Get the contents of the file
  //  @return  {string}         the contents of the file
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

  // Loads the contents of this file
  //   @return {Promise}     a promise awaiting loading the contents of the file
  //   @throws {SystemError} When the file could not be read
  load () {
    if (this.promiseLoad === null) {
      this.promiseLoad = fs.promises.readFile(this.path, 'utf8')
        .then((contents) => {
          this.contents = contents
        }).catch((err) => {
          throw err
        })
    }

    return this.promiseLoad
  }
}

// Represents a generated file
class GeneratedFile extends File {
  // @param   {string}    path The path to the source file
  // @throws  {TypeError} when an argument is of the wrong type
  constructor (path) {
    super(path)

    // DependencyTrees this GeneratedFile is a member of
    this.containingTrees = []
  }
}

// Represents a generated file and the source files used to generate it
class DependencyTree {
  // @param  {string|GeneratedFile} generatedFile The path to the file generated
  // @param  {SourceFile}           primarySource The source that references all other sources
  // @param  {SourceFile[]}         secondarySources The source files referenced by the primary source
  // @param  {function}             build(generatedFilePath, sourceFiles) The function to generate the file
  //   @param {string}                generatedFilePath the path to the file to be generated
  //   @param {SourceFile}            primarySource The source that references all other sources
  //   @param {object}                sourceFiles The source files referenced by the primary source in an object where the key for the source is the name of the source file excluding its extension
  //   @param {object}                buildOptions Additional arguments for generating the file
  // @param  {object}               buildOptions Additional arguments to be passed to the build function
  // @throws {TypeError}            when an argument is of the wrong type
  constructor (generatedFile, primarySource, secondarySources, build, buildOptions) {
    if ((typeof generatedFile !== 'string') && !(generatedFile instanceof GeneratedFile)) {
      throw new TypeError('Param generatedFile must be a string or GeneratedFile')
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

    // convert secondarySources to object
    const secondarySourcesAsObject = {}

    secondarySources.forEach((source) => {
      secondarySourcesAsObject[/.*?\/_?([a-zA-Z]+)\.[a-z]+/.exec(source.path)[1]] = source
    })

    this.build = build
    this.buildOptions = buildOptions
    this.generatedFile = (generatedFile instanceof GeneratedFile) ? generatedFile : new GeneratedFile(generatedFile)
    this.primarySource = primarySource
    this.secondarySources = secondarySourcesAsObject
    this.statFileCount = 0
    this.TRACKED_FILE_COUNT = secondarySources.length + 2

    // Add reference to this parent tree for member files
    this.getFiles().forEach((file) => {
      file.containingTrees.push(this)
    })
  }

  // Generates the file if all the sources are loaded
  //  @return {Promise} A promise representing the file generation
  generateFile () {
    return this.loadFiles()
      .then(() => {
        this.build(this.generatedFile.path, this.primarySource, this.secondarySources, this.buildOptions)
      })
  }

  // Get a list of all files associated with this tree
  //  @return {Object[]} an unsorted array containing this tree's GeneratedFile and all SourceFiles
  getFiles () {
    return Object.values(this.secondarySources).concat(this.primarySource, this.generatedFile)
  }

  // Get a list of all sources associated with this tree
  //  @return {SourceFile[]} an unsorted array containing this tree's SourceFiles
  getSources () {
    return Object.values(this.secondarySources).concat(this.primarySource)
  }

  // Determines whether the generated file is up to date with its source files
  //  @return {boolean} true if the generated file does not exist or is older than a source file. false otherwise
  isOutdated () {
    const sources = this.getSources()

    // Check if all sources were stat
    const unstatSource = sources.some((source) => {
      if (!source.lastModifiedTime) {
        console.error(`ERROR: Could not determine if ${this.generatedFile.path} is updated. Required source ${source.path} was not stat`)
        return true
      }
    })

    if (unstatSource) {
      return false
    }

    if (!this.generatedFile.lastModifiedTime) {
      return true
    } else {
      const generatedFileLastModifiedTime = this.generatedFile.lastModifiedTime
      const updatedSource = sources.some((source) => {
        return generatedFileLastModifiedTime < source.lastModifiedTime
      })

      if (updatedSource) {
        return true
      }

      return false
    }
  }

  loadFiles () {
    return new Promise((resolve, reject) => {
      const sources = this.getSources()
      let sourceLoadCount = 0

      sources.forEach((source) => {
        source.load()
        .then(() => {
          sourceLoadCount++

          if (sourceLoadCount === sources.length) {
            resolve()
          }
        })
        .catch((err) => {
          console.error(`Failed to load source ${source.path}`)
          reject(err)
        })
      })
    })
  }

  // Retrieves last modiifed times for all files
  //  @return {Promise} A promise representing the file generation
  statFiles () {
    const files = this.getFiles()

    return new Promise((resolve, reject) => {
      files.forEach((file) => {
        if (file instanceof SourceFile) {
          file.stat()
            .catch((err) => {
              console.error(`ERROR: Failed to stat ${file.path}. Files requiring ${file.path} will not be generated.`)
              reject(err)
            })
            .finally(() => {
              this.statFileCount++

              if (this.statFileCount === files.length) {
                resolve()
              }
            })
        } else { // File is generated file
          file.stat()
          .catch((err) => {
            console.warn(`WARNING: Failed to stat ${file.path}. File is assumed to have not been generated yet`)
            console.warn(err)
          }).finally(() => {
            this.statFileCount++

            if (this.statFileCount === files.length) {
              resolve()
            }
          })
        }
      })
    })
  }
}

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
    console.log('generated css/configMaker.css')
  }).catch((err) => {
    console.log('ERROR: Failed to generate css/configMaker.css')
    console.error(err)
  })
}

const sources = {
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
      'extended-path': '../',
      'js-possible':   true
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
