```example
模板新增格式：第一行是name，后面代码块包裹的内容会填充到模板中。
```
name:`默认`
```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" />
```
name:`5位时间srcid写法（08:08）`
```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#minute%10" />
```
name:`5位时间srcExp写法（08:08）`
```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'" 					   x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour3)+'.png'" x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_hour4)+'.png'" x="{x[4]}" y="{y[4]}" />
```
name:`6位日期srcid写法（03/21星期六）`
```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="(#month+1)/10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="(#month+1)%10"	/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#date/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#date%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#day_of_week" />
```
name:`6位日期srcExp写法（03/21星期六）`
```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq1)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq2)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'"				         x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq3)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_rq4)+'.png'"     x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}_'+int(#day_of_week)+'.png'" x="{x[5]}" y="{y[5]}" />
```

name:`4位时间srcid写法（0808）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#minute/10" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute%10" />
```

name:`4位时间srcExp写法（0808）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}_'+int(#cur_hour3)+'.png'" x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour4)+'.png'" x="{x[3]}" y="{y[3]}" />
```

name:`7位日期srcid写法（03月21日星期六）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="(#month+1)/10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="(#month+1)%10"	/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#date/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#date%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" />
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#day_of_week" />
```

name:`7位日期srcExp写法（03月21日星期六）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq1)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq2)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'"				         x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq3)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_rq4)+'.png'"     x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}.png'"				         x="{x[5]}" y="{y[5]}" />
<Image srcExp="'{path[6]}{acname[6]}_'+int(#day_of_week)+'.png'" x="{x[6]}" y="{y[6]}" />
```

name:`10位日期srcid写法（2026/03/21）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="#year/1000%10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#year/100%10"	/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#year/10%10"	/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#year/1%10"	/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="(#month+1)/10"	/>
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="(#month+1)%10"	/>
<Image src="{path[7]}{acname[7]}.png" x="{x[7]}" y="{y[7]}" />
<Image src="{path[8]}{acname[8]}.png" x="{x[8]}" y="{y[8]}" srcid="#date/10" />
<Image src="{path[9]}{acname[9]}.png" x="{x[9]}" y="{y[9]}" srcid="#date%10" />
```

name:`10位日期srcExp写法（2026/03/21）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq5)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq6)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}_'+int(#cur_rq7)+'.png'"     x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq8)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}.png'"				         x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}_'+int(#cur_rq1)+'.png'"     x="{x[5]}" y="{y[5]}" />
<Image srcExp="'{path[6]}{acname[6]}_'+int(#cur_rq2)+'.png'"     x="{x[6]}" y="{y[6]}" />
<Image srcExp="'{path[7]}{acname[7]}.png'"				         x="{x[7]}" y="{y[7]}" />
<Image srcExp="'{path[8]}{acname[8]}_'+int(#cur_rq3)+'.png'"     x="{x[8]}" y="{y[8]}" />
<Image srcExp="'{path[9]}{acname[9]}_'+int(#cur_rq4)+'.png'"     x="{x[9]}" y="{y[9]}" />
```

name:`6华为农历（农历闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png"	/>
<Image x="{x[1]}" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[2]}-{gapX[2]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[3]}-{gapX[2]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png"	/>
<Image x="{x[4]}-{gapX[2]}*eq(#run,0)" y="{y[4]}" src="{path[4]}{acname[4]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[5]}-{gapX[2]}*eq(#run,0)" y="{y[5]}" src="{path[5]}{acname[5]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

name:`5华为农历（闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[1]}-{gapX[1]}*eq(#run,0)" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[2]}-{gapX[1]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png"	/>
<Image x="{x[3]}-{gapX[1]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[4]}-{gapX[1]}*eq(#run,0)" y="{y[4]}" src="{path[4]}{acname[4]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

name:`4华为农历（闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[1]}-{gapX[1]}*eq(#run,0)" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[2]}-{gapX[1]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[3]}-{gapX[1]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

name:`电量进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}-{-gapX[2]}+ifelse(eq(#battery_state,1)+eq(#battery_state,3),{-gapX[2]}*(#loop/2000%1),{-gapX[2]}*0.01*#battery_level)" y="{y[1]}" align="absolute" hybridMode="6"/>
</Image>
```

name:`条形进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}-{-gapX[2]}+{-gapX[2]}*0.01*max(#jrsy_bfb,3)*ne(#jrsy_bfb,0)" y="{y[1]}" align="absolute" hybridMode="6"/>
</Image>
```

