const config = require('./config');
const XLSX = require('xlsx');
const fs = require('fs');

console.log('Starting ...');


const workbook = XLSX.readFile(config.input);
const sheetNamesList = workbook.SheetNames;

let rawData = sheetParse(config.sheet);
let nodes = [[],[]];


console.log('Making nodes ...');
/* parse all data and creates question and answer nodes */
rawData.forEach(v => qaParser(v));

nodes[0].sort((a,b) => a.stepID - b.stepID);
nodes[1].sort((a,b) => a.questionID - b.questionID);


/* put all answers in every question node */
for (var i = 0; i < nodes[1].length; i++) {
  for (var j = 0; j < nodes[0].length; j++) {
    if(nodes[0][j].stepID === nodes[1][i].questionID){
      delete nodes[1][i].questionID;
      nodes[0][j].answers.push(nodes[1][i]);
      break;
    }
  }
}

console.log('All nodes done!');

let data = nodes[0].map(v => plistify(v)).reduce((a,b) => a + b);

let finalPlist = '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<array>\n'
+ data
+ '</array>\n</plist>\n';

let outFile = config.out.replace('$', sheetNamesList[config.sheet]);

fs.writeFile(outFile, finalPlist, (err) => {
  if (err) throw err;
  console.log('It\'s saved!');
});



/**
* Parse sheet in workbook by number
* @param number : Integer - index of sheet
* @return data : Array - array of stringified cell data
*/
function sheetParse(number){
  console.log('Parsing xlsx ....');

  let worksheet = workbook.Sheets[sheetNamesList[number]];
  let data = [];

  for (cell in worksheet) {
    /* all keys that do not begin with "!" correspond to cell addresses */
    if(cell[0] === '!') continue;
    data.push(JSON.stringify(worksheet[cell].v));
  }

  // console.log(sheet_name_list[2] + "!" + z + "=" + JSON.stringify(worksheet[z].v));
  console.log('Parsing done!');
  return data;
}

/**
* Creates question or answer object from input string and put them in nodes array
* @param str : String - input string
* @map question : Object - if str contains |QXXX| key where XXX - question ID
* @map question : Object - if str contains |QXXX?FY| key where XXX - question ID, FY - final tag true or false
* @map answer : Object - if str contains |QXXX:Y:QZZZ| key where
*                            XXX - parent question ID,
*                            Y - current answer ID,
*                            ZZZ - next step question ID
*/
function qaParser(str){


  str = str.trim();

  /* cuts metadata from input str and removes unnecessary beginning " */
  let meta = str.slice(str.indexOf('|'), str.lastIndexOf('|') + 1);

  /* cuts text string from input str and removes unnecessary ending " */
  let string = str.slice(str.lastIndexOf('|') + 1, -1);


  let aReg = /\|Q(\d*):(\d):Q(\d*)\|/i;
  let qReg = /\|Q(\d*)\|/i;
  let qfReg = /\|Q(\d*)\?(\w*)\|/i;

  let question = {
    text : "",
    answers : [],
    stepID : 0
  };

  let answer = {
    text : "",
    questionID : 0,
    answerID : 0,
    stepID : 0
  };


  if(meta.match(qReg)){
    question.text = string;
    question.stepID = qReg.exec(meta)[1];
    nodes[0].push(question);
    // return question;
  }

  if(meta.match(qfReg)){
    let opt = qfReg.exec(meta)
    question.text = string;
    question.stepID = opt[1];
    question.final = opt[2] == 'FT';
    delete question.answers;
    nodes[0].push(question);
    // return answer;
  }

  if(meta.match(aReg)){
    let opt = aReg.exec(meta);
    answer.text = string;
    answer.questionID = opt[1];
    answer.answerID = opt[2];
    answer.stepID = opt[3];
    nodes[1].push(answer);
    // return answer;
  }

  // return null;
}


/**
* Makes <dict>obj</dict> node
* @param obj : Object - input Object
* @return plist : String - plistified object :)
*/
function plistify(obj){

  let plist = '';

  for (var k in obj) {
    plist += '<key>' + k + '</key>\n'
    if(k === 'text'){
      if(obj[k].length > 140){
        plist += '<array>\n<string>' + tr(0,obj[k]).split("|").join('</string>\n<string>') + '</string>\n</array>\n';
      }
      else{
        plist += '<string>' + obj[k] + '</string>\n';
      }
    }
    if(k === 'stepID' || k == 'answerID'){
      plist += '<integer>' + obj[k] + '</integer>\n';
    }
    if(k === 'final'){
      plist += obj[k] ? '<true/>\n' : '<false/>\n';
    }
    if(k === 'answers'){
      plist += '<array>\n';
      for (let i = 0; i < obj[k].length; i++){
        plist += plistify(obj[k][i]);
      }
      plist += '</array>\n';
    }
  }

  return '<dict>\n' + plist + '</dict>\n';
}


function tr(start, str){
  if(start + 140 > str.length) return str.slice(start);
  let end = str.slice(start, start + 140).lastIndexOf(" ") + 1;
  let t = str.slice(start, end - 1);
  return t + '|' + tr (0, str.slice(end));
}
