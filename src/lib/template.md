```example
模板新增格式：第一行是name，后面代码块包裹的内容会填充到模板中。
```
#### name:`默认`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" />
```
#### 时间

##### name:`5位时间srcid写法（08:08）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#minute%10" />
```
##### name:`5位时间srcExp写法（08:08）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'" 					   x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour3)+'.png'" x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_hour4)+'.png'" x="{x[4]}" y="{y[4]}" />
```
##### name:`6位日期srcid写法（03/21星期六）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="(#month+1)/10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="(#month+1)%10"	/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#date/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#date%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#day_of_week" />
```
##### name:`6位日期srcExp写法（03/21星期六）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq1)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq2)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'"				         x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq3)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_rq4)+'.png'"     x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}_'+int(#day_of_week)+'.png'" x="{x[5]}" y="{y[5]}" />
```

##### name:`4位时间srcid写法（0808）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#minute/10" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute%10" />
```

##### name:`4位时间srcExp写法（0808）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}_'+int(#cur_hour3)+'.png'" x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour4)+'.png'" x="{x[3]}" y="{y[3]}" />
```

##### name:`8位时间srcid写法（08:08:08）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#minute%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" />
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#second/10" />
<Image src="{path[7]}{acname[7]}.png" x="{x[7]}" y="{y[7]}" srcid="#second%10" />
```

##### name:`8位时间srcExp写法（08:08:08）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'" 					   x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour3)+'.png'" x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_hour4)+'.png'" x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}.png'" 					   x="{x[5]}" y="{y[5]}" />
<Image srcExp="'{path[6]}{acname[6]}_'+int(#cur_hour5)+'.png'" x="{x[6]}" y="{y[6]}" />
<Image srcExp="'{path[7]}{acname[7]}_'+int(#cur_hour6)+'.png'" x="{x[7]}" y="{y[7]}" />
```

##### name:`6位时间srcid写法（080808）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="ifelse(not(#apkg),#hour24/10,eq(#hour12,0),1,#hour12/10)" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="ifelse(not(#apkg),#hour24%10,eq(#hour12,0),2,#hour12%10)" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#minute/10" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#minute%10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#second/10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#second%10" />
```

##### name:`6位时间srcExp写法（080808）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_hour1)+'.png'" x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_hour2)+'.png'" x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}_'+int(#cur_hour3)+'.png'" x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_hour4)+'.png'" x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_hour5)+'.png'" x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}_'+int(#cur_hour6)+'.png'" x="{x[5]}" y="{y[5]}" />
```

#### 日期

##### name:`7位日期srcid写法（03月21日星期六）`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="(#month+1)/10"	/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="(#month+1)%10"	/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#date/10" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#date%10" />
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" />
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#day_of_week" />
```

##### name:`7位日期srcExp写法（03月21日星期六）`

```
<Image srcExp="'{path[0]}{acname[0]}_'+int(#cur_rq1)+'.png'"     x="{x[0]}" y="{y[0]}" />
<Image srcExp="'{path[1]}{acname[1]}_'+int(#cur_rq2)+'.png'"     x="{x[1]}" y="{y[1]}" />
<Image srcExp="'{path[2]}{acname[2]}.png'"				         x="{x[2]}" y="{y[2]}" />
<Image srcExp="'{path[3]}{acname[3]}_'+int(#cur_rq3)+'.png'"     x="{x[3]}" y="{y[3]}" />
<Image srcExp="'{path[4]}{acname[4]}_'+int(#cur_rq4)+'.png'"     x="{x[4]}" y="{y[4]}" />
<Image srcExp="'{path[5]}{acname[5]}.png'"				         x="{x[5]}" y="{y[5]}" />
<Image srcExp="'{path[6]}{acname[6]}_'+int(#day_of_week)+'.png'" x="{x[6]}" y="{y[6]}" />
```

##### name:`10位日期srcid写法（2026/03/21）`

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

##### name:`10位日期srcExp写法（2026/03/21）`

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

#### 农历

##### name:`6华为农历（农历闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png"	/>
<Image x="{x[1]}" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[2]}-{gapX[2]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[3]}-{gapX[2]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png"	/>
<Image x="{x[4]}-{gapX[2]}*eq(#run,0)" y="{y[4]}" src="{path[4]}{acname[4]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[5]}-{gapX[2]}*eq(#run,0)" y="{y[5]}" src="{path[5]}{acname[5]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

##### name:`5华为农历（闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[1]}-{gapX[1]}*eq(#run,0)" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[2]}-{gapX[1]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png"	/>
<Image x="{x[3]}-{gapX[1]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[4]}-{gapX[1]}*eq(#run,0)" y="{y[4]}" src="{path[4]}{acname[4]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

##### name:`4华为农历（闰六月初一）`

```
<Image x="{x[0]}" y="{y[0]}" src="{path[0]}{acname[0]}.png" 	visibility="eq(#run,1)"/>
<Image x="{x[1]}-{gapX[1]}*eq(#run,0)" y="{y[1]}" src="{path[1]}{acname[1]}.png" 	srcid="#lunarMonth"/>
<Image x="{x[2]}-{gapX[1]}*eq(#run,0)" y="{y[2]}" src="{path[2]}{acname[2]}.png" 	srcid="ifelse(le(#lunarDay,10),0,gt(#lunarDay,10)*lt(#lunarDay,20),10,eq(#lunarDay,20),2,gt(#lunarDay,20)*lt(#lunarDay,30),20,ge(#lunarDay,30),3,0)"/>
<Image x="{x[3]}-{gapX[1]}*eq(#run,0)" y="{y[3]}" src="{path[3]}{acname[3]}.png" 	srcid="ifelse(eq(#lunarDay%10,0),10,#lunarDay%10)"/>
```

#### mask进度条

##### name:`h 电量进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}-{-gapX[2]}+ifelse(eq(#battery_state,1)+eq(#battery_state,3),{-gapX[2]}*(#loop/2000%1),{-gapX[2]}*0.01*#battery_level)" y="{y[1]}" align="absolute" hybridMode="6"/>
</Image>
```

##### name:`h 条形进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}-{-gapX[2]}+{-gapX[2]}*0.01*max(#jrsy_bfb,3)*ne(#jrsy_bfb,0)" y="{y[1]}" align="absolute" hybridMode="6"/>
</Image>
```

##### name:`s 电量进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}+{gapY[2]}-ifelse(eq(#battery_state,1)+eq(#battery_state,3),{gapY[2]}*(#loop/2000%1),{gapY[2]}*0.01*#battery_level)" align="absolute" hybridMode="6"/>
</Image>
```

##### name:`s 条形进度条mask`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" visibility="eq(#cur_bsid,1)">
    <Mask src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}+{gapY[2]}-{gapY[2]}*0.01*max(#jrsy_bfb,3)*ne(#jrsy_bfb,0)" align="absolute" hybridMode="6"/>
</Image>
```

#### 电量

##### name:`sd透明度`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" alpha="ifelse(eq(#battery_state,1)+eq(#battery_state,3),155+100*sin(#loop/1000%2*#pai),100)"/>
```

#### 时钟

##### name:`时钟（d,mz,fz,sz,dot）`

```
<!-- 依次为 底图 秒针 分针 时针 顶图 -->
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" pivotX="{centerX[0]}-{x[1]}" pivotY="{centerY[0]}-{y[1]}" angle="#second*6" />
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" pivotX="{centerX[0]}-{x[2]}" pivotY="{centerY[0]}-{y[2]}" angle="#minute*6"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" pivotX="{centerX[0]}-{x[3]}" pivotY="{centerY[0]}-{y[3]}" angle="#hour12*30+#minute/2" />
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" />
```

##### name:`时钟（d,fz,sz,dot）`

```
<!-- 依次为 底图 分针 时针 顶图 -->
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" pivotX="{centerX[0]}-{x[1]}" pivotY="{centerY[0]}-{y[1]}" angle="#minute*6"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" pivotX="{centerX[0]}-{x[2]}" pivotY="{centerY[0]}-{y[2]}" angle="#hour12*30+#minute/2" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" />
```

##### name:`时钟（d,fz,sz）`

```
<!-- 依次为 底图 分针 时针 顶图 -->
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" pivotX="{centerX[0]}-{x[1]}" pivotY="{centerY[0]}-{y[1]}" angle="#minute*6"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" pivotX="{centerX[0]}-{x[2]}" pivotY="{centerY[0]}-{y[2]}" angle="#hour12*30+#minute/2" />
```

#### 今日剩余

##### name:`6位今日剩余时分秒`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="#jinriHour/10%10"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#jinriHour/1%10"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#jinriMinute/10%10"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#jinriMinute/1%10"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#jinriSecond/10%10"/>
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#jinriSecond/1%10"/>
```

##### name:`9位今日剩余时分秒`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" srcid="#jinriHour/10%10"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#jinriHour/1%10"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" />
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#jinriMinute/10%10"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#jinriMinute/1%10"/>
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" />
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#jinriSecond/10%10"/>
<Image src="{path[7]}{acname[7]}.png" x="{x[7]}" y="{y[7]}" srcid="#jinriSecond/1%10"/>
<Image src="{path[8]}{acname[8]}.png" x="{x[8]}" y="{y[8]}" />
```

#### 喝水

##### name:`2位喝水+按钮`

```
<!-- 喝水 -->
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#cur_hsid"/>
<!-- 喝水按钮 -->
<Button x="{x[2]}" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">    
			<VariableCommand name="cur_hsid" expression="ifelse(lt(#cur_hsid,8),#cur_hsid+1,8)" condition="#click" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[3]}" y="{y[3]}" w="{width[3]}" h="{height[3]}">
	<Triggers>
		<Trigger action="up">    
			<VariableCommand name="cur_hsid" expression="ifelse(gt(#cur_hsid,0),#cur_hsid-1,0)" condition="#click" />
		</Trigger>
	</Triggers>
</Button>
```

##### name:`3位喝水+按钮`

```
<!-- 喝水 -->
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}"/>
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#cur_hsid"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#cur_hsid"/>
<!-- 喝水按钮 -->
<Button x="{x[3]}" y="{y[3]}" w="{width[3]}" h="{height[3]}">
	<Triggers>
		<Trigger action="up">    
			<VariableCommand name="cur_hsid" expression="ifelse(lt(#cur_hsid,8),#cur_hsid+1,8)" condition="#click" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">    
			<VariableCommand name="cur_hsid" expression="ifelse(gt(#cur_hsid,0),#cur_hsid-1,0)" condition="#click" />
		</Trigger>
	</Triggers>
