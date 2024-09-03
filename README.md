# senseurl

`senseurl`是一个使用原生JavaScript开发的前端项目，利用Vite作为构建工具，旨在提供快速开发和构建的体验。

## 开始之前

确保你的开发环境中已经安装了Node.js，Vite和Git，这是运行和构建该项目所必需的。

## 安装 Node.js

访问[Node.js官网](https://nodejs.org/)下载并安装Node.js。安装完成后，你可以通过打开命令行或终端运行以下命令来验证安装：

```bash
node --version
npm --version
```

如果这些命令返回了版本号，那么Node.js和npm（Node.js的包管理器）已成功安装。

## 安装 Vite

使用npm全局安装Vite。打开你的命令行或终端，运行以下命令：

```bash
npm install -g vite
```
这将允许你在任何地方通过命令行使用Vite。

## 安装 Git
访问[Git官网](https://git-scm.com/downloads)下载并安装Git。验证安装：

```bash
git --version
```

## 克隆本项目
1. 打开命令行或终端。
2. 运行以下命令来克隆本项目：
```bash
git clone https://github.com/orwithout/senseurl.git
# 使用Vite初始化名为`senseurl`的vanilla项目方法（仅供参考）：
# npm create vite@latest senseurl -- --template vanilla
```


3. 进入项目目录：

```bash
cd senseurl
```

4. 安装项目依赖：

```bash
npm install
```

## 运行项目

在项目目录中，使用以下命令启动开发服务器：

```bash
npm run dev
```

这将启动一个本地开发服务器并打开浏览器窗口加载你的项目。现在，你可以开始开发你的应用了！

## 构建项目

为了构建生产版本的应用，请运行：

```bash
npm run build
```

Vite将构建项目并将输出文件放在`dist`目录中。
