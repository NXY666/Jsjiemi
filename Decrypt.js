/* JS简易解密
* 作者：NXY666
* 用法：在FILE_NAME中填写路径，运行即可。
* 输出：
*   encryptEdited1.js：去除全局加密
*   encryptEdited2.js：去除函数加密
*   encryptEdited3.js：去除if-else死代码
*   encryptEdited4.js：16进制数字转10进制、['XXX']转.XXX.
*/
const FILE_NAME = "encryptRowWithTag.js";

const fs = require("fs");

let js = fs.readFileSync(FILE_NAME).toString();

Array.prototype.top = function () {
	return this[this.length - 1];
};
//如果是对象，则返回空数组
function splitStatements(jsStr) {
	let signStack = [];
	let jsArr = [];

	let startPos = 0, nowPos = 0;
	for (; nowPos < jsStr.length; nowPos++) {
		switch (jsStr[nowPos]) {
			case '(':
			case '[':
			case '{':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					signStack.push(jsStr[nowPos]);
				}
				break;
			case ')':
				if (signStack.top() === '(') {
					signStack.pop();
				}
				break;
			case ']':
				if (signStack.top() === '[') {
					signStack.pop();
				}
				break;
			case '}':
				if (signStack.top() === '{') {
					signStack.pop();
				}
				break;
			case '/':
				if (signStack.top() === jsStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//[{( +-* <>=? &|! ~^
					if (jsStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsStr[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//开始字符串
					signStack.push(jsStr[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
					continue;
				}
				break;
			default:
				break;
		}
		if (
			jsStr[nowPos] === '}' &&
			(
				jsStr.slice(nowPos + 1, nowPos + 1 + 4) !== "else" &&
				jsStr.slice(nowPos + 1, nowPos + 1 + 5) !== "while" &&
				jsStr.slice(nowPos + 1, nowPos + 1 + 7) !== "finally" &&
				jsStr.slice(nowPos + 1, nowPos + 1 + 5) !== "catch" &&
				jsStr[nowPos + 1] !== ';' &&
				jsStr[nowPos + 1] !== '=' &&
				jsStr[nowPos + 1] !== ',' &&
				jsStr[nowPos + 1] !== '('
			) ||
			jsStr[nowPos] === ';'
		) {
			if (signStack.length === 0) {
				jsArr.push(jsStr.slice(startPos, nowPos + 1));
				startPos = nowPos + 1;
			}
		}
	}
	return jsArr.filter(function (statement) {
		return statement !== ';';
	});
}
function transEval(jsStr) {
	return eval(
		jsStr
		.replace(/\\/g, "\\\\")
		.replace(/\\n/g, "\\\\n")
		.replace(/\\r/g, "\\\\r")
		.replace(/\\c/g, "\\\\c")
		.replace(/\\f/g, "\\\\f")
		.replace(/\\s/g, "\\\\s")
		.replace(/\\S/g, "\\\\S")
		.replace(/\\t/g, "\\\\t")
		.replace(/\\v/g, "\\\\v")
		.replace(/\\"/g, '\\\\"')
		.replace(/\\'/g, "\\\\'")
		.replace(/\\\(/g, "\\\\(")
		.replace(/\\\)/g, "\\\\)")
		.replace(/\\\*/g, "\\\\*")
		.replace(/\\\+/g, "\\\\+")
		.replace(/\\\./g, "\\\\.")
		.replace(/\\\[/g, "\\\\[")
		.replace(/\\\?/g, "\\\\?")
		.replace(/\\\^/g, "\\\\^")
		.replace(/\\\|/g, "\\\\|")
	);
}
function transGlobalEval(jsStr) {
	return global.eval(
		jsStr
		.replace(/\\/g, "\\\\")
		.replace(/\\n/g, "\\\\n")
		.replace(/\\r/g, "\\\\r")
		.replace(/\\c/g, "\\\\c")
		.replace(/\\f/g, "\\\\f")
		.replace(/\\s/g, "\\\\s")
		.replace(/\\S/g, "\\\\S")
		.replace(/\\t/g, "\\\\t")
		.replace(/\\v/g, "\\\\v")
		.replace(/\\"/g, '\\\\"')
		.replace(/\\'/g, "\\\\'")
		.replace(/\\\(/g, "\\\\(")
		.replace(/\\\)/g, "\\\\)")
		.replace(/\\\*/g, "\\\\*")
		.replace(/\\\+/g, "\\\\+")
		.replace(/\\\./g, "\\\\.")
		.replace(/\\\[/g, "\\\\[")
		.replace(/\\\?/g, "\\\\?")
		.replace(/\\\^/g, "\\\\^")
		.replace(/\\\|/g, "\\\\|")
	);
}
function runFunc(funcJs) {
	let signStack = [];

	for (let nowPos = 0; nowPos < funcJs.length; nowPos++) {
		switch (funcJs[nowPos]) {
			case ')':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					return "'" + transEval(funcJs.slice(0, nowPos + 1)).replace(/'/g, "\\'") + "'" + funcJs.slice(nowPos + 1);
				}
				break;
			case '/':
				if (signStack.top() === funcJs[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.length === 0) {
					//[{( +-* <>=? &|! ~^
					if (funcJs[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(funcJs[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === funcJs[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.length === 0) {
					//开始字符串
					signStack.push(funcJs[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				break;
		}
	}
}
function decryptGlobalJs(js) {
	js = js.replace(/!!\[]/g, "true").replace(/!\[]/g, "false");
	let jsArr = splitStatements(js);

	transGlobalEval(jsArr.slice(0, 3).join(";"));

	let globalDecryptFuncName = jsArr[2].slice(9, jsArr[2].indexOf("("));

	return jsArr.slice(3, -1).map(function (funcJs) {
		let signStack = [];

		for (let nowPos = 0; nowPos < funcJs.length; nowPos++) {
			switch (funcJs[nowPos]) {
				case '/':
					if (signStack.top() === funcJs[nowPos]) {
						//结束正则
						signStack.pop();
					} else if (signStack.length === 0) {
						//[{( +-* <>=? &|! ~^
						if (funcJs[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
							//开始正则
							signStack.push(funcJs[nowPos]);
						}
					}
					break;
				case '"':
				case "'":
				case '`':
					if (signStack.top() === funcJs[nowPos]) {
						//结束字符串
						signStack.pop();
					} else if (signStack.length === 0) {
						//开始字符串
						signStack.push(funcJs[nowPos]);
					}
					break;
				case '\\':
					if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
						nowPos++;
					}
					break;
				default:
					if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`' && funcJs.indexOf(globalDecryptFuncName, nowPos) === nowPos) {
						funcJs = funcJs.slice(0, nowPos) + runFunc(funcJs.slice(nowPos)).replace(/\n/g, '\\n');
						nowPos--;
					}
					break;
			}
		}

		return funcJs;
	});
}
jsStatementsArr = decryptGlobalJs(js);
fs.writeFileSync("encryptEdited1.js", jsStatementsArr.join("\n"));

function transformJsStr(jsStr) {
	let signStack = [];

	jsStr = jsStr.split("");
	for (let nowPos = 0; nowPos < jsStr.length; nowPos++) {
		switch (jsStr[nowPos]) {
			case '/':
				if (signStack.top() === jsStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.length === 0) {
					//[{( +-* <>=? &|! ~^
					if (jsStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsStr[nowPos]);
					}
				} else {
					jsStr[nowPos] = 'R';
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.length === 0) {
					//开始字符串
					signStack.push(jsStr[nowPos]);
				} else {
					jsStr[nowPos] = 'S';
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					jsStr[nowPos] = 'S';
				}
				break;
		}
	}
	return jsStr.join("");
}
function checkFuncDecryptor(jsStr) {
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		return false;
	}
	let transformStr = transformJsStr(jsStr);

	let funcNum = transformStr.match(/'([a-zA-Z]){5}':function\(/g) || [],
		strNum = transformStr.match(/'([a-zA-Z]){5}':'/g) || [],
		commaNum = transformStr.match(/,'/g) || [];

	if (funcNum.length + strNum.length - 1 === commaNum.length) {
		return transformStr.slice(4, transformStr.indexOf("="));
	}
	return false;
}
function replaceFunc(jsFuncStr) {
	let signStack = [], argsArr = [];

	let startArgIndex = 0, funcEndIndex = 0;
	for (let nowPos = 0; nowPos < jsFuncStr.length; nowPos++) {
		switch (jsFuncStr[nowPos]) {
			case '(':
			case '[':
			case '{':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					signStack.push(jsFuncStr[nowPos]);
				}
				break;
			case '}':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					signStack.pop();
				}
				break;
			case ']':
				if (signStack.top() === '[') {
					signStack.pop();
					if (signStack.length === 0) {
						funcEndIndex = nowPos;
						startArgIndex = funcEndIndex + 2;
						//直接把函数拿过来
						if (jsFuncStr[nowPos + 1] !== '(') {
							return transEval(jsFuncStr.slice(0, funcEndIndex + 1)).toString() + jsFuncStr.slice(funcEndIndex + 1);
						}
					}
				}
				break;
			case ')':
				if (signStack.top() === '(') {
					signStack.pop();
					if (signStack.length === 0) {
						argsArr.push(jsFuncStr.slice(startArgIndex, nowPos).replace(/\n/g, '\\n').replace(/"/g, '\\"'));
						let newFunc = procFunc(transEval(jsFuncStr.slice(0, funcEndIndex + 1)));
						return transEval(newFunc + "newFunc(\"" + argsArr.join('","') + "\")") + jsFuncStr.slice(nowPos + 1);
					}
				}
				break;
			case ',':
				if (signStack.length === 1 && signStack.top() === "(") {
					argsArr.push(jsFuncStr.slice(startArgIndex, nowPos).replace(/\n/g, '\\n').replace(/"/g, '\\"'));
					startArgIndex = nowPos + 1;
				}
				break;
			case '/':
				if (signStack.top() === jsFuncStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//[{( +-* <>=? &|! ~^
					if (jsFuncStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsFuncStr[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsFuncStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//开始字符串
					signStack.push(jsFuncStr[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				break;
		}
	}
}
function procFunc(func) {
	let funcRowStr = func.toString();
	let transFuncStr = transformJsStr(funcRowStr);
	let argStartPos = transFuncStr.indexOf('('), argEndPos = transFuncStr.indexOf(')');
	let argsArr = funcRowStr.slice(argStartPos + 1, argEndPos).split(",");

	let funcContent = funcRowStr.slice(transFuncStr.indexOf("{") + 1, transFuncStr.lastIndexOf("}"));
	argsArr.forEach(function (arg) {
		funcContent = funcContent.replace(new RegExp(arg, 'g'), "${" + arg + "}");
	});

	funcContent = funcContent.replace("return ", "return `").replace(";", "`;");

	func = "newFunc=function(" + argsArr.join(",") + "){" + funcContent + "};";

	return func;
}
function getObjStr(jsObjStr) {
	let signStack = [];

	for (let nowPos = 0; nowPos < jsObjStr.length; nowPos++) {
		switch (jsObjStr[nowPos]) {
			case ']':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					let replaceStr = transEval(jsObjStr.slice(0, nowPos + 1));
					if (typeof replaceStr == "string") {
						return "'" + replaceStr.replace(/'/g, "\\'") + "'" + jsObjStr.slice(nowPos + 1);
					} else {
						return replaceFunc(jsObjStr);
					}
				}
				break;
			case '/':
				if (signStack.top() === jsObjStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.length === 0) {
					//[{( +-* <>=? &|! ~^
					if (jsObjStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsObjStr[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsObjStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.length === 0) {
					//开始字符串
					signStack.push(jsObjStr[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				break;
		}
	}
}
function decryptJsArr(funcJsArr) {
	let decryptorObjName = checkFuncDecryptor(funcJsArr[0]);
	if (decryptorObjName) {
		transGlobalEval(funcJsArr[0]);
		funcJsArr = funcJsArr.slice(1).map(function (funcJs) {
			let signStack = [];

			for (let nowPos = 0; nowPos < funcJs.length; nowPos++) {
				switch (funcJs[nowPos]) {
					case '/':
						if (signStack.top() === funcJs[nowPos]) {
							//结束正则
							signStack.pop();
						} else if (signStack.length === 0) {
							//[{( +-* <>=? &|! ~^
							if (funcJs[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
								//开始正则
								signStack.push(funcJs[nowPos]);
							}
						}
						break;
					case '"':
					case "'":
					case '`':
						if (signStack.top() === funcJs[nowPos]) {
							//结束字符串
							signStack.pop();
						} else if (signStack.length === 0) {
							//开始字符串
							signStack.push(funcJs[nowPos]);
						}
						break;
					case '\\':
						if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
							nowPos++;
						}
						break;
					default:
						if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`' && funcJs.indexOf(decryptorObjName, nowPos) === nowPos) {
							funcJs = funcJs.slice(0, nowPos) + getObjStr(funcJs.slice(nowPos));
							nowPos--;
						}
						break;
				}
			}

			return funcJs;
		});
	}

	funcJsArr = funcJsArr.map(function (statement) {
		let signStack = [];

		let startPos = -1;
		for (let nowPos = 0; nowPos < statement.length; nowPos++) {
			switch (statement[nowPos]) {
				case '{':
					if (signStack.length === 0) {
						startPos = nowPos;
					}
					if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						signStack.push(statement[nowPos]);
					}
					break;
				case '}':
					if (signStack.top() === '{') {
						signStack.pop();
					}
					if (signStack.length === 0 && startPos !== -1) {
						let splitStatementsRes = splitStatements(statement.slice(startPos + 1, nowPos));
						// console.log("quote:", statement.slice(startPos, nowPos + 1));
						if (splitStatementsRes.length) {
							statement = statement.slice(0, startPos + 1) + decryptJsArr(splitStatementsRes).join("").replace(/\n/g, "\\n") + statement.slice(nowPos);
						}
						startPos = -1;
					}
					break;
				case '/':
					if (signStack.top() === statement[nowPos]) {
						//结束正则
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//[{( +-* <>=? &|! ~^
						if (statement[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
							//开始正则
							signStack.push(statement[nowPos]);
						}
					}
					break;
				case '"':
				case "'":
				case '`':
					if (signStack.top() === statement[nowPos]) {
						//结束字符串
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//开始字符串
						signStack.push(statement[nowPos]);
					}
					break;
				case '\\':
					if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
						nowPos++;
					}
					break;
				default:
					break;
			}
		}
		return statement;
	});

	return funcJsArr;
}
jsStatementsArr = decryptJsArr(jsStatementsArr);
fs.writeFileSync("encryptEdited2.js", jsStatementsArr.join("\n"));

function simplifyIf(ifJsStr) {
	let ifRes = eval(ifJsStr.slice(2, 21));
	let elsePos = skipQuote(ifJsStr, 21) + 1;
	let endPos = skipQuote(ifJsStr, elsePos + 4);

	// console.log("true: ", ifJsStr.slice(22, elsePos - 1));
	// console.log("false: ", ifJsStr.slice(elsePos + 5, endPos));

	if (ifRes) {
		return ifJsStr.slice(22, elsePos - 1) + ifJsStr.slice(endPos + 1);
	} else {
		return ifJsStr.slice(elsePos + 5, endPos) + ifJsStr.slice(endPos + 1);
	}
}
function skipQuote(jsStr, startPos) {
	let signStack = [];

	for (let nowPos = startPos; nowPos < jsStr.length; nowPos++) {
		switch (jsStr[nowPos]) {
			case '{':
				signStack.length === 0 && (startPos = nowPos);
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					signStack.push(jsStr[nowPos]);
				}
				break;
			case '}':
				if (signStack.top() === '{') {
					signStack.pop();
				}
				break;
			case '/':
				if (signStack.top() === jsStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//[{( +-* <>=? &|! ~^
					if (jsStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsStr[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//开始字符串
					signStack.push(jsStr[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				break;
		}
		if (signStack.length === 0) {
			return nowPos;
		}
	}
}
function clearDeadCodes(globalJsArr) {
	return globalJsArr.map(function (statement) {
		let signStack = [];

		for (let nowPos = 0; nowPos < statement.length; nowPos++) {
			switch (statement[nowPos]) {
				case '/':
					if (signStack.top() === statement[nowPos]) {
						//结束正则
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//[{( +-* <>=? &|! ~^
						if (statement[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
							//开始正则
							signStack.push(statement[nowPos]);
						}
					}
					break;
				case '"':
				case "'":
				case '`':
					if (signStack.top() === statement[nowPos]) {
						//结束字符串
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//开始字符串
						signStack.push(statement[nowPos]);
					}
					break;
				case '\\':
					if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
						nowPos++;
					}
					break;
				default:
					let nextStr = statement.slice(nowPos);
					if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						if (nextStr.search(/if\('([a-zA-Z]){5}'([=!])?=='([a-zA-Z]){5}'\)/) === 0) {
							statement = statement.slice(0, nowPos) + simplifyIf(nextStr);
						}
					}
					break;
			}
		}
		return statement;
	});
}
jsStatementsArr = clearDeadCodes(jsStatementsArr);
fs.writeFileSync("encryptEdited3.js", jsStatementsArr.join("\n"));

function parseCrochets(lastChar, quoteJsStr) {
	let signStack = [];

	let endPos = 0;
	for (let nowPos = 0; nowPos < quoteJsStr.length; nowPos++) {
		switch (quoteJsStr[nowPos]) {
			case '[':
				if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					signStack.push('[');
				}
				break;
			case ']':
				if (signStack.top() === '[') {
					signStack.pop();
				}
				if (signStack.length === 0) {
					endPos = nowPos;
				}
				break;
			case '/':
				if (signStack.top() === quoteJsStr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//[{( +-* <>=? &|! ~^
					if (quoteJsStr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(quoteJsStr[nowPos]);
					}
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === quoteJsStr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
					//开始字符串
					signStack.push(quoteJsStr[nowPos]);
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				break;
		}
		if (signStack.length === 0) {
			let varStr;
			varStr = quoteJsStr.slice(2, nowPos - 1);
			if (quoteJsStr[1] === '(' && quoteJsStr[nowPos - 1] === ')') {
				varStr = varStr.slice(1, -1);
			}
			// 中间有运算就不行
			if (varStr.replace(/\\'/g, "Q").indexOf("'") !== -1) {
				console.log(varStr);
				return quoteJsStr;
			}
			quoteJsStr = quoteJsStr.slice(nowPos + 1);
			// 排除字符串数组
			if (!lastChar.match(/[ \[{(+\-*\\%<>=!^&|~?:,;]/)) {
				if (lastChar !== '.') {
					varStr = "." + varStr;
				}
				if (!quoteJsStr[0].match(/[ .\[{()}\]+\-*\\%<>=!^&|~?:,;]/)) {
					varStr += ".";
				}
			}
			return varStr + quoteJsStr;
		}
	}
}
function decryptFormat(globalJsArr) {
	return globalJsArr.map(function (statement) {
		let signStack = [];

		for (let nowPos = 0; nowPos < statement.length; nowPos++) {
			let nextStr = statement.slice(nowPos);
			switch (statement[nowPos]) {
				case '0':
					if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						if (nextStr.search(/0x[0-9a-fA-F]*/) === 0 && statement[nowPos - 1].match(/[ .\[{()}\]+\-*\\%<>=!^&|?:,]/)) {
							let oldInt = nextStr.match(/0x[0-9a-fA-F]*/)[0].toString();
							let newInt = parseInt(oldInt, 16).toString();
							statement = statement.slice(0, nowPos) + newInt + nextStr.slice(oldInt.length);
						}
					}
					break;
				case '[':
					if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						if (nextStr.search(/\[(\()?'([\w])*?'(\))?]/) === 0) {
							statement = statement.slice(0, nowPos) + parseCrochets(statement[nowPos - 1], nextStr);
						}
					}
					break;
				case '/':
					if (signStack.top() === statement[nowPos]) {
						//结束正则
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//[{( +-* <>=? &|! ~^
						if (statement[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
							//开始正则
							signStack.push(statement[nowPos]);
						}
					}
					break;
				case '"':
				case "'":
				case '`':
					if (signStack.top() === statement[nowPos]) {
						//结束字符串
						signStack.pop();
					} else if (signStack.top() !== '"' && signStack.top() !== "'" && signStack.top() !== '/' && signStack.top() !== '`') {
						//开始字符串
						signStack.push(statement[nowPos]);
					}
					break;
				case '\\':
					if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
						nowPos++;
					}
					break;
				default:
					break;
			}
		}
		return statement;
	});
}
jsStatementsArr = decryptFormat(jsStatementsArr);
fs.writeFileSync("encryptEdited4.js", jsStatementsArr.join("\n"));