</Button>
```

#### 生日弹窗

##### name:`11位生日弹窗2000.08.08`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#rq_1" alpha="ifelse(ge(#rqnum,1),255,100)"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#rq_2" alpha="ifelse(ge(#rqnum,2),255,100)"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#rq_3" alpha="ifelse(ge(#rqnum,3),255,100)"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#rq_4" alpha="ifelse(ge(#rqnum,4),255,100)"/>
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}"               alpha="ifelse(ge(#rqnum,4),255,100)"/>
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#rq_5" alpha="ifelse(ge(#rqnum,5),255,100)"/>
<Image src="{path[7]}{acname[7]}.png" x="{x[7]}" y="{y[7]}" srcid="#rq_6" alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[8]}{acname[8]}.png" x="{x[8]}" y="{y[8]}"               alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[9]}{acname[9]}.png" x="{x[9]}" y="{y[9]}" srcid="#rq_7" alpha="ifelse(ge(#rqnum,7),255,100)"/>
<Image src="{path[10]}{acname[10]}.png" x="{x[10]}" y="{y[10]}" srcid="#rq_8" alpha="ifelse(ge(#rqnum,8),255,100)"/>
```

##### name:`9位生日弹窗2000.08.08`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#rq_1" alpha="ifelse(ge(#rqnum,1),255,100)"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#rq_2" alpha="ifelse(ge(#rqnum,2),255,100)"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#rq_3" alpha="ifelse(ge(#rqnum,3),255,100)"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#rq_4" alpha="ifelse(ge(#rqnum,4),255,100)"/>
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#rq_5" alpha="ifelse(ge(#rqnum,5),255,100)"/>
<Image src="{path[6]}{acname[6]}.png" x="{x[6]}" y="{y[6]}" srcid="#rq_6" alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[7]}{acname[7]}.png" x="{x[7]}" y="{y[7]}" srcid="#rq_7" alpha="ifelse(ge(#rqnum,7),255,100)"/>
<Image src="{path[8]}{acname[8]}.png" x="{x[8]}" y="{y[8]}" srcid="#rq_8" alpha="ifelse(ge(#rqnum,8),255,100)"/>
```

##### name:`4位生日弹窗0808`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#rq_5" alpha="ifelse(ge(#rqnum,5),255,100)"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#rq_6" alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}" srcid="#rq_7" alpha="ifelse(ge(#rqnum,7),255,100)"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#rq_8" alpha="ifelse(ge(#rqnum,8),255,100)"/>
```

