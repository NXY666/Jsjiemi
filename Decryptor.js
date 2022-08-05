/**
 * JsjiamiV6解密工具
 * @author NXY666
 * @version 2.9.0
 */
const fs = require("fs");
const readline = require("readline");
const Path = require("path");
const vm = require("vm");
let vm2;

/**
 * 获取数组末尾的值。
 * @param {number} offset 偏移值。
 * @returns {any | undefined} 返回数组末尾的值。若数组为空，则返回undefined。
 */
Array.prototype.top = function (offset = 0) {
	return this[this.length - 1 - offset];
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
String.prototype.searchOf = function (regexp, position = 0) {
	if (typeof regexp == "string") {
		return this.indexOf(regexp, position);
	}

	if (position < 0) {
		position = 0;
	} else if (position >= this.length) {
		return -1;
	}

	let searchRes = this.slice(position).search(regexp);
	return searchRes === -1 ? -1 : position + searchRes;
};

/**
 * 使用正则表达式或字符串从字符串末尾的某一位置开始搜索字符串。
 * @param {RegExp|string} regexp 正则表达式。若为字符串则等同于 String.lastIndexOf ，在该方法下贪婪模式不生效。
 * @param {number?} position 起始位置。若不指定则从 +Infinity 位置开始搜索。
 * @returns {number} 匹配到的索引值。若未匹配成功，则返回 -1。
 */
String.prototype.lastSearchOf = function (regexp, position = Number.POSITIVE_INFINITY) {
	let srcReg = regexp;
	if (regexp instanceof RegExp) {
		regexp = new RegExp(`[\\s\\S]*(?=(?:${regexp.source}))`, regexp.flags.replace(/g/g, ''));
	} else {
		return this.lastIndexOf(regexp, position);
	}

	let thisStr = this;

	if (position < 0) {
		return -1;
	} else if (position < thisStr.length) {
		thisStr = thisStr.slice(0, position + 1);
	}

	if (!srcReg.test(thisStr)) {
		return -1;
	}

	return thisStr.match(regexp)[0].length;
};

/**
 * 填充字符串。
 * @param {string} char 正则表达式。若为字符串则等同于 String.lastIndexOf ，在该方法下贪婪模式不生效。
 * @param {number?} st 起始位置。若不指定则从字符串开头开始。
 * @param {number?} en 结束位置。若不指定则从字符串末尾结束。
 * @returns {string} 填充结果。
 */
String.prototype.fill = function (char, st = 0, en = this.length) {
	if (st < 0) {
		st = 0;
	} else if (st >= this.length) {
		return this;
	}

	if (en < 0) {
		return this;
	} else if (en >= this.length) {
		en = this.length;
	}

	return this.split("").fill(char, st, en).join("");
};

// fs.writeFileSync("res.txt", "");

/**
 * 日志工具
 * */
const Logger = (function () {
	function Logger(options) {
		options = options || {};
		this.mergeOptions(this._options, options);
		this._data.progress.layers[-1] = {
			index: -1,
			now: 0,
			max: 1,
			tempSize: 100,
			tempProg: 0
		};
		console.clear();
	}

	Logger.prototype._options = {
		// 进度选项
		content: {
			linePrefix: {
				first: "* ",
				others: "· "
			}
		},
		// 进度选项
		progress: {
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
			now: 0,
			layers: []
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
	Logger.prototype.updateConsole = function (forceOutput, stayInline) {
		// 检查更新是否过于频繁
		if (!forceOutput && Date.now() - this._data.log.lastTime < this._options.progress.frequency) {
			return;
		} else {
			this._data.log.lastTime = Date.now();
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
			progressArr.length = length = this._options.progress.length;
			if (this._data.progress.determine) {
				percent = Math.floor(now / max * length);
				progressArr.fill(this._options.progress.fullStr, 0, percent);
				progressArr.fill(this._options.progress.emptyStr, percent, length);
				progressStr = `[${progressArr.join("")}] ${(now / max * 100).toFixed(1).padStart(5, " ")}%`;
			} else {
				if (this._data.progress.finished) {
					progressArr.fill(this._options.progress.fullStr, 0, length);
					progressStr = `[${progressArr.join("")}]`;
				} else {
					let progressBarStart = now % length,
						progressBarEnd = progressBarStart + length / 5;
					progressArr.fill(this._options.progress.emptyStr, 0, length);
					progressArr.fill(this._options.progress.fullStr, progressBarStart, progressBarEnd);
					let exceed = progressBarEnd - length;
					if (exceed > 0) {
						progressArr.fill(this._options.progress.fullStr, 0, exceed);
					}
					progressStr = `[${progressArr.join("")}]`;
					this._data.progress.now++;
				}
			}
		}

		let logContents = this._data.log.content.split("\n"), logContentLength = logContents.length;

		// 写入日志
		if (stayInline) {
			this._data.log.line += this._data.log.lastContentLines;
		} else {
			readline.cursorTo(process.stdout, 0, this._data.log.line);
		}
		let lastContentLines = this._data.log.lastContentLines;
		logContents.forEach(function (line, index) {
			console.info((index === 0 ? this._options.content.linePrefix.first : this._options.content.linePrefix.others) + line + (index === logContentLength - 1 ? " " + progressStr : ""));
		}.bind(this));
		if (lastContentLines > logContentLength) {
			for (let i = lastContentLines - logContentLength; i > 0; i--) {
				console.info("\n");
			}
		}
		this._data.log.lastContentLines = logContentLength;
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

	Logger.prototype.addLayer = function (max) {
		let nowIndex = this._data.progress.layers.length;
		let lastLayer = this._data.progress.layers[nowIndex - 1];
		this._data.progress.layers.push({
			index: nowIndex,
			now: 0,
			max,
			tempSize: lastLayer.tempSize / lastLayer.max,
			tempProg: lastLayer.tempProg
		});
	};
	Logger.prototype.setLayer = function (now, max) {
		let lastLayer = this._data.progress.layers.top(-1);
		let nowLayer = this._data.progress.layers.top();
		if (now !== undefined) {
			nowLayer.now = now;
		}
		if (max !== undefined) {
			nowLayer.max = max;
		}
		nowLayer.tempProg = lastLayer.tempProg + nowLayer.tempSize * nowLayer.now / nowLayer.max;
	};
	Logger.prototype.removeLayer = function () {
		this._data.progress.layers.pop();
	};
	return Logger;
})();
function pause(text) {
	if (config["quietMode"]) {
		return;
	}
	// process.stdin.setRawMode已被废弃，某些版本只能使用回车键来解除暂停
	console.warn(`${text !== undefined ? text + "\n" : ""}[请按${process.stdin.setRawMode ? '任意' : '回车'}键继续]`);
	let stopTime = Date.now();
	process.stdin.setRawMode && process.stdin.setRawMode(true);
	try {
		fs.readSync(0, Buffer.alloc(1), 0, 1, null);
	} catch (e) {
		if (e.code === 'EAGAIN') {
			// 'resource temporarily unavailable'
			// Happens on OS X 10.8.3 (not Windows 7!)
			throw Error("暂停功能不受支持，请在配置文件中启用安静模式。");
		} else if (e.code === 'EOF') {
			// Happens on Windows 7, but not OS X 10.8.3:
			// simply signals the end of *piped* stdin input.
		} else {
			throw e;
		}
	}
	process.stdin.setRawMode && process.stdin.setRawMode(false);
	PAUSE_TIME += Date.now() - stopTime;
}
/**
 * 代码分析工具
 * */
function transStr(jsStr) {
	let signStack = [], jsArr = jsStr.split("");
	let signStartPosStack = [], lastQuoteStartPos = -1;
	for (let nowPos = 0; nowPos < jsArr.length; nowPos++) {
		switch (jsArr[nowPos]) {
			case '/':
				if (signStack.top() === jsArr[nowPos]) {
					// 结束正则
					signStack.pop();
					lastQuoteStartPos = signStartPosStack.pop();
					continue;
				} else if (signStack.length === 0) {
					// [{( +-* <>=? &|! ~^ ,
					if (jsArr[nowPos + 1] === '*') {
						// 块注释
						let endPos = jsStr.indexOf("*/", nowPos);
						jsArr.fill("C", nowPos + 2, endPos);
						nowPos = endPos + 1;
					} else if (jsArr[nowPos + 1] === '/') {
						// 行注释
						let endPos = jsStr.searchOf(/\n?\r|\r?\n/, nowPos);
						jsArr.fill("C", nowPos + 2, endPos);
						nowPos = endPos - 1;
					} else if (nowPos === 0 || (() => {
						let jsStrBehind = jsStr.slice(0, nowPos).trim();
						if (
							// 符号后为正则表达式
							/(\.|\(|,|{|}|\[|;|(?:[=!]?=|\+|-|\*|%|<?<|>?>?>|&|\||^|\/|!)?=|\*|%|\+?\+|-?-|<?<|>?>?>|&?&|^|!|~|\|?\||\?|:)$/.test(jsStrBehind) ||
							// 关键字后为正则表达式
							/(?:^|[\u0000-\u0023\u0025-\u002d\u002f\u003a-\u0040\u005b-\u005c\u005e\u0060\u007b-\u00a9\u00ab-\u00b4\u00b6\u00b8-\u00b9\u00bb-\u00bf\u00d7\u00f7\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02eb\u02ed\u02ef-\u02ff\u0375\u0378-\u0379\u037e\u0380-\u0385\u038b\u038d\u03a2\u03f6\u0482\u0488-\u0489\u0530\u0557-\u0558\u055a-\u055f\u0589-\u0590\u05be\u05c0\u05c3\u05c6\u05c8-\u05cf\u05eb-\u05ee\u05f3-\u060f\u061b-\u061f\u066a-\u066d\u06d4\u06dd-\u06de\u06e9\u06fd-\u06fe\u0700-\u070f\u074b-\u074c\u07b2-\u07bf\u07f6-\u07f9\u07fb-\u07fc\u07fe-\u07ff\u082e-\u083f\u085c-\u085f\u086b-\u086f\u0888\u088f-\u0897\u08e2\u0964-\u0965\u0970\u0984\u098d-\u098e\u0991-\u0992\u09a9\u09b1\u09b3-\u09b5\u09ba-\u09bb\u09c5-\u09c6\u09c9-\u09ca\u09cf-\u09d6\u09d8-\u09db\u09de\u09e4-\u09e5\u09f2-\u09fb\u09fd\u09ff-\u0a00\u0a04\u0a0b-\u0a0e\u0a11-\u0a12\u0a29\u0a31\u0a34\u0a37\u0a3a-\u0a3b\u0a3d\u0a43-\u0a46\u0a49-\u0a4a\u0a4e-\u0a50\u0a52-\u0a58\u0a5d\u0a5f-\u0a65\u0a76-\u0a80\u0a84\u0a8e\u0a92\u0aa9\u0ab1\u0ab4\u0aba-\u0abb\u0ac6\u0aca\u0ace-\u0acf\u0ad1-\u0adf\u0ae4-\u0ae5\u0af0-\u0af8\u0b00\u0b04\u0b0d-\u0b0e\u0b11-\u0b12\u0b29\u0b31\u0b34\u0b3a-\u0b3b\u0b45-\u0b46\u0b49-\u0b4a\u0b4e-\u0b54\u0b58-\u0b5b\u0b5e\u0b64-\u0b65\u0b70\u0b72-\u0b81\u0b84\u0b8b-\u0b8d\u0b91\u0b96-\u0b98\u0b9b\u0b9d\u0ba0-\u0ba2\u0ba5-\u0ba7\u0bab-\u0bad\u0bba-\u0bbd\u0bc3-\u0bc5\u0bc9\u0bce-\u0bcf\u0bd1-\u0bd6\u0bd8-\u0be5\u0bf0-\u0bff\u0c0d\u0c11\u0c29\u0c3a-\u0c3b\u0c45\u0c49\u0c4e-\u0c54\u0c57\u0c5b-\u0c5c\u0c5e-\u0c5f\u0c64-\u0c65\u0c70-\u0c7f\u0c84\u0c8d\u0c91\u0ca9\u0cb4\u0cba-\u0cbb\u0cc5\u0cc9\u0cce-\u0cd4\u0cd7-\u0cdc\u0cdf\u0ce4-\u0ce5\u0cf0\u0cf3-\u0cff\u0d0d\u0d11\u0d45\u0d49\u0d4f-\u0d53\u0d58-\u0d5e\u0d64-\u0d65\u0d70-\u0d79\u0d80\u0d84\u0d97-\u0d99\u0db2\u0dbc\u0dbe-\u0dbf\u0dc7-\u0dc9\u0dcb-\u0dce\u0dd5\u0dd7\u0de0-\u0de5\u0df0-\u0df1\u0df4-\u0e00\u0e3b-\u0e3f\u0e4f\u0e5a-\u0e80\u0e83\u0e85\u0e8b\u0ea4\u0ea6\u0ebe-\u0ebf\u0ec5\u0ec7\u0ece-\u0ecf\u0eda-\u0edb\u0ee0-\u0eff\u0f01-\u0f17\u0f1a-\u0f1f\u0f2a-\u0f34\u0f36\u0f38\u0f3a-\u0f3d\u0f48\u0f6d-\u0f70\u0f85\u0f98\u0fbd-\u0fc5\u0fc7-\u0fff\u104a-\u104f\u109e-\u109f\u10c6\u10c8-\u10cc\u10ce-\u10cf\u10fb\u1249\u124e-\u124f\u1257\u1259\u125e-\u125f\u1289\u128e-\u128f\u12b1\u12b6-\u12b7\u12bf\u12c1\u12c6-\u12c7\u12d7\u1311\u1316-\u1317\u135b-\u135c\u1360-\u1368\u1372-\u137f\u1390-\u139f\u13f6-\u13f7\u13fe-\u1400\u166d-\u166e\u1680\u169b-\u169f\u16eb-\u16ed\u16f9-\u16ff\u1716-\u171e\u1735-\u173f\u1754-\u175f\u176d\u1771\u1774-\u177f\u17d4-\u17d6\u17d8-\u17db\u17de-\u17df\u17ea-\u180a\u180e\u181a-\u181f\u1879-\u187f\u18ab-\u18af\u18f6-\u18ff\u191f\u192c-\u192f\u193c-\u1945\u196e-\u196f\u1975-\u197f\u19ac-\u19af\u19ca-\u19cf\u19db-\u19ff\u1a1c-\u1a1f\u1a5f\u1a7d-\u1a7e\u1a8a-\u1a8f\u1a9a-\u1aa6\u1aa8-\u1aaf\u1abe\u1acf-\u1aff\u1b4d-\u1b4f\u1b5a-\u1b6a\u1b74-\u1b7f\u1bf4-\u1bff\u1c38-\u1c3f\u1c4a-\u1c4c\u1c7e-\u1c7f\u1c89-\u1c8f\u1cbb-\u1cbc\u1cc0-\u1ccf\u1cd3\u1cfb-\u1cff\u1f16-\u1f17\u1f1e-\u1f1f\u1f46-\u1f47\u1f4e-\u1f4f\u1f58\u1f5a\u1f5c\u1f5e\u1f7e-\u1f7f\u1fb5\u1fbd\u1fbf-\u1fc1\u1fc5\u1fcd-\u1fcf\u1fd4-\u1fd5\u1fdc-\u1fdf\u1fed-\u1ff1\u1ff5\u1ffd-\u200b\u200e-\u203e\u2041-\u2053\u2055-\u2070\u2072-\u207e\u2080-\u208f\u209d-\u20cf\u20dd-\u20e0\u20e2-\u20e4\u20f1-\u2101\u2103-\u2106\u2108-\u2109\u2114\u2116-\u2117\u211e-\u2123\u2125\u2127\u2129\u213a-\u213b\u2140-\u2144\u214a-\u214d\u214f-\u215f\u2189-\u2bff\u2ce5-\u2cea\u2cf4-\u2cff\u2d26\u2d28-\u2d2c\u2d2e-\u2d2f\u2d68-\u2d6e\u2d70-\u2d7e\u2d97-\u2d9f\u2da7\u2daf\u2db7\u2dbf\u2dc7\u2dcf\u2dd7\u2ddf\u2e00-\u3004\u3008-\u3020\u3030\u3036-\u3037\u303d-\u3040\u3097-\u3098\u30a0\u30fb\u3100-\u3104\u3130\u318f-\u319f\u31c0-\u31ef\u3200-\u33ff\u4dc0-\u4dff\ua48d-\ua4cf\ua4fe-\ua4ff\ua60d-\ua60f\ua62c-\ua63f\ua670-\ua673\ua67e\ua6f2-\ua716\ua720-\ua721\ua789-\ua78a\ua7cb-\ua7cf\ua7d2\ua7d4\ua7da-\ua7f1\ua828-\ua82b\ua82d-\ua83f\ua874-\ua87f\ua8c6-\ua8cf\ua8da-\ua8df\ua8f8-\ua8fa\ua8fc\ua92e-\ua92f\ua954-\ua95f\ua97d-\ua97f\ua9c1-\ua9ce\ua9da-\ua9df\ua9ff\uaa37-\uaa3f\uaa4e-\uaa4f\uaa5a-\uaa5f\uaa77-\uaa79\uaac3-\uaada\uaade-\uaadf\uaaf0-\uaaf1\uaaf7-\uab00\uab07-\uab08\uab0f-\uab10\uab17-\uab1f\uab27\uab2f\uab5b\uab6a-\uab6f\uabeb\uabee-\uabef\uabfa-\uabff\ud7a4-\ud7af\ud7c7-\ud7ca\ud7fc-\uf8ff\ufa6e-\ufa6f\ufada-\ufaff\ufb07-\ufb12\ufb18-\ufb1c\ufb29\ufb37\ufb3d\ufb3f\ufb42\ufb45\ufbb2-\ufbd2\ufd3e-\ufd4f\ufd90-\ufd91\ufdc8-\ufdef\ufdfc-\ufdff\ufe10-\ufe1f\ufe30-\ufe32\ufe35-\ufe4c\ufe50-\ufe6f\ufe75\ufefd-\uff0f\uff1a-\uff20\uff3b-\uff3e\uff40\uff5b-\uff65\uffbf-\uffc1\uffc8-\uffc9\uffd0-\uffd1\uffd8-\uffd9\uffdd-\uffff])(?:await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|throw|try|typeof|var|void|while|with|yield)$/.test(jsStrBehind)
						) {
							return true;
						}
						if (jsStrBehind.endsWith(")")) {
							return /(?:^|[\u0000-\u0023\u0025-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u00a9\u00ab-\u00b4\u00b6\u00b8-\u00b9\u00bb-\u00bf\u00d7\u00f7\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02eb\u02ed\u02ef-\u02ff\u0375\u0378-\u0379\u037e\u0380-\u0385\u038b\u038d\u03a2\u03f6\u0482\u0488-\u0489\u0530\u0557-\u0558\u055a-\u055f\u0589-\u0590\u05be\u05c0\u05c3\u05c6\u05c8-\u05cf\u05eb-\u05ee\u05f3-\u060f\u061b-\u061f\u066a-\u066d\u06d4\u06dd-\u06de\u06e9\u06fd-\u06fe\u0700-\u070f\u074b-\u074c\u07b2-\u07bf\u07f6-\u07f9\u07fb-\u07fc\u07fe-\u07ff\u082e-\u083f\u085c-\u085f\u086b-\u086f\u0888\u088f-\u0897\u08e2\u0964-\u0965\u0970\u0984\u098d-\u098e\u0991-\u0992\u09a9\u09b1\u09b3-\u09b5\u09ba-\u09bb\u09c5-\u09c6\u09c9-\u09ca\u09cf-\u09d6\u09d8-\u09db\u09de\u09e4-\u09e5\u09f2-\u09fb\u09fd\u09ff-\u0a00\u0a04\u0a0b-\u0a0e\u0a11-\u0a12\u0a29\u0a31\u0a34\u0a37\u0a3a-\u0a3b\u0a3d\u0a43-\u0a46\u0a49-\u0a4a\u0a4e-\u0a50\u0a52-\u0a58\u0a5d\u0a5f-\u0a65\u0a76-\u0a80\u0a84\u0a8e\u0a92\u0aa9\u0ab1\u0ab4\u0aba-\u0abb\u0ac6\u0aca\u0ace-\u0acf\u0ad1-\u0adf\u0ae4-\u0ae5\u0af0-\u0af8\u0b00\u0b04\u0b0d-\u0b0e\u0b11-\u0b12\u0b29\u0b31\u0b34\u0b3a-\u0b3b\u0b45-\u0b46\u0b49-\u0b4a\u0b4e-\u0b54\u0b58-\u0b5b\u0b5e\u0b64-\u0b65\u0b70\u0b72-\u0b81\u0b84\u0b8b-\u0b8d\u0b91\u0b96-\u0b98\u0b9b\u0b9d\u0ba0-\u0ba2\u0ba5-\u0ba7\u0bab-\u0bad\u0bba-\u0bbd\u0bc3-\u0bc5\u0bc9\u0bce-\u0bcf\u0bd1-\u0bd6\u0bd8-\u0be5\u0bf0-\u0bff\u0c0d\u0c11\u0c29\u0c3a-\u0c3b\u0c45\u0c49\u0c4e-\u0c54\u0c57\u0c5b-\u0c5c\u0c5e-\u0c5f\u0c64-\u0c65\u0c70-\u0c7f\u0c84\u0c8d\u0c91\u0ca9\u0cb4\u0cba-\u0cbb\u0cc5\u0cc9\u0cce-\u0cd4\u0cd7-\u0cdc\u0cdf\u0ce4-\u0ce5\u0cf0\u0cf3-\u0cff\u0d0d\u0d11\u0d45\u0d49\u0d4f-\u0d53\u0d58-\u0d5e\u0d64-\u0d65\u0d70-\u0d79\u0d80\u0d84\u0d97-\u0d99\u0db2\u0dbc\u0dbe-\u0dbf\u0dc7-\u0dc9\u0dcb-\u0dce\u0dd5\u0dd7\u0de0-\u0de5\u0df0-\u0df1\u0df4-\u0e00\u0e3b-\u0e3f\u0e4f\u0e5a-\u0e80\u0e83\u0e85\u0e8b\u0ea4\u0ea6\u0ebe-\u0ebf\u0ec5\u0ec7\u0ece-\u0ecf\u0eda-\u0edb\u0ee0-\u0eff\u0f01-\u0f17\u0f1a-\u0f1f\u0f2a-\u0f34\u0f36\u0f38\u0f3a-\u0f3d\u0f48\u0f6d-\u0f70\u0f85\u0f98\u0fbd-\u0fc5\u0fc7-\u0fff\u104a-\u104f\u109e-\u109f\u10c6\u10c8-\u10cc\u10ce-\u10cf\u10fb\u1249\u124e-\u124f\u1257\u1259\u125e-\u125f\u1289\u128e-\u128f\u12b1\u12b6-\u12b7\u12bf\u12c1\u12c6-\u12c7\u12d7\u1311\u1316-\u1317\u135b-\u135c\u1360-\u1368\u1372-\u137f\u1390-\u139f\u13f6-\u13f7\u13fe-\u1400\u166d-\u166e\u1680\u169b-\u169f\u16eb-\u16ed\u16f9-\u16ff\u1716-\u171e\u1735-\u173f\u1754-\u175f\u176d\u1771\u1774-\u177f\u17d4-\u17d6\u17d8-\u17db\u17de-\u17df\u17ea-\u180a\u180e\u181a-\u181f\u1879-\u187f\u18ab-\u18af\u18f6-\u18ff\u191f\u192c-\u192f\u193c-\u1945\u196e-\u196f\u1975-\u197f\u19ac-\u19af\u19ca-\u19cf\u19db-\u19ff\u1a1c-\u1a1f\u1a5f\u1a7d-\u1a7e\u1a8a-\u1a8f\u1a9a-\u1aa6\u1aa8-\u1aaf\u1abe\u1acf-\u1aff\u1b4d-\u1b4f\u1b5a-\u1b6a\u1b74-\u1b7f\u1bf4-\u1bff\u1c38-\u1c3f\u1c4a-\u1c4c\u1c7e-\u1c7f\u1c89-\u1c8f\u1cbb-\u1cbc\u1cc0-\u1ccf\u1cd3\u1cfb-\u1cff\u1f16-\u1f17\u1f1e-\u1f1f\u1f46-\u1f47\u1f4e-\u1f4f\u1f58\u1f5a\u1f5c\u1f5e\u1f7e-\u1f7f\u1fb5\u1fbd\u1fbf-\u1fc1\u1fc5\u1fcd-\u1fcf\u1fd4-\u1fd5\u1fdc-\u1fdf\u1fed-\u1ff1\u1ff5\u1ffd-\u200b\u200e-\u203e\u2041-\u2053\u2055-\u2070\u2072-\u207e\u2080-\u208f\u209d-\u20cf\u20dd-\u20e0\u20e2-\u20e4\u20f1-\u2101\u2103-\u2106\u2108-\u2109\u2114\u2116-\u2117\u211e-\u2123\u2125\u2127\u2129\u213a-\u213b\u2140-\u2144\u214a-\u214d\u214f-\u215f\u2189-\u2bff\u2ce5-\u2cea\u2cf4-\u2cff\u2d26\u2d28-\u2d2c\u2d2e-\u2d2f\u2d68-\u2d6e\u2d70-\u2d7e\u2d97-\u2d9f\u2da7\u2daf\u2db7\u2dbf\u2dc7\u2dcf\u2dd7\u2ddf\u2e00-\u3004\u3008-\u3020\u3030\u3036-\u3037\u303d-\u3040\u3097-\u3098\u30a0\u30fb\u3100-\u3104\u3130\u318f-\u319f\u31c0-\u31ef\u3200-\u33ff\u4dc0-\u4dff\ua48d-\ua4cf\ua4fe-\ua4ff\ua60d-\ua60f\ua62c-\ua63f\ua670-\ua673\ua67e\ua6f2-\ua716\ua720-\ua721\ua789-\ua78a\ua7cb-\ua7cf\ua7d2\ua7d4\ua7da-\ua7f1\ua828-\ua82b\ua82d-\ua83f\ua874-\ua87f\ua8c6-\ua8cf\ua8da-\ua8df\ua8f8-\ua8fa\ua8fc\ua92e-\ua92f\ua954-\ua95f\ua97d-\ua97f\ua9c1-\ua9ce\ua9da-\ua9df\ua9ff\uaa37-\uaa3f\uaa4e-\uaa4f\uaa5a-\uaa5f\uaa77-\uaa79\uaac3-\uaada\uaade-\uaadf\uaaf0-\uaaf1\uaaf7-\uab00\uab07-\uab08\uab0f-\uab10\uab17-\uab1f\uab27\uab2f\uab5b\uab6a-\uab6f\uabeb\uabee-\uabef\uabfa-\uabff\ud7a4-\ud7af\ud7c7-\ud7ca\ud7fc-\uf8ff\ufa6e-\ufa6f\ufada-\ufaff\ufb07-\ufb12\ufb18-\ufb1c\ufb29\ufb37\ufb3d\ufb3f\ufb42\ufb45\ufbb2-\ufbd2\ufd3e-\ufd4f\ufd90-\ufd91\ufdc8-\ufdef\ufdfc-\ufdff\ufe10-\ufe1f\ufe30-\ufe32\ufe35-\ufe4c\ufe50-\ufe6f\ufe75\ufefd-\uff0f\uff1a-\uff20\uff3b-\uff3e\uff40\uff5b-\uff65\uffbf-\uffc1\uffc8-\uffc9\uffd0-\uffd1\uffd8-\uffd9\uffdd-\uffff])(?:for|while|with|if)$/.test(jsStr.slice(0, lastQuoteStartPos).trim());
						}
						return false;
					})()) {
						// 开始正则
						signStack.push(jsArr[nowPos]);
						signStartPosStack.push(nowPos);
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
					lastQuoteStartPos = signStartPosStack.pop();
					continue;
				} else if (signStack.length === 0) {
					// 开始字符串
					signStack.push(jsArr[nowPos]);
					signStartPosStack.push(nowPos);
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
function transLayer(jsStr, layer, hasTrans) {
	jsStr = hasTrans ? jsStr : transStr(jsStr);
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
					throw SyntaxError("尝试关闭不存在的“[]”。");
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
					throw SyntaxError("尝试关闭不存在的“{}”。");
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
					throw SyntaxError("尝试关闭不存在的“()”。");
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
					throw SyntaxError("尝试关闭不存在的“[]”。");
				}
				break;
			case '}':
				if (signStack.top() === "{") {
					// 结束
					signStack.pop();
				} else {
					throw SyntaxError("尝试关闭不存在的“{}”。");
				}
				break;
			case ')':
				if (signStack.top() === "(") {
					// 结束
					signStack.pop();
				} else {
					throw SyntaxError("尝试关闭不存在的“()”。");
				}
				break;
			default:
				break;
		}
		if (signStack.length === 0) {
			return nowPos;
		}
	}
	throw Error("未知错误。");
}
function splitStatements(jsStr, statementType) {
	let transLayerRes = transLayer(jsStr), splitJsArr = [];
	if (statementType === undefined) {
		let tmpStr = transLayerRes.replace(/[0-9a-zA-Z]+/g, "W");
		if (tmpStr === "" || tmpStr === ";") {
			// 空
			statementType = "EMPTY";
		} else if (/^(?:[^,:;]+:[^,:;]+,)*[^,:;]+:[^,:;]+$/.test(tmpStr)) {
			// 对象
			statementType = "OBJECT";
		} else if (/^(?:case[!"%&'(*+,\-.\/:;<=>?@\[^{|~ ]|default:)/.test(transLayerRes.slice(0, 8))) {
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
					if (/^(?:case[!"'(+\-.\[{~ ]|default:)/.test(transPartJsStr.slice(0, 8))) {
						// switch...case
						endPos = (() => {
							let reg = /[?:]/g, res, cnt = 0;
							while (res = reg.exec(transPartJsStr)) {
								res[0] === "?" ? cnt++ : cnt--;
								if (cnt === -1) {
									return res.index;
								}
							}
						})();
						splitJsArr.push(partJsStr.slice(0, endPos + 1));
						startPos += endPos + 1;
						// case后跟{则一定是代码块
						if (transPartJsStr[startPos] === "{") {
							endPos = getQuoteEndPos(partJsStr, startPos);
							splitJsArr.push(partJsStr.slice(startPos, endPos + 1));
							startPos = endPos + 1;
						}
					} else if ((() => {
						let matchRes =
							transLayerRes.slice(startPos).match(/^(?:yiled )?(?:await )?if\(Q+\){?.*?(?:};|;|})(?:else if\(Q+\){?.*?(};|;|}))*(?:else{?.*?(};|;|}))?/) || // if...else
							transPartJsStr.match(/^(?:yiled )?(?:await )?(?:async )?function\*? [^(]+?\(Q*\){Q*};?/) || // function（花括号不可省略，无需判断）
							transPartJsStr.match(/^(?:yiled )?(?:await )?(?:for|while|with)\(Q+\){?.*?(?:};|;|})/) || // for / while / with（花括号可省略，需判断）
							transPartJsStr.match(/^(?:yiled )?(?:await )?do{?.*?[;}]\(Q+\);?/) || // do...while（花括号可省略，需判断）
							transPartJsStr.match(/^(?:yiled )?(?:await )?try{Q*}(?:catch(?:\(Q+\))?{Q*})?(?:finally{Q*})?;?/) || // try...catch（两个花括号都不能省，所以无需判断）
							transPartJsStr.match(/^(?:yiled )?(?:await )?switch\(Q+\){Q*};?/); // switch（两个花括号都不能省，所以无需判断）
						return matchRes && (endPos = startPos + matchRes[0].length);
					})()) {
						splitJsArr.push(jsStr.slice(startPos, endPos));
						startPos = endPos;
					} else {
						// 其它
						splitJsArr.push(...splitStatements(jsStr.slice(startPos, endPos + 1)));
						startPos = endPos + 1;
					}
				} else if ((() => {
					let matchRes =
						transLayerRes.slice(startPos).match(/^(?:yiled )?(?:await )?if\(Q+\){?.*?(?:};|;|})(?:else if\(Q+\){?.*?(};|;|}))*(?:else{?.*?(};|;|}))?/) || // if...else
						transPartJsStr.match(/^(?:yiled )?(?:await )?(?:async )?function\*? [^(]+?\(Q*\){Q*};?/) || // function（花括号不可省略，无需判断）
						transPartJsStr.match(/^(?:yiled )?(?:await )?(?:for|while|with)\(Q+\){?.*?(?:};|;|})/) || // for / while / with（花括号可省略，需判断）
						transPartJsStr.match(/^(?:yiled )?(?:await )?do{?.*?[;}]\(Q+\);?/) || // do...while（花括号可省略，需判断）
						transPartJsStr.match(/^(?:yiled )?(?:await )?try{Q*}catch\(Q+\){Q*}(?:finally{Q*})?;?/) || // try...catch（两个花括号都不能省，所以无需判断）
						transPartJsStr.match(/^(?:yiled )?(?:await )?switch\(Q+\){Q*};?/); // switch（两个花括号都不能省，所以无需判断）
					return matchRes && (endPos = startPos + matchRes[0].length);
				})()) {
					splitJsArr.push(jsStr.slice(startPos, endPos));
					startPos = endPos;
				} else {
					// 其它
					splitJsArr.push(jsStr.slice(startPos, endPos + 1));
					startPos = endPos + 1;
				}
			} while (statementType === "SWITCH_CASE" ? (endPos = transLayerRes.searchOf(/[;:}](?:case[!"'(+\-.\[{~ ]|default:)/, startPos)) !== -1 : (endPos = transLayerRes.indexOf(";", startPos)) !== -1);
			if (startPos < jsStr.length) {
				splitJsArr.push(...splitStatements(jsStr.slice(startPos)));
			}
			break;
		}
		default: {
			throw Error(`包含无法解析的代码块类型“${statementType}”。`);
		}
	}
	splitJsArr.type = statementType;
	return splitJsArr;
}
/**
 * JSON5工具
 */
const JSON5 = {
	parse: function (jsonStr) {
		let transRes = transStr(jsonStr);

		let commentPos = Number.POSITIVE_INFINITY;
		while ((commentPos === Number.POSITIVE_INFINITY || commentPos - 1 >= 0) && (commentPos = Math.max(
			transRes.lastSearchOf(/\/\*C*\*\//, commentPos - 1),
			transRes.lastSearchOf(/\/\/C*(?:\n?\r|\r?\n)/, commentPos - 1)
		)) !== -1) {
			switch (transRes[commentPos + 1]) {
				case '*': {
					let blockComment = transRes.slice(commentPos).match(/^\/\*C*\*\//)[0];
					jsonStr = jsonStr.replaceWithStr(commentPos, commentPos + blockComment.length, "");
					break;
				}
				case '/': {
					let lineComment = transRes.slice(commentPos).match(/^\/\/C*(?:\n?\r|\r?\n)/)[0];
					jsonStr = jsonStr.replaceWithStr(commentPos, commentPos + lineComment.length, "");
					break;
				}
				default:
					throw Error(`包含未知的注释类型“/${transRes[commentPos + 1]}”。`);
			}
		}

		return JSON.parse(jsonStr);
	},
	stringify: JSON.stringify
};
/**
 * 虚拟机执行工具
 * */
let globalContext = vm.createContext();
try {
	let {VM} = require("vm2");
	vm2 = new VM({
		allowAsync: false,
		sandbox: globalContext
	});
} catch (e) {
}
function virtualEval(jsStr) {
	return virtualGlobalEval(jsStr);
}
function virtualGlobalEval(jsStr) {
	return vm2 ? vm2.run(String(jsStr)) : vm.runInContext(jsStr, globalContext);
}

let config;
try {
	config = JSON5.parse(fs.readFileSync("config.json").toString());
} catch (e) {
	console.error(e);
	throw Error(`未找到配置文件（config.json），请确认该文件是否存在于当前目录。`);
}

// 开始计时
let START_TIMESTAMP = Date.now(), PAUSE_TIME = 0;

// 初始化日志工具并确认文件路径
let logger = new Logger(config["logger"]);
logger.logWithoutProgress("----====* JsjiamiV6 Decryptor *====----");
let absolutePathStr = Path.resolve(config.target);
logger.logWithoutProgress(`解密文件：${absolutePathStr}`);
logger.logWithoutProgress(`输出目录：${Path.resolve("./")}`);
logger.logWithoutProgress(`模拟模块：${vm2 ? "vm2" : "vm (不安全)"}`);
if (!vm2) {
	console.warn("【安全建议】当前未安装 vm2 模块，该模块支持相对安全地执行 JavaScript 代码。在安装 vm2 模块之前，解密器将使用 Node.js 内建的 vm 模块。因此，请尽量避免解密不可信的 JavaScript 文件。");
}
pause();

let js;
try {
	js = fs.readFileSync(absolutePathStr).toString().trim() + ";";
} catch (e) {
	console.error(e);
	throw Error(`目标脚本不存在或无权访问，请检查后再试。`);
}

logger.logWithoutDetermine("净化代码");
function compressionCode(jsStr) {
	let transRes = transStr(jsStr);

	let commentPos = Number.POSITIVE_INFINITY;
	while ((commentPos === Number.POSITIVE_INFINITY || commentPos - 1 >= 0) && (commentPos = Math.max(
		transRes.lastSearchOf(/\/\*C*\*\//, commentPos - 1),
		transRes.lastSearchOf(/\/\/C*(?:\n?\r|\r?\n)/, commentPos - 1)
	)) !== -1) {
		logger.weakUpdate();
		switch (transRes[commentPos + 1]) {
			case '*': {
				let blockComment = transRes.slice(commentPos).match(/^\/\*C*\*\//)[0];
				jsStr = jsStr.replaceWithStr(commentPos, commentPos + blockComment.length, "");
				break;
			}
			case '/': {
				let lineComment = transRes.slice(commentPos).match(/^\/\/C*(?:\n?\r|\r?\n)/)[0];
				jsStr = jsStr.replaceWithStr(commentPos, commentPos + lineComment.length, "");
				break;
			}
			default:
				throw Error(`包含未知的注释类型“${transRes[commentPos + 1]}”。`);
		}
	}

	transRes = transStr(jsStr);

	let spacePos = Number.POSITIVE_INFINITY;
	while ((spacePos === Number.POSITIVE_INFINITY || spacePos - 1 >= 0) && (spacePos = Math.max(
		transRes.lastSearchOf(/\s/, spacePos - 1)
	)) !== -1) {
		logger.weakUpdate();
		if (
			(jsStr[spacePos - 1] == null || jsStr[spacePos - 1].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:;@\s]/)) ||
			(jsStr[spacePos + 1] == null || jsStr[spacePos + 1].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:;@\s]/))
		) {
			jsStr = jsStr.replaceWithStr(spacePos, spacePos + 1, "");
		}
	}

	return jsStr;
}
js = compressionCode(js);
fs.writeFileSync("DecryptResult0.js", js);

logger.logWithoutDetermine("解除全局加密");
const STATEMENTS_TYPE_SCHEMAS = {
	signInfo: {
		"Self": /^var (?:_?[0-9a-zA-Z$ｉＯ]+?='S+?',(?:_?[0-9a-zA-Z$ｉＯ]+?_=\['S+?'],)?)?_?[0-9a-zA-Z$]+=\[_?[0-9a-zA-Z$ｉＯ']+?(?:,'S+?')*?];?/
	},
	preprocessFunction: {
		// _0x102809='po';var _0x111dc8='shift',_0x47c13d='push'
		"PoShiftPushString": /_?[0-9a-zA-Z$]+='po';var _?[0-9a-zA-Z$]+='shift',_?[0-9a-zA-Z$]+='push'/,
		// while(--_0x1f4621){
		"DecreasingLoop": /while\(--_?[0-9a-zA-Z$]+\)\{/,
		// _0x362d54=_0x5845c1,_0x2576f4=_0x2d8f05[_0x4fbc7a+'p']();
		"AddPFunction": /_?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\+'p']\(\);/,
		// ['replace'](/[zUrTestTestZTest=]/g,'')
		"ReplaceBase64RegExp": /\['replace']\(\/\[[0-9a-zA-Z]*?=]\/g,''\)/,
		// c['push'](c['shift']());
		"PushAndShift": /_?[0-9a-zA-Z$]+\['push']\(_?[0-9a-zA-Z$]+\['shift']\(\)\)/,
		// return _0x43c762(++_0x3c2786,_0x2db158)>>_0x3c2786^_0x2db158;
		"ReturnWith++And>>And^": /return _?[0-9a-zA-Z$]+\(\+\+_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)>>_?[0-9a-zA-Z$]+\^_?[0-9a-zA-Z$]+/,
		// var _0xeaaebc={'data':{'key':'cookie','value':'timeout'}
		"CookieTimeoutDataObject": /var _?[0-9a-zA-Z$]+=\{'data':\{'key':'cookie','value':'timeout'}/,
		// new RegExp\(\'\(\?\:\^\|\;\\x20\)\'\+_0x49a403\[\'replace\'\]\(\/\(\[\.\$\?\*\|\{\}\(\)\[\]\\\/\+\^\]\)\/g\,\'\$1\'\)\+\'\=\(\[\^\;\]\*\)\'\)
		"SignReplaceRegExp": /new RegExp\('\(\?:\^\|;\\x20\)'\+_?[0-9a-zA-Z$]+\['replace']\(\/\(\[\.\$\?\*\|\{}\(\)\[]\\\/\+\^]\)\/g,'\$1'\)\+'=\(\[\^;]\*\)'\)/,
		// new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');
		"EscapedRegExp": /new RegExp\('\\x5cw+\\x20*\\x5c\(\\x5c\)\\x20\*\{\\x5cw\+\\x20\*\[\\x27|\\x22]\.\+\[\\x27|\\x22];\?\\x20*}'\);/
	},
	decryptor: {
		/* 有预处理函数 */
		// _0x542044=~~'0x'['concat'](_0x542044
		"DoubleWaveConcat": /_?[0-9a-zA-Z$]+=~~'0x'\['concat']\(_?[0-9a-zA-Z$]+/,
		// Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')
		"FunctionConstructorString": /Function\('return\\x20\(function\(\)\\x20'\+'\{}\.constructor\(\\x22return\\x20this\\x22\)\(\\x20\)'\+'\);'\)/,
		// var _0x3ef5fb=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;
		"WhatIsThis": /var _?[0-9a-zA-Z$]+=typeof window!=='undefined'\?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'\?global:this;/,
		// var _0x1d2c53='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		"CharSetString": /var _?[0-9a-zA-Z$]+='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\+\/=';/,
		// '%'+('00'+_0x1f82f7['charCodeAt']
		"ZeroPlusCharCodeAt": /'%'\+\('00'\+_?[0-9a-zA-Z$]+\['charCodeAt']/,
		// _0x53656e['charCodeAt'](_0x578a24%_0x53656e['length']))%0x100;
		"CharCodeAtLength": /_?[0-9a-zA-Z$]+\['charCodeAt']\(_?[0-9a-zA-Z$]+%_?[0-9a-zA-Z$]+\['length']\)\)%0x100;/,
		// +=String['fromCharCode'](
		"PlusStringFromCharCode": /\+=String\['fromCharCode']\(/,
		/* 无预处理函数 */
		// function _0x9549(_0x52aa18,_0x1a09ad){_0x52aa18=~~'0x'['concat'](_0x52aa18['slice'](0x0));var _0x4fe032=_0x34a7[_0x52aa18];return _0x4fe032;};
		"WithoutPreprocess": /(?:function _?[0-9a-zA-Z$]+|var _?[0-9a-zA-Z$]+=function)\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+=~~'0x'\['concat']\(_?[0-9a-zA-Z$]+(?:\['slice']\(0x0\))?\);var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+];return _?[0-9a-zA-Z$]+;};/
	},
	verifyFunction: {
		// for(_0x36eaeb=_0x39941e['shift'](_0x422e9c>>0x2);_0x36eaeb&&_0x36eaeb!==(_0x39941e['pop'](_0x422e9c>>0x3)+'')['replace'](/[ChUlbeWOEtLSnTtk=]/g,'');_0x422e9c++)
		"Self": /for\(_?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\['shift']\(_?[0-9a-zA-Z$]+>>0x2\);_?[0-9a-zA-Z$]+&&_?[0-9a-zA-Z$]+!==\(_?[0-9a-zA-Z$]+\['pop']\(_?[0-9a-zA-Z$]+>>0x3\)\+''\)\['replace']\(\/\[[a-zA-Z]+=?]\/g,''\);_?[0-9a-zA-Z$]+\+\+\)/
	}
};
const GLOBAL_DECRYPTOR_INFO = {
	signInfo: {
		name: null,
		// _0xod / _0x / iIl / oO0 / abc
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
	return jsArr.map(function (jsStr) {
		let transRes = transStr(jsStr);

		/**
		 * 签名信息
		 * @namespace signInfo
		 * @description 用于存放签名以及处理前的解密数据。
		 * 签名命名规则 _?[0-9a-zA-Z$ｉＯ]+
		 * 变量命名规则 _?[0-9a-zA-Z$]+
		 * 字符串规则 'S+'
		 */
		if (GLOBAL_DECRYPTOR_INFO.signInfo.raw == null) {
			let schemas = STATEMENTS_TYPE_SCHEMAS.signInfo;
			if (schemas["Self"].test(transRes)) {
				GLOBAL_DECRYPTOR_INFO.signInfo.name = jsStr.slice(4, transRes.indexOf("=", 4));
				(signName => {
					if (/^_0xod[0-9a-zA-Z]$/.test(signName)) {
						GLOBAL_DECRYPTOR_INFO.signInfo.confuseType = "_0xod";
						GLOBAL_DECRYPTOR_INFO.signInfo.nameRegExp = `_0x[0-9a-f]+`;
					} else if (/^_0x[0-9a-f]{4}$/.test(signName)) {
						GLOBAL_DECRYPTOR_INFO.signInfo.confuseType = "_0x";
						GLOBAL_DECRYPTOR_INFO.signInfo.nameRegExp = `_0x[0-9a-f]+`;
					} else if (/^[iｉl]+$/.test(signName)) {
						GLOBAL_DECRYPTOR_INFO.signInfo.confuseType = "iIl";
						GLOBAL_DECRYPTOR_INFO.signInfo.nameRegExp = `[iIl1]+`;
					} else if (/^[OＯ0$]+$/.test(signName)) {
						GLOBAL_DECRYPTOR_INFO.signInfo.confuseType = "oO0";
						GLOBAL_DECRYPTOR_INFO.signInfo.nameRegExp = `[O0Q$]+`;
					} else if (/^[a-z]+$/.test(signName)) {
						GLOBAL_DECRYPTOR_INFO.signInfo.confuseType = "abc";
						GLOBAL_DECRYPTOR_INFO.signInfo.nameRegExp = `[a-z]+`;
					} else {
						throw Error(`包含未知的混淆模式“${signName}”。`);
					}
				})(GLOBAL_DECRYPTOR_INFO.signInfo.name);
				GLOBAL_DECRYPTOR_INFO.signInfo.hasSignString = /^var _?[0-9a-zA-Z$ｉＯ]+='S+?',/.test(transRes);
				GLOBAL_DECRYPTOR_INFO.signInfo.hasMemberArray = /_?[0-9a-zA-Z$ｉＯ]+_=\['S+?'],/.test(transRes);
				GLOBAL_DECRYPTOR_INFO.signInfo.raw = jsStr;
				return {
					type: "SIGN_INFO",
					content: GLOBAL_DECRYPTOR_INFO.signInfo
				};
			}
		} else {
			if (new RegExp(`^${GLOBAL_DECRYPTOR_INFO.signInfo.name.replace(/\$/g, "\\$")}='S*';?$`).test(transRes)) {
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
		 * 变量命名规则 _?[0-9a-zA-Z$]+
		 * 字符串规则 'S+'
		 * */
		if (GLOBAL_DECRYPTOR_INFO.signInfo.raw != null && GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw == null) {
			let schemas = STATEMENTS_TYPE_SCHEMAS.preprocessFunction;
			if (
				schemas["PoShiftPushString"].test(jsStr) +
				schemas["DecreasingLoop"].test(jsStr) +
				schemas["ReplaceBase64RegExp"].test(jsStr) +
				schemas["PushAndShift"].test(jsStr) +
				schemas["ReturnWith++And>>And^"].test(jsStr) +
				schemas["CookieTimeoutDataObject"].test(jsStr) +
				schemas["SignReplaceRegExp"].test(jsStr) +
				schemas["EscapedRegExp"].test(jsStr) >= 3
			) {
				GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw = jsStr;
				return {
					type: "PREPROCESS_FUNCTION",
					content: GLOBAL_DECRYPTOR_INFO.preprocessFunction
				};
			}
		}

		/**
		 * 解密函数
		 * @namespace globalDecryptorInfo.decryptor
		 * @description 使用解密数据完成字符串解密。
		 * 变量命名规则 _?[0-9a-zA-Z$]+
		 * 字符串规则 'S+'
		 * */
		if (GLOBAL_DECRYPTOR_INFO.signInfo.raw != null && GLOBAL_DECRYPTOR_INFO.decryptor.raw == null) {
			let isDecryptor = false;
			let schemas = STATEMENTS_TYPE_SCHEMAS.decryptor;
			if (GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw != null) {
				// 有预处理函数
				if (
					schemas["DoubleWaveConcat"].test(jsStr) +
					schemas["FunctionConstructorString"].test(jsStr) +
					schemas["WhatIsThis"].test(jsStr) +
					schemas["CharSetString"].test(jsStr) +
					schemas["ZeroPlusCharCodeAt"].test(jsStr) +
					schemas["CharCodeAtLength"].test(jsStr) +
					schemas["PlusStringFromCharCode"].test(jsStr) >= 4
				) {
					isDecryptor = true;
				}
			} else {
				// 无预处理函数
				if (schemas["WithoutPreprocess"].test(jsStr)) {
					isDecryptor = true;
				}
			}
			if (isDecryptor) {
				if (jsStr.startsWith("function ")) {
					GLOBAL_DECRYPTOR_INFO.decryptor.type = "function";
					GLOBAL_DECRYPTOR_INFO.decryptor.name = jsStr.slice(9, transRes.indexOf("("));
					GLOBAL_DECRYPTOR_INFO.decryptor.raw = jsStr;
					return {
						type: "DECRYPTOR",
						content: GLOBAL_DECRYPTOR_INFO.decryptor
					};
				} else if (jsStr.startsWith("var ")) {
					GLOBAL_DECRYPTOR_INFO.decryptor.type = "var";
					GLOBAL_DECRYPTOR_INFO.decryptor.name = jsStr.slice(4, transRes.indexOf("="));
					GLOBAL_DECRYPTOR_INFO.decryptor.raw = jsStr;
					return {
						type: "DECRYPTOR",
						content: GLOBAL_DECRYPTOR_INFO.decryptor
					};
				}
			}
		}

		/**
		 * 验证函数
		 * @namespace globalDecryptorInfo.verifyFunction
		 * @description 验证解密数据是否被修改，并去掉头尾多余内容。
		 * 变量命名规则 _?[0-9a-zA-Z$]+
		 * 字符串规则 'S+'
		 * */
		if (GLOBAL_DECRYPTOR_INFO.signInfo.raw != null && GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw == null && GLOBAL_DECRYPTOR_INFO.decryptor.raw != null) {
			let schemas = STATEMENTS_TYPE_SCHEMAS.verifyFunction;
			if (schemas["Self"].test(jsStr)) {
				GLOBAL_DECRYPTOR_INFO.verifyFunction.raw = jsStr;
				return {
					type: "VERIFY_FUNCTION",
					content: GLOBAL_DECRYPTOR_INFO.verifyFunction
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
	if (GLOBAL_DECRYPTOR_INFO.decryptor.raw === null) {
		pause("【警告】解密函数识别失败，可在 GitHub[https://github.com/NXY666/JsjiamiV6-Decryptor] 上提交 issue 以寻找原因。");
		return jsArr;
	} else {
		if (GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw === null && GLOBAL_DECRYPTOR_INFO.verifyFunction.raw === null) {
			pause("【警告】已发现解密函数，但未发现其对应的预处理函数或验证函数，可能无法正常运行。可在 GitHub[https://github.com/NXY666/JsjiamiV6-Decryptor] 上提交 issue 以寻找原因。");
		}
		virtualGlobalEval(GLOBAL_DECRYPTOR_INFO.signInfo.raw);
		virtualGlobalEval(GLOBAL_DECRYPTOR_INFO.preprocessFunction.raw);
		virtualGlobalEval(GLOBAL_DECRYPTOR_INFO.decryptor.raw);
		virtualGlobalEval(GLOBAL_DECRYPTOR_INFO.verifyFunction.raw);
	}
	return jsArr.filter(function (jsStr, index) {
		return statementsTypeArr[index].type === "COMMON";
	}).map(function (funcJs) {
		logger.weakUpdate();
		transStrRes = transStr(funcJs);

		let decryptorPos = Number.POSITIVE_INFINITY;
		while ((decryptorPos === Number.POSITIVE_INFINITY || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastIndexOf(`${GLOBAL_DECRYPTOR_INFO.decryptor.name}('`, decryptorPos - 1)) !== -1) {
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
 * 获取代码块内加密对象的名称
 * @param jsStr {string} 需解析的代码块
 * @returns {string | boolean} 若传入的代码块包含加密对象则输出加密对象名称，反之则输出false。
 */
function getCodeBlockDecryptorName(jsStr) {
	// jsStr为空或不是以var 开头
	if (!jsStr || jsStr.slice(0, 4) !== "var ") {
		// fs.appendFileSync("res.txt", "初步检查不通过:" + jsStr.slice(0, 100) + "\n");
		// console.log("初步检查不通过:", jsStr.slice(0, 100));
		return false;
	}

	let transStrRes = transStr(jsStr),
		transLayerRes = transLayer(transStrRes, 1, true),
		transLayer2Res = transLayer(transStrRes, 2, true);
	let startPos = transLayer2Res.indexOf("{") + 1, endPos = transLayer2Res.lastIndexOf("}"), strScanLen = 0;

	// 先过一遍
	if (!transLayerRes.match(/var _?[0-9a-zA-Z$]+=\{Q+};/)) {
		// fs.appendFileSync("res.txt", "局部格式检查不通过:" + jsStr.slice(0, 100) + "\n");
		return false;
	}

	transStrRes = transStrRes.slice(startPos, endPos);
	let checkRes = transLayer2Res.slice(startPos, endPos).split(",").every(function (objectItem) {
		let itemTransRes = transStrRes.slice(strScanLen, strScanLen + objectItem.length);
		let itemTransLayer2Res = transLayer(itemTransRes, 2, true);
		if (objectItem.match(/^'S+':'S+'$/) || itemTransLayer2Res.match(/^'S+':function\([^)]*\)\{return[^;]*;}$/)) {
			strScanLen += objectItem.length + 1;
			return true;
		} else {
			return false;
		}
	});
	if (checkRes) {
		// fs.appendFileSync("res.txt", "检查通过:" + jsStr + "\n");
		// console.log("检查通过:", jsStr.slice(0, 100));
		return transLayer2Res.slice(4, transLayer2Res.indexOf("="));
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
function replaceDecryptorFunc(callObjName, callFuncName, callStr, ignoreQuoteOutside) {
	// 获取加密对象内函数的参数列表
	let callFunc = virtualEval(callObjName + "['" + callFuncName + "']");
	let funcStr = callFunc.toString(), transFuncStr = transStr(funcStr);
	let funcParams = funcStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")).splitByOtherStr(transFuncStr.slice(transFuncStr.indexOf("(") + 1, transFuncStr.indexOf(")")), ",");

	// 获取调用解密函数的参数列表
	let transCallStr = transStr(callStr);
	let transCallLayer = transLayer(transCallStr, 1, true), transCallLayer2 = transLayer(transCallStr, 2, true);
	let callParamsStr = callStr.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")"));
	let callParams = callParamsStr.splitByOtherStr(transCallLayer2.slice(transCallLayer.indexOf("(") + 1, transCallLayer.indexOf(")")), ",");
	if (funcParams.length !== callParams.length) {
		throw Error(`加密对象函数调用参数数量(${callParams.length})与实际(${funcParams})不符。`);
	}
	let funcResStr = funcStr.slice(transFuncStr.indexOf("{return ") + 8, transFuncStr.lastIndexOf(";}")),
		replacePos = 0;
	funcParams.forEach(function (param, index) {
		replacePos = transStr(funcResStr).replace(/SQ/g, " ").indexOf(param, replacePos);
		funcResStr = funcResStr.slice(0, replacePos) + funcResStr.slice(replacePos).replace(param, callParams[index].replace(/\$/g, "$$$$"));
		replacePos = replacePos + callParams[index].length;
	});

	if ((funcParams.length === 2 && !transFuncStr.endsWith(");}")) && !ignoreQuoteOutside) {
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
const ANTI_FORMAT_SCHEMAS = {
	// var Iii11l=function(_0x38a067){var _0x18a5dd=true;return function(_0x50a0cd,_0x2e85e1){var _0x311825='';var _0x370651=_0x18a5dd?function(){if(_0x311825===''&&_0x2e85e1){var _0x5599c3=_0x2e85e1['apply'](_0x50a0cd,arguments);_0x2e85e1=null;return _0x5599c3;}}:function(_0x38a067){};_0x18a5dd=false;var _0x38a067='';return _0x370651;};}();
	"HandleFunction": /^var _?[0-9a-zA-Z$]+=function\(_0x[0-9a-f]+\)\{var _0x[0-9a-f]+=true;return function\(_0x[0-9a-f]+,_0x[0-9a-f]+\)\{var _0x[0-9a-f]+='\u202e?';var _0x[0-9a-f]+=_0x[0-9a-f]+\?function\(\)\{if\(_0x[0-9a-f]+==='\u202e?'&&_0x[0-9a-f]+\)\{var _0x[0-9a-f]+=_0x[0-9a-f]+\['apply']\(_0x[0-9a-f]+,arguments\);_0x[0-9a-f]+=null;return _0x[0-9a-f]+;}}:function\(_0x[0-9a-f]+\)\{};_0x[0-9a-f]+=false;var _0x[0-9a-f]+='\u202e?';return _0x[0-9a-f]+;};}\(\);$/,
	// var lIllII=Iii11l(this,function(){var _0xb7103=function(){return'\x64\x65\x76';},_0x5099b6=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x47d370=function(){var _0x2a2dae=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x2a2dae['\x74\x65\x73\x74'](_0xb7103['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x31ac8b=function(){var _0x233c31=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x233c31['\x74\x65\x73\x74'](_0x5099b6['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x45622f=function(_0x3369e4){var _0x249441=~-0x1>>0x1+0xff%0x0;if(_0x3369e4['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x249441)){_0x297518(_0x3369e4);}};var _0x297518=function(_0x45378d){var _0x2c47cd=~-0x4>>0x1+0xff%0x0;if(_0x45378d['\x69\x6e\x64\x65\x78\x4f\x66']((true+'')[0x3])!==_0x2c47cd){_0x45622f(_0x45378d);}};if(!_0x47d370()){if(!_0x31ac8b()){_0x45622f('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x45622f('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x45622f('\x69\x6e\x64\u0435\x78\x4f\x66');}});
	"DetectFunction": /^var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(this,function\(\)\{var _0x[0-9a-f]+=function\(\)\{return'\\x64\\x65\\x76';},_0x[0-9a-f]+=function\(\)\{return'\\x77\\x69\\x6e\\x64\\x6f\\x77';};var _0x[0-9a-f]+=function\(\)\{var _0x[0-9a-f]+=new RegExp\('\\x5c\\x77\\x2b\\x20\\x2a\\x5c\\x28\\x5c\\x29\\x20\\x2a\\x7b\\x5c\\x77\\x2b\\x20\\x2a\\x5b\\x27\\x7c\\x22\\x5d\\x2e\\x2b\\x5b\\x27\\x7c\\x22\\x5d\\x3b\\x3f\\x20\\x2a\\x7d'\);return!_0x[0-9a-f]+\['\\x74\\x65\\x73\\x74']\(_0x[0-9a-f]+\['\\x74\\x6f\\x53\\x74\\x72\\x69\\x6e\\x67']\(\)\);};var _0x[0-9a-f]+=function\(\)\{var _0x[0-9a-f]+=new RegExp\('\\x28\\x5c\\x5c\\x5b\\x78\\x7c\\x75\\x5d\\x28\\x5c\\x77\\x29\\x7b\\x32\\x2c\\x34\\x7d\\x29\\x2b'\);return _0x[0-9a-f]+\['\\x74\\x65\\x73\\x74']\(_0x[0-9a-f]+\['\\x74\\x6f\\x53\\x74\\x72\\x69\\x6e\\x67']\(\)\);};var _0x[0-9a-f]+=function\(_0x[0-9a-f]+\)\{var _0x[0-9a-f]+=~-0x1>>0x1\+0xff%0x0;if\(_0x[0-9a-f]+\['\\x69\\x6e\\x64\\x65\\x78\\x4f\\x66']\('\\x69'===_0x[0-9a-f]+\)\)\{_0x[0-9a-f]+\(_0x[0-9a-f]+\);}};var _0x[0-9a-f]+=function\(_0x[0-9a-f]+\)\{var _0x[0-9a-f]+=~-0x4>>0x1\+0xff%0x0;if\(_0x[0-9a-f]+\['\\x69\\x6e\\x64\\x65\\x78\\x4f\\x66']\(\(true\+''\)\[0x3]\)!==_0x[0-9a-f]+\)\{_0x[0-9a-f]+\(_0x[0-9a-f]+\);}};if\(!_0x[0-9a-f]+\(\)\)\{if\(!_0x[0-9a-f]+\(\)\)\{_0x[0-9a-f]+\('\\x69\\x6e\\x64\\u0435\\x78\\x4f\\x66'\);}else\{_0x[0-9a-f]+\('\\x69\\x6e\\x64\\x65\\x78\\x4f\\x66'\);}}else\{_0x[0-9a-f]+\('\\x69\\x6e\\x64\\u0435\\x78\\x4f\\x66'\);}}\);$/,
	// llIlII();
	"FunctionRunner": /^_?[0-9a-zA-Z$]+\(\);$/
};
function decryptCodeBlockArr(jsArr, isShowProgress) {
	if (isShowProgress) {
		logger.logWithProgress("解除代码块加密", 0, jsArr.length);
	}
	// 检查是否有禁止格式化代码（不管选择什么命名格式，这里都会用十六进制命名）
	if (
		ANTI_FORMAT_SCHEMAS["HandleFunction"].test(jsArr[0]) &&
		ANTI_FORMAT_SCHEMAS["DetectFunction"].test(jsArr[1]) &&
		ANTI_FORMAT_SCHEMAS["FunctionRunner"].test(jsArr[2])
	) {
		jsArr = jsArr.slice(3);
	}
	// 获取加密对象名称（无则为false）
	let decryptorObjName = getCodeBlockDecryptorName(jsArr[0]);
	// 代码块解密
	if (decryptorObjName) {
		virtualGlobalEval(jsArr[0]);

		let transStrRes;
		// 识别是否添加括号（二叉树？不！它超出了我的能力范围。）
		jsArr = jsArr.slice(1).map(function (jsStr) {
			transStrRes = transStr(jsStr);

			let decryptorPos = Number.POSITIVE_INFINITY;
			while ((decryptorPos === Number.POSITIVE_INFINITY || decryptorPos - 1 >= 0) && (decryptorPos = transStrRes.lastSearchOf(new RegExp(decryptorObjName.replace(/\$/g, "\\$") + "\\['.+?']"), decryptorPos - 1)) !== -1) {
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
						jsStr = jsStr.replaceWithStr(decryptorPos, rightRoundPos + 1, replaceDecryptorFunc(decryptorObjName, jsStr.slice(leftSquarePos + 2, rightSquarePos - 1), jsStr.slice(decryptorPos, rightRoundPos + 1), ignoreQuoteOutside));
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

logger.logWithoutProgress("清理死代码（花指令）");
function simplifyIf(ifJsStr) {
	let conditionStartPos = 2, conditionEndPos = getQuoteEndPos(ifJsStr, conditionStartPos);
	let ifRes = eval(ifJsStr.slice(conditionStartPos, conditionEndPos + 1));
	let elsePos = getQuoteEndPos(ifJsStr, conditionEndPos + 1) + 1, endPos = getQuoteEndPos(ifJsStr, elsePos + 4);

	return ifRes ? ifJsStr.slice(conditionEndPos + 2, elsePos - 1) : ifJsStr.slice(elsePos + 5, endPos);
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
		let transStrRes = transStr(jsArr[0]), transLayerRes = transLayer(transStrRes, 1, true);
		if (/^if\('S+'[=!]=='S+'\)/.test(transStrRes)) {
			let transFakeIfStr = transLayerRes.match(/if\(Q*\){Q*}else{Q*}/)[0];
			return clearDeadCodes(splitStatements(simplifyIf(jsArr[0].slice(0, transFakeIfStr.length)), "COMMON"));
		}
	} else if (jsArr.length === 2) {
		// switch死代码
		if (/^var \S+?='[0-9|]*?'\['split']\('\|'\),\S+?=0x0;/.test(jsArr[0]) && /^while\(true\){switch\(\S+?\[\S+?\+\+]\)/.test(jsArr[1])) {
			let initMatch = jsArr[0].match(/var (\S+?)='[0-9|]*?'\['split']\('\|'\),(\S+?)=0x0;/),
				whileMatch = jsArr[1].match(/while\(true\){switch\((\S+?)\[(\S+?)\+\+]\)/);
			let sequence;
			if ((initMatch && initMatch.length === 3 && whileMatch && whileMatch.length === 3) && ((sequence = initMatch[1]) === whileMatch[1] && initMatch[2] === whileMatch[2])) {
				virtualEval(jsArr[0]);
				let sequenceList = virtualEval(sequence);
				let caseBlock = jsArr[1].slice(whileMatch[0].length + 1, getQuoteEndPos(jsArr[1], whileMatch[0].length));
				let transCaseBlock = transLayer(caseBlock);
				let caseList = [];
				let caseRegexp = /case ?'S*'/g;

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
	} else if (jsArr.length === 3) {
		// switch死代码
		if (/^var \S+='[0-9|]*?'\['split']\('\|'\);/.test(jsArr[0]) && /^var \S+=0x0;/.test(jsArr[1]) && /^while\(true\){switch\(\S+\[\S+\+\+]\)/.test(jsArr[2])) {
			let initMatch0 = jsArr[0].match(/^var (\S+)='[0-9|]*?'\['split']\('\|'\);$/),
				initMatch1 = jsArr[1].match(/^var (\S+)=0x0;$/),
				whileMatch = jsArr[2].match(/while\(true\){switch\((\S+)\[(\S+)\+\+]\)/);
			let sequence;
			if ((initMatch0 && initMatch0.length === 2 && initMatch1 && initMatch1.length === 2 && whileMatch && whileMatch.length === 3) &&
				((sequence = initMatch0[1]) === whileMatch[1] && initMatch1[1] === whileMatch[2])) {
				virtualEval(jsArr[0]);
				virtualEval(jsArr[1]);
				let sequenceList = virtualEval(sequence);
				let caseBlock = jsArr[2].slice(whileMatch[0].length + 1, getQuoteEndPos(jsArr[2], whileMatch[0].length));
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

logger.logWithoutDetermine("解除环境限制");
function clearEnvironmentLimit(jsArr) {
	let jsStr = jsArr.join("");
	let transRes = transStr(jsStr);

	// 万恶之源
	let preSearchRegexp1 = /var _?[0-9a-zA-Z$]+=function\((?:_?[0-9a-zA-Z$]+)?\)\{var _?[0-9a-zA-Z$]+=true;return function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{(?:var _?[0-9a-zA-Z$]+='\u202e?';)?var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\?function\(\)\{if\((?:\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&)?_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\['apply']\(_?[0-9a-zA-Z$]+,arguments\);_?[0-9a-zA-Z$]+=null;return _?[0-9a-zA-Z$]+;}}:function\((?:_?[0-9a-zA-Z$]+)?\)\{};_?[0-9a-zA-Z$]+=false;(?:var _?[0-9a-zA-Z$]+='\u202e?';)?return _?[0-9a-zA-Z$]+;};}\(\);/;
	let searchRes1;
	while ((searchRes1 = preSearchRegexp1.exec(jsStr))) {
		logger.weakUpdate();
		let startPos = searchRes1.index, endPos = startPos + searchRes1[0].length;
		if (/^var _?[0-9a-zA-Z$]+=function\((?:_?[0-9a-zA-Z$]+)?\)\{var _?[0-9a-zA-Z$]+=true;return function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{(?:var _?[0-9a-zA-Z$]+='(?:S{1})?';)?var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\?function\(\)\{if\((?:\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&)?_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\['S{5}']\(_?[0-9a-zA-Z$]+,arguments\);_?[0-9a-zA-Z$]+=null;return _?[0-9a-zA-Z$]+;}}:function\((?:_?[0-9a-zA-Z$]+)?\)\{};_?[0-9a-zA-Z$]+=false;(?:var _?[0-9a-zA-Z$]+='(?:S{1})?';)?return _?[0-9a-zA-Z$]+;};}\(\);/.test(transRes.slice(startPos, endPos))) {
			jsStr = jsStr.replaceWithStr(startPos, endPos, "");
			transRes = transRes.replaceWithStr(startPos, endPos, "");
			preSearchRegexp1.lastIndex = startPos;
		} else {
			// pause(transRes.slice(startPos, endPos));
		}
	}

	// 防止格式化
	let preSearchRegexp2 = /\(function\(\)\{_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=new RegExp\('function \*\\\\\( \*\\\\\)'\);var _?[0-9a-zA-Z$]+=new RegExp\('\\\\\+\\\\\+ \*\(\?:\(\?:\[a-z0-9A-Z_]\)\{1,8}\|\(\?:\\\\b\|\\\\d\)\[a-z0-9_]\{1,8}\(\?:\\\\b\|\\\\d\)\)','(?:i|\\x69)'\);var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\('init'\);if\(!_?[0-9a-zA-Z$]+\['test']\(_?[0-9a-zA-Z$]+\+'chain'\)\|\|!_?[0-9a-zA-Z$]+\['test']\(_?[0-9a-zA-Z$]+\+'input'\)\)\{_?[0-9a-zA-Z$]+\('(?:0|\\x30)'\);}else\{_?[0-9a-zA-Z$]+\(\);}}\)\(\);}\(\)\);/;
	let searchRes2;
	while ((searchRes2 = preSearchRegexp2.exec(jsStr))) {
		logger.weakUpdate();
		let startPos = searchRes2.index, endPos = startPos + searchRes2[0].length;
		if (/^\(function\(\)\{_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=new RegExp\('S{18}'\);var _?[0-9a-zA-Z$]+=new RegExp\('S{70}','(?:S{1}|S{4})'\);var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\('S{4}'\);if\(!_?[0-9a-zA-Z$]+\['S{4}']\(_?[0-9a-zA-Z$]+\+'S{5}'\)\|\|!_?[0-9a-zA-Z$]+\['S{4}']\(_?[0-9a-zA-Z$]+\+'S{5}'\)\)\{_?[0-9a-zA-Z$]+\('(?:S{1}|S{4})'\);}else\{_?[0-9a-zA-Z$]+\(\);}}\)\(\);}\(\)\);/.test(transRes.slice(startPos, endPos))) {
			jsStr = jsStr.replaceWithStr(startPos, endPos, "");
			transRes = transRes.replaceWithStr(startPos, endPos, "");
			preSearchRegexp2.lastIndex = startPos;
		} else {
			// pause(transRes.slice(startPos, endPos));
		}
	}

	// 禁止控制台输出
	let preSearchRegexp3 = /(?:\(function\(\)\{_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=new RegExp\('function \*\\\\\( \*\\\\\)'\);var _?[0-9a-zA-Z$]+=new RegExp\('\\\\\+\\\\\+ \*\(\?:\(\?:\[a-z0-9A-Z_]\)\{1,8}\|\(\?:\\\\b\|\\\\d\)\[a-z0-9_]\{1,8}\(\?:\\\\b\|\\\\d\)\)','(?:i|\\x69)'\);var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\('init'\);if\(!_?[0-9a-zA-Z$]+\['test']\(_?[0-9a-zA-Z$]+\+'chain'\)\|\|!_?[0-9a-zA-Z$]+\['test']\(_?[0-9a-zA-Z$]+\+'input'\)\)\{_?[0-9a-zA-Z$]+\('(?:0|\\x30)'\);}else\{_?[0-9a-zA-Z$]+\(\);}}\)\(\);}\(\)\);var _?[0-9a-zA-Z$]+=function\(_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=true;return function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+='\u202e?';var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\?function\(\)\{if\(\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\['apply']\(_?[0-9a-zA-Z$]+,arguments\);_?[0-9a-zA-Z$]+=null;return _?[0-9a-zA-Z$]+;}}:function\(_?[0-9a-zA-Z$]+\)\{};_?[0-9a-zA-Z$]+=false;var _?[0-9a-zA-Z$]+='\u202e?';return _?[0-9a-zA-Z$]+;};}\(\);)?var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=function\(\)\{};var _?[0-9a-zA-Z$]+(?:=\(?typeof window!=='undefined'\)?\?window:\(?typeof process==='object'\)?&&\(?typeof require==='function'\)?&&\(?typeof global==='object'\)?\?global:this;|;try\{var _?[0-9a-zA-Z$]+=Function\('return \(function\(\) '\+'\{}\.constructor\("return this"\)\( \)'\+'\\x29\\x3b'\);_?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(\);}catch\(_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+=window;}|=function\(\)\{var _?[0-9a-zA-Z$]+;try\{_?[0-9a-zA-Z$]+=Function\('return \(function\(\) '\+'\{}\.constructor\("return this"\)\( \)'\+'\\x29\\x3b'\)\(\);}catch\(_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+=window;}return _?[0-9a-zA-Z$]+;};var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(\);)if\(!_?[0-9a-zA-Z$]+\['console']\)\{_?[0-9a-zA-Z$]+\['console']=function\(_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=\{};_?[0-9a-zA-Z$]+\['log']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['warn']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['debug']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['info']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['error']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['exception']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['trace']=_?[0-9a-zA-Z$]+;return _?[0-9a-zA-Z$]+;}\(_?[0-9a-zA-Z$]+\);}else\{_?[0-9a-zA-Z$]+\['console']\['log']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['warn']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['debug']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['info']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['error']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['exception']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['console']\['trace']=_?[0-9a-zA-Z$]+;}}\);_?[0-9a-zA-Z$]+\(\);/;
	let searchRes3;
	while ((searchRes3 = preSearchRegexp3.exec(jsStr))) {
		logger.weakUpdate();
		let startPos = searchRes3.index, endPos = startPos + searchRes3[0].length;
		if (/^(?:\(function\(\)\{_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=new RegExp\('S{18}'\);var _?[0-9a-zA-Z$]+=new RegExp\('S{70}','(?:S{1}|S{4})'\);var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\('S{4}'\);if\(!_?[0-9a-zA-Z$]+\['S{4}']\(_?[0-9a-zA-Z$]+\+'S{5}'\)\|\|!_?[0-9a-zA-Z$]+\['S{4}']\(_?[0-9a-zA-Z$]+\+'S{5}'\)\)\{_?[0-9a-zA-Z$]+\('(?:S{1}|S{4})'\);}else\{_?[0-9a-zA-Z$]+\(\);}}\)\(\);}\(\)\);var _?[0-9a-zA-Z$]+=function\(_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=true;return function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+='(?:S{1})?';var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\?function\(\)\{if\(\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\['S{5}']\(_?[0-9a-zA-Z$]+,arguments\);_?[0-9a-zA-Z$]+=null;return _?[0-9a-zA-Z$]+;}}:function\(_?[0-9a-zA-Z$]+\)\{};_?[0-9a-zA-Z$]+=false;var _?[0-9a-zA-Z$]+='(?:S{1})?';return _?[0-9a-zA-Z$]+;};}\(\);)?var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+=function\(\)\{};var _?[0-9a-zA-Z$]+(?:=\(?typeof window!=='S{9}'\)?\?window:\(?typeof process==='S{6}'\)?&&\(?typeof require==='S{8}'\)?&&\(?typeof global==='S{6}'\)?\?global:this;|;try{var _?[0-9a-zA-Z$]+=Function\('S{19}'\+'S{32}'\+'S{8}'\);_?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(\);}catch\(_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+=window;}|=function\(\)\{var _?[0-9a-zA-Z$]+;try\{_?[0-9a-zA-Z$]+=Function\('S{19}'\+'S{32}'\+'S{8}'\)\(\);}catch\(_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+=window;}return _?[0-9a-zA-Z$]+;};var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(\);)if\(!_?[0-9a-zA-Z$]+\['S{7}']\)\{_?[0-9a-zA-Z$]+\['S{7}']=function\(_?[0-9a-zA-Z$]+\)\{var _?[0-9a-zA-Z$]+=\{};_?[0-9a-zA-Z$]+\['S{3}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{4}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{5}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{4}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{5}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{9}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{5}']=_?[0-9a-zA-Z$]+;return _?[0-9a-zA-Z$]+;}\(_?[0-9a-zA-Z$]+\);}else\{_?[0-9a-zA-Z$]+\['S{7}']\['S{3}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{4}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{5}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{4}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{5}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{9}']=_?[0-9a-zA-Z$]+;_?[0-9a-zA-Z$]+\['S{7}']\['S{5}']=_?[0-9a-zA-Z$]+;}}\);_?[0-9a-zA-Z$]+\(\);$/.test(transRes.slice(startPos, endPos))) {
			jsStr = jsStr.replaceWithStr(startPos, endPos, "");
			transRes = transRes.replaceWithStr(startPos, endPos, "");
			preSearchRegexp3.lastIndex = startPos;
		} else {
			// pause(transRes.slice(startPos, endPos));
		}
	}

	// 禁止控制台调试
	let preSearchRegexp4 = /function _?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\)\{function _?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\)\{(?:var _?[0-9a-zA-Z$]+='\u202e?\u202e?';if\(\(?typeof _?[0-9a-zA-Z$]+==='string'\)?&&\(?_?[0-9a-zA-Z$]+==='\u202e?\u202e?'\)?\)\{var _?[0-9a-zA-Z$]+=function\(\)\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'Function\(arguments\[0]\+"'\+_?[0-9a-zA-Z$]+\)?\+'"\)\(\)'\);}\(_?[0-9a-zA-Z$]+\);}\('bugger'\)\('de'\)\);};return _?[0-9a-zA-Z$]+\(\);}else\{if\(\(?\(''\+\(?_?[0-9a-zA-Z$]+\/_?[0-9a-zA-Z$]+\)?\)\['length']!==0x1\)?\|\|\(?_?[0-9a-zA-Z$]+%0x14===0x0\)?\)\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'Function\(arguments\[0]\+(?:"|\\x22)'\+_?[0-9a-zA-Z$]+\)?\+'(?:"|\\x22)\)\(\)'\);}\(_?[0-9a-zA-Z$]+\);}\('bugger'\)\('de'\)\);;}else\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'Function\(arguments\[0]\+(?:"|\\x22)'\+_?[0-9a-zA-Z$]+\)?\+'(?:"|\\x22)\)\(\)'\);}\(_?[0-9a-zA-Z$]+\);}\('bugger'\)\('de'\)\);;}}|if\(typeof _?[0-9a-zA-Z$]+==='string'\)\{return function\(_?[0-9a-zA-Z$]+\)\{}\['constructor']\('debugger;'\)\['apply']\('counter'\);}else\{if\(\(?\(''\+\(?_?[0-9a-zA-Z$]+\/_?[0-9a-zA-Z$]+\)?\)\['length']!==0x1\)?\|\|\(?\(?_?[0-9a-zA-Z$]+%0x14\)?===0x0\)?\)\{\(function\(\)\{return true;}\['constructor']\('debu'\+'gger'\)\['call']\('action'\)\);}else\{\(function\(\)\{return false;}\['constructor']\('debu'\+'gger'\)\['apply']\('stateObject'\)\);}})_?[0-9a-zA-Z$]+\(\+\+_?[0-9a-zA-Z$]+\);}try\{if\(_?[0-9a-zA-Z$]+\)\{return _?[0-9a-zA-Z$]+;}else\{_?[0-9a-zA-Z$]+\(0x0\);}}catch\(_?[0-9a-zA-Z$]+\)\{}};/g;
	let searchRes4;
	while ((searchRes4 = preSearchRegexp4.exec(jsStr))) {
		logger.weakUpdate();
		let startPos = searchRes4.index, endPos = startPos + searchRes4[0].length;
		if (/^function _?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\)\{function _?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\)\{(?:var _?[0-9a-zA-Z$]+='(?:S{2})?';if\(\(?typeof _?[0-9a-zA-Z$]+==='S{6}'\)?&&\(?_?[0-9a-zA-Z$]+==='(?:S{2})?'\)?\)\{var _?[0-9a-zA-Z$]+=function\(\)\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'(?:S{23}|S{26})'\+_?[0-9a-zA-Z$]+\)?\+'(?:S{4}|S{7})'\);}\(_?[0-9a-zA-Z$]+\);}\('S{6}'\)\('S{2}'\)\);};return _?[0-9a-zA-Z$]+\(\);}else\{if\(\(?\(''\+\(?_?[0-9a-zA-Z$]+\/_?[0-9a-zA-Z$]+\)?\)\['S{6}']!==0x1\)?\|\|\(?\(?_?[0-9a-zA-Z$]+%0x14\)?===0x0\)?\)\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'(?:S{23}|S{26})'\+_?[0-9a-zA-Z$]+\)?\+'(?:S{4}|S{7})'\);}\(_?[0-9a-zA-Z$]+\);}\('S{6}'\)\('S{2}'\)\);;}else\{\(function\(_?[0-9a-zA-Z$]+\)\{return function\(_?[0-9a-zA-Z$]+\)\{return Function\(\(?'(?:S{23}|S{26})'\+_?[0-9a-zA-Z$]+\)?\+'(?:S{4}|S{7})'\);}\(_?[0-9a-zA-Z$]+\);}\('S{6}'\)\('S{2}'\)\);;}}|if\(typeof _?[0-9a-zA-Z$]+==='S{6}'\)\{return function\(_?[0-9a-zA-Z$]+\)\{}\['S{11}']\('S{9}'\)\['S{5}']\('S{7}'\);}else\{if\(\(?\(''\+\(?_?[0-9a-zA-Z$]+\/_?[0-9a-zA-Z$]+\)?\)\['S{6}']!==0x1\)?\|\|\(?\(?_?[0-9a-zA-Z$]+%0x14\)?===0x0\)?\)\{\(function\(\)\{return true;}\['S{11}']\('S{4}'\+'S{4}'\)\['S{4}']\('S{6}'\)\);}else\{\(function\(\)\{return false;}\['S{11}']\('S{4}'\+'S{4}'\)\['S{5}']\('S{11}'\)\);}})_?[0-9a-zA-Z$]+\(\+\+_?[0-9a-zA-Z$]+\);}try\{if\(_?[0-9a-zA-Z$]+\)\{return _?[0-9a-zA-Z$]+;}else\{_?[0-9a-zA-Z$]+\(0x0\);}}catch\(_?[0-9a-zA-Z$]+\)\{}};$/.test(transRes.slice(startPos, endPos))) {
			jsStr = jsStr.replaceWithStr(startPos, endPos, "");
			transRes = transRes.replaceWithStr(startPos, endPos, "");
			preSearchRegexp4.lastIndex = startPos;
		} else {
			// pause(transRes.slice(startPos, endPos));
		}
	}

	// 安全域名
	let preSearchRegexp5 = /var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+='\u202e?';var _?[0-9a-zA-Z$]+=\(?typeof window!=='undefined'\)?\?window:\(?\(?typeof process==='object'\)?&&\(?typeof require==='function'\)?\)?&&\(?typeof global==='object'\)?\?global:this;var _?[0-9a-zA-Z$]+=\[\[0x0,0x0,0x0,0x0,0x0],\['[^']+'\['replace']\(new RegExp\('\[[a-zA-Z]+]','g'\),''\)\['split']\(';'\),false],\[function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{return _?[0-9a-zA-Z$]+\['charCodeAt']\(_?[0-9a-zA-Z$]+\)==_?[0-9a-zA-Z$]+;},function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+]\[_?[0-9a-zA-Z$]+]=_?[0-9a-zA-Z$]+;},function\(\)\{return!0x0;}]];var _?[0-9a-zA-Z$]+=function\(\)\{while\(_?[0-9a-zA-Z$]+\[0x2]\[0x2]\(\)\)\{_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x4]]=_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x4]];};};for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\)\{if\(\(?\(?\(?\(?\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&\(?_?[0-9a-zA-Z$]+\['length']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x74\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x5,0x65\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x3,0x75\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x64\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x0,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&\(?_?[0-9a-zA-Z$]+\['length']==0x6\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x5,0x6e\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x64\)\){_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x1,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&\(?_?[0-9a-zA-Z$]+\['length']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x6e\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x6c\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x2,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\)\{if\(\(?\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&\(?_?[0-9a-zA-Z$]+\['length']==0x4\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x3,0x66\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x4,_?[0-9a-zA-Z$]+\);}else if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?&&\(?_?[0-9a-zA-Z$]+\['length']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x65\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x68\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x3,_?[0-9a-zA-Z$]+\);}}if\(!_?[0-9a-zA-Z$]+\[0x0]\[0x0]\|\|!_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{return;}var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x1]];var _?[0-9a-zA-Z$]+=!!_?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]&&_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x3]];var _?[0-9a-zA-Z$]+=\(?_?[0-9a-zA-Z$]+\|\|_?[0-9a-zA-Z$]+\)?;}\);_?[0-9a-zA-Z$]+\(\);/;
	let searchRes5;
	while ((searchRes5 = preSearchRegexp5.exec(jsStr))) {
		logger.weakUpdate();
		let startPos = searchRes5.index, endPos = startPos + searchRes5[0].length;
		if (/^var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+\(this,function\(\)\{var _?[0-9a-zA-Z$]+='(?:S{1})?';var _?[0-9a-zA-Z$]+=\(?typeof window!=='S{9}'\)?\?window:\(?\(?typeof process==='S{6}'\)?&&\(?typeof require==='S{8}'\)?\)?&&\(?typeof global==='S{6}'\)?\?global:this;var _?[0-9a-zA-Z$]+=\[\[0x0,0x0,0x0,0x0,0x0],\['S+'\['S{7}']\(new RegExp\('S+','S{1}'\),''\)\['S{5}']\('S{1}'\),false],\[function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{return _?[0-9a-zA-Z$]+\['S{10}']\(_?[0-9a-zA-Z$]+\)==_?[0-9a-zA-Z$]+;},function\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+]\[_?[0-9a-zA-Z$]+]=_?[0-9a-zA-Z$]+;},function\(\)\{return!0x0;}]];var _?[0-9a-zA-Z$]+=function\(\)\{while\(_?[0-9a-zA-Z$]+\[0x2]\[0x2]\(\)\)\{_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x4]]=_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x4]];};};for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\)\{if\(\(?\(?\(?\(?\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&\(?_?[0-9a-zA-Z$]+\['S{6}']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x74\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x5,0x65\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x3,0x75\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x64\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x0,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&\(?_?[0-9a-zA-Z$]+\['S{6}']==0x6\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x5,0x6e\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x64\)\){_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x1,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&\(?_?[0-9a-zA-Z$]+\['S{6}']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x6e\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x6c\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x2,_?[0-9a-zA-Z$]+\);break;}}for\(var _?[0-9a-zA-Z$]+ in _?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\)\{if\(\(?\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&\(?_?[0-9a-zA-Z$]+\['S{6}']==0x4\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x3,0x66\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x4,_?[0-9a-zA-Z$]+\);}else if\(\(?\(?\(?_?[0-9a-zA-Z$]+==='(?:S{1})?'\)?&&\(?_?[0-9a-zA-Z$]+\['S{6}']==0x8\)?\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x7,0x65\)\)?&&_?[0-9a-zA-Z$]+\[0x2]\[0x0]\(_?[0-9a-zA-Z$]+,0x0,0x68\)\)\{_?[0-9a-zA-Z$]+\[0x2]\[0x1]\(0x0,0x3,_?[0-9a-zA-Z$]+\);}}if\(!_?[0-9a-zA-Z$]+\[0x0]\[0x0]\|\|!_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\)\{return;}var _?[0-9a-zA-Z$]+=_?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x1]];var _?[0-9a-zA-Z$]+=!!_?[0-9a-zA-Z$]+[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]&&_?[0-9a-zA-Z$]+\[_?[0-9a-zA-Z$]+\[0x0]\[0x0]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x2]]\[_?[0-9a-zA-Z$]+\[0x0]\[0x3]];var _?[0-9a-zA-Z$]+=\(?_?[0-9a-zA-Z$]+\|\|_?[0-9a-zA-Z$]+\)?;}\);_?[0-9a-zA-Z$]+\(\);/.test(transRes.slice(startPos, endPos))) {
			jsStr = jsStr.replaceWithStr(startPos, endPos, "");
			transRes = transRes.replaceWithStr(startPos, endPos, "");
			preSearchRegexp5.lastIndex = startPos;
		} else {
			// pause(transRes.slice(startPos, endPos));
		}
	}

	return splitStatements(jsStr).filter(function (jsStr) {
		logger.weakUpdate();
		return !/^window\['setInterval']\(function\(\)\{(?:function _?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+,_?[0-9a-zA-Z$]+\)\{return \(?_?[0-9a-zA-Z$]+\+_?[0-9a-zA-Z$]+\)?;})?var _?[0-9a-zA-Z$]+=(?:_?[0-9a-zA-Z$]+\('jsj','iam'\)|'jsj'\+'iam')(?:,_?[0-9a-zA-Z$]+='\u202e?')?;if\((?:\(?\(?typeof _?[0-9a-zA-Z$ｉＯ]+==_?[0-9a-zA-Z$]+\('undefi','ned'\)\)?&&\(?_?[0-9a-zA-Z$]+==='\u202e?'\)?\)?\|\|\(?_?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$ｉＯ]+,'\u202e?'\)!=_?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+\(_?[0-9a-zA-Z$]+,'i.com.v'\),_?[0-9a-zA-Z$]+\['length']\),'\u202e?'\)\)?|typeof _?[0-9a-zA-Z$ｉＯ]+=='undefi'\+'ned'\|\|_?[0-9a-zA-Z$ｉＯ]+!=_?[0-9a-zA-Z$]+\+'i.com.v'\+_?[0-9a-zA-Z$]+\['length'])\)\{var _?[0-9a-zA-Z$]+=\[];while\(_?[0-9a-zA-Z$]+\['length']>-0x1\)\{_?[0-9a-zA-Z$]+\['push']\(_?[0-9a-zA-Z$]+\['length']\^0x2\);}}_?[0-9a-zA-Z$]+\(\);},0x7d0\);/.test(jsStr);
	});
}
jsStatementsArr = clearEnvironmentLimit(jsStatementsArr, true);
fs.writeFileSync("DecryptResult4.js", jsStatementsArr.join("\n"));

