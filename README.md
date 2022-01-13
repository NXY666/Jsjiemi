# Jsjiemi

* **简易的** `JavaScript` 解密工具。
* **完全** 使用 NodeJs 开发。
* **未引用** 第三方模块，轻便快捷。

## 解密效果

* 源码：
    ```javascript
    function closeSubPage() {
        $("#errorflowTip").hide();
        hideAllTitleImg();
        window.parent.document.getElementById("tipframe").style.display = 'none';
        window.parent.document.getElementById("divPop").style.display = 'none';
        window.parent.document.getElementById("divTupian").style.display = 'none';
        window.parent.document.getElementById("divTupian3").style.display = 'none';
        window.parent.document.getElementById("divMask").style.display = 'none';
        window.parent.document.getElementById("divPop_package").style.display = 'none';
        window.parent.document.getElementById("divTupian_package").style.display = 'none';
        window.parent.document.getElementById("divTupian3_package").style.display = 'none';
        var url = "interface/GKD/blank_hk.html";
        if (document.getElementById("subPageUrl_chongzhi")) {
            document.getElementById("subPageUrl_chongzhi").src = url;
        }
        var userIndex = getQueryStringByName("userIndex");
        AuthInterFace.freshOnlineUserInfo(userIndex, function (freshOnline) {
            getTime = 1;
            fillData();
        });
    }
    ```
* 加密后（为了方便对比已进行格式化处理）：
    ```javascript
    function closeSubPage() {
        var _0x44e423 = {
            'hEPha': function (_0x33d5a8, _0x51c65b) {
                return _0x33d5a8(_0x51c65b);
            },
            'pVRGQ': _0x64f0('b', '3)z2'),
            'nOOib': function (_0x4c2b42, _0x159ddf) {
                return _0x4c2b42 !== _0x159ddf;
            },
            'bSway': _0x64f0('c', 'HmCh'),
            'znLcq': function (_0x1b7898) {
                return _0x1b7898();
            },
            'DXLaD': function (_0x573ea8, _0x502818) {
                return _0x573ea8(_0x502818);
            },
            'kyVlL': _0x64f0('d', 'NMy2'),
            'dGnnc': _0x64f0('e', 'FBUA'),
            'xbeZc': 'none',
            'GwDrJ': 'divPop',
            'eeYpK': _0x64f0('f', 'cM)m'),
            'MzNnY': _0x64f0('10', 'Zg5['),
            'sfeFu': _0x64f0('11', '*E$X'),
            'ERCki': 'interface/GKD/blank_hk.html',
            'VtPds': _0x64f0('12', 'tkAR'),
            'VtRBc': function (_0x649db8, _0x52c1f1) {
                return _0x649db8(_0x52c1f1);
            }
        };
        _0x44e423[_0x64f0('13', 'cM)m')]($, _0x44e423['kyVlL'])['hide']();
        _0x44e423['znLcq'](hideAllTitleImg);
        window[_0x64f0('14', '3Pmi')][_0x64f0('15', '7#T0')][_0x64f0('16', '[qqS')](_0x44e423[_0x64f0('17', 'm*Jj')])[_0x64f0('18', '1kNS')][_0x64f0('19', 'o9K@')] = _0x44e423[_0x64f0('1a', 'NMy2')];
        window[_0x64f0('1b', 'JtD4')][_0x64f0('1c', 'ZOwg')]['getElementById'](_0x44e423[_0x64f0('1d', ')rYM')])[_0x64f0('1e', 'Zg5[')]['display'] = _0x44e423[_0x64f0('1f', '*6xD')];
        window[_0x64f0('20', 'FBUA')][_0x64f0('21', 'tkAR')][_0x64f0('22', 'z1V4')](_0x64f0('23', '1kNS'))['style'][_0x64f0('24', 'G%jM')] = 'none';
        window['parent'][_0x64f0('25', 'G%jM')]['getElementById'](_0x44e423[_0x64f0('26', 'ZOwg')])[_0x64f0('27', 'tkAR')][_0x64f0('28', 'xViR')] = _0x44e423[_0x64f0('29', 'gS57')];
        window[_0x64f0('2a', 'hSvn')]['document'][_0x64f0('2b', 'F[EM')](_0x44e423['MzNnY'])[_0x64f0('2c', '4Ats')][_0x64f0('2d', 'OJFQ')] = _0x44e423[_0x64f0('2e', 'xViR')];
        window[_0x64f0('2f', '7#T0')]['document'][_0x64f0('30', 'A4bS')]('divPop_package')[_0x64f0('31', '8Vu)')]['display'] = _0x44e423[_0x64f0('32', 'JtD4')];
        window['parent']['document'][_0x64f0('33', 't7O$')](_0x44e423[_0x64f0('34', 'hY8M')])[_0x64f0('35', '7#T0')][_0x64f0('36', 'fv0b')] = _0x44e423[_0x64f0('37', 'EgB!')];
        window[_0x64f0('38', 'gS57')][_0x64f0('39', 'F[EM')]['getElementById'](_0x64f0('3a', '*E$X'))[_0x64f0('3b', 'kUYz')][_0x64f0('3c', '1kNS')] = _0x44e423['xbeZc'];
        var _0x5995f3 = _0x44e423[_0x64f0('3d', ')rYM')];
        if (document[_0x64f0('3e', 'JtD4')](_0x44e423['VtPds'])) {
            document[_0x64f0('3f', 'y@FJ')](_0x64f0('40', '*E$X'))[_0x64f0('41', 'gS57')] = _0x5995f3;
        }
        var _0x5e2498 = _0x44e423[_0x64f0('42', 'gS57')](getQueryStringByName, _0x64f0('43', 'tkAR'));
        AuthInterFace[_0x64f0('44', ')rYM')](_0x5e2498, function (_0x267bf4) {
            if (_0x44e423['nOOib'](_0x44e423['bSway'], _0x64f0('45', 'a5h*'))) {
                _0x44e423['hEPha']($, _0x44e423['pVRGQ'])[_0x64f0('46', 'G%jM')]();
                autoLogin = ![];
            } else {
                getTime = 0x1;
                _0x44e423[_0x64f0('47', 'Zg5[')](fillData);
            }
        });
    }
    ```