##### name:`5位生日弹窗08.08`

```
<Image src="{path[0]}{acname[0]}.png" x="{x[0]}" y="{y[0]}" />
<Image src="{path[1]}{acname[1]}.png" x="{x[1]}" y="{y[1]}" srcid="#rq_5" alpha="ifelse(ge(#rqnum,5),255,100)"/>
<Image src="{path[2]}{acname[2]}.png" x="{x[2]}" y="{y[2]}" srcid="#rq_6" alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[3]}{acname[3]}.png" x="{x[3]}" y="{y[3]}"               alpha="ifelse(ge(#rqnum,6),255,100)"/>
<Image src="{path[4]}{acname[4]}.png" x="{x[4]}" y="{y[4]}" srcid="#rq_7" alpha="ifelse(ge(#rqnum,7),255,100)"/>
<Image src="{path[5]}{acname[5]}.png" x="{x[5]}" y="{y[5]}" srcid="#rq_8" alpha="ifelse(ge(#rqnum,8),255,100)"/>
```

##### name:`4行3列1 生日弹窗按钮 1,2,4`

```
<!-- 需要创建3个矩形，分别框选弹窗1,2,4三个数字获取顺序是1,2,4三个顺序。 -->
<!-- 1-0 -->
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="1" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="2" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="3" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="4" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="5" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="6" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="7" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="8" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="9" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*3" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="sjsznum" expression="0" condition="#click*eq(#srk_al,255)" />
			<VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
		</Trigger>
	</Triggers>
</Button>

<!-- 确认 -->
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*3" w="{width[0]}" h="{height[0]}" visibility="eq(#srk_al,255)">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="rq_nian" expression="#rq_1*1000+#rq_2*100+#rq_3*10+#rq_4" condition="#click"/>
			<VariableCommand name="rq_yue" expression="#rq_5*10+#rq_6" condition="#click"/>
			<VariableCommand name="rq_rq" expression="#rq_7*10+#rq_8" condition="#click"/>
			<!-- 输入年份是否闰年 -->
			<VariableCommand name="rq_leap" expression="eq((#rq_nian%4),0)*ne((#rq_nian%100),0)+eq((#rq_nian%400),0)" condition="#click"/>
			<!-- 输入月份的天数 -->
			<VariableCommand name="rq_month_days" expression="ifelse(eq(#rq_yue,2),#rq_leap+28,eq(#rq_yue,4)+eq(#rq_yue,6)+eq(#rq_yue,9)+eq(#rq_yue,11),30,31)" condition="#click"/>
			<!-- 考试和放假应该在今天之后 -->
			<VariableCommand name="rqNotright1" expression="(eq(#sjid,2)+eq(#sjid,4))*lt(#rq_nian*10000+#rq_yue*100+#rq_rq,#nian*10000+(#yue+1)*100+#rq)"/>
			<!-- 在一起应该在今天之前 -->
			<VariableCommand name="rqNotright2" expression="eq(#sjid,3)*gt(#rq_nian*10000+#rq_yue*100+#rq_rq,#nian*10000+(#yue+1)*100+#rq)"/>
			<!-- 判断日期是否正确 -->
			<VariableCommand name="rqright" expression="ifelse(ne(#rqnum,8),0,gt(#rq_yue,12)+eq(#rq_yue,0)+gt(#rq_rq,#rq_month_days)+eq(#rq_rq,0),0,1)"/>
			<!-- 生日 -->
			<VariableCommand name="sj1n" expression="#rq_nian" condition="eq(#sjid,1)*#rqright"/>
			<VariableCommand name="sj1y" expression="#rq_yue" condition="eq(#sjid,1)*#rqright"/>
			<VariableCommand name="sj1r" expression="#rq_rq" condition="eq(#sjid,1)*#rqright"/>
			
			<!-- 考试 -->
			<VariableCommand name="sj2n" expression="#rq_nian" condition="eq(#sjid,2)*#rqright"/>
			<VariableCommand name="sj2y" expression="#rq_yue" condition="eq(#sjid,2)*#rqright"/>
			<VariableCommand name="sj2r" expression="#rq_rq" condition="eq(#sjid,2)*#rqright"/>
			
			<!-- 在一起 -->
			<VariableCommand name="sj3n" expression="#rq_nian" condition="eq(#sjid,3)*#rqright"/>
			<VariableCommand name="sj3y" expression="#rq_yue" condition="eq(#sjid,3)*#rqright"/>
			<VariableCommand name="sj3r" expression="#rq_rq" condition="eq(#sjid,3)*#rqright"/>
		
			<!-- 放假 -->
			<VariableCommand name="sj4n" expression="#rq_nian" condition="eq(#sjid,4)*#rqright"/>
			<VariableCommand name="sj4y" expression="#rq_yue" condition="eq(#sjid,4)*#rqright"/>
			<VariableCommand name="sj4r" expression="#rq_rq" condition="eq(#sjid,4)*#rqright"/>
			
			<VariableCommand name="rqnum" expression="8" condition="not(#rqright)*#click"/>
		
			<VariableCommand name="time_srk" expression="#loop" condition="#click"/>
			<VariableCommand name="srk" expression="0" condition="#click"/>
		</Trigger>
	</Triggers>
</Button>
<!-- 删除 -->
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*3" w="{width[0]}" h="{height[0]}" visibility="eq(#srk_al,255)">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="rq_1" condition="eq(#rqnum,1)*#click" expression="0"/>
			<VariableCommand name="rq_2" condition="eq(#rqnum,2)*#click" expression="0"/>
			<VariableCommand name="rq_3" condition="eq(#rqnum,3)*#click" expression="0"/>
			<VariableCommand name="rq_4" condition="eq(#rqnum,4)*#click" expression="0"/>
			<VariableCommand name="rq_5" condition="eq(#rqnum,5)*#click" expression="0"/>
			<VariableCommand name="rq_6" condition="eq(#rqnum,6)*#click" expression="0"/>
			<VariableCommand name="rq_7" condition="eq(#rqnum,7)*#click" expression="0"/>
			<VariableCommand name="rq_8" condition="eq(#rqnum,8)*#click" expression="0"/>
			<VariableCommand name="rqnum" expression="#rqnum-1" condition="gt(#rqnum,0)*#click"/>
		</Trigger>
	</Triggers>
</Button>
```

