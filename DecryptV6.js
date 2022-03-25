/**
 * JsjiamiV6简易解密（作者：NXY666）
 */
const FILE_NAME = "./template/format/1.js";

const fs = require("fs");
const vm = require("vm");
const readline = require("readline");
const Path = require("path");

/**
 * 获取数组末尾的值。
 * @returns {any | undefined} 返回数组末尾的值。若数组为空，则返回undefined。
 */
Array.prototype.top = function () {
	return this[this.length - 1];
};

/**
 * 使用字符串替换当前字符串中的一段字符。
 * @param {number} st 起始位置。
 * @param {number} en 结束位置。
 * @param {string} str 替换结果字符串。
 */
String.prototype.replaceWithStr = function (st, en, str) {
	return this.slice(0, st) + str + this.slice(en);
};

/**
 * 以一段长度相同的字符串为模板分割当前字符串。
 * @param {string} str 字符串模板。
 * @param {string} separator 分隔符。
 * @returns {string[]} 返回分割后的字符串数组。
 * @throws {Error} 字符串模板长度与当前字符串长度不一致时抛出错误。
 */
String.prototype.splitByOtherStr = function (str, separator) {
	if (this.length !== str.length) {
		throw Error("字符串模板长度与当前字符串长度不一致。");
	}
	let splitRes = str.split(separator);
	let nowPos = 0;
	return splitRes.map(function (item) {
		let res = this.slice(nowPos, nowPos + item.length);
		nowPos += item.length + separator.length;
		return res;
	}.bind(this));
};

/**
 * 使用正则表达式或字符串从某一位置开始搜索字符串。
 * @param {RegExp|string} regexp 正则表达式。若为字符串则等同于 String.indexOf 。
 * @param {number?} position 起始位置。若不指定则从 0 位置开始搜索。
 * @returns {number} 匹配到的索引值。若未匹配成功，则返回 -1。
 */
String.prototype.searchOf = function (regexp, position) {
	if (typeof regexp == "string") {
		return this.indexOf(regexp, position);
	}

	if (position === undefined) {
		position = 0;
	}

	if (position < 0) {
		position = 0;
	} else if (position >= this.length) {
		return -1;
	}

	return position + this.slice(position).search(regexp);
};

/**
 * 使用正则表达式或字符串从字符串末尾的某一位置开始搜索字符串。
 * @param {RegExp|string} regexp 正则表达式。若为字符串则等同于 String.lastIndexOf 。
 * @param {number?} position 起始位置。若不指定则从 0 位置开始搜索。
 * @returns {number} 匹配到的索引值。若未匹配成功，则返回 -1。
 */
