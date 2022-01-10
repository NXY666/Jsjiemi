/* JsjiamiV6简易解密
* 作者：NXY666
*/
const FILE_NAME = "./template/4.js";

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
String.prototype.searchOf = function (regexp, position) {
	if (typeof regexp == "string") {
		return this.indexOf(regexp, position);
	}

	if (position < 0) {
		position = 0;
	} else if (position >= this.length) {
		return -1;
	}

	return position + this.slice(position).search(regexp);
};
String.prototype.lastSearchOf = function (regexp, position) {
	if (typeof regexp != "object") {
		return this.lastIndexOf(regexp, position);
	} else {
		regexp = new RegExp(regexp.source, regexp.flags + 'g');
	}

	let thisStr = this;
	if (position < 0) {
		return -1;
	} else if (position < thisStr.length) {
		thisStr = thisStr.slice(0, position + 1);
	}

	let posRes = -1, matchRes;
	while ((matchRes = regexp.exec(thisStr)) != null) {
		posRes = matchRes.index;
	}

	return posRes;
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
					if (nowPos === 0 || jsArr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^;]/)) {
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
					jsArr[nowPos++] = jsArr[nowPos] = 'S';
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
					console.error("“]”关闭失败");
					throw EvalError("解析失败");
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
					console.error("“}”关闭失败");
					throw EvalError("解析失败");
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
					console.error("“)”关闭失败");
					throw EvalError("解析失败");
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
	return "'" + JSON.stringify(str).slice(1, -1).replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
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
					console.error("“]”关闭失败");
					throw EvalError("解析失败");
				}
				break;
			case '}':
				if (signStack.top() === "{") {
					//结束
					signStack.pop();
				} else {
					console.error("“}”关闭失败");
					throw EvalError("解析失败");
				}
				break;
			case ')':
				if (signStack.top() === "(") {
					//结束
					signStack.pop();
				} else {
					console.error("“)”关闭失败");
					throw EvalError("解析失败");
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
	if (startPos < jsStr.length) {
		splitJsArr.push(jsStr.slice(startPos));
	}
	return splitJsArr;
}

console.info("正在去除全局加密……");
//如果是对象，则返回空数组
function decryptGlobalJs(js) {
	let transStrRes = transStr(js);

	let boolMarkPos = undefined;
	while ((boolMarkPos === undefined || boolMarkPos - 1 >= 0) && (boolMarkPos = transStrRes.lastIndexOf("![]", boolMarkPos - 1)) !== -1) {
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
		while ((decryptorPos === undefined || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(decryptorName, decryptorPos - 1)) !== -1) {
			let endPos = transStrRes.indexOf(")", decryptorPos);
			funcJs = funcJs.replaceWithStr(decryptorPos, endPos + 1, escapeEvalStr(virtualEval(funcJs.slice(decryptorPos, endPos + 1))));
		}

		return funcJs;
	});
}
jsStatementsArr = decryptGlobalJs(js);
fs.writeFileSync("DecryptResult1.js", jsStatementsArr.join("\n"));