##### name:`4行3列2 生日弹窗按钮 1,2,4`

```
<!-- 需要创建3个矩形，分别框选弹窗1,2,4三个数字获取顺序是1,2,4三个顺序。 -->
<!-- 1-0 -->
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="1" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="2" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="3" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="4" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="5" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="6" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*0" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="7" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*1" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="8" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*2" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="9" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]}*3" y="{y[0]}+{gapY[2]}*1" w="{width[0]}" h="{height[0]}">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="sjsznum" expression="0" condition="#click*eq(#srk_al,255)" />
            <VariableCommand name="sjsjsz" expression="not(#sjsjsz)" condition="#click*eq(#srk_al,255)" />
        </Trigger>
    </Triggers>
</Button>

<!-- 确认 -->
<Button x="{x[0]}+{gapX[1]}*3" y="{y[0]}+{gapY[2]}*2" w="{width[0]}" h="{height[0]}" visibility="eq(#srk_al,255)">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="rq_nian" expression="#rq_1*1000+#rq_2*100+#rq_3*10+#rq_4" condition="#click"/>
            <VariableCommand name="rq_yue" expression="#rq_5*10+#rq_6" condition="#click"/>
            <VariableCommand name="rq_rq" expression="#rq_7*10+#rq_8" condition="#click"/>
            <!-- 输入年份是否闰年 -->
            <VariableCommand name="rq_leap" expression="eq((#rq_nian%4),0)*ne((#rq_nian%100),0)+eq((#rq_nian%400),0)" condition="#click"/>
            <!-- 输入月份的天数 -->
            <VariableCommand name="rq_month_days" expression="ifelse(eq(#rq_yue,2),#rq_leap+28,eq(#rq_yue,4)+eq(#rq_yue,6)+eq(#rq_yue,9)+eq(#rq_yue,11),30,31)" condition="#click"/>
            <!-- 考试和放假应该在今天之后 -->
            <VariableCommand name="rqNotright1" expression="(eq(#sjid,2)+eq(#sjid,4))*lt(#rq_nian*10000+#rq_yue*100+#rq_rq,#nian*10000+(#yue+1)*100+#rq)"/>
            <!-- 在一起应该在今天之前 -->
            <VariableCommand name="rqNotright2" expression="eq(#sjid,3)*gt(#rq_nian*10000+#rq_yue*100+#rq_rq,#nian*10000+(#yue+1)*100+#rq)"/>
            <!-- 判断日期是否正确 -->
            <VariableCommand name="rqright" expression="ifelse(ne(#rqnum,8),0,gt(#rq_yue,12)+eq(#rq_yue,0)+gt(#rq_rq,#rq_month_days)+eq(#rq_rq,0),0,1)"/>
            <!-- 生日 -->
            <VariableCommand name="sj1n" expression="#rq_nian" condition="eq(#sjid,1)*#rqright"/>
            <VariableCommand name="sj1y" expression="#rq_yue" condition="eq(#sjid,1)*#rqright"/>
            <VariableCommand name="sj1r" expression="#rq_rq" condition="eq(#sjid,1)*#rqright"/>

            <!-- 考试 -->
            <VariableCommand name="sj2n" expression="#rq_nian" condition="eq(#sjid,2)*#rqright"/>
            <VariableCommand name="sj2y" expression="#rq_yue" condition="eq(#sjid,2)*#rqright"/>
            <VariableCommand name="sj2r" expression="#rq_rq" condition="eq(#sjid,2)*#rqright"/>

            <!-- 在一起 -->
            <VariableCommand name="sj3n" expression="#rq_nian" condition="eq(#sjid,3)*#rqright"/>
            <VariableCommand name="sj3y" expression="#rq_yue" condition="eq(#sjid,3)*#rqright"/>
            <VariableCommand name="sj3r" expression="#rq_rq" condition="eq(#sjid,3)*#rqright"/>

            <!-- 放假 -->
            <VariableCommand name="sj4n" expression="#rq_nian" condition="eq(#sjid,4)*#rqright"/>
            <VariableCommand name="sj4y" expression="#rq_yue" condition="eq(#sjid,4)*#rqright"/>
            <VariableCommand name="sj4r" expression="#rq_rq" condition="eq(#sjid,4)*#rqright"/>

            <VariableCommand name="rqnum" expression="8" condition="not(#rqright)*#click"/>

            <VariableCommand name="time_srk" expression="#loop" condition="#click"/>
            <VariableCommand name="srk" expression="0" condition="#click"/>
        </Trigger>
    </Triggers>
</Button>
<!-- 删除 -->
<Button x="{x[0]}+{gapX[1]}*3" y="{y[0]}+{gapY[2]}*0" w="{width[0]}" h="{height[0]}" visibility="eq(#srk_al,255)">
    <Triggers>
        <Trigger action="up">
            <VariableCommand name="rq_1" condition="eq(#rqnum,1)*#click" expression="0"/>
            <VariableCommand name="rq_2" condition="eq(#rqnum,2)*#click" expression="0"/>
            <VariableCommand name="rq_3" condition="eq(#rqnum,3)*#click" expression="0"/>
            <VariableCommand name="rq_4" condition="eq(#rqnum,4)*#click" expression="0"/>
            <VariableCommand name="rq_5" condition="eq(#rqnum,5)*#click" expression="0"/>
            <VariableCommand name="rq_6" condition="eq(#rqnum,6)*#click" expression="0"/>
            <VariableCommand name="rq_7" condition="eq(#rqnum,7)*#click" expression="0"/>
            <VariableCommand name="rq_8" condition="eq(#rqnum,8)*#click" expression="0"/>
            <VariableCommand name="rqnum" expression="#rqnum-1" condition="gt(#rqnum,0)*#click"/>
        </Trigger>
    </Triggers>
</Button>
```

