/* V6简易解密
* 作者：NXY666
* 用法：在FILE_NAME中填写路径，运行即可。
* 输出：
*   DecryptResult1.js：去除全局加密
*   DecryptResult2.js：去除函数加密
*   DecryptResult3.js：去除if-else死代码
*   DecryptResult4.js：16进制数字转10进制、['XXX']转.XXX.
*/
const FILE_NAME = "./template/2.js";

const fs = require("fs");
const vm = require("vm");

let js = fs.readFileSync(FILE_NAME).toString();

Array.prototype.top = function () {
	return this[this.length - 1];
};
String.prototype.replaceWithStr = function (st, en, str) {
	return this.slice(0, st) + str + this.slice(en);
};
String.prototype.splitByOtherStr = function (str, separator) {
	if (this.length !== str.length) {
		throw Error("字符串长度与源字符串长度不一致。");
	}
	let splitRes = str.split(separator);
	let nowPos = 0;
	return splitRes.map(function (item) {
		let res = this.slice(nowPos, nowPos + item.length);
		nowPos += item.length + separator.length;
		return res;
	}.bind(this));
};
let globalContext = vm.createContext();

function transStr(jsStr) {
	let signStack = [], jsArr = jsStr.split("");
	for (let nowPos = 0; nowPos < jsArr.length; nowPos++) {
		switch (jsArr[nowPos]) {
			case '/':
				if (signStack.top() === jsArr[nowPos]) {
					//结束正则
					signStack.pop();
				} else if (signStack.length === 0) {
					//[{( +-* <>=? &|! ~^
					if (jsArr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
						//开始正则
						signStack.push(jsArr[nowPos]);
					}
				} else {
					jsArr[nowPos] = 'S';
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsArr[nowPos]) {
					//结束字符串
					signStack.pop();
				} else if (signStack.length === 0) {
					//开始字符串
					signStack.push(jsArr[nowPos]);
				} else {
					jsArr[nowPos] = 'S';
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					nowPos++;
				}
				break;
			default:
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					jsArr[nowPos] = 'S';
				}
				break;
		}
	}
	return jsArr.join("");
}
function transLayer(jsStr, layer) {
	jsStr = transStr(jsStr);
	if (layer === undefined) {
		layer = 1;
	}

	let signStack = [], jsArr = jsStr.split("");
	for (let nowPos = 0; nowPos < jsArr.length; nowPos++) {
		switch (jsArr[nowPos]) {
			case '[':
			case '{':
			case '(':
				//开始
				signStack.push(jsArr[nowPos]);
				if (signStack.length > layer) {
					jsArr[nowPos] = 'Q';
				}
				break;
			case ']':
				if (signStack.top() === "[") {
					//结束
					if (signStack.length > layer) {
						jsArr[nowPos] = 'Q';
					}
					signStack.pop();
				} else {
					console.log("“]”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			case '}':
				if (signStack.top() === "{") {
					//结束
					if (signStack.length > layer) {
						jsArr[nowPos] = 'Q';
					}
					signStack.pop();
				} else {
					console.log("“}”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			case ')':
				if (signStack.top() === "(") {
					//结束
					if (signStack.length > layer) {
						jsArr[nowPos] = 'Q';
					}
					signStack.pop();
				} else {
					console.log("“)”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			default:
				if (signStack.length > layer - 1) {
					jsArr[nowPos] = 'Q';
				}
				break;
		}
	}
	return jsArr.join("");
}

function transEvalStr(jsStr) {
	return jsStr;
}
function virtualEval(jsStr) {
	return vm.runInContext(transEvalStr(jsStr), globalContext);
}
function virtualGlobalEval(jsStr) {
	return vm.runInContext(transEvalStr(jsStr), globalContext);
}

function escapeEvalStr(str) {
	return "'" + JSON.stringify(str).slice(1, -1).replace("'", "\\'").replace('\\"', '"') + "'";
}
function getQuoteEndPos(jsStr, startPos) {
	if (startPos === undefined) {
		startPos = 0;
	}
	jsStr = transStr(jsStr);

	let signStack = [], jsArr = jsStr.split("");
	for (let nowPos = startPos; nowPos < jsArr.length; nowPos++) {
		switch (jsArr[nowPos]) {
			case '[':
			case '{':
			case '(':
				//开始
				signStack.push(jsArr[nowPos]);
				break;
			case ']':
				if (signStack.top() === "[") {
					//结束
					signStack.pop();
				} else {
					console.log("“]”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			case '}':
				if (signStack.top() === "{") {
					//结束
					signStack.pop();
				} else {
					console.log("“}”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			case ')':
				if (signStack.top() === "(") {
					//结束
					signStack.pop();
				} else {
					console.log("“)”关闭失败");
					throw EvalError("解析失败");
					// return jsArr.join("");
				}
				break;
			default:
				break;
		}
		if (signStack.length === 0) {
			return nowPos;
		}
	}
	throw "未知错误";
}

function splitStatements(jsStr) {
	let transLayerRes = transLayer(jsStr), splitJsArr = [];
	let startPos = 0, endPos = undefined;
	while ((endPos = transLayerRes.indexOf(";", startPos)) !== -1) {
		splitJsArr.push(jsStr.slice(startPos, endPos + 1));
		startPos = endPos + 1;
	}
	return splitJsArr;
}

//如果是对象，则返回空数组
function decryptGlobalJs(js) {
	let transStrRes = transStr(js);

	let boolMarkPos = undefined;
	while ((boolMarkPos = transStrRes.lastIndexOf("![]", boolMarkPos - 1)) !== -1) {
		if (transStrRes[boolMarkPos - 1] === "!") {
			js = js.replaceWithStr(boolMarkPos - 1, boolMarkPos + 3, "true");
		} else {
			js = js.replaceWithStr(boolMarkPos, boolMarkPos + 3, "false");
		}
	}

	let jsArr = splitStatements(js);

	for (let i = 0; i < 3; i++) {
		virtualGlobalEval(jsArr[i]);
	}

	let decryptorName = jsArr[2].slice(jsArr[2].indexOf("function") + 9, jsArr[2].indexOf("(")) || jsArr[2].slice(jsArr[2].indexOf("var ") + 4, jsArr[2].indexOf("=function("));

	return jsArr.slice(3, -1).map(function (funcJs) {
		transStrRes = transStr(funcJs);

		let decryptorPos = undefined;
		while ((decryptorPos = transStrRes.lastIndexOf(decryptorName, decryptorPos - 1)) !== -1) {
			let endPos = transStrRes.indexOf(")", decryptorPos);
			funcJs = funcJs.replaceWithStr(decryptorPos, endPos + 1, escapeEvalStr(virtualEval(funcJs.slice(decryptorPos, endPos + 1))));
		}

		return funcJs;
	});
}
jsStatementsArr = decryptGlobalJs(js);
fs.writeFileSync("DecryptResult1.js", jsStatementsArr.join("\n"));

//有则输出名字，无则输出false
function getFuncDecryptorName(jsStr) {
	//jsStr为空或不是以var 开头
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		return false;
	}

	let transStrRes = transLayer(jsStr, 2);
	let checkRes = transStrRes.slice(transStrRes.indexOf("{") + 1, transStrRes.lastIndexOf("}")).split(",").every(function (objectItem) {
		let checkRes;
		if ((checkRes = objectItem.match(/'(S)*':('(S)*'|function\((Q)*\){(Q)*})/))) {
			return checkRes[0] === objectItem;
		}
	});
	if (checkRes) {
		// console.log("符合条件：", jsStr);
		return transStrRes.slice(4, transStrRes.indexOf("="));
	} else {
		console.log("检查不通过：", jsStr);
		transStrRes.slice(transStrRes.indexOf("{") + 1, transStrRes.lastIndexOf("}")).split(",").every(function (objectItem) {
			let checkRes;
			if ((checkRes = objectItem.match(/'(S)*':('(S)*'|function\((Q)*\){(Q)*})/))) {
				return checkRes[0] === objectItem;
			}
		});
		return false;
	}
}
function replaceObjFunc(callFunc, callStr) {
	console.log("*", callStr);
	let funcStr = callFunc.toString(), transFuncStr = transStr(funcStr);
	let funcParams = funcStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")).splitByOtherStr(transFuncStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")), ",");

	let transCallLayer = transLayer(callStr), transCallLayer2 = transLayer(callStr, 2);
	console.log("# callStr:", callStr, "\n- transCallLayer:", transCallLayer, "\n- transCallLayer2:", transCallLayer2);
	let callParamsStr = callStr.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")"));
	let callParams = callParamsStr.splitByOtherStr(transCallLayer2.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")")), ",");
	if (funcParams.length === callParams.length) {
		console.log(funcParams, callParams);
	} else {
		console.error("×", funcParams, callParams);
	}

	let funcResStr = funcStr.slice(transFuncStr.indexOf("{return ") + 8, transFuncStr.lastIndexOf(";}"));
	funcParams.forEach(function (param, index) {
		funcResStr = funcResStr.replace(param, callParams[index]);
	});

	console.log(funcStr, funcResStr, "\n");
	return funcResStr;
}
function decryptJsArr(funcJsArr) {
	let decryptorObjName = getFuncDecryptorName(funcJsArr[0]);
	//代码块解密
	if (decryptorObjName) {
		virtualGlobalEval(funcJsArr[0]);

		let transStrRes;

		funcJsArr = funcJsArr.slice(1).map(function (funcJs) {
			transStrRes = transStr(funcJs);

			let decryptorPos = undefined;
			while ((decryptorPos === undefined || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(decryptorObjName, decryptorPos - 1)) !== -1) {
				let leftSquarePos = transStrRes.indexOf("[", decryptorPos),
					rightSquarePos = transStrRes.indexOf("]", decryptorPos);
				// console.log(decryptorPos);
				// console.log(decryptorObjName + funcJs.slice(leftSquarePos));

				switch (virtualEval("typeof " + decryptorObjName + funcJs.slice(leftSquarePos, rightSquarePos + 1))) {
					case "string": {
						funcJs = funcJs.replaceWithStr(decryptorPos, rightSquarePos + 1, escapeEvalStr(virtualEval(decryptorObjName + funcJs.slice(leftSquarePos, rightSquarePos + 1))));
						break;
					}
					case "function": {
						let transLayerRes = transStr(funcJs);
						let rightRoundPos = getQuoteEndPos(transLayerRes, rightSquarePos + 1);
						funcJs = funcJs.replaceWithStr(decryptorPos, rightRoundPos + 1, replaceObjFunc(virtualEval(decryptorObjName + funcJs.slice(leftSquarePos, rightSquarePos + 1)), funcJs.slice(decryptorPos, rightRoundPos + 1)));
						break;
					}
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
							statement = statement.replaceWithStr(startPos + 1, nowPos, decryptJsArr(splitStatementsRes).join(""));
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
fs.writeFileSync("DecryptResult2.js", jsStatementsArr.join("\n"));

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
fs.writeFileSync("DecryptResult3.js", jsStatementsArr.join("\n"));

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
fs.writeFileSync("DecryptResult4.js", jsStatementsArr.join("\n"));