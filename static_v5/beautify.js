const esformatter = require('esformatter');
const fs          = require('fs');
const path        = require('path');
const walk        = require('fs-walk');

const options     = require('./esformatter.options.js');

function main() {
  // walk the src directory
  walk.walkSync(__dirname + '/src', function(basedir, filename) {
    if (shouldFormat(filename)) {
      let file      = path.join(basedir, filename);
      let contents  = fs.readFileSync(file).toString();
      let formatted = esformatter.format(contents, options);

      fs.writeFileSync(file, formatted);
    }
  });
}

function shouldFormat(filename) {
  var f = filename;
  return f.endsWith('.html') || f.endsWith('.js') || f.endsWith('.jsx');
}

if (require.main === module) {
  main();
}