String.prototype.lastSearchOf = function (regexp, position) {
	if (typeof regexp != "object") {
		return this.lastIndexOf(regexp, position);
	} else {
		regexp = new RegExp(regexp.source, regexp.flags + 'g');
	}

	if (position === undefined) {
		position = 0;
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

fs.writeFileSync("res.txt", "");
/**
 * 日志工具
 * */
const Logger = (function () {
	function Logger(options) {
		options = options || {};
		this.mergeOptions(this._options, options);
		console.clear();
	}

	Logger.prototype._options = {
		// 进度选项
		logOptions: {},
		// 进度选项
		progressOptions: {
			length: 50,
			frequency: 100,
			emptyStr: " ",
			fullStr: "="
		}
	};
	Logger.prototype._data = {
		// 日志数据
		log: {
			content: null,
			lastTime: 0,
			line: 0,
			lastContentLines: 0
		},
		// 进度数据
		progress: {
			enabled: false,
			determine: false,
			finished: false,
			max: 100,
			now: 0
		}
	};

	Logger.prototype.mergeOptions = function (targetOption, newOption) {
		if (!newOption) {
			return targetOption;
		}
		Object.keys(targetOption).forEach(function (key) {
			if (newOption[key] === undefined) {
				return;
			}
			if (typeof targetOption[key] != "object" || Array.isArray(targetOption[key])) {
				targetOption[key] = newOption[key];
			} else {
				targetOption[key] = this.mergeOptions(targetOption[key], newOption[key]);
			}
		}.bind(this));
		return targetOption;
	};

	Logger.prototype.weakUpdate = function () {
		this.updateConsole();
	};
	Logger.prototype.updateConsole = function (forceOutput, nextLine) {
		// 检查更新是否过于频繁
		if (!forceOutput && new Date().getTime() - this._data.log.lastTime < this._options.progressOptions.frequency) {
			return;
		} else {
			this._data.log.lastTime = new Date().getTime();
		}

		// 日志进度
		let now, max, length, percent;
		let progressArr = [], progressStr = "";
		if (this._data.progress.enabled) {
			now = this._data.progress.now;
			max = this._data.progress.max;
			if (now > max) {
				now = max;
			}
			progressArr.length = length = this._options.progressOptions.length;
			if (this._data.progress.determine) {
				percent = Math.floor(now / max * length);
				progressArr.fill(this._options.progressOptions.fullStr, 0, percent);
				progressArr.fill(this._options.progressOptions.emptyStr, percent, length);
				progressStr = `[${progressArr.join("")}] ${(now / max * 100).toFixed(1).padStart(5, " ")}%`;
			} else {
				if (this._data.progress.finished) {
					progressArr.fill(this._options.progressOptions.fullStr, 0, length);
					progressStr = `[${progressArr.join("")}]`;
				} else {
					let progressBarStart = now % length,
						progressBarEnd = progressBarStart + length / 5;
					progressArr.fill(this._options.progressOptions.emptyStr, 0, length);
					progressArr.fill(this._options.progressOptions.fullStr, progressBarStart, progressBarEnd);
					let exceed = progressBarEnd - length;
					if (exceed > 0) {
						progressArr.fill(this._options.progressOptions.fullStr, 0, exceed);
					}
					progressStr = `[${progressArr.join("")}]`;
					this._data.progress.now++;
				}
			}
		}

		// 拼装内容和进度
		let outputStr = `* ${this._data.log.content} ${progressStr}`;

		// 写入日志
		if (!nextLine) {
			readline.cursorTo(process.stdout, 0, this._data.log.line);
		} else {
			this._data.log.line += this._data.log.lastContentLines;
		}
		let lastContentLines = this._data.log.lastContentLines;
		this._data.log.lastContentLines = outputStr.split("\n").map(function (line) {
			console.info(line);
		}).length;
		if (lastContentLines > this._data.log.lastContentLines) {
			for (let i = lastContentLines - this._data.log.lastContentLines; i > 0; i--) {
				console.info("\n");
			}
		}
	};

	Logger.prototype.logWithProgress = function (content, now, max) {
		let logChanged = this._data.log.content !== null && this._data.log.content !== content;
		if (logChanged && !this._data.progress.determine) {
			this.logWithoutDetermineFinished();
		}
		this._data.log.content = content;
		this._data.progress.enabled = true;
		this._data.progress.determine = true;
		this._data.progress.now = now;
		this._data.progress.max = max;
		this.updateConsole(true, logChanged);
	};
	Logger.prototype.logWithoutDetermine = function (content) {
		let logChanged = this._data.log.content !== null && this._data.log.content !== content;
		if (logChanged && !this._data.progress.determine) {
			this.logWithoutDetermineFinished();
		}
		this._data.log.content = content;
		this._data.progress.enabled = true;
		this._data.progress.determine = false;
		this._data.progress.finished = false;
		this._data.progress.now = 0;
		this._data.progress.max = Number.POSITIVE_INFINITY;
		this.updateConsole(true, logChanged);
	};
	Logger.prototype.logWithoutDetermineFinished = function () {
		this._data.progress.finished = true;
		this.updateConsole(true);
	};
	Logger.prototype.logWithoutProgress = function (content) {
		let logChanged = this._data.log.content !== null && this._data.log.content !== content;
		if (logChanged && !this._data.progress.determine) {
			this.logWithoutDetermineFinished();
		}
		this._data.log.content = content;
		this._data.progress.enabled = false;
		this.updateConsole(true, logChanged);
	};
	return Logger;
})();
function pause(text) {
	console.warn(`${text !== undefined ? text + "\n" : ""}[请按任意键继续]`);
	let stopTime = new Date().getTime();
	process.stdin.setRawMode(true);
	fs.readSync(0, Buffer.alloc(1), 0, 1, null);
	process.stdin.setRawMode(false);
	PAUSE_TIME += new Date().getTime() - stopTime;
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
					continue;
				} else if (signStack.length === 0) {
					// [{( +-* <>=? &|! ~^
					if (jsArr[nowPos + 1] === '*') {
						// 块注释
						let endPos = jsStr.indexOf("*/", nowPos);
						jsArr.fill("C", nowPos + 2, endPos);
						nowPos = endPos + 1;
					} else if (jsArr[nowPos + 1] === '/') {
						// 行注释
						let endPos = jsStr.searchOf(/(\n|\r|\n\r|\r\n)/, nowPos);
						jsArr.fill("C", nowPos + 2, endPos);
						nowPos = endPos - 1;
					} else if (nowPos === 0 || jsArr[nowPos - 1].match(/[\[{(+\-*<>=?&|!~^;]/)) {
						// 开始正则
						signStack.push(jsArr[nowPos]);
					}
					continue;
				}
				break;
			case '"':
			case "'":
			case '`':
				if (signStack.top() === jsArr[nowPos]) {
					// 结束字符串
					signStack.pop();
					continue;
				} else if (signStack.length === 0) {
					// 开始字符串
					signStack.push(jsArr[nowPos]);
					continue;
				}
				break;
			case '\\':
				if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
					jsArr[nowPos++] = 'S';
				}
				break;
			default:
				break;
		}
		if (signStack.top() === '"' || signStack.top() === "'" || signStack.top() === '/' || signStack.top() === '`') {
			jsArr[nowPos] = 'S';
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
		if (tmpStr === "" || tmpStr === ";") {
			// 空
			statementType = "EMPTY";
		} else if (/^([^,:;]+:[^,:;]+,)*[^,:;]+:[^,:;]+$/.test(tmpStr)) {
			// 对象
			statementType = "OBJECT";
		} else if (/^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~ ]|default:)/.test(transLayerRes.slice(0, 8))) {
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
			let startPos = 0, endPos = transLayerRes.indexOf(";", startPos);
			if (endPos === -1) {
				endPos = Number.POSITIVE_INFINITY;
			}
			do {
				let partJsStr = jsStr.slice(startPos, endPos + 1),
					transPartJsStr = transLayerRes.slice(startPos, endPos + 1);
				if (statementType === "SWITCH_CASE") {
					if (/^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~ ]|(default:))/.test(transPartJsStr.slice(0, 8))) {
						// switch...case
						endPos = transPartJsStr.indexOf(":");
						splitJsArr.push(partJsStr.slice(0, endPos + 1));
						startPos += endPos + 1;
					} else if ((() => {
						let matchRes =
							transLayerRes.slice(startPos).match(/^if\(Q+\){?.*?(};|;|})(else if\(Q+\){?.*?(};|;|}))*(else{?.*?(};|;|}))?/) || // if...else
							transPartJsStr.match(/^(async )?function [^(]+?\(Q*\){Q*};?/) || // function（花括号不可省略，无需判断）
							transPartJsStr.match(/^(for|while)\(Q+\){?.*?(};|;|})/) || // for / while（花括号可省略，需判断）
							transPartJsStr.match(/^do{?.*?[;}]\(Q+\);?/) || // do...while（花括号可省略，需判断）
							transPartJsStr.match(/^try{Q*}catch\(Q+\){Q*};?/) || // try...catch（两个花括号都不能省，所以无需判断）
							transPartJsStr.match(/^switch\(Q+\){Q*};?/); // switch（两个花括号都不能省，所以无需判断）
						return matchRes && (endPos = startPos + matchRes[0].length);
					})()) {
						splitJsArr.push(jsStr.slice(startPos, endPos));
						startPos = endPos;
					} else {
						// 其它
						splitJsArr.push(jsStr.slice(startPos, endPos + 1));
						startPos = endPos + 1;
					}
				} else if ((() => {
					let matchRes =
						transLayerRes.slice(startPos).match(/^if\(Q+\){?.*?(};|;|})(else if\(Q+\){?.*?(};|;|}))*(else{?.*?(};|;|}))?/) || // if...else
						transPartJsStr.match(/^(async )?function [^(]+?\(Q*\){Q*};?/) || // function（花括号不可省略，无需判断）
						transPartJsStr.match(/^(for|while)\(Q+\){?.*?(};|;|})/) || // for / while（花括号可省略，需判断）
						transPartJsStr.match(/^do{?.*?[;}]\(Q+\);?/) || // do...while（花括号可省略，需判断）
						transPartJsStr.match(/^try{Q*}catch\(Q+\){Q*};?/) || // try...catch（两个花括号都不能省，所以无需判断）
						transPartJsStr.match(/^switch\(Q+\){Q*};?/); // switch（两个花括号都不能省，所以无需判断）
					return matchRes && (endPos = startPos + matchRes[0].length);
				})()) {
					splitJsArr.push(jsStr.slice(startPos, endPos));
					startPos = endPos;
				} else {
					// 其它
					splitJsArr.push(jsStr.slice(startPos, endPos + 1));
					startPos = endPos + 1;
				}
			} while ((endPos = transLayerRes.indexOf(";", startPos)) !== -1);
			if (startPos < jsStr.length) {
				splitJsArr.push(jsStr.slice(startPos));
			}
			break;
		}
		default: {
			throw "未知的代码块类型 " + statementType;
		}
	}
	splitJsArr.type = statementType;
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

