#  1. <a name='Intro'></a>Intro

First thing first, I ain't no programmer nor received any systematic programming training. One Java intro course in college, that's all I got.

So this code structure will be shitty, I'll tried to get it documented as good as possible, hope to save you some headache.

#  2. <a name='StructureandDesign'></a>Structure and Design

[See here](Structure&Design.md)

#  3. <a name='Tasksystem'></a>Task system

The idea behind the task design is super general. This game, screeps, is all about moving those so-called `resources` around. For example, `energies` been *`harvested`* from `source`, *`dropped`* to `containers` and then transported into `extensions` or being used on `upgradeController`.

Therefore, creeps are merely "movers". They take stuff (energies, minerals, etc)

因为这游戏本质是个搬运资源游戏
比如：
withdraw 能量 -> transfer spawn
withdraw 能量 -> upgrade controller
harvest 能量 -> transfer tower
etc.

如果用role的话以上每一种情况都得分别写role
用任务系统的话就可以按照creep的body去找某类action的任务
如WORK多的可去build/repair/upgrade，CARRY多的去给各类建筑物填充energy

#  4. <a name='AboutCreepsMilitarybehavior'></a>About Creeps' Military behavior

The fact is, no matter how smart an AI is, it'll always be dumber than the dumbest human, unless it is a deep-learning AI (let me know if anyone achieve this. Like issue their repo). Therefore, this code only implement basic defenses but leave those big-brain operations to user.

#  5. <a name='AGruntGuideforNon-coder'></a>A Grunt Guide for Non-coder

This code was not currently using grunt

##  5.1. <a name='Fullversion'></a>Full version

1. Install [NPM](https://www.npmjs.com/get-npm) on your pc/mac.
2. type `npm install -g grunt-cli` in cmd (Windows) or terminal (MacOS) to install grunt client. If MacOS return an error message saying things like `access denied`, use `sudo npm install -g grunt-cli` to force it. Since you used `sudo`, you'll need to type in your log-in password to confirm.
3. Guide your cmd/terminal to your scripts' root folder. If you don't know how, go search "how to change directory in CMD/Terminal" (choice one base on your operating system).
4. type `npm init`. This will create a package.json, which is essential for next few steps. It'll ask you a few questions about how you want to name it and other things. Read and type in what your desired or just press Enter a few time. A more detailed, official guide [here](https://gruntjs.com/getting-started#package.json).
5. If you now run `npm list -depth=0`, it should return a line, start with the name & version you gave in last step. And follow by a directory of your scripts folder. If so, you're good to go. If not, check your previous steps.
6. Type in `npm install grunt --save-dev` and then also type in all commands starts with `npm install...` in this [guide](https://docs.screeps.com/contributed/advanced_grunt.html).  And don't forget to save the [example file](https://docs.screeps.com/contributed/advanced_grunt.html#Full-Example) as `GruntFile.js` . My GruntFile is the same as this example but with some extra comments for non-coders.
7. type in [`grunt test`](https://docs.screeps.com/contributed/advanced_grunt.html#Beautify),then read the message it returns. If the message didn't say you **missing** something, then you're fine.
8. Finally, set up your [`.screeps.json`](https://docs.screeps.com/contributed/advanced_grunt.html#Secure-Credentials).
9. Be careful, safety is off. By "**pushing code**", you'll wipe out all your server scripts and replace it with the scripts in your local folder. If you're ready, type in `grunt screeps` to push your local code to the official server.

##  5.2. <a name='TLDRversion'></a>TL;DR version

Disclaimer: It's better if you know what you're doing.

1. type in below line-by-line:

```cmd
npm install -g grunt-cli
cd <your folder directory>
npm init
:: press enter a few times
npm install grunt --save-dev
npm install grunt-contrib-clean --save-dev
npm install grunt-contrib-copy --save-dev
npm install grunt-file-append --save-dev
npm install grunt-jsbeautifier --save-dev
npm install grunt-rsync --save-dev
npm install grunt-screeps --save-dev
npm install time-grunt --save-dev
```

1. Copy this [`GruntFile.js`](https://docs.screeps.com/contributed/advanced_grunt.html#Full-Example) and set up you own [`.screeps.json`](https://docs.screeps.com/contributed/advanced_grunt.html#Secure-Credentials)

2. Push your local scripts to Screeps server by typing in `grunt screeps` in your cmd/terminal.
