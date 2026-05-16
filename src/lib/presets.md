```example
模板新增格式：代码块包裹的内容会填充到模板中。
```
```
x="{x}" y="{y}" 
```
```
x="{x}" y="{y}" w="{width}" h="{height}" 
```
```
<Image src="{path}{name}.png" x="{x}" y="{y}" />
```
```
<Image src="{path}{name}.png" x="{x}" y="{y}" w="{width}" h="{height}" scaleType="fill"/>
```
```
<Image src="{path}{name}.png" x="{centerX}" y="{centerY}" w="{width}{scaleAnim}" h="{height}{scaleAnim}" align="center" alignV="center" scaleType="fill"/>
```
```
<Image src="{path}{name}.png" x="{x}" y="{y}" w="{width}" h="{height}" centerX="{centerX}-{x}" centerY="{centerY}-{y}" rotation="{rotateAnim}" />
```
```
<Text textExp="'{text}'" x="{x}" y="{y}" bold="false" color="{fontColor}" size="{fontSize}"/>
```