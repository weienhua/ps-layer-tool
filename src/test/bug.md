这里是现在xml模板生成的bug

1、百分比
面板生成代码：
```xml
<!-- 变量: #battery_level, 对齐: 水平左 垂直上 -->
<Image x="725-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/100%10" visibility="ge(#battery_level,100)"/>
<Image x="743-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/10%10" visibility="ge(#battery_level,10)"/>
<Image x="761-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/1%10" visibility="ge(#battery_level,0)"/>
<Image x="779-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz_c.png"/>

```
正确代码：
```xml
<!-- 变量: #battery_level, 对齐: 水平左 垂直上 -->
<Image x="725-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/100%10" visibility="ge(#battery_level,100)"/>
<Image x="743-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/10%10" visibility="ge(#battery_level,10)"/>
<Image x="761-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz.png" srcid="#battery_level/1%10" visibility="ge(#battery_level,0)"/>
<Image x="779-18*1*lt(#battery_level,100)-18*1*lt(#battery_level,10)" y="1484-0*1*lt(#battery_level,100)-0*1*lt(#battery_level,10)" src="1/day/wd/bfb/sz_c.png"/>

```
按照正确代码的样式输出,
- `18*1*lt(#battery_level,100)`里面需要修改`18`，即百位和十位之间的x轴间距。`1`是水平左对齐方式。
- `18*1*lt(#battery_level,10)`里面需要修改`18`，即十位和个位之间的x轴间距。`1`是水平左对齐方式。
- `0*1*lt(#battery_level,100)`里面需要修改`0`，即百位和十位之间的y轴间距。`1`是垂直上对齐方式。
- `0*1*lt(#battery_level,10)`里面需要修改`0`，即十位和个位之间的y轴间距。`1`是垂直上对齐方式
- 水平对齐方式左中右对应`1` `0.5` `0`
- 垂直对齐方式上中下对应`1` `0.5` `0`

2、温度
面板生成代码：
```xml
<!-- 变量: #weatherTemp, 对齐: 水平左 垂直上 -->
<Image x="727+21*0*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1429+4*0*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz_f.png" visibility="lt(#weatherTemp,0)"/>
<Image x="746-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1431-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz.png" srcid="abs(#weatherTemp)/10%10" visibility="ge(abs(#weatherTemp),10)"/>
<Image x="767-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1435-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz.png" srcid="abs(#weatherTemp)/1%10"/>
<Image x="795-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1442-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz_c.png"/>

```
正确代码：
```xml
<!-- 变量: #weatherTemp, 对齐: 水平左 垂直上 -->
<Image x="727+21*0*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1429+4*0*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz_f.png" visibility="lt(#weatherTemp,0)"/>
<Image x="746-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1431-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz.png" srcid="abs(#weatherTemp)/10%10" visibility="ge(abs(#weatherTemp),10)"/>
<Image x="767-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1435-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz.png" srcid="abs(#weatherTemp)/1%10"/>
<Image x="795-21*1*lt(abs(#weatherTemp),10)-19*1*ge(#weatherTemp,0)" y="1442-4*1*lt(abs(#weatherTemp),10)-2*1*ge(#weatherTemp,0)" src="1/day/wd/wd/sz_c.png"/>

```
按照正确代码的样式输出，这里温度负号和数字之间有点区别。
- 第一行是温度的负号，`21*0*lt(abs(#weatherTemp),10)`里面需要修改`21`，即温度十位和个位之间的x轴间距。`0`是水平左对齐方式。
- 后面三行是温度数字和符号，`21*1*lt(abs(#weatherTemp),10)`里面需要修改`21`，即温度十位和个位之间的x轴间距。`1`是水平左对齐方式。
- `19*1*ge(#weatherTemp,0)`里面需要修改`19`，即温度负号和十位之间的x轴间距。`1`是水平左对齐方式。
- 第一行是温度的负号，`4*0*lt(abs(#weatherTemp),10)`里面需要修改第一个`4`，即温度十位和个位之间的y轴间距。第二个`0`是水平左对齐方式。
- 后面三行是温度数字和符号，`4*1*lt(abs(#weatherTemp),10)`里面需要修改`4`，即温度十位和个位之间的y轴间距。`1`是水平左对齐方式。
- `2*1*ge(#weatherTemp,0)`里面需要修改`2`，即温度负号和十位之间的x轴间距。`1`是水平左对齐方式。
- 第一行温度负号`lt(abs(#weatherTemp),10)`情况的水平对齐方式左中右对应`0` `0.5` `1`
- 第一行温度负号`ge(#weatherTemp,0)`情况的水平对齐方式左中右对应`1` `0.5` `0`
- 第一行温度负号`lt(abs(#weatherTemp),10)`情况的垂直对齐方式左中右对应`0` `0.5` `1`
- 第一行温度负号`ge(#weatherTemp,0)`情况的垂直对齐方式左中右对应`1` `0.5` `0`
- 后面三行`lt(abs(#weatherTemp),10)`情况的垂直对齐方式左中右对应`1` `0.5` `0`
- 后面三行`ge(#weatherTemp,0)`情况的垂直对齐方式左中右对应`1` `0.5` `0`

