console.log('Start');

const fs = require("fs");
const encoding = require("encoding");
const ibm866 = require("ibm866");
const inputFile = 'part_2.csv';
const iteratorFile = inputFile.split('.')[0] + "_temp.csv";



fs.readFile(inputFile, (err, data) => {
  if (err) {
    return console.error(err);
  }

  var fQuotes = [];
  var fCommas = [];

  let regQuotes = /\"(.*?)\"/g;
  let text = data.toString()

  let textArr = text.replace(regQuotes, function(match){
    fQuotes.push(match);
    return '';
  });

  fCommas = textArr.split(',');

  // test replace functions
  fs.writeFile(iteratorFile, textArr, function(err){
    if (err) {
      return console.error(err);
    }
    console.log("Data written!");
  });

  fs.writeFile('fCommas.csv', fCommas.join('\n'), e => console.log(e));
  fs.writeFile('fQuotes.csv', fQuotes.join('\n'), e => console.log(e));


  // fQuotes.forEach(v => console.log(v));


});
