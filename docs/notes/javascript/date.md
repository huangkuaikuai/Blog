# 别再使用Date.now()计算时间差
假如某天你乘坐飞机从一个时区飞往另一个时区，你是否会根据两个机场各自的“挂钟”来计算你的飞行时间呢？如果你的回答是“不”，那么接下来我会用一个有趣的实验来告诉你，为什么在写代码的时候最好也不要这样做。

> 原文地址：[https://blog.insiderattack.net/how-not-to-measure-time-in-programming-11089d546180](https://blog.insiderattack.net/how-not-to-measure-time-in-programming-11089d546180)

> 作者：[Deepal Jayasekara](https://deepal.io/?source=post_page-----11089d546180--------------------------------)

## 时钟，时间和时间测量
我见过无数开发者（包括我自己）使用**日期时间函数（date-time function）**测量时间差。这些函数使用所谓的**按日计时时钟（注：英文是time-of-day clock，单看这个词理解起来可能有点绕，不过大意是指我们生活中的时钟计时方式，即以24小时为周期刷新）**，在JS里通常是`Date.now()`或者是Date构造函数。在开发时，我们一般会调用`Date.now()`去计算时间差：
```javascript
const start = Date.now();
doSomething();
const end = Date.now();
const durationMs = end - start;
```
看起来上面这段代码没什么问题，但实际上并不是这样。在开始我们的实验之前，我需要先科普几点，即时间是如何被测量的，在操作系统中具体又是怎样做的：

- 每个计算机上的时钟运行速度并不是完全一致，有些时钟的运行速度可能相对更快或更慢，最终可能会相互偏离（就像家里的挂钟一样）。
- 而**“时钟偏离”**在分布式系统中会导致各种各样的问题。
- **网络时间协议**（Network Time Protocol，NTP）就是用于解决时钟偏离问题的一种网络协议，它会让计算机的时钟与具有准确时间的“时间服务器”的时钟保持同步。
- NTP客户端一般由操作系统提供，定期从配置的时间服务器接收准确时间。如果NTP客户端发现本地时间和时间服务器的时间产生了偏差，那么它可能会根据偏差的大小对本地系统的时钟进行**校正**。
- 这种**时间校正**可能会导致系统时钟突然向前或向后移动。
- 而那些使用了时间时钟的函数就会被时间校正所影响，例如JS里的Date.now()，以当前系统时间作为返回值。

现在你可能理解了为什么我说上面那段代码不好使了，下面我会用具体的例子来让你明白背后的原因。

## 实验1：使用日期时间函数测量时间差
在这个实验里，我们将测量运行`doSomething()`所花费的时间。在开始前，我故意设置了一个假时间（会比真实时间快一分钟），并在执行`doSomething()`时使用NTP对时间进行调整，从而模拟NTP的时间校正。代码如下：
> 完整的实现代码会贴在文章末尾。此示例依赖了一些macOS shell的一些命令和工具函数，因此仅适用于macOS，但也可以自行修改一下放在Linux上跑。

```javascript
setFakeTime(); // set time to 1 min ahead of actual time

const startTimeToD = Date.now(); // set startTime with time-of-day clock

setImmediate(() => {
  correctTimeNTP(); // synchronise the clock
});

await doSomething();

const endTimeToD = Date.now(); // set endTime with time-of-day clock
const durationToD = endTimeToD - startTimeToD;

console.log(`Duration measured by time-of-day clock\t: ${durationToD}ms`);
```

- `setFakeTime()`会将系统时间调整到实际时间的后一分钟。这个方法里使用了macOS的`date`命令。
- `correctTimeNTP()`使用了macOS的`sntp`命令（NTP客户端提供）来和时间服务器`time.apple.com`的时间进行同步，实现时间校正。
- `doSomething()`这个函数会执行一个时间花费大约为2000ms的任务，其实就是用`setTimeout()`做个延时。

如果你运行上面这段代码，它将使用`Date.now()`测量`doSomething()`所用的时间，并将其打印出来。然而出人意料的是，我们得到的是一个负值，这显然不是我们所期望的结果。<br />![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/23256592/1667067708103-29f4f5a4-a8d7-4436-b6e6-803423dcd0ca.png#clientId=u7473932f-2894-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=uea0280b3&margin=%5Bobject%20Object%5D&name=image.png&originHeight=179&originWidth=1400&originalType=binary&ratio=1&rotation=0&showTitle=false&size=32540&status=done&style=none&taskId=ueb73591d-de8e-4652-8607-3951c92b196&title=&width=700)<br />其背后的原因是NTP客户端对时钟进行了校正（往前调了1分钟），因此`endTimeToD`比`startTimeToD`的时间要早。尽管这个例子是模拟的，但在现实生活中，我们也经常因为各种各样的原因遇到类似的情况，比如时间服务器因为某些原因导致传输的时间不准确、NTP客户端对系统时间进行了校正、人工修改了系统时间等等。但更重要的问题是，我们应该怎样做来避免得到一个负值。实际上，我们只需要**将按日计时时钟函数替换为单调时钟函数**。
<a name="m9kVe"></a>
## 实验2：使用单调时钟函数测量时间差
**单调时钟**是简单的计数器，它从过去的任意时间点开始，并以与系统时钟相同的速度移动。由于这只是一个计数器，因此在给定时间点读取的单调时间戳本身没有任何意义，但是单调时钟不受NTP校正的影响。因此，计算在两个不同时间点读取的两个单调时间戳之间的差值将得到两个点之间的准确持续时间。<br />通常每个编程语言都会提供单调时钟和时间时钟。在Node.js里，使用单调时钟的函数有：

- `process.hrtime.bigint()`(在老版本中用的是`process.hrtime`)
- `require('perf_hooks').performance.now()`

接下来我们在实验里用`require('perf_hooks').performance.now()`替换`Date.now()`。你也可以自己尝试一下使用`process.hrtime.bigint()`的效果如何。
```javascript
const { performance } = require("perf_hooks")

setFakeTime();

const startTimeMon = performance.now(); // set startTime with monotonic clock

setImmediate(() => {
  correctTimeNTP(); // synchronise the clock
});
await doSomething();

const endTimeMon = performance.now(); // set endTime with monotonic clock
const durationMon = endTimeMon - startTimeMon;

console.log(`Duration measured by monotonic clock\t: ${durationMon}ms`);
```
运行上面这段代码得到的输出结果如下：<br />![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/23256592/1667749424499-8dc8b533-0a7e-4fa0-b407-0fe8cfc32d65.png#clientId=u7473932f-2894-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=90&id=u0789c390&margin=%5Bobject%20Object%5D&name=image.png&originHeight=179&originWidth=1400&originalType=binary&ratio=1&rotation=0&showTitle=false&size=40341&status=done&style=none&taskId=ud4bb19ea-a56c-4ba8-b783-82e17982439&title=&width=700)<br />如上图所示，在使用单调时间以后，我们得到了正确的时间差。
> 没有得到准确的 2000 毫秒的原因是，setTimeout 受制于某些事件循环机制，作者在在[这篇文章](https://blog.insiderattack.net/timers-immediates-and-process-nexttick-nodejs-event-loop-part-2-2c53fd511bb3)中有解释。

现在让我们尝试在一个脚本中运行两个实验，以比较和测量第一个实验的误差。

## 实验3：对比实验
在这个实验中，我们同时运行实验1和实验2的代码，除此之外，我们还做以下记录：

- 在`setFakeTime()`函数内执行的`sntp`命令的输出
- 使用`Date.now()`计算的持续时间的误差

实验3的代码如下：
```javascript
setFakeTime();

const startTimeToD = Date.now(); // set startTime with time-of-day clock
const startTimeMon = performance.now(); // set startTime with monotonic clock

setImmediate(() => {
  correctTimeNTP(); // synchronise the clock
});
await doSomething();

const endTimeToD = Date.now(); // set endTime with time-of-day clock
const endTimeMon = performance.now(); // set endTime with monotonic clock
const durationToD = endTimeToD - startTimeToD;
const durationMon = endTimeMon - startTimeMon;
const error = (durationToD - durationMon) / 1000;

console.log(`Duration measured by time-of-day clock\t: ${durationToD}ms`);
console.log(`Duration measured by monotonic clock\t: ${durationMon}ms`);
console.log(`Error: ${error.toFixed(3)}s`);
```
运行以上代码后，我们得到以下结果：<br />![image.png](https://intranetproxy.alipay.com/skylark/lark/0/2022/png/23256592/1667750562851-0918d1c9-a8a1-46e7-9e4c-2f6dc9dab26f.png#clientId=u7473932f-2894-4&crop=0&crop=0&crop=1&crop=1&from=paste&height=172&id=ua1e1f46c&margin=%5Bobject%20Object%5D&name=image.png&originHeight=344&originWidth=1400&originalType=binary&ratio=1&rotation=0&showTitle=false&size=110554&status=done&style=none&taskId=u88d6b16f-8b54-40d5-a7a7-338148c0395&title=&width=700)<br />从上图中，我们可以清楚地看到两种方法测量的持续时间之间的差异。如果忽略精度差异，使用`Date.now()`(-54.053s)测量的持续时间的“误差”几乎与NTP客户端校正的数字（-54.053600s）相同。这说明使用按日计时时钟测量的持续时间会受到NTP校正的影响。
> _Node.js的setTimeout()和setInterval()不会受到NTP时间校正的影响吗？_
> Node.js事件循环使用uv__hrtime来测量循环时间，使用的是单调时钟，因此setTimeout和setInterval函数不受NTP时间校正的影响。

## 总结和建议
在现实场景中，出于监控和记录的目的，我们经常会测量时间差。然而使用不恰当的函数得到的结果往往是不准确的，就像本文实验模拟的那样。对于计算时间差这类场景，我们应该尽可能使用单调时钟函数。从另一方面来说，`performance.now()`返回值的精度也更高。最后，作者给出了实验的完整代码：
```javascript
const { execSync } = require("child_process");
const { setTimeout } = require("timers/promises");
const { performance } = require("perf_hooks")

function setFakeTime() {
  const toTwoDigits = (num) => num.toString().padStart(2, "0");
  const now = new Date();
  const month = toTwoDigits(now.getMonth() + 1);
  const date = toTwoDigits(now.getDate());
  const hours = toTwoDigits(now.getHours());
  const fakeMinutes = toTwoDigits(now.getMinutes() + 1); // set minutes to 1 min ahead of actual time
  const year = now.getFullYear().toString().substring(2, 4);

  // set fake time
  execSync(`date -u ${month}${date}${hours}${fakeMinutes}${year}`);
}

function correctTimeNTP() {
  const output = execSync(`sntp -sS time.apple.com`);
  console.log(`Time corrected: ${output}`);
}

const doSomething = () => setTimeout(2000);

(async () => {
  setFakeTime();

  const startTimeToD = Date.now(); // set startTime with time-of-day clock
  const startTimeMon = performance.now(); // set startTime with monotonic clock

  setImmediate(() => {
    correctTimeNTP(); // synchronise the clock
  });
  await doSomething();

  const endTimeToD = Date.now(); // set endTime with time-of-day clock
  const endTimeMon = performance.now(); // set endTime with monotonic clock
  const durationToD = endTimeToD - startTimeToD;
  const durationMon = endTimeMon - startTimeMon;
  const error = (durationToD - durationMon) / 1000;

  console.log(`Duration measured by time-of-day clock\t: ${durationToD}ms`);
  console.log(`Duration measured by monotonic clock\t: ${durationMon}ms`);
  console.log(`Error: ${error.toFixed(3)}s`);
})();
```
注意：sntp命令和date命令都需要权限，运行脚本的时候别忘了加上sudo