console.info("正在去除代码块加密……");
//有则输出名字，无则输出false
function getFuncDecryptorName(jsStr) {
	//jsStr为空或不是以var 开头
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		// console.log("初步检查不通过:", jsStr);
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
		// console.log("检查通过:", jsStr.slice(0, 100));
		return transStrRes.slice(4, transStrRes.indexOf("="));
	} else {
		console.warn("非加密对象:", jsStr);
		return false;
	}
}
function replaceObjFunc(callFunc, callStr) {
	// console.log("*", callStr);
	let funcStr = callFunc.toString(), transFuncStr = transStr(funcStr);
	let funcParams = funcStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")).splitByOtherStr(transFuncStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")), ",");

	let transCallLayer = transLayer(callStr), transCallLayer2 = transLayer(callStr, 2);
	// console.log("# callStr:", callStr, "\n- transCallLayer:", transCallLayer, "\n- transCallLayer2:", transCallLayer2);
	let callParamsStr = callStr.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")"));
	let callParams = callParamsStr.splitByOtherStr(transCallLayer2.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")")), ",");
	if (funcParams.length === callParams.length) {
		// console.log(funcParams, callParams);
	} else {
		console.error("×", funcParams, callParams);
	}

	let funcResStr = funcStr.slice(transFuncStr.indexOf("{return ") + 8, transFuncStr.lastIndexOf(";}"));
	funcParams.forEach(function (param, index) {
		funcResStr = funcResStr.replace(param, callParams[index]);
	});

	// console.log(funcStr, funcResStr, "\n");
	return funcResStr;
}
function findCodeBlock(jsArr) {
	return jsArr.map(function (jsStr) {
		let transLayerRes = transLayer(jsStr);
		let startPos = undefined;
		while ((startPos === undefined || startPos - 1 >= 0) && (startPos = transLayerRes.lastIndexOf("{", startPos - 1)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			let splitStatementsRes = splitStatements(jsStr.slice(startPos + 1, endPos));
			if (splitStatementsRes.length) {
				jsStr = jsStr.replaceWithStr(startPos + 1, endPos, decryptCodeBlockArr(splitStatementsRes).join(""));
			}
		}

		transLayerRes = transLayer(jsStr);
		startPos = undefined;
		while ((startPos === undefined || startPos - 1 >= 0) && (startPos = transLayerRes.lastIndexOf("(", startPos - 1)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			jsStr = jsStr.replaceWithStr(startPos + 1, endPos, findCodeBlock([jsStr.slice(startPos + 1, endPos)]).join(""));
		}

		transLayerRes = transLayer(jsStr);
		startPos = undefined;
		while ((startPos === undefined || startPos - 1 >= 0) && (startPos = transLayerRes.lastIndexOf("[", startPos - 1)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			jsStr = jsStr.replaceWithStr(startPos + 1, endPos, findCodeBlock([jsStr.slice(startPos + 1, endPos)]).join(""));
		}
		return jsStr;
	});
}
function decryptCodeBlockArr(funcJsArr) {
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

	funcJsArr = findCodeBlock(funcJsArr);

	return funcJsArr;
}
jsStatementsArr = decryptCodeBlockArr(jsStatementsArr);
fs.writeFileSync("DecryptResult2.js", jsStatementsArr.join("\n"));

console.info("正在去除 if...else 死代码……");
function simplifyIf(ifJsStr) {
	let ifRes = eval(ifJsStr.slice(2, 21));
	let elsePos = getQuoteEndPos(ifJsStr, 21) + 1;
	let endPos = getQuoteEndPos(ifJsStr, elsePos + 4);

	// console.log("true: ", ifJsStr.slice(22, elsePos - 1));
	// console.log("false: ", ifJsStr.slice(elsePos + 5, endPos));

	if (ifRes) {
		return ifJsStr.slice(22, elsePos - 1) + ifJsStr.slice(endPos + 1);
	} else {
		return ifJsStr.slice(elsePos + 5, endPos) + ifJsStr.slice(endPos + 1);
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
						if (nowPos === 0 || statement[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^]/)) {
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

console.info("正在提升代码可读性……");
function decryptFormat(globalJsArr) {
	return globalJsArr.map(function (statement) {
		let transStrRes = transStr(statement);
		let hexNumberPos = undefined;
		while ((hexNumberPos = transStrRes.lastSearchOf(/0x([0-9a-fA-F])*/, hexNumberPos - 1)) !== -1) {
			let activeNumStr = transStrRes.slice(hexNumberPos).match(/0x([0-9a-fA-F])*/)[0];
			let checkNumberRegexp = /[{}\[\]().,+\-*\/~!%<>=&|^?:; ]/;
			if (
				transStrRes[hexNumberPos - 1].match(checkNumberRegexp) != null &&
				transStrRes[hexNumberPos + activeNumStr.length].match(checkNumberRegexp) != null
			) {
				// console.log("√", hexNumberPos, activeNumStr);
				statement = statement.replaceWithStr(hexNumberPos, hexNumberPos + activeNumStr.length, parseInt(activeNumStr, 16));
			} else {
				// console.log("×", hexNumberPos, activeNumStr, "[", transStrRes[hexNumberPos - 1], ",", transStrRes[hexNumberPos + activeNumStr.length], "]");
			}
		}

		transStrRes = transStr(statement);
		let objIndexerPos = undefined;
		while ((objIndexerPos = transStrRes.lastSearchOf(/\['(S)*.']/, objIndexerPos - 1)) !== -1) {
			let activeIndexerStr = transStrRes.slice(objIndexerPos).match(/\['(S)*.']/)[0];
			let leftSplitter, rightSplitter;

			if (transStrRes[objIndexerPos + activeIndexerStr.length].match(/[^{}\[\]().,+\-*\/~!%<>=&|^?:; ]/) != null) {
				// console.log("√ R", objIndexerPos, activeIndexerStr);
				rightSplitter = ".";
			} else {
				// console.log("× R", objIndexerPos, activeIndexerStr, "[", transStrRes[objIndexerPos - 1], ",", transStrRes[objIndexerPos + activeIndexerStr.length], "]");
				rightSplitter = "";
			}
			statement = statement.replaceWithStr(objIndexerPos + activeIndexerStr.length - 2, objIndexerPos + activeIndexerStr.length, rightSplitter);
			transStrRes = transStrRes.replaceWithStr(objIndexerPos + activeIndexerStr.length - 2, objIndexerPos + activeIndexerStr.length, rightSplitter);

			if (transStrRes[objIndexerPos - 1] === "/") {
				let lastRegExpPos = transStrRes.lastSearchOf(/\/(S)*\//, objIndexerPos);
				if (lastRegExpPos === -1) {
					leftSplitter = "";
					// console.log("× E", objIndexerPos, activeIndexerStr);
				} else {
					let activeRegExpStr = transStrRes.slice(lastRegExpPos).match(/\/(S)*\//)[0];
					if (lastRegExpPos + activeRegExpStr.length === objIndexerPos) {
						leftSplitter = ".";
						// console.log("√ E", objIndexerPos, activeIndexerStr);
					} else {
						leftSplitter = "";
						// console.log("× E", objIndexerPos, activeIndexerStr);
					}
				}
			} else if (transStrRes[objIndexerPos - 1].match(/[^{}\[(.,+\-*~!%<>=&|^?:; ]/) != null) {
				// console.log("√ L", objIndexerPos, activeIndexerStr);
				leftSplitter = ".";
			} else {
				// console.log("× L", objIndexerPos, activeIndexerStr, "[", transStrRes[objIndexerPos - 1], ",", transStrRes[objIndexerPos + activeIndexerStr.length], "]");
				leftSplitter = "";
			}
			statement = statement.replaceWithStr(objIndexerPos, objIndexerPos + 2, leftSplitter);
			transStrRes = transStrRes.replaceWithStr(objIndexerPos, objIndexerPos + 2, leftSplitter);
		}

		return statement;
	});
}
jsStatementsArr = decryptFormat(jsStatementsArr);
fs.writeFileSync("DecryptResult4.js", jsStatementsArr.join("\n"));

console.info("全部完毕！");