3、步数
面板生成代码：
```xml
<!-- 变量: #steps_value, 对齐: 水平左 垂直上 -->
<Image x="722-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1514-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/10000%10" visibility="ge(#steps_value,10000)"/>
<Image x="742-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1517-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/1000%10" visibility="ge(#steps_value,1000)"/>
<Image x="764-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1526-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/100%10" visibility="ge(#steps_value,100)"/>
<Image x="781-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1564-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/10%10" visibility="ge(#steps_value,10)"/>
<Image x="811-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1585-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/1%10" visibility="ge(#steps_value,0)"/>

```
正确代码：
```xml
<!-- 变量: #steps_value, 对齐: 水平左 垂直上 -->
<Image x="722-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1514-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/10000%10" visibility="ge(#steps_value,10000)"/>
<Image x="742-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1517-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/1000%10" visibility="ge(#steps_value,1000)"/>
<Image x="764-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1526-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/100%10" visibility="ge(#steps_value,100)"/>
<Image x="781-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1564-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/10%10" visibility="ge(#steps_value,10)"/>
<Image x="811-20*1*lt(#steps_value,10000)-22*1*lt(#steps_value,1000)-17*1*lt(#steps_value,100)-30*1*lt(#steps_value,10)" y="1585-3*1*lt(#steps_value,10000)-9*1*lt(#steps_value,1000)-38*1*lt(#steps_value,100)-21*1*lt(#steps_value,10)" src="1/day/wd/bs/sz.png" srcid="#steps_value/1%10" visibility="ge(#steps_value,0)"/>

```
按照正确代码的样式输出，
- `20*1*lt(#steps_value,10000)`里面需要修改`20`，即万位和千位之间的x轴间距。`1`是水平左对齐方式。
- `22*1*lt(#steps_value,1000)`里面需要修改`22`，即千位和百位之间的x轴间距。`1`是水平左对齐方式。
- `17*1*lt(#steps_value,100)`里面需要修改`17`，即百位和十位之间的x轴间距。`1`是水平左对齐方式。
- `30*1*lt(#steps_value,10)`里面需要修改`30`，即十位和个位之间的x轴间距。`1`是水平左对齐方式。
- `3*1*lt(#steps_value,10000)`里面需要修改`3`，即万位和千位之间的y轴间距。`1`是垂直上对齐方式
- `9*1*lt(#steps_value,1000)`里面需要修改`9`，即千位和百位之间的y轴间距。`1`是垂直上对齐方式
- `38*1*lt(#steps_value,100)`里面需要修改`38`，即百位和十位之间的y轴间距。`1`是垂直上对齐方式
- `21*1*lt(#steps_value,10)`里面需要修改`21`，即十位和个位之间的y轴间距。`1`是垂直上对齐方式
- 水平对齐方式左中右对应`1` `0.5` `0`
- 垂直对齐方式上中下对应`1` `0.5` `0`

需要保证输出代码对应三个样式统一。