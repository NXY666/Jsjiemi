/*
* JsjiamiV6简易解密（作者：NXY666）
*/
const FILE_NAME = "./template/19.js";
// const FILE_NAME = "./DecryptResult3.js";

const fs = require("fs");
const vm = require("vm");

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
// noinspection JSUnusedGlobalSymbols
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

// fs.writeFileSync("res.txt", "");
/**
 * 日志工具
 * */
function showMsgProgress(msg) {
	console.clear();
	console.warn(`* 正在${msg}……`);
}
function showNumProgress(msg, nowProgress, maxProgress) {
	let percent = Math.floor(nowProgress / maxProgress * 50);
	let progressArr = [];
	for (let i = 0; i < 50; i++) {
		if (i < percent) {
			progressArr.push("▇");
		} else {
			progressArr.push(" ");
		}
	}
	console.clear();
	console.warn(`* 正在${msg}…… [${progressArr.join("")}] ${(nowProgress / maxProgress * 100).toFixed(1).padStart(5, " ")}%`);
}
function pause(text) {
	console.warn(`${text}${text !== undefined ? "\n" : ""}[请按任意键继续]`);
	let stopTime = new Date().getTime();
	process.stdin.setRawMode(true);
	fs.readSync(0, Buffer.alloc(1), 0, 1, null);
	process.stdin.setRawMode(false);
	START_TIME += new Date().getTime() - stopTime;
}
/**
 * 代码分析工具
 * */
function transStr(jsStr) {
	let signStack = [], jsArr = jsStr.split("");
	for (let nowPos = 0; nowPos < jsArr.length; nowPos++) {
		switch (jsArr[nowPos]) {
			case '/':
				if (signStack.top() === jsArr[nowPos]) {
					// 结束正则
					signStack.pop();
				} else if (signStack.length === 0) {
					// [{( +-* <>=? &|! ~^
					if (nowPos === 0 || jsArr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^;]/)) {
						// 开始正则
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
					// 结束字符串
					signStack.pop();
				} else if (signStack.length === 0) {
					// 开始字符串
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
				// 开始
				signStack.push(jsArr[nowPos]);
				if (signStack.length > layer) {
					jsArr[nowPos] = 'Q';
				}
				break;
			case ']':
				if (signStack.top() === "[") {
					// 结束
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
					// 结束
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
					// 结束
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
				// 开始
				signStack.push(jsArr[nowPos]);
				break;
			case ']':
				if (signStack.top() === "[") {
					// 结束
					signStack.pop();
				} else {
					console.error("“]”关闭失败");
					throw EvalError("解析失败");
				}
				break;
			case '}':
				if (signStack.top() === "{") {
					// 结束
					signStack.pop();
				} else {
					console.error("“}”关闭失败");
					throw EvalError("解析失败");
				}
				break;
			case ')':
				if (signStack.top() === "(") {
					// 结束
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
	throw Error("未知错误");
}
function splitStatements(jsStr, statementType) {
	let transLayerRes = transLayer(jsStr), splitJsArr = [];
	if (statementType === undefined) {
		let tmpStr = transLayerRes.replace(/([0-9a-zA-Z])+/g, "W");
		if (tmpStr === "") {
			// 空
			statementType = "EMPTY";
		} else if (/^([^,:;]+:[^,:;]+,)*[^,:;]+:[^,:;]+$/.test(tmpStr)) {
			// 对象
			statementType = "OBJECT";
		} else if (/^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~]|defalut:)/.test(transLayerRes.slice(0, 8))) {
			// case
			statementType = "SWITCH_CASE";
		} else {
			// 普通
			statementType = "COMMON";
		}
	}
	switch (statementType) {
		case "EMPTY": {
			break;
		}
		case "OBJECT": {
			break;
		}
		case "SWITCH_CASE":
		case "COMMON": {
			let startPos = 0, endPos;
			while ((endPos = transLayerRes.indexOf(";", startPos)) !== -1) {
				let partJsStr = jsStr.slice(startPos, endPos + 1),
					transPartJsStr = transLayerRes.slice(startPos, endPos + 1);
				if (statementType === "SWITCH_CASE" && /^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~]|defalut:)/.test(transPartJsStr.slice(0, 8))) {
					// switch...case
					endPos = transPartJsStr.indexOf(":");
					splitJsArr.push(partJsStr.slice(0, endPos + 1));
					startPos += endPos + 1;
				} else if ((() => {
					let matchRes =
						transLayerRes.slice(startPos).match(/^if\(Q+\){?.*?(;|}|};)(else if\(Q+\){?.*?(;|}|};))*?(else{?.*?(;|}|};))?/) || // if...else
						transPartJsStr.match(/^(async )?function [^(]+?\(Q*\){Q+};?/) || // function（花括号不可省略，无需判断）
						transPartJsStr.match(/^(for|while)\(Q+\){?.*?(;|}|};)/) || // for / while（花括号可省略，需判断）
						transPartJsStr.match(/^do{?.*?[;}]\(Q+\);?/) || // do...while（花括号可省略，需判断）
						transPartJsStr.match(/^try{Q+}catch\(Q+\){Q+};?/); // try...catch（两个花括号都不能省，所以无需判断）
					return matchRes && (endPos = startPos + matchRes[0].length);
				})()) {
					splitJsArr.push(jsStr.slice(startPos, endPos));
					startPos = endPos;
				} else {
					// 其它
					splitJsArr.push(jsStr.slice(startPos, endPos + 1));
					startPos = endPos + 1;
				}
			}
			if (startPos < jsStr.length) {
				splitJsArr.push(jsStr.slice(startPos));
			}
			break;
		}
		default: {
			throw "未知的代码块类型 " + statementType;
		}
	}
	splitJsArr["type"] = statementType;
	return splitJsArr;
}
/**
 * 虚拟机执行工具
 * */