#### 姓名字母弹窗

##### name:`26字母输入按钮qpalzm`

```
<!-- 需要创建9个矩形，分别框选弹窗qpalzm六个字母，删除、空格、确认三个按钮，获取顺序是qpalzms。 -->
<Button x="{x[0]}+{gapX[1]/9}*0" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="1" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="1" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="1" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*1" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="2" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="2" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="2" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*2" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="3" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="3" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="3" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*3" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="4" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="4" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="4" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*4" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="5" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="5" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="5" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*5" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="6" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="6" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="6" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*6" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="7" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="7" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="7" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*7" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="8" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="8" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="8" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*8" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="9" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="9" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="9" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[0]}+{gapX[1]/9}*9" y="{y[0]}" w="{width[0]}" h="{height[0]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="10" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="10" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="10" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*0" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="11" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="11" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="11" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*1" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="12" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="12" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="12" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*2" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="13" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="13" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="13" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*3" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="14" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="14" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="14" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*4" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="15" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="15" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="15" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*5" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="16" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="16" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="16" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*6" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="17" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="17" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="17" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*7" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="18" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="18" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="18" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[2]}+{gapX[3]/8}*8" y="{y[2]}" w="{width[2]}" h="{height[2]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="19" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="19" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="19" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*0" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="20" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="20" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="20" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*1" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="21" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="21" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="21" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*2" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="22" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="22" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="22" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*3" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="23" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="23" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="23" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*4" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="24" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="24" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="24" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*5" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="25" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="25" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="25" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<Button x="{x[4]}+{gapX[5]/6}*6" y="{y[4]}" w="{width[4]}" h="{height[4]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="26" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="26" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="26" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<!-- 空格 -->
<Button x="{x[7]}" y="{y[7]}" w="{width[7]}" h="{height[7]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="0" condition="eq(#nameNum,0)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="0" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="0" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum+1" condition="lt(#nameNum,3)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<!-- 删除 -->
<Button x="{x[6]}" y="{y[6]}" w="{width[6]}" h="{height[6]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="name1id" expression="0" condition="eq(#nameNum,1)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name2id" expression="0" condition="eq(#nameNum,2)*#click*eq(#tc_al,255)" />
			<VariableCommand name="name3id" expression="0" condition="eq(#nameNum,3)*#click*eq(#tc_al,255)" />
			<VariableCommand name="nameNum" expression="#nameNum-1" condition="gt(#nameNum,0)*#click*eq(#tc_al,255)" />
		</Trigger>
	</Triggers>
</Button>
<!-- 确认 -->
<Button x="{x[8]}" y="{y[8]}" w="{width[8]}" h="{height[8]}">
	<Triggers>
		<Trigger action="up">
			<VariableCommand name="time_tc" expression="#loop" condition="#click" />
			<VariableCommand name="tckg" expression="0" condition="#click" />
		</Trigger>
	</Triggers>
</Button>
```