// 开始计时
let START_TIMESTAMP = new Date().getTime(), PAUSE_TIME = 0;

// 初始化日志工具并确认文件路径
let logger = new Logger({});
logger.logWithoutProgress("----====* JsjiamiV6 Decryptor *====----");
let absolutePathStr = Path.resolve(FILE_NAME);
logger.logWithoutProgress("解密文件：" + absolutePathStr);
logger.logWithoutProgress("输出目录：" + Path.resolve("./"));
pause();

let js = fs.readFileSync(absolutePathStr).toString().trim() + ";";

logger.logWithoutDetermine("净化代码");
function compressionCode(jsStr) {
	let transRes = transStr(jsStr);

	let commentPos = Number.POSITIVE_INFINITY;
	while ((commentPos === Number.POSITIVE_INFINITY || commentPos - 1 >= 0) && (commentPos = Math.max(
		transRes.lastSearchOf(/\/\*C*\*\//, commentPos - 1),
		transRes.lastSearchOf(/\/\/C*(\n|\r|\n\r|\r\n)/, commentPos - 1)
	)) !== -1) {
		logger.weakUpdate();
		switch (transRes[commentPos + 1]) {
			case '*': {
				let blockComment = transRes.slice(commentPos).match(/^\/\*C*\*\//)[0];
				jsStr = jsStr.replaceWithStr(commentPos, commentPos + blockComment.length, "");
				break;
			}
			case '/': {
				let lineComment = transRes.slice(commentPos).match(/^\/\/C*(\n|\r|\n\r|\r\n)/)[0];
				jsStr = jsStr.replaceWithStr(commentPos, commentPos + lineComment.length, "");
				break;
			}
			default:
				throw new Error("发现未知的注释类型。");
		}
	}

	transRes = transStr(jsStr);
	fs.writeFileSync("res.js", transRes);

	let spacePos = Number.POSITIVE_INFINITY;
	while ((spacePos === Number.POSITIVE_INFINITY || spacePos - 1 >= 0) && (spacePos = Math.max(
		transRes.lastIndexOf(" ", spacePos - 1),
		transRes.lastIndexOf("\t", spacePos - 1),
		transRes.lastIndexOf("\n", spacePos - 1),
		transRes.lastIndexOf("\r", spacePos - 1)
	)) !== -1) {
		logger.weakUpdate();
		fs.appendFileSync("res.txt", jsStr.slice(spacePos - 1, spacePos + 2) + " ");
		if ((jsStr[spacePos - 1] == null || jsStr[spacePos - 1].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:;@ \t\n\r]/)) ||
			(jsStr[spacePos + 1] == null || jsStr[spacePos + 1].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:;@ \t\n\r]/))) {
			jsStr = jsStr.replaceWithStr(spacePos, spacePos + 1, "");
		}
		fs.appendFileSync("res.txt", jsStr.slice(spacePos - 1, spacePos + 2) + "\n");
	}

	return jsStr;
}
js = compressionCode(js);
fs.writeFileSync("DecryptResult0.js", js);

logger.logWithoutDetermine("解除全局加密");
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
				// /return _?[0-9a-z]+?\(\+\+_?[0-9a-z]+?,_?[0-9a-z]+?\)>>_?[0-9a-z]+?\^_?[0-9a-z]+?;/.test(jsStr) &&
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

		/**
		 * 验证函数
		 * @namespace globalDecryptorInfo.verifyFunction
		 * @description 验证解密数据是否被修改，并去掉头尾多余内容。
		 * 变量命名规则 _?[0-9a-zA-Z$]+?
		 * 字符串规则 'S+?'
		 * */
		if (globalDecryptorInfo.signInfo.raw != null && globalDecryptorInfo.preprocessFunction.raw == null && globalDecryptorInfo.decryptor.raw != null) {
			if (
				/\['replace']\(\/\[[a-zA-Z]+=]\/g,''/.test(jsStr) &&
				index === 2
			) {
				globalDecryptorInfo.verifyFunction.raw = jsStr;
				return {
					type: "VERIFY_FUNCTION",
					content: globalDecryptorInfo.verifyFunction
				};
			}
		}

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
		logger.weakUpdate();
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
		return jsArr;
	} else {
		if (globalDecryptorInfo.preprocessFunction.raw === null && globalDecryptorInfo.verifyFunction.raw === null) {
			pause("【警告】已发现解密器，但未发现其对应的预处理函数和验证函数，可能无法正常运行。可在GitHub上提交issue以寻找原因。");
		}
		virtualGlobalEval(globalDecryptorInfo.signInfo.raw);
		virtualGlobalEval(globalDecryptorInfo.preprocessFunction.raw);
		virtualGlobalEval(globalDecryptorInfo.decryptor.raw);
		virtualGlobalEval(globalDecryptorInfo.verifyFunction.raw);
	}
	return jsArr.filter(function (jsStr, index) {
		// console.log(statementsTypeArr[index].type);
		return statementsTypeArr[index].type === "COMMON";
	}).map(function (funcJs) {
		logger.weakUpdate();
		transStrRes = transStr(funcJs);

		let decryptorPos = Number.POSITIVE_INFINITY;
		while ((decryptorPos === Number.POSITIVE_INFINITY || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(`${globalDecryptorInfo.decryptor.name}('`, decryptorPos - 1)) !== -1) {
			logger.weakUpdate();
			let endPos = transStrRes.indexOf(")", decryptorPos);
			funcJs = funcJs.replaceWithStr(decryptorPos, endPos + 1, escapeEvalStr(virtualEval(funcJs.slice(decryptorPos, endPos + 1))));
		}

		return funcJs;
	});
}
jsStatementsArr = decryptGlobalJs(js);
fs.writeFileSync("DecryptResult1.js", jsStatementsArr.join("\n"));

