# JsjiamiV6解密工具
* **简易的** [JsjiamiV6](https://www.jsjiami.com/) 解密工具。
* **完全**使用 NodeJs 开发。
* **未引用**外部库，轻量快捷。

# 使用须知
* 解密文件中**必须**有且仅有通过JsjiamiV6加密的内容，且不允许格式化，否则将解密失败。
* 仅支持使用 AutoJs配置 模式加密的JS文件。
* 解密器会使用vm（虚拟机）执行JS中的部分代码（在一般情况下，它会被用来执行JsjiamiV6生成的解密函数）。
* 如果您的JS**过于复杂**或**使用了(我)不常用的语法**，可能导致解密失败，如遇到此类情况欢迎提出。

## 使用方法
1. 在 [DecryptV6.js](https://github.com/NXY666/JavaScriptV6Decryptor/blob/master/DecryptV6.js) 的常量 FILE_NAME 中填写需解密的脚本路径。
2. 运行该脚本。

## 输出结果
    每一解密步骤完成后，解密器都会输出一个结果文件。
* DecryptResult1.js：去除全局加密
* DecryptResult2.js：去除函数加密
* DecryptResult3.js：去除if-else死代码
* DecryptResult4.js：提升代码可读性(16进制数字转换为10进制数字、“\['XXX'\]”转换为“.XXX”).
