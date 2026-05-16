```example
模板新增格式：第一行是name，后面代码块包裹的内容会填充到模板中。
```
name:`默认`
```
<Image src="{path[0]}{name[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{name[1]}.png" x="{x[1]}" y="{y[1]}" />
```
name:`5位时间srcid写法（08:08）`
```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{name[2]}.png"   x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#minute%10" />
```
name:`5位时间srcExp写法（08:08）`
```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{name[2]}.png'" 					   x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour3)+'.png'" x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_hour4)+'.png'" x="{x[4]}" y="{y[4]}" />
```
name:`6位日期srcid写法（03/21星期六）`
```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="(#month+1)/10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="(#month+1)%10"	/>
<Image src="{path[2]}{name[2]}.png"	  x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#date/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#date%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#day_of_week" />
```
name:`6位日期srcExp写法（03/21星期六）`
```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq1)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq2)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{name[2]}.png'"				         x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq3)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_rq4)+'.png'"     x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}_'+int(#day_of_week)+'.png'" x="{x[5]}" y="{y[5]}" />
```