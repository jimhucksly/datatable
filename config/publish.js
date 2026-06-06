const path = require('path');
const fs = require('fs');
const json = require('../package.json');

function publish() {
  try {
    const splited = json.version.split('.').map((e, i, arr) => {
      if (i === arr.length - 1) {
        return Number(e) + 1;
      }
      return e;
    });
    json.version = splited.join('.');
    const data = JSON.stringify(json, null, 2) + '\n';
    fs.writeFileSync(path.resolve(__dirname, '../package.json'), data);
  } catch (e) {
    /* eslint-disable no-console */
    console.log(e);
  }
};

publish();