* 解密后（为了方便对比已进行格式化处理）：
    ```javascript
    function closeSubPage() {
        $('#errorflowTip').hide();
        hideAllTitleImg();
        window.parent.document.getElementById('tipframe').style.display = 'none';
        window.parent.document.getElementById('divPop').style.display = 'none';
        window.parent.document.getElementById('divTupian').style.display = 'none';
        window.parent.document.getElementById('divTupian3').style.display = 'none';
        window.parent.document.getElementById('divMask').style.display = 'none';
        window.parent.document.getElementById('divPop_package').style.display = 'none';
        window.parent.document.getElementById('divTupian_package').style.display = 'none';
        window.parent.document.getElementById('divTupian3_package').style.display = 'none';
        var _0x5995f3 = 'interface/GKD/blank_hk.html';
        if (document.getElementById('subPageUrl_chongzhi')) {
            document.getElementById('subPageUrl_chongzhi').src = _0x5995f3;
        }
        var _0x5e2498 = getQueryStringByName('userIndex');
        AuthInterFace.freshOnlineUserInfo(_0x5e2498, function (_0x267bf4) {
            getTime = 1;
            fillData();
        });
    }
    ```

## 使用须知

* 解密文件中**必须**有且仅有通过JS加密器加密的内容，且**不允许格式化**，否则将解密失败。
* 仅支持使用 AutoJs配置 模式加密的JS文件。
* 解密器会使用vm（虚拟机）执行JS中的部分代码（在一般情况下，它会被用来执行JS加密器生成的解密函数）。
* 如果该JS**过于复杂**或**使用了(我)不常用的语法**，可能导致解密失败，如遇到此类情况欢迎提出。

## 使用方法

1. 在 [Decrypt.js](https://github.com/NXY666/Jsjiemi/blob/master/Decrypt.js) 的常量 FILE_NAME 中填写需解密的脚本路径。
2. 运行 [Decrypt.js](https://github.com/NXY666/Jsjiemi/blob/master/Decrypt.js) 。

## 输出结果

> 每一解密步骤完成后，解密器都会输出一个结果文件。

> 您可以根据您的**需求**从以下版本中选择一个作为最终解密结果。

* DecryptResult1.js：去除全局加密
* DecryptResult2.js：去除代码块加密
* DecryptResult3.js：去除 if...else 和 switch.case 死代码
* DecryptResult4.js：提升代码可读性(16进制数字转换为10进制数字、“\['XXX'\]”转换为“.XXX”)
