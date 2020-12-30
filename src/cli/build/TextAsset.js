const { Asset } = require('parcel-bundler')

module.exports = class TextAsset extends Asset {
  constructor(name, pkg, options) {
    super(name, pkg, options)
    this.type = 'js'
  }

  generate() {
    const content = JSON.stringify(this.contents);

    return [{ type: 'js', value: `module.exports = ${content}` }]
  }
}