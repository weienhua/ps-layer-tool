"""
恢复预设文件中 GBK 编码的中文条目，转为 UTF-8。
已损坏的 U+FFFD 替换字符无法恢复，保持原样。
"""
import json
import re
import sys
import os

FILE_PATH = r"C:/Users/29727/AppData/Roaming/Adobe/CEP/extensions/com.layertool.panel/dist/lib/presets/all/default.json"

def find_gbk_sequences(data: bytes):
    """查找所有非 ASCII 字节序列，尝试用 GBK 解码"""
    results = []
    i = 0
    while i < len(data):
        if data[i] > 0x7f:
            j = i
            while j < len(data) and data[j] > 0x7f:
                j += 1
            seq = data[i:j]
            # 检查是否是 UTF-8 替换字符 (ef bf bd)
            if seq == b'\xef\xbf\xbd' * (len(seq) // 3):
                # 已损坏，跳过
                i = j
                continue
            # 尝试 GBK 解码
            try:
                decoded = seq.decode('gbk')
                results.append((i, j, seq, decoded))
            except:
                pass
            i = j
        else:
            i += 1
    return results

def fix_file(filepath):
    # 读取原始字节
    with open(filepath, 'rb') as f:
        raw = f.read()

    # 查找 GBK 序列
    gbk_seqs = find_gbk_sequences(raw)
    if not gbk_seqs:
        print("没有找到可恢复的 GBK 编码条目。")
        return

    print(f"找到 {len(gbk_seqs)} 个 GBK 编码序列：")
    for start, end, orig, decoded in gbk_seqs:
        print(f"  偏移 {start}: {orig.hex(' ')} -> {decoded}")

    # 用 GBK 解码的 UTF-8 替换原始字节
    fixed = bytearray(raw)
    offset_delta = 0
    for start, end, orig, decoded in gbk_seqs:
        utf8_bytes = decoded.encode('utf-8')
        adj_start = start + offset_delta
        adj_end = end + offset_delta
        fixed[adj_start:adj_end] = utf8_bytes
        offset_delta += len(utf8_bytes) - len(orig)

    # 写回文件
    with open(filepath, 'wb') as f:
        f.write(bytes(fixed))

    print("\n已恢复并保存。")

    # 验证：用 UTF-8 读取并显示恢复的名称
    with open(filepath, 'r', encoding='utf-8') as f:
        presets = json.load(f)

    print("\n恢复后的预设名称：")
    for p in presets:
        name = p.get('name', '')
        # 检查是否还有乱码
        has_garble = any(ord(c) > 0x7f and ord(c) != 0xFFFD for c in name)
        status = "✓" if not has_garble or all(ord(c) < 0x7f or ord(c) > 0xFFFD for c in name) else "?"
        print(f"  {status} {name}")

if __name__ == '__main__':
    fix_file(FILE_PATH)