let globalContext = vm.createContext();
function virtualEval(jsStr) {
	return virtualGlobalEval(jsStr);
}
function virtualGlobalEval(jsStr) {
	return vm.runInContext(jsStr, globalContext);
}

let START_TIME = new Date().getTime();

showMsgProgress("解除全局加密");
const globalDecryptorInfo = {
	signInfo: {
		name: null,
		// _0x / iIl / oO0 / abc
		confuseType: null,
		nameRegExp: null,
		hasSignString: null,
		hasMemberArray: null,
		raw: null
	},
	preprocessFunction: {
		raw: null
	},
	verifyFunction: {
		raw: null
	},
	decryptor: {
		// function / var
		type: null,
		name: null,
		raw: null
	}
};
function getStatementsType(jsArr) {
	return jsArr.map(function (jsStr, index) {
		let transRes = transStr(jsStr);

		/**
		 * 签名信息
		 * @namespace signInfo
		 * @description 用于存放签名以及处理前的解密数据。
		 * 签名命名规则 _?[0-9a-zA-Z$ｉＯ]+?
		 * 变量命名规则 _?[0-9a-zA-Z$]+?
		 * 字符串规则 'S+?'
		 * */
		if (globalDecryptorInfo.signInfo.raw == null) {
			if (/^var (_?[0-9a-zA-Z$ｉＯ]+?='S+?',(_?[0-9a-zA-Z$ｉＯ]+?_=\['S+?'],)?)?_?[0-9a-zA-Z$]+?=\[_?[0-9a-zA-Z$ｉＯ]+?(,'S+?')*?];?/.test(transRes)) {
				globalDecryptorInfo.signInfo.name = jsStr.slice(4, transRes.indexOf("=", 4));
				(function (signName) {
					if (/^_0xod[0-9a-zA-z]$/.test(signName)) {
						globalDecryptorInfo.signInfo.confuseType = "_0x";
						globalDecryptorInfo.signInfo.nameRegExp = `_0x[0-9a-f]+`;
					} else if (/^[iｉl]+$/.test(signName)) {
						globalDecryptorInfo.signInfo.confuseType = "iIl";
						globalDecryptorInfo.signInfo.nameRegExp = `[iIl1]+`;
					} else if (/^[OＯ0$]+$/.test(signName)) {
						globalDecryptorInfo.signInfo.confuseType = "oO0";
						globalDecryptorInfo.signInfo.nameRegExp = `[O0Q$]+`;
					} else if (/^[a-z]+$/.test(signName)) {
						globalDecryptorInfo.signInfo.confuseType = "abc";
						globalDecryptorInfo.signInfo.nameRegExp = `[a-z]+`;
					} else {
						throw new Error("未知的混淆模式：" + signName);
					}
				})(globalDecryptorInfo.signInfo.name);
				globalDecryptorInfo.signInfo.hasSignString = /^var _?[0-9a-zA-Z$ｉＯ]+?='S+?',/.test(transRes);
				globalDecryptorInfo.signInfo.hasMemberArray = /_?[0-9a-zA-Z$ｉＯ]+?_=\['S+?'],/.test(transRes);
				globalDecryptorInfo.signInfo.raw = jsStr;
				return {
					type: "SIGN_INFO",
					content: globalDecryptorInfo.signInfo
				};
			}
		} else {
			if (new RegExp(`^${globalDecryptorInfo.signInfo.name}='S+';?$`).test(transRes)) {
				return {
					type: "SIGN_REITERATE",
					content: {
						raw: jsStr
					}
				};
			}
		}

		/**
		 * 预处理函数
		 * @namespace globalDecryptorInfo.preprocessFunction
		 * @description 将签名信息预处理为可用的解密数据。
		 * 变量命名规则 _?[0-9a-zA-Z$]+?
		 * 字符串规则 'S+?'
		 * */
		if (globalDecryptorInfo.signInfo.raw != null && globalDecryptorInfo.preprocessFunction.raw == null && index === 1) {
			if (
				/\['replace']\(\/\[[a-zA-Z]+=]\/g,''/.test(jsStr) &&
				/return _?[0-9a-z]+?\(\+\+_?[0-9a-z]+?,_?[0-9a-z]+?\)>>_?[0-9a-z]+?\^_?[0-9a-z]+?;/.test(jsStr) &&
				/\){while\(--/.test(jsStr)
			) {
				globalDecryptorInfo.preprocessFunction.raw = jsStr;
				return {
					type: "PREPROCESS_FUNCTION",
					content: globalDecryptorInfo.preprocessFunction
				};
			}
		}

		/**
		 * 解密函数
		 * @namespace globalDecryptorInfo.decryptor
		 * @description 使用解密数据完成字符串解密。
		 * 变量命名规则 _?[0-9a-zA-Z$]+?
		 * 字符串规则 'S+?'
		 * */
		if (globalDecryptorInfo.signInfo.raw != null && globalDecryptorInfo.decryptor.raw == null) {
			// 必须匹配以下项，否则就不是
			if (/=~~'0x'\['concat']\(/.test(jsStr)) {
				let isDecryptor = false;
				if (globalDecryptorInfo.preprocessFunction.raw != null) {
					// 有预处理函数
					if (/='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+\/=';/.test(jsStr) && /\+='%'\+\('00'\+/.test(jsStr)) {
						isDecryptor = true;
					}
				} else {
					// 无预处理函数
					if (index === 1) {
						isDecryptor = true;
					}
				}
				if (isDecryptor) {
					if (jsStr.startsWith("function ")) {
						globalDecryptorInfo.decryptor.type = "function";
						globalDecryptorInfo.decryptor.name = jsStr.slice(9, transRes.indexOf("("));
						globalDecryptorInfo.decryptor.raw = jsStr;
						return {
							type: "DECRYPTOR",
							content: globalDecryptorInfo.decryptor
						};
					} else if (jsStr.startsWith("var ")) {
						globalDecryptorInfo.decryptor.type = "var";
						globalDecryptorInfo.decryptor.name = jsStr.slice(4, transRes.indexOf("="));
						globalDecryptorInfo.decryptor.raw = jsStr;
						return {
							type: "DECRYPTOR",
							content: globalDecryptorInfo.decryptor
						};
					}
				}
			}
		}

		// TODO 判断验证函数（如今缺少例子）

		/**
		 * 空语句
		 * @namespace globalDecryptorInfo.empty
		 * @description 空语句。
		 * */
		if (jsStr.trim() === "" || jsStr.trim() === ";") {
			return {
				type: "EMPTY",
				content: {
					raw: jsStr
				}
			};
		}

		/**
		 * 常规语句
		 * @namespace globalDecryptorInfo.common
		 * @description 常规语句。
		 * */
		return {
			type: "COMMON",
			content: {
				raw: jsStr
			}
		};
	});
}
function decryptGlobalJs(js) {
	let transStrRes = transStr(js);
	let boolMarkPos = Number.POSITIVE_INFINITY;
	while ((boolMarkPos === Number.POSITIVE_INFINITY || boolMarkPos - 1 >= 0) && (boolMarkPos = transStrRes.lastIndexOf("![]", boolMarkPos - 1)) !== -1) {
		if (transStrRes[boolMarkPos - 1] === "!") {
			js = js.replaceWithStr(boolMarkPos - 1, boolMarkPos + 3, ((transStrRes[boolMarkPos - 2].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:; @]/) ? "" : " ")) + "true");
		} else {
			js = js.replaceWithStr(boolMarkPos, boolMarkPos + 3, ((transStrRes[boolMarkPos - 1].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:; @]/) ? "" : " ")) + "false");
		}
	}
	let jsArr = splitStatements(js);
	let statementsTypeArr = getStatementsType(jsArr);
	if (globalDecryptorInfo.decryptor.raw === null) {
		pause("【警告】解密器识别失败，可在GitHub上提交issue以寻找原因。");

		for (let i = 0; i < 3; i++) {
			virtualGlobalEval(jsArr[i]);
		}

		globalDecryptorInfo.decryptor.raw = jsArr[2];
		globalDecryptorInfo.decryptor.name = globalDecryptorInfo.decryptor.raw.slice(globalDecryptorInfo.decryptor.raw.indexOf("function") + 9, globalDecryptorInfo.decryptor.raw.indexOf("(")) || globalDecryptorInfo.decryptor.raw.slice(globalDecryptorInfo.decryptor.raw.indexOf("var ") + 4, globalDecryptorInfo.decryptor.raw.indexOf("=function("));

		jsArr = jsArr.slice(3);
		statementsTypeArr = statementsTypeArr.slice(3);
	} else {
		virtualGlobalEval(globalDecryptorInfo.signInfo.raw);
		virtualGlobalEval(globalDecryptorInfo.preprocessFunction.raw);
		virtualGlobalEval(globalDecryptorInfo.decryptor.raw);
	}
	return jsArr.filter(function (jsStr, index) {
		return statementsTypeArr[index].type === "COMMON";
	}).map(function (funcJs) {
		transStrRes = transStr(funcJs);

		let decryptorPos = Number.POSITIVE_INFINITY;
		while ((decryptorPos === Number.POSITIVE_INFINITY || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(`${globalDecryptorInfo.decryptor.name}('`, decryptorPos - 1)) !== -1) {
			let endPos = transStrRes.indexOf(")", decryptorPos);
			funcJs = funcJs.replaceWithStr(decryptorPos, endPos + 1, escapeEvalStr(virtualEval(funcJs.slice(decryptorPos, endPos + 1))));
		}

		return funcJs;
	});
}
let js = fs.readFileSync(FILE_NAME).toString();
jsStatementsArr = decryptGlobalJs(js);
// jsStatementsArr = splitStatements(js);
fs.writeFileSync("DecryptResult1.js", jsStatementsArr.join("\n"));

showMsgProgress("解除代码块加密");
// 有则输出名字，无则输出false
function getFuncDecryptorName(jsStr) {
	// jsStr为空或不是以var 开头
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		// fs.appendFileSync("res.txt", "初步检查不通过:" + jsStr.slice(0, 100) + "\n");
		// console.log("初步检查不通过:", jsStr.slice(0, 100));
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
		// fs.appendFileSync("res.txt", "检查通过:" + jsStr.slice(0, 100) + "\n");
		// console.log("检查通过:", jsStr.slice(0, 100));
		return transStrRes.slice(4, transStrRes.indexOf("="));
	} else {
		// fs.appendFileSync("res.txt", "非加密对象:" + jsStr + "\n");
		// console.warn("非加密对象:", jsStr);
		return false;
	}
}
// 替换掉代码块中所有用加密对象加密过的东西
function replaceObjFunc(callObjName, callFuncName, callStr, ignoreQuoteOutside) {
	// 获取解密对象内函数的参数列表
	let callFunc = virtualEval(callObjName + "['" + callFuncName + "']");
	let funcStr = callFunc.toString(), transFuncStr = transStr(funcStr);
	let funcParams = funcStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")).splitByOtherStr(transFuncStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")), ",");

	// 获取调用解密函数的参数列表
	let transCallLayer = transLayer(callStr), transCallLayer2 = transLayer(callStr, 2);
	let callParamsStr = callStr.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")"));
	let callParams = callParamsStr.splitByOtherStr(transCallLayer2.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")")), ",");
	if (funcParams.length !== callParams.length) {
		throw new Error(`解密对象函数调用参数数量(${callParams.length})与实际(${funcParams})不符`);
	}
	let funcResStr = funcStr.slice(transFuncStr.indexOf("{return ") + 8, transFuncStr.lastIndexOf(";}"));
	funcParams.forEach(function (param, index) {
		// if (transLayer(callParams[index]).match(/[^=!]=[^=]/)) {
		// 	callParams[index] = "(" + callParams[index] + ")";
		// }
		funcResStr = funcResStr.replace(param, callParams[index].replace(/\$/g, "$$$$"));
	});

	if (funcParams.length === 2 && !transFuncStr.endsWith(");}") && !ignoreQuoteOutside) {
		return "(" + funcResStr + ")";
	} else {
		return funcResStr;
	}
}
function findAndDecryptCodeBlock(jsArr, isShowProgress) {
	return jsArr.map(function (jsStr, progress) {
		let transLayerRes = transLayer(jsStr);
		let startPos = Number.POSITIVE_INFINITY;
		while ((startPos === Number.POSITIVE_INFINITY || startPos - 1 >= 0) && (startPos = Math.max(
			transLayerRes.lastIndexOf("{", startPos - 1),
			transLayerRes.lastIndexOf("(", startPos - 1),
			transLayerRes.lastIndexOf("[", startPos - 1)
		)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			if (jsStr[startPos] === "{") {
				let splitStatementsRes = splitStatements(jsStr.slice(startPos + 1, endPos));
				if (splitStatementsRes.length) {
					jsStr = jsStr.replaceWithStr(startPos + 1, endPos, decryptCodeBlockArr(splitStatementsRes).join(""));
					continue;
				}
			}
			jsStr = jsStr.replaceWithStr(startPos + 1, endPos, findAndDecryptCodeBlock([jsStr.slice(startPos + 1, endPos)]).join(""));
		}
		if (isShowProgress) {
			showNumProgress("解除代码块加密", progress + 1, jsArr.length);
		}
		return jsStr;
	});
}
function decryptCodeBlockArr(jsArr, isShowProgress) {
	if (isShowProgress) {
		showNumProgress("解除代码块加密", 0, jsArr.length);
	}
	let decryptorObjName = getFuncDecryptorName(jsArr[0]);
	// 代码块解密
	if (decryptorObjName) {
		virtualGlobalEval(jsArr[0]);

		let transStrRes;
		// TODO 识别是否添加括号（二叉树？不！它超出了我的能力范围。）
		jsArr = jsArr.slice(1).map(function (jsStr) {
			transStrRes = transStr(jsStr);

			let decryptorPos = Number.POSITIVE_INFINITY;
			while ((decryptorPos === Number.POSITIVE_INFINITY || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(decryptorObjName, decryptorPos - 1)) !== -1) {
				let leftSquarePos = transStrRes.indexOf("[", decryptorPos),
					rightSquarePos = transStrRes.indexOf("]", decryptorPos);

				switch (virtualEval("typeof " + decryptorObjName + jsStr.slice(leftSquarePos, rightSquarePos + 1))) {
					case "string": {
						jsStr = jsStr.replaceWithStr(decryptorPos, rightSquarePos + 1, escapeEvalStr(virtualEval(decryptorObjName + jsStr.slice(leftSquarePos, rightSquarePos + 1))));
						break;
					}
					case "function": {
						let transRes = transStr(jsStr);
						let rightRoundPos = getQuoteEndPos(transRes, rightSquarePos + 1);

						let jsStrBehind = transRes.slice(0, decryptorPos),
							jsStrFront = transRes.slice(rightRoundPos + 1);
						let ignoreQuoteOutside =
							(
								(
									jsStrBehind.endsWith("return ") ||
									jsStrBehind.endsWith(";") ||
									jsStrBehind.endsWith("{")
								) && (
									jsStrFront.startsWith(";")
								)
							) || (// 所在的区域周围只有一个运算符
								(
									jsStrBehind.endsWith(",") ||
									jsStrBehind.endsWith("(")
								) && (
									jsStrFront.startsWith(",") ||
									jsStrFront.startsWith(")")
								)
							); // 逗号并列表示周围没有其它运算符
						fs.appendFileSync("res.txt", ignoreQuoteOutside + " (" + jsStrBehind + "   " + jsStr.slice(decryptorPos, rightRoundPos + 1) + "   " + jsStrFront + ")\n" + jsStr + "\n" + jsStr.replaceWithStr(decryptorPos, rightRoundPos + 1, replaceObjFunc(decryptorObjName, jsStr.slice(leftSquarePos + 2, rightSquarePos - 1), jsStr.slice(decryptorPos, rightRoundPos + 1), ignoreQuoteOutside)) + "\n\n");
						jsStr = jsStr.replaceWithStr(decryptorPos, rightRoundPos + 1, replaceObjFunc(decryptorObjName, jsStr.slice(leftSquarePos + 2, rightSquarePos - 1), jsStr.slice(decryptorPos, rightRoundPos + 1), ignoreQuoteOutside));
						break;
					}
				}
			}
			return jsStr;
		});
	}
	return findAndDecryptCodeBlock(jsArr, isShowProgress);
}
jsStatementsArr = decryptCodeBlockArr(jsStatementsArr, true);
fs.writeFileSync("DecryptResult2.js", jsStatementsArr.join("\n"));

showMsgProgress("清理死代码（花指令）");
function simplifyIf(ifJsStr) {
	let conditionStartPos = 2, conditionEndPos = getQuoteEndPos(ifJsStr, conditionStartPos);
	let ifRes = eval(ifJsStr.slice(conditionStartPos, conditionEndPos + 1));
	let elsePos = getQuoteEndPos(ifJsStr, conditionEndPos + 1) + 1, endPos = getQuoteEndPos(ifJsStr, elsePos + 4);

	if (ifRes) {
		return ifJsStr.slice(conditionEndPos + 2, elsePos - 1);
	} else {
		return ifJsStr.slice(elsePos + 5, endPos);
	}
}
function findAndClearDeadCodes(jsArr, isShowProgress) {
	return jsArr.map(function (jsStr, progress) {
		let transLayerRes = transLayer(jsStr);
		let startPos = Number.POSITIVE_INFINITY;
		while ((startPos === Number.POSITIVE_INFINITY || startPos - 1 >= 0) && (startPos = Math.max(
			transLayerRes.lastIndexOf("{", startPos - 1),
			transLayerRes.lastIndexOf("(", startPos - 1),
			transLayerRes.lastIndexOf("[", startPos - 1)
		)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			if (jsStr[startPos] === "{") {
				let splitStatementsRes = splitStatements(jsStr.slice(startPos + 1, endPos));
				if (splitStatementsRes.length) {
					jsStr = jsStr.replaceWithStr(startPos + 1, endPos, clearDeadCodes(splitStatementsRes).join(""));
					continue;
				}
			}
			jsStr = jsStr.replaceWithStr(startPos + 1, endPos, findAndClearDeadCodes([jsStr.slice(startPos + 1, endPos)]).join(""));
		}
		if (isShowProgress) {
			showNumProgress("清理死代码（花指令）", progress + 1, jsArr.length);
		}
		return jsStr;
	});
}
function clearDeadCodes(jsArr, isShowProgress) {
	if (isShowProgress) {
		showNumProgress("清理死代码（花指令）", 0, jsArr.length);
	}
	if (jsArr.length === 1) {
		// if死代码
		let transStrRes = transStr(jsArr[0]), transLayerRes = transLayer(jsArr[0]);
		if (/^if\('S+'[=!]=='S+'\)/.test(transStrRes)) {
			let transFakeIfStr = transLayerRes.match(/if\(Q*\){Q*}else{Q*}/)[0];
			return clearDeadCodes(splitStatements(simplifyIf(jsArr[0].slice(0, transFakeIfStr.length)), "COMMON"));
		}
	} else if (jsArr.length === 2) {
		// switch死代码
		if (/^var (\S*?)='[0-9|]*?'\['split']\('\|'\),(\S*?)=0x0;/.test(jsArr[0]) && /^while\(true\){switch\((\S*?)\[(\S*?)\+\+]\)/.test(jsArr[1])) {
			let initMatch = jsArr[0].match(/var (\S*?)='[0-9|]*?'\['split']\('\|'\),(\S*?)=0x0;/),
				whileMatch = jsArr[1].match(/while\(true\){switch\((\S*?)\[(\S*?)\+\+]\)/);
			let sequence;
			if ((initMatch && initMatch.length === 3 && whileMatch && whileMatch.length === 3) && ((sequence = initMatch[1]) === whileMatch[1] && initMatch[2] === whileMatch[2])) {
				virtualEval(jsArr[0]);
				let sequenceList = virtualEval(sequence);
				let caseBlock = jsArr[1].slice(whileMatch[0].length + 1, getQuoteEndPos(jsArr[1], whileMatch[0].length));
				let transCaseBlock = transLayer(caseBlock);
				let caseList = [];
				let caseRegexp = /case'S*'/g;

				sequenceList.forEach(function () {
					let regRes = caseRegexp.exec(transCaseBlock);
					let startPos = regRes.index + regRes[0].length + 1, endPos = (() => {
						let casePos = transCaseBlock.indexOf("case'", startPos + 1);
						let continuePos = transCaseBlock.indexOf("continue;", startPos + 1);
						if (casePos === -1) {
							casePos = Number.POSITIVE_INFINITY;
						}
						if (continuePos === -1) {
							continuePos = Number.POSITIVE_INFINITY;
						}
						return Math.min(casePos, continuePos);
					})();
					caseList.push(caseBlock.slice(startPos, endPos).replace("continue;", ""));
				});

				return clearDeadCodes(sequenceList.map(function (index) {
					return caseList[index];
				}));
			}
		}
	}
	return findAndClearDeadCodes(jsArr, isShowProgress);
}
jsStatementsArr = clearDeadCodes(jsStatementsArr, true);
fs.writeFileSync("DecryptResult3.js", jsStatementsArr.join("\n"));

showMsgProgress("提升代码可读性");
function decryptFormat(globalJsArr) {
	return globalJsArr.map(function (statement) {
		let transStrRes = transStr(statement);
		let hexNumberPos = Number.POSITIVE_INFINITY;
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
		let objIndexerPos = Number.POSITIVE_INFINITY;
		while ((objIndexerPos = transStrRes.lastSearchOf(/\['(S)*.']/, objIndexerPos - 1)) !== -1) {
			let activeIndexerStr = transStrRes.slice(objIndexerPos).match(/\['(S)*.']/)[0];
			let leftSplitter, rightSplitter;

			let isAheadRegexp = (() => {
				if (transStrRes[objIndexerPos - 1] !== "/") {
					return false;
				}
				let lastRegExpPos = transStrRes.lastSearchOf(/\/(S)*\//, objIndexerPos);
				if (lastRegExpPos === -1) {
					return false;
				} else {
					let activeRegExpStr = transStrRes.slice(lastRegExpPos).match(/\/(S)*\//)[0];
					return lastRegExpPos + activeRegExpStr.length === objIndexerPos;
				}
			})();

			if ((() => { // 判断前面是不是数字
					if (!transStrRes[objIndexerPos - 1].match(/[0-9.]/)) {
						return false;
					}
					let pos = objIndexerPos;
					while (--pos) {
						if (transStrRes[pos].match(/[0-9.]/)) {
						} else {
							return !!transStrRes[pos].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:; @]/);
						}
					}
				})() ||
				transStrRes[objIndexerPos - 1].match(/[{}\[(,+\-*~!%<>=&|^?:;@]/) ||
				transStrRes[objIndexerPos + activeIndexerStr.length].match(/[`'"]/) ||
				(!isAheadRegexp && transStrRes[objIndexerPos - 1] === '/') ||
				statement.slice(objIndexerPos + 2, objIndexerPos + activeIndexerStr.length - 2).match(/[{}\[\]().,+\-*\/\\~!%<>=&|^?:; @]/)
			) {
				// 特殊原因，不转换
			} else {
				// 右边要不要加点
				if (transStrRes[objIndexerPos + activeIndexerStr.length].match(/[^{}\[\]().,+\-*\/~!%<>=&|^?:; ]/) != null) {
					// console.log("√ R", objIndexerPos, activeIndexerStr);
					rightSplitter = ".";
				} else {
					// console.log("× R", objIndexerPos, activeIndexerStr, "[", transStrRes[objIndexerPos - 1], ",", transStrRes[objIndexerPos + activeIndexerStr.length], "]");
					rightSplitter = "";
				}
				statement = statement.replaceWithStr(objIndexerPos + activeIndexerStr.length - 2, objIndexerPos + activeIndexerStr.length, rightSplitter);
				transStrRes = transStrRes.replaceWithStr(objIndexerPos + activeIndexerStr.length - 2, objIndexerPos + activeIndexerStr.length, rightSplitter);

				// 左边要不要加点
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
				} else if (transStrRes[objIndexerPos - 1].match(/[^{\[(.,+\-*~!%<>=&|^?:; ]/) != null) {
					// console.log("√ L", objIndexerPos, activeIndexerStr);
					leftSplitter = ".";
				} else {
					// console.log("× L", objIndexerPos, activeIndexerStr, "[", transStrRes[objIndexerPos - 1], ",", transStrRes[objIndexerPos + activeIndexerStr.length], "]");
					leftSplitter = "";
				}
				statement = statement.replaceWithStr(objIndexerPos, objIndexerPos + 2, leftSplitter);
				transStrRes = transStrRes.replaceWithStr(objIndexerPos, objIndexerPos + 2, leftSplitter);
			}
		}

		return statement;
	});
}
jsStatementsArr = decryptFormat(jsStatementsArr);
fs.writeFileSync("DecryptResult4.js", jsStatementsArr.join("\n"));

const END_TIME = new Date().getTime();

console.clear();
console.info(`* 解密完成！
* 耗时：${END_TIME - START_TIME}ms`);