logger.logWithoutProgress("解除代码块加密");
/**
 * 获取代码块加密对象的名称
 * @param jsStr {string} 需解析的代码块
 * @returns {string | boolean} 若传入的代码块包含加密对象则输出加密对象名称，反之则输出false。
 */
function getFuncDecryptorName(jsStr) {
	// jsStr为空或不是以var 开头
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		// fs.appendFileSync("res.txt", "初步检查不通过:" + jsStr.slice(0, 100) + "\n");
		// console.log("初步检查不通过:", jsStr.slice(0, 100));
		return false;
	}

	let transStrRes = transLayer(jsStr, 2);
	let checkRes = transStrRes.slice(transStrRes.indexOf("{") + 1, transStrRes.lastIndexOf("}")).split(",").every(function (objectItem) {
		let checkRes = objectItem.match(/'(S)*':('(S)*'|function\((Q)*\){(Q)*})/);
		return checkRes && checkRes[0] === objectItem;
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
/**
 * 替换代码块中使用加密对象方法加密的内容
 * @param callObjName {string} 所在代码块的加密对象名称
 * @param callFuncName {string} 调用加密对象的方法名称
 * @param callStr {string} 调用加密对象方法的原文
 * @param ignoreQuoteOutside {boolean} 解密完成后是否不使用圆括号包装结果
 * @returns {string} 解密结果
 */
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
			logger.logWithProgress("解除代码块加密", progress + 1, jsArr.length);
		}
		return jsStr;
	});
}
function decryptCodeBlockArr(jsArr, isShowProgress) {
	if (isShowProgress) {
		logger.logWithProgress("解除代码块加密", 0, jsArr.length);
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
								( // 所在的区域周围只有一个运算符
									jsStrBehind.endsWith("return ") ||
									jsStrBehind.endsWith(";") ||
									jsStrBehind.endsWith("{")
								) && (
									jsStrFront.startsWith(";")
								)
							) || (
								( // 逗号并列表示周围没有其它运算符
									jsStrBehind.endsWith(",") ||
									jsStrBehind.endsWith("(")
								) && (
									jsStrFront.startsWith(",") ||
									jsStrFront.startsWith(")")
								)
							) || (
								( // 所在的区域周围只有一个运算符
									jsStrBehind.endsWith("[")
								) && (
									jsStrFront.startsWith("]")
								)
							);
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

logger.logWithProgress("清理死代码（花指令）");
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
			logger.logWithProgress("清理死代码（花指令）", progress + 1, jsArr.length);
		}
		return jsStr;
	});
}
function clearDeadCodes(jsArr, isShowProgress) {
	if (isShowProgress) {
		logger.logWithProgress("清理死代码（花指令）", 0, jsArr.length);
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

logger.logWithoutDetermine("提升代码可读性");
function decodeStr(txt) {
	return eval(`(\`${txt.replace(/`/g, "\\`")}\`)`).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
function decryptFormat(globalJsArr) {
	return globalJsArr.map(function (statement) {
		logger.weakUpdate();
		let transStrRes = transStr(statement);
		let hexNumberPos = Number.POSITIVE_INFINITY;
		while ((hexNumberPos = transStrRes.lastSearchOf(/0x[0-9a-fA-F]*/, hexNumberPos - 1)) !== -1) {
			logger.weakUpdate();
			let activeNumStr = transStrRes.slice(hexNumberPos).match(/0x([0-9a-fA-F])*/)[0];
			// ^~是位运算符，此处排除
			let checkNumberRegexp = /[{}\[\]().,+\-*\/!<>%=&|?:; ]/;
			if (
				transStrRes[hexNumberPos - 1].match(checkNumberRegexp) != null &&
				(transStrRes[hexNumberPos - 1].match(/[&|]/) == null || transStrRes[hexNumberPos - 1] === transStrRes[hexNumberPos - 2]) &&
				(transStrRes[hexNumberPos - 1].match(/[<>]/) == null || transStrRes[hexNumberPos - 1] !== transStrRes[hexNumberPos - 2]) &&
				transStrRes[hexNumberPos + activeNumStr.length].match(checkNumberRegexp) != null &&
				(transStrRes[hexNumberPos + activeNumStr.length].match(/[&|]/) == null || transStrRes[hexNumberPos + activeNumStr.length] === transStrRes[hexNumberPos + activeNumStr.length + 1]) &&
				(transStrRes[hexNumberPos + activeNumStr.length].match(/[<>]/) == null || transStrRes[hexNumberPos + activeNumStr.length] !== transStrRes[hexNumberPos + activeNumStr.length + 1])
			) {
				// console.log("√", hexNumberPos, activeNumStr);
				statement = statement.replaceWithStr(hexNumberPos, hexNumberPos + activeNumStr.length, parseInt(activeNumStr, 16));
			} else {
				// console.log("×", hexNumberPos, activeNumStr, "[", transStrRes[hexNumberPos - 1], ",", transStrRes[hexNumberPos + activeNumStr.length], "]");
			}
		}

		transStrRes = transStr(statement);
		let objIndexerPos = Number.POSITIVE_INFINITY;
		while ((objIndexerPos = transStrRes.lastSearchOf(/\['S*.']/, objIndexerPos - 1)) !== -1) {
			logger.weakUpdate();
			let activeIndexerStr = transStrRes.slice(objIndexerPos).match(/\['(S)*.']/)[0];
			let leftSplitter, rightSplitter;

			let isAheadRegexp = (() => {
				if (transStrRes[objIndexerPos - 1] !== "/") {
					return false;
				}
				let lastRegExpPos = transStrRes.lastSearchOf(/\/S*\//, objIndexerPos);
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
				statement.slice(objIndexerPos + 2, objIndexerPos + activeIndexerStr.length - 2).match(/[{}\[\]().,+\-*\/\\~!%<>=&|^?:; @]/) ||
				statement[objIndexerPos + 2].match(/[0-9]/)
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
					let lastRegExpPos = transStrRes.lastSearchOf(/\/S*\//, objIndexerPos);
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

		transStrRes = transStr(statement);
		// console.log("trans: ", transStrRes);
		let hexCharRes = Number.POSITIVE_INFINITY;
		// console.log("first: ", transStrRes.lastSearchOf(/'S+'/, hexCharRes - 1));
		while ((hexCharRes = transStrRes.lastSearchOf(/'S+'/, hexCharRes - 1)) !== -1) {
			logger.weakUpdate();
			let activeStr = transStrRes.slice(hexCharRes++).match(/'S+'/)[0];
			// console.log("raw: ", transStrRes.slice(hexCharRes - 1, hexCharRes + activeStr.length - 1), statement.slice(hexCharRes - 1, hexCharRes + activeStr.length - 1));
			// console.log("result: ", decodeStr(statement.slice(hexCharRes, hexCharRes + activeStr.length - 2)));
			statement = statement.replaceWithStr(hexCharRes, hexCharRes + activeStr.length - 2, decodeStr(statement.slice(hexCharRes, hexCharRes + activeStr.length - 2)));
		}

		return statement;
	});
}
jsStatementsArr = decryptFormat(jsStatementsArr);
fs.writeFileSync("DecryptResult4.js", jsStatementsArr.join("\n"));

logger.logWithoutProgress("格式化代码");
function findAndFormatCodeBlock(jsArr, layer, isShowProgress) {
	return jsArr.map(function (jsStr, progress) {
		// 特殊情况会在前面添加前缀
		let prefixCount = 0;
		if (jsStr[0] === "\t") {
			prefixCount = layer - /^\t+/.test(jsStr).toString().length + 1;
		}

		let transLayerRes = transLayer(jsStr);
		let startPos = Number.POSITIVE_INFINITY;
		while ((startPos === Number.POSITIVE_INFINITY || startPos - 1 >= 0) && (startPos = Math.max(
			transLayerRes.lastIndexOf("{", startPos - 1),
			transLayerRes.lastIndexOf("(", startPos - 1),
			transLayerRes.lastIndexOf("[", startPos - 1)
		)) !== -1) {
			let endPos = getQuoteEndPos(jsStr, startPos);
			if (jsStr[startPos] === "{") {
				// 拆分代码并顺便清理空语句
				let splitStatementsRes = splitStatements(jsStr.slice(startPos + 1, endPos)).filter(function (statement) {
					return statement !== ";";
				});
				if (splitStatementsRes.length) {
					let isCaseBlock = /^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~ ]|default:)/.test(transStr(splitStatementsRes[0]).slice(0, 8));
					let padTabs = "\n" + "".padEnd(layer + prefixCount, "\t");
					if (isCaseBlock) {
						splitStatementsRes = splitStatementsRes.map(function (statement) {
							if (!/^(case[!"%&'(*+,\-.\/:;<=>?@\[^{|~ ]|default:)/.test(transStr(statement).slice(0, 8))) {
								return "\t" + statement;
							} else {
								return statement;
							}
						});
					}
					jsStr = jsStr.replaceWithStr(startPos + 1, endPos, padTabs + findAndFormatCodeBlock(splitStatementsRes, layer + 1).join(padTabs) + padTabs.slice(0, -1));
				}
				continue;
			}
			jsStr = jsStr.replaceWithStr(startPos + 1, endPos, findAndFormatCodeBlock([jsStr.slice(startPos + 1, endPos)], layer).join("\n" + "".padEnd(layer, "\t")));
		}
		if (isShowProgress) {
			logger.logWithProgress("格式化代码", progress + 1, jsArr.length);
		}
		return jsStr;
	});
}
jsStatementsArr = findAndFormatCodeBlock(jsStatementsArr, 1, true);
fs.writeFileSync("DecryptResult5.js", jsStatementsArr.join("\n"));

const END_TIMESTAMP = new Date().getTime();

logger.logWithoutProgress(`解密完成！
* 耗时：${END_TIMESTAMP - START_TIMESTAMP - PAUSE_TIME}ms`);