logger.logWithoutDetermine("提升代码可读性");
function decodeStr(txt) {
	return eval(`(\`${txt.replace(/`/g, "\\`")}\`)`).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
function decryptFormat(globalJsArr) {
	return globalJsArr.map(function (statement) {
		logger.weakUpdate();

		let transStrRes;

		// 合并串联字符串（'spl'+'it' → 'split'）
		if (config["optionalFunction"]["MergeString"]) {
			transStrRes = transStr(statement);
			let multiStrPos = Number.POSITIVE_INFINITY;
			while ((multiStrPos = transStrRes.lastSearchOf(/S'\+'S/, multiStrPos - 1)) !== -1) {
				logger.weakUpdate();
				statement = statement.replaceWithStr(multiStrPos + 1, multiStrPos + 4, "");
			}
		}

		// 转换十六进制数字（0x1 → 1）
		if (config["optionalFunction"]["ConvertHex"]) {
			transStrRes = transStr(statement);
			let hexNumberPos = Number.POSITIVE_INFINITY;
			while ((hexNumberPos = transStrRes.lastSearchOf(/0x[0-9a-fA-F]*/, hexNumberPos - 1)) !== -1) {
				logger.weakUpdate();
				let activeNumStr = transStrRes.slice(hexNumberPos).match(/0x[0-9a-fA-F]*/)[0];
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
					statement = statement.replaceWithStr(hexNumberPos, hexNumberPos + activeNumStr.length, parseInt(activeNumStr, 16).toString());
				}
			}
		}

		// 转换Unicode字符（\x22 → "）
		if (config["optionalFunction"]["ConvertUnicode"]) {
			transStrRes = transStr(statement);
			let hexCharRes = Number.POSITIVE_INFINITY;
			while ((hexCharRes = transStrRes.lastSearchOf(/'S+'/, hexCharRes - 1)) !== -1) {
				logger.weakUpdate();
				let activeStr = transStrRes.slice(hexCharRes++).match(/'S+'/)[0];
				statement = statement.replaceWithStr(hexCharRes, hexCharRes + activeStr.length - 2, decodeStr(statement.slice(hexCharRes, hexCharRes + activeStr.length - 2)));
			}
		}

		// 替换索引器（Object['keys'] → Object.keys）
		if (config["optionalFunction"]["ReplaceIndexer"]) {
			transStrRes = transStr(statement);
			let objIndexerPos = Number.POSITIVE_INFINITY;
			while ((objIndexerPos = transStrRes.lastSearchOf(/\['S*.']/, objIndexerPos - 1)) !== -1) {
				logger.weakUpdate();
				let activeIndexerStr = transStrRes.slice(objIndexerPos).match(/\['S*.']/)[0];
				let leftSplitter, rightSplitter;

				let isAheadRegexp = (() => {
					if (transStrRes[objIndexerPos - 1] !== "/") {
						return false;
					}
					let lastRegExpPos = transStrRes.lastSearchOf(/\/S*\//, objIndexerPos);
					if (lastRegExpPos === -1) {
						return false;
					} else {
						let activeRegExpStr = transStrRes.slice(lastRegExpPos).match(/\/S*\//)[0];
						return lastRegExpPos + activeRegExpStr.length === objIndexerPos;
					}
				})();
				if ((() => {
						if (!transStrRes[objIndexerPos - 1].match(/[0-9.]/)) {
							return false;
						}
						let pos = objIndexerPos;
						while (--pos) {
							if (!transStrRes[pos].match(/[0-9.]/)) {
								return !!transStrRes[pos].match(/[{}\[\]().,+\-*\/~!%<>=&|^?:; @]/);
							}
						}
					})() || // 123['toString']() -×-> 123.toString()
					transStrRes[objIndexerPos - 1].match(/[{}\[(,+\-*~!%<>=&|^?:;@]/) || // [['t']] -×-> [.t] （此时是字符串数组）
					transStrRes[objIndexerPos + activeIndexerStr.length].match(/[`'"]/) || // ['t']"a" -×-> t."a" （忘了为什么了）
					!isAheadRegexp && transStrRes[objIndexerPos - 1] === '/' || // 1 / ['t'] -×-> 1 /.t （此时是字符串数组）
					transStrRes.slice(objIndexerPos - 5, objIndexerPos) === 'async' || // async ['t'] -×-> async .t （此时是类函数）
					!/^[\u0024\u0041-\u005a\u005f\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376-\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e-\u066f\u0671-\u06d3\u06d5\u06e5-\u06e6\u06ee-\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4-\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u0870-\u0887\u0889-\u088e\u08a0-\u08c9\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc-\u09dd\u09df-\u09e1\u09f0-\u09f1\u09fc\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0-\u0ae1\u0af9\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3d\u0b5c-\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c5d\u0c60-\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cdd-\u0cde\u0ce0-\u0ce1\u0cf1-\u0cf2\u0d04-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32-\u0e33\u0e40-\u0e46\u0e81-\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2-\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065-\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1711\u171f-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4c\u1b83-\u1ba0\u1bae-\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5-\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cee\u2cf2-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a-\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ca\ua7d0-\ua7d1\ua7d3\ua7d5-\ua7d9\ua7f2-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd-\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5-\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][\u0024\u0030-\u0039\u0041-\u005a\u005f\u0061-\u007a\u00aa\u00b5\u00b7\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0300-\u0374\u0376-\u0377\u037a-\u037d\u037f\u0386-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u0483-\u0487\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7\u05d0-\u05ea\u05ef-\u05f2\u0610-\u061a\u0620-\u0669\u066e-\u06d3\u06d5-\u06dc\u06df-\u06e8\u06ea-\u06fc\u06ff\u0710-\u074a\u074d-\u07b1\u07c0-\u07f5\u07fa\u07fd\u0800-\u082d\u0840-\u085b\u0860-\u086a\u0870-\u0887\u0889-\u088e\u0898-\u08e1\u08e3-\u0963\u0966-\u096f\u0971-\u0983\u0985-\u098c\u098f-\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bc-\u09c4\u09c7-\u09c8\u09cb-\u09ce\u09d7\u09dc-\u09dd\u09df-\u09e3\u09e6-\u09f1\u09fc\u09fe\u0a01-\u0a03\u0a05-\u0a0a\u0a0f-\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32-\u0a33\u0a35-\u0a36\u0a38-\u0a39\u0a3c\u0a3e-\u0a42\u0a47-\u0a48\u0a4b-\u0a4d\u0a51\u0a59-\u0a5c\u0a5e\u0a66-\u0a75\u0a81-\u0a83\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2-\u0ab3\u0ab5-\u0ab9\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ad0\u0ae0-\u0ae3\u0ae6-\u0aef\u0af9-\u0aff\u0b01-\u0b03\u0b05-\u0b0c\u0b0f-\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32-\u0b33\u0b35-\u0b39\u0b3c-\u0b44\u0b47-\u0b48\u0b4b-\u0b4d\u0b55-\u0b57\u0b5c-\u0b5d\u0b5f-\u0b63\u0b66-\u0b6f\u0b71\u0b82-\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99-\u0b9a\u0b9c\u0b9e-\u0b9f\u0ba3-\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd0\u0bd7\u0be6-\u0bef\u0c00-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3c-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55-\u0c56\u0c58-\u0c5a\u0c5d\u0c60-\u0c63\u0c66-\u0c6f\u0c80-\u0c83\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5-\u0cd6\u0cdd-\u0cde\u0ce0-\u0ce3\u0ce6-\u0cef\u0cf1-\u0cf2\u0d00-\u0d0c\u0d0e-\u0d10\u0d12-\u0d44\u0d46-\u0d48\u0d4a-\u0d4e\u0d54-\u0d57\u0d5f-\u0d63\u0d66-\u0d6f\u0d7a-\u0d7f\u0d81-\u0d83\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2-\u0df3\u0e01-\u0e3a\u0e40-\u0e4e\u0e50-\u0e59\u0e81-\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0ebd\u0ec0-\u0ec4\u0ec6\u0ec8-\u0ecd\u0ed0-\u0ed9\u0edc-\u0edf\u0f00\u0f18-\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e-\u0f47\u0f49-\u0f6c\u0f71-\u0f84\u0f86-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1049\u1050-\u109d\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u135d-\u135f\u1369-\u1371\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u1715\u171f-\u1734\u1740-\u1753\u1760-\u176c\u176e-\u1770\u1772-\u1773\u1780-\u17d3\u17d7\u17dc-\u17dd\u17e0-\u17e9\u180b-\u180d\u180f-\u1819\u1820-\u1878\u1880-\u18aa\u18b0-\u18f5\u1900-\u191e\u1920-\u192b\u1930-\u193b\u1946-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u19d0-\u19da\u1a00-\u1a1b\u1a20-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1aa7\u1ab0-\u1abd\u1abf-\u1ace\u1b00-\u1b4c\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1bf3\u1c00-\u1c37\u1c40-\u1c49\u1c4d-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1cd0-\u1cd2\u1cd4-\u1cfa\u1d00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u200c-\u200d\u203f-\u2040\u2054\u2071\u207f\u2090-\u209c\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2ce4\u2ceb-\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d7f-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2de0-\u2dff\u3005-\u3007\u3021-\u302f\u3031-\u3035\u3038-\u303c\u3041-\u3096\u3099-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31bf\u31f0-\u31ff\u3400-\u4dbf\u4e00-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua62b\ua640-\ua66f\ua674-\ua67d\ua67f-\ua6f1\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ca\ua7d0-\ua7d1\ua7d3\ua7d5-\ua7d9\ua7f2-\ua827\ua82c\ua840-\ua873\ua880-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f7\ua8fb\ua8fd-\ua92d\ua930-\ua953\ua960-\ua97c\ua980-\ua9c0\ua9cf-\ua9d9\ua9e0-\ua9fe\uaa00-\uaa36\uaa40-\uaa4d\uaa50-\uaa59\uaa60-\uaa76\uaa7a-\uaac2\uaadb-\uaadd\uaae0-\uaaef\uaaf2-\uaaf6\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab69\uab70-\uabea\uabec-\uabed\uabf0-\uabf9\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe00-\ufe0f\ufe20-\ufe2f\ufe33-\ufe34\ufe4d-\ufe4f\ufe70-\ufe74\ufe76-\ufefc\uff10-\uff19\uff21-\uff3a\uff3f\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc]*$/.test(statement.slice(objIndexerPos + 2, objIndexerPos + activeIndexerStr.length - 2)) || // ['1xx'] -×-> .1xx.
					/^(in|of|instanceof)[\u0000-\u0023\u0025-\u002f\u003a-\u0040\u005b-\u005e\u0060\u007b-\u00a9\u00ab-\u00b4\u00b6\u00b8-\u00b9\u00bb-\u00bf\u00d7\u00f7\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02eb\u02ed\u02ef-\u02ff\u0375\u0378-\u0379\u037e\u0380-\u0385\u038b\u038d\u03a2\u03f6\u0482\u0488-\u0489\u0530\u0557-\u0558\u055a-\u055f\u0589-\u0590\u05be\u05c0\u05c3\u05c6\u05c8-\u05cf\u05eb-\u05ee\u05f3-\u060f\u061b-\u061f\u066a-\u066d\u06d4\u06dd-\u06de\u06e9\u06fd-\u06fe\u0700-\u070f\u074b-\u074c\u07b2-\u07bf\u07f6-\u07f9\u07fb-\u07fc\u07fe-\u07ff\u082e-\u083f\u085c-\u085f\u086b-\u086f\u0888\u088f-\u0897\u08e2\u0964-\u0965\u0970\u0984\u098d-\u098e\u0991-\u0992\u09a9\u09b1\u09b3-\u09b5\u09ba-\u09bb\u09c5-\u09c6\u09c9-\u09ca\u09cf-\u09d6\u09d8-\u09db\u09de\u09e4-\u09e5\u09f2-\u09fb\u09fd\u09ff-\u0a00\u0a04\u0a0b-\u0a0e\u0a11-\u0a12\u0a29\u0a31\u0a34\u0a37\u0a3a-\u0a3b\u0a3d\u0a43-\u0a46\u0a49-\u0a4a\u0a4e-\u0a50\u0a52-\u0a58\u0a5d\u0a5f-\u0a65\u0a76-\u0a80\u0a84\u0a8e\u0a92\u0aa9\u0ab1\u0ab4\u0aba-\u0abb\u0ac6\u0aca\u0ace-\u0acf\u0ad1-\u0adf\u0ae4-\u0ae5\u0af0-\u0af8\u0b00\u0b04\u0b0d-\u0b0e\u0b11-\u0b12\u0b29\u0b31\u0b34\u0b3a-\u0b3b\u0b45-\u0b46\u0b49-\u0b4a\u0b4e-\u0b54\u0b58-\u0b5b\u0b5e\u0b64-\u0b65\u0b70\u0b72-\u0b81\u0b84\u0b8b-\u0b8d\u0b91\u0b96-\u0b98\u0b9b\u0b9d\u0ba0-\u0ba2\u0ba5-\u0ba7\u0bab-\u0bad\u0bba-\u0bbd\u0bc3-\u0bc5\u0bc9\u0bce-\u0bcf\u0bd1-\u0bd6\u0bd8-\u0be5\u0bf0-\u0bff\u0c0d\u0c11\u0c29\u0c3a-\u0c3b\u0c45\u0c49\u0c4e-\u0c54\u0c57\u0c5b-\u0c5c\u0c5e-\u0c5f\u0c64-\u0c65\u0c70-\u0c7f\u0c84\u0c8d\u0c91\u0ca9\u0cb4\u0cba-\u0cbb\u0cc5\u0cc9\u0cce-\u0cd4\u0cd7-\u0cdc\u0cdf\u0ce4-\u0ce5\u0cf0\u0cf3-\u0cff\u0d0d\u0d11\u0d45\u0d49\u0d4f-\u0d53\u0d58-\u0d5e\u0d64-\u0d65\u0d70-\u0d79\u0d80\u0d84\u0d97-\u0d99\u0db2\u0dbc\u0dbe-\u0dbf\u0dc7-\u0dc9\u0dcb-\u0dce\u0dd5\u0dd7\u0de0-\u0de5\u0df0-\u0df1\u0df4-\u0e00\u0e3b-\u0e3f\u0e4f\u0e5a-\u0e80\u0e83\u0e85\u0e8b\u0ea4\u0ea6\u0ebe-\u0ebf\u0ec5\u0ec7\u0ece-\u0ecf\u0eda-\u0edb\u0ee0-\u0eff\u0f01-\u0f17\u0f1a-\u0f1f\u0f2a-\u0f34\u0f36\u0f38\u0f3a-\u0f3d\u0f48\u0f6d-\u0f70\u0f85\u0f98\u0fbd-\u0fc5\u0fc7-\u0fff\u104a-\u104f\u109e-\u109f\u10c6\u10c8-\u10cc\u10ce-\u10cf\u10fb\u1249\u124e-\u124f\u1257\u1259\u125e-\u125f\u1289\u128e-\u128f\u12b1\u12b6-\u12b7\u12bf\u12c1\u12c6-\u12c7\u12d7\u1311\u1316-\u1317\u135b-\u135c\u1360-\u1368\u1372-\u137f\u1390-\u139f\u13f6-\u13f7\u13fe-\u1400\u166d-\u166e\u1680\u169b-\u169f\u16eb-\u16ed\u16f9-\u16ff\u1716-\u171e\u1735-\u173f\u1754-\u175f\u176d\u1771\u1774-\u177f\u17d4-\u17d6\u17d8-\u17db\u17de-\u17df\u17ea-\u180a\u180e\u181a-\u181f\u1879-\u187f\u18ab-\u18af\u18f6-\u18ff\u191f\u192c-\u192f\u193c-\u1945\u196e-\u196f\u1975-\u197f\u19ac-\u19af\u19ca-\u19cf\u19db-\u19ff\u1a1c-\u1a1f\u1a5f\u1a7d-\u1a7e\u1a8a-\u1a8f\u1a9a-\u1aa6\u1aa8-\u1aaf\u1abe\u1acf-\u1aff\u1b4d-\u1b4f\u1b5a-\u1b6a\u1b74-\u1b7f\u1bf4-\u1bff\u1c38-\u1c3f\u1c4a-\u1c4c\u1c7e-\u1c7f\u1c89-\u1c8f\u1cbb-\u1cbc\u1cc0-\u1ccf\u1cd3\u1cfb-\u1cff\u1f16-\u1f17\u1f1e-\u1f1f\u1f46-\u1f47\u1f4e-\u1f4f\u1f58\u1f5a\u1f5c\u1f5e\u1f7e-\u1f7f\u1fb5\u1fbd\u1fbf-\u1fc1\u1fc5\u1fcd-\u1fcf\u1fd4-\u1fd5\u1fdc-\u1fdf\u1fed-\u1ff1\u1ff5\u1ffd-\u200b\u200e-\u203e\u2041-\u2053\u2055-\u2070\u2072-\u207e\u2080-\u208f\u209d-\u20cf\u20dd-\u20e0\u20e2-\u20e4\u20f1-\u2101\u2103-\u2106\u2108-\u2109\u2114\u2116-\u2117\u211e-\u2123\u2125\u2127\u2129\u213a-\u213b\u2140-\u2144\u214a-\u214d\u214f-\u215f\u2189-\u2bff\u2ce5-\u2cea\u2cf4-\u2cff\u2d26\u2d28-\u2d2c\u2d2e-\u2d2f\u2d68-\u2d6e\u2d70-\u2d7e\u2d97-\u2d9f\u2da7\u2daf\u2db7\u2dbf\u2dc7\u2dcf\u2dd7\u2ddf\u2e00-\u3004\u3008-\u3020\u3030\u3036-\u3037\u303d-\u3040\u3097-\u3098\u30a0\u30fb\u3100-\u3104\u3130\u318f-\u319f\u31c0-\u31ef\u3200-\u33ff\u4dc0-\u4dff\ua48d-\ua4cf\ua4fe-\ua4ff\ua60d-\ua60f\ua62c-\ua63f\ua670-\ua673\ua67e\ua6f2-\ua716\ua720-\ua721\ua789-\ua78a\ua7cb-\ua7cf\ua7d2\ua7d4\ua7da-\ua7f1\ua828-\ua82b\ua82d-\ua83f\ua874-\ua87f\ua8c6-\ua8cf\ua8da-\ua8df\ua8f8-\ua8fa\ua8fc\ua92e-\ua92f\ua954-\ua95f\ua97d-\ua97f\ua9c1-\ua9ce\ua9da-\ua9df\ua9ff\uaa37-\uaa3f\uaa4e-\uaa4f\uaa5a-\uaa5f\uaa77-\uaa79\uaac3-\uaada\uaade-\uaadf\uaaf0-\uaaf1\uaaf7-\uab00\uab07-\uab08\uab0f-\uab10\uab17-\uab1f\uab27\uab2f\uab5b\uab6a-\uab6f\uabeb\uabee-\uabef\uabfa-\uabff\ud7a4-\ud7af\ud7c7-\ud7ca\ud7fc-\uf8ff\ufa6e-\ufa6f\ufada-\ufaff\ufb07-\ufb12\ufb18-\ufb1c\ufb29\ufb37\ufb3d\ufb3f\ufb42\ufb45\ufbb2-\ufbd2\ufd3e-\ufd4f\ufd90-\ufd91\ufdc8-\ufdef\ufdfc-\ufdff\ufe10-\ufe1f\ufe30-\ufe32\ufe35-\ufe4c\ufe50-\ufe6f\ufe75\ufefd-\uff0f\uff1a-\uff20\uff3b-\uff3e\uff40\uff5b-\uff65\uffbf-\uffc1\uffc8-\uffc9\uffd0-\uffd1\uffd8-\uffd9\uffdd-\uffff]/.test(transStrRes.slice(objIndexerPos + activeIndexerStr.length)) // Symbol['iterator']in Object() -×-> Symbol.iterator.in Object()
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
							let activeRegExpStr = transStrRes.slice(lastRegExpPos).match(/\/S*\//)[0];
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
		}

		return statement;
	});
}
jsStatementsArr = decryptFormat(jsStatementsArr);
fs.writeFileSync("DecryptResult5.js", jsStatementsArr.join("\n"));

logger.logWithoutProgress("格式化代码");
function findAndFormatCodeBlock(jsStr, needSplit = true, isRoot = true) {
	if (Array.isArray(jsStr)) {
		let jsArr = jsStr.map(function (jsPartStr, progress) {
			logger.logWithProgress("格式化代码", progress, jsStr.length);
			return findAndFormatCodeBlock(jsPartStr, needSplit, isRoot);
		});
		logger.logWithProgress("格式化代码", 1, 1);
		return jsArr;
	}
	let transLayerRes = transLayer(jsStr);
	let searchRegexp = /[{(\[]Q+[\])}]/g, searchRes;
	while (searchRes = searchRegexp.exec(transLayerRes)) {
		let startPos = searchRes.index + 1, endPos = startPos + searchRes[0].length - 2;
		let formatRes = findAndFormatCodeBlock(jsStr.slice(startPos, endPos), searchRes[0][0] === '{', false);
		jsStr = jsStr.replaceWithStr(startPos, endPos, formatRes);
		transLayerRes = transLayerRes.replaceWithStr(startPos, endPos, formatRes);
		searchRegexp.lastIndex = startPos + formatRes.length + 1;
	}
	if (needSplit) {
		let splitStatementsRes = splitStatements(jsStr);
		switch (splitStatementsRes.type) {
			case "EMPTY":
				break;
			case "COMMON":
				if (!isRoot) {
					jsStr = ("\n" + splitStatementsRes.join('\n')).replace(/\n/g, "\n\t") + "\n";
				}
				break;
			case "OBJECT":
				break;
			case "SWITCH_CASE":
				for (let index = 0; index < splitStatementsRes.length; index++) {
					let jsStr = splitStatementsRes[index];
					if (/^(?:case[!"'(+\-.\[{~ ]|default:)/.test(jsStr)) {
						if (splitStatementsRes[index + 1]?.[0] === '{') {
							jsStr += '{';
							splitStatementsRes[index + 1] = splitStatementsRes[index + 1].slice(2, -2).replace(/(\t*)\t/g, "$1");
							splitStatementsRes.splice(index + 2, 0, '}');
						}
						splitStatementsRes[index] = jsStr;
					} else if (jsStr !== '}') {
						splitStatementsRes[index] = "\t" + jsStr.replace(/\n/g, "\n\t");
					}
				}
				jsStr = ("\n" + splitStatementsRes.join('\n')).replace(/\n/g, "\n\t") + "\n";
				break;
		}
	}
	return jsStr;
}
jsStatementsArr = findAndFormatCodeBlock(jsStatementsArr);
fs.writeFileSync("DecryptResult6.js", jsStatementsArr.join("\n"));

const END_TIMESTAMP = Date.now();

logger.logWithoutProgress(`解密完成！
耗时：${END_TIMESTAMP - START_TIMESTAMP - PAUSE_TIME}